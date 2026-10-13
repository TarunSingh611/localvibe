import { route, ok, notFound, forbidden } from '@/lib/api';
import { getCurrentUser, requireUser } from '@/lib/session';
import { getPostById, postsCollection } from '@/lib/posts';
import { getDatabase, toObjectId } from '@/lib/mongodb';

type Context = { params: Promise<{ id: string }> };

export const GET = route<Context>(async (_request, { params }) => {
  const { id } = await params;
  const viewer = await getCurrentUser();
  const post = await getPostById(id, viewer?._id);
  if (!post) throw notFound('This post is no longer available');
  return ok(post);
});

export const DELETE = route<Context>(async (_request, { params }) => {
  const { id } = await params;
  const user = await requireUser();
  const postId = toObjectId(id);
  if (!postId) throw notFound();

  const posts = await postsCollection();
  const post = await posts.findOne({ _id: postId }, { projection: { authorId: 1 } });
  if (!post) throw notFound();
  if (!post.authorId.equals(user._id) && user.role !== 'admin') throw forbidden();

  const db = await getDatabase();
  await Promise.all([
    posts.deleteOne({ _id: postId }),
    db.collection('comments').deleteMany({ postId }),
    db.collection('likes').deleteMany({ postId }),
  ]);
  return ok({ success: true });
});
