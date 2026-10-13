import { ObjectId } from 'mongodb';
import { route, ok, parseBody, notFound } from '@/lib/api';
import { getCurrentUser, requireUser } from '@/lib/session';
import { rateLimit } from '@/lib/rate-limit';
import { commentSchema } from '@/lib/validation';
import { postsCollection } from '@/lib/posts';
import { getDatabase, toObjectId } from '@/lib/mongodb';
import { loadUsersById, toPublicUser } from '@/lib/users';
import { toCommentDTO } from '@/lib/serializers';
import { notify, truncate } from '@/lib/notifications';
import type { CommentDoc } from '@/types';

type Context = { params: Promise<{ id: string }> };

export const GET = route<Context>(async (_request, { params }) => {
  const { id } = await params;
  const postId = toObjectId(id);
  if (!postId) throw notFound();
  const viewer = await getCurrentUser();

  const comments = await (await getDatabase())
    .collection<CommentDoc>('comments')
    .find({ postId, status: 'active' })
    .sort({ createdAt: 1 })
    .limit(300)
    .toArray();
  const authors = await loadUsersById(comments.map((c) => c.authorId));

  return ok({ items: comments.map((c) => toCommentDTO(c, { authors, viewerId: viewer?._id })) });
});

export const POST = route<Context>(async (request, { params }) => {
  const { id } = await params;
  const user = await requireUser();
  await rateLimit({ key: `comment:${user._id}`, limit: 30, windowSeconds: 600 });
  const { text } = await parseBody(request, commentSchema);

  const postId = toObjectId(id);
  if (!postId) throw notFound();
  const posts = await postsCollection();
  const post = await posts.findOne({ _id: postId, status: 'active' }, { projection: { authorId: 1 } });
  if (!post) throw notFound('This post is no longer available');

  const comment: CommentDoc = {
    _id: new ObjectId(),
    postId,
    authorId: user._id,
    text,
    status: 'active',
    createdAt: new Date(),
  };
  await (await getDatabase()).collection<CommentDoc>('comments').insertOne(comment);
  await posts.updateOne({ _id: postId }, { $inc: { commentCount: 1 } });

  await notify({
    userId: post.authorId,
    actorId: user._id,
    type: 'comment',
    text: `${user.name} commented: "${truncate(text, 60)}"`,
    link: `/posts/${id}`,
  });

  const authors = new Map([[user._id.toString(), toPublicUser(user)]]);
  return ok(toCommentDTO(comment, { authors, viewerId: user._id }), { status: 201 });
});
