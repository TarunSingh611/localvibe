import bcrypt from 'bcryptjs';
import { MongoServerError } from 'mongodb';
import { route, parseBody, ok, clientIp, ApiError } from '@/lib/api';
import { rateLimit } from '@/lib/rate-limit';
import { registerSchema } from '@/lib/validation';
import { newUserDoc, usersCollection } from '@/lib/users';
import { sendEmail, appUrl } from '@/lib/email';
import { escapeHtml } from '@/lib/utils';

export const POST = route(async (request) => {
  await rateLimit({ key: `register:${clientIp(request)}`, limit: 5, windowSeconds: 3600 });
  const input = await parseBody(request, registerSchema);
  const users = await usersCollection();

  const existing = await users.findOne(
    { $or: [{ email: input.email }, { username: input.username }] },
    { projection: { email: 1, username: 1 } }
  );
  if (existing?.email === input.email) throw new ApiError(409, 'An account with this email already exists');
  if (existing?.username === input.username) throw new ApiError(409, 'That username is taken');

  const passwordHash = await bcrypt.hash(input.password, 12);
  try {
    await users.insertOne(
      newUserDoc({
        email: input.email,
        name: input.name,
        username: input.username,
        passwordHash,
        provider: 'credentials',
      })
    );
  } catch (error) {
    if (error instanceof MongoServerError && error.code === 11000) {
      throw new ApiError(409, 'An account with this email or username already exists');
    }
    throw error;
  }

  void sendEmail({
    to: input.email,
    subject: 'Welcome to LocalVibe',
    heading: `Welcome, ${escapeHtml(input.name)}!`,
    body: 'Your account is ready. Set your neighborhood, say hello in the local feed, and keep an eye on alerts near you.',
    cta: { label: 'Open LocalVibe', url: `${appUrl()}/feed` },
  });

  return ok({ success: true }, { status: 201 });
});
