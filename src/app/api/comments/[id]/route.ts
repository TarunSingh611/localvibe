import { route, ok, notFound, forbidden } from '@/lib/api';
import { requireUser } from '@/lib/session';
import { postsCollection } from '@/lib/posts';
import { getDatabase, toObjectId } from '@/lib/mongodb';
import type { CommentDoc } from '@/types';

type Context = { params: Promise<{ id: string }> };

export const DELETE = route<Context>(async (_request, { params }) => {
  const { id } = await params;
  const user = await requireUser();
  const commentId = toObjectId(id);
  if (!commentId) throw notFound();

  const comments = (await getDatabase()).collection<CommentDoc>('comments');
  const comment = await comments.findOne({ _id: commentId });
  if (!comment) throw notFound();

  const posts = await postsCollection();
  const post = await posts.findOne({ _id: comment.postId }, { projection: { authorId: 1 } });
  const canDelete =
    comment.authorId.equals(user._id) || post?.authorId.equals(user._id) || user.role === 'admin';
  if (!canDelete) throw forbidden();

  const result = await comments.deleteOne({ _id: commentId });
  if (result.deletedCount && comment.status === 'active') {
    await posts.updateOne({ _id: comment.postId }, { $inc: { commentCount: -1 } });
  }
  return ok({ success: true });
});
