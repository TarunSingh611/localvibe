import { route, ok, notFound, badRequest } from '@/lib/api';
import { requireUser } from '@/lib/session';
import { toObjectId } from '@/lib/mongodb';
import { usersCollection } from '@/lib/users';

type Context = { params: Promise<{ id: string }> };

/** Toggles whether the current user blocks another user from messaging them. */
export const POST = route<Context>(async (_request, { params }) => {
  const { id } = await params;
  const user = await requireUser();
  const targetId = toObjectId(id);
  if (!targetId) throw notFound();
  if (targetId.equals(user._id)) throw badRequest('You cannot block yourself');

  const users = await usersCollection();
  const target = await users.findOne({ _id: targetId }, { projection: { _id: 1 } });
  if (!target) throw notFound();

  const isBlocked = user.blockedUserIds?.some((b) => b.equals(targetId)) ?? false;
  await users.updateOne(
    { _id: user._id },
    isBlocked ? { $pull: { blockedUserIds: targetId } } : { $addToSet: { blockedUserIds: targetId } }
  );
  return ok({ blocked: !isBlocked });
});
