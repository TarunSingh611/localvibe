import { route } from '@/lib/api';
import { requireUser } from '@/lib/session';
import { rateLimit } from '@/lib/rate-limit';
import { getDatabase } from '@/lib/mongodb';
import { toMe } from '@/lib/users';

export const dynamic = 'force-dynamic';

/** Downloads a JSON copy of everything the user has created. */
export const GET = route(async () => {
  const user = await requireUser();
  await rateLimit({ key: `export:${user._id}`, limit: 5, windowSeconds: 3600 });
  const db = await getDatabase();

  const [posts, comments, listings, messages, favorites] = await Promise.all([
    db.collection('posts').find({ authorId: user._id }).project({ authorId: 0 }).toArray(),
    db.collection('comments').find({ authorId: user._id }).project({ authorId: 0 }).toArray(),
    db.collection('listings').find({ sellerId: user._id }).project({ sellerId: 0 }).toArray(),
    db.collection('messages').find({ senderId: user._id }).project({ senderId: 0 }).toArray(),
    db.collection('favorites').find({ userId: user._id }).project({ userId: 0 }).toArray(),
  ]);

  const data = {
    exportedAt: new Date().toISOString(),
    profile: toMe(user),
    posts,
    comments,
    listings,
    messagesSent: messages,
    favorites,
  };

  return new Response(JSON.stringify(data, null, 2), {
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': `attachment; filename="localvibe-${user.username}-export.json"`,
    },
  });
});
