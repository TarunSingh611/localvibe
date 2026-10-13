import { createHash } from 'crypto';
import bcrypt from 'bcryptjs';
import type { ObjectId } from 'mongodb';
import { route, parseBody, ok, clientIp, badRequest } from '@/lib/api';
import { rateLimit } from '@/lib/rate-limit';
import { resetPasswordSchema } from '@/lib/validation';
import { usersCollection } from '@/lib/users';
import { getDatabase } from '@/lib/mongodb';

export const POST = route(async (request) => {
  await rateLimit({ key: `reset:${clientIp(request)}`, limit: 10, windowSeconds: 3600 });
  const { token, password } = await parseBody(request, resetPasswordSchema);

  const db = await getDatabase();
  const resets = db.collection<{ userId: ObjectId; tokenHash: string; expiresAt: Date }>('passwordResets');
  const tokenHash = createHash('sha256').update(token).digest('hex');
  const reset = await resets.findOneAndDelete({ tokenHash, expiresAt: { $gt: new Date() } });
  if (!reset) throw badRequest('This reset link is invalid or has expired. Please request a new one.');

  const users = await usersCollection();
  await users.updateOne(
    { _id: reset.userId },
    { $set: { passwordHash: await bcrypt.hash(password, 12), updatedAt: new Date() } }
  );

  return ok({ success: true });
});
