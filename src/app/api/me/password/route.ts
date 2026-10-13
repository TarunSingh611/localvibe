import bcrypt from 'bcryptjs';
import { route, ok, parseBody, badRequest } from '@/lib/api';
import { requireUser } from '@/lib/session';
import { rateLimit } from '@/lib/rate-limit';
import { changePasswordSchema } from '@/lib/validation';
import { usersCollection } from '@/lib/users';

export const POST = route(async (request) => {
  const user = await requireUser();
  await rateLimit({ key: `password:${user._id}`, limit: 10, windowSeconds: 3600 });
  const { currentPassword, newPassword } = await parseBody(request, changePasswordSchema);

  if (user.passwordHash) {
    if (!currentPassword || !(await bcrypt.compare(currentPassword, user.passwordHash))) {
      throw badRequest('Your current password is incorrect');
    }
  }

  await (await usersCollection()).updateOne(
    { _id: user._id },
    { $set: { passwordHash: await bcrypt.hash(newPassword, 12), updatedAt: new Date() } }
  );
  return ok({ success: true });
});
