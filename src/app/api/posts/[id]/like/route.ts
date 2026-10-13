import { MongoServerError } from 'mongodb';
import { route, ok, notFound } from '@/lib/api';
import { requireUser } from '@/lib/session';
import { rateLimit } from '@/lib/rate-limit';
import { postsCollection } from '@/lib/posts';
import { getDatabase, toObjectId } from '@/lib/mongodb';
import { notify, truncate } from '@/lib/notifications';

type Context = { params: Promise<{ id: string }> };

export const POST = route<Context>(async (_request, { params }) => {
  const { id } = await params;
  const user = await requireUser();
  await rateLimit({ key: `like:${user._id}`, limit: 120, windowSeconds: 600 });

  const postId = toObjectId(id);
  if (!postId) throw notFound();
  const posts = await postsCollection();
  const post = await posts.findOne({ _id: postId, status: 'active' }, { projection: { authorId: 1, text: 1 } });
  if (!post) throw notFound();

  const likes = (await getDatabase()).collection('likes');
  let liked: boolean;
  try {
    await likes.insertOne({ postId, userId: user._id, createdAt: new Date() });
    liked = true;
  } catch (error) {
    if (!(error instanceof MongoServerError && error.code === 11000)) throw error;
    await likes.deleteOne({ postId, userId: user._id });
    liked = false;
  }

  const updated = await posts.findOneAndUpdate(
    { _id: postId },
    { $inc: { likeCount: liked ? 1 : -1 } },
    { returnDocument: 'after', projection: { likeCount: 1 } }
  );

  if (liked) {
    await notify({
      userId: post.authorId,
      actorId: user._id,
      type: 'like',
      text: `${user.name} liked your post "${truncate(post.text, 40)}"`,
      link: `/posts/${id}`,
    });
  }

  return ok({ liked, likeCount: Math.max(0, updated?.likeCount ?? 0) });
});
