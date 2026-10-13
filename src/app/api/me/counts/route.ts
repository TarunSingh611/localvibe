import { route, ok } from '@/lib/api';
import { getCurrentUser } from '@/lib/session';
import { getDatabase } from '@/lib/mongodb';

export const dynamic = 'force-dynamic';

/** Lightweight badge counts, polled by the navigation. */
export const GET = route(async () => {
  const user = await getCurrentUser();
  if (!user) return ok({ notifications: 0, messages: 0 });

  const db = await getDatabase();
  const key = `unread.${user._id}`;
  const [notifications, messageAgg] = await Promise.all([
    db.collection('notifications').countDocuments({ userId: user._id, read: false }, { limit: 99 }),
    db
      .collection('conversations')
      .aggregate<{ total: number }>([
        { $match: { participants: user._id, [key]: { $gt: 0 } } },
        { $group: { _id: null, total: { $sum: `$${key}` } } },
      ])
      .toArray(),
  ]);

  return ok({ notifications, messages: messageAgg[0]?.total ?? 0 });
});
