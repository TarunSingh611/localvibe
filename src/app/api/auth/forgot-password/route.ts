import { createHash, randomBytes } from 'crypto';
import { ObjectId } from 'mongodb';
import { route, parseBody, ok, clientIp } from '@/lib/api';
import { rateLimit } from '@/lib/rate-limit';
import { forgotPasswordSchema } from '@/lib/validation';
import { usersCollection } from '@/lib/users';
import { getDatabase } from '@/lib/mongodb';
import { sendEmail, appUrl } from '@/lib/email';

export const POST = route(async (request) => {
  await rateLimit({ key: `forgot:${clientIp(request)}`, limit: 5, windowSeconds: 3600 });
  const { email } = await parseBody(request, forgotPasswordSchema);

  const users = await usersCollection();
  const user = await users.findOne({ email });

  // Always respond the same way so the endpoint cannot be used to discover accounts.
  if (user && !user.banned) {
    const token = randomBytes(32).toString('hex');
    const db = await getDatabase();
    await db.collection('passwordResets').deleteMany({ userId: user._id });
    await db.collection('passwordResets').insertOne({
      _id: new ObjectId(),
      userId: user._id,
      tokenHash: createHash('sha256').update(token).digest('hex'),
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
    });

    await sendEmail({
      to: user.email,
      subject: 'Reset your LocalVibe password',
      heading: 'Reset your password',
      body: 'Someone (hopefully you) asked to reset your LocalVibe password. This link expires in 1 hour. If you did not request this, you can ignore this email.',
      cta: { label: 'Choose a new password', url: `${appUrl()}/auth/reset-password?token=${token}` },
    });
  }

  return ok({ success: true });
});
