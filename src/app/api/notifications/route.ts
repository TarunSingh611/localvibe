import { route, ok } from '@/lib/api';
import { requireUser } from '@/lib/session';
import { getDatabase } from '@/lib/mongodb';
import { loadUsersById } from '@/lib/users';
import type { NotificationDoc, NotificationDTO } from '@/types';

export const dynamic = 'force-dynamic';

export const GET = route(async () => {
  const user = await requireUser();
  const notifications = (await getDatabase()).collection<NotificationDoc>('notifications');
  const docs = await notifications.find({ userId: user._id }).sort({ createdAt: -1 }).limit(60).toArray();
  const actors = await loadUsersById(docs.map((d) => d.actorId).filter((id): id is NonNullable<typeof id> => Boolean(id)));

  return ok({
    items: docs.map<NotificationDTO>((doc) => ({
      id: doc._id.toString(),
      type: doc.type,
      text: doc.text,
      link: doc.link,
      read: doc.read,
      actor: doc.actorId ? actors.get(doc.actorId.toString()) : undefined,
      createdAt: doc.createdAt.toISOString(),
    })),
  });
});

/** Marks all notifications as read. */
export const POST = route(async () => {
  const user = await requireUser();
  await (await getDatabase())
    .collection<NotificationDoc>('notifications')
    .updateMany({ userId: user._id, read: false }, { $set: { read: true } });
  return ok({ success: true });
});
