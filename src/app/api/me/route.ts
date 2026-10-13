import bcrypt from 'bcryptjs';
import type { ObjectId } from 'mongodb';
import { route, ok, parseBody, ApiError, badRequest } from '@/lib/api';
import { requireUser } from '@/lib/session';
import { rateLimit } from '@/lib/rate-limit';
import { profileUpdateSchema } from '@/lib/validation';
import { toMe, usersCollection } from '@/lib/users';
import { getDatabase } from '@/lib/mongodb';
import { geoPoint } from '@/lib/geo';
import type { UserDoc } from '@/types';

export const dynamic = 'force-dynamic';

export const GET = route(async () => {
  const user = await requireUser();
  return ok(toMe(user));
});

export const PATCH = route(async (request) => {
  const user = await requireUser();
  await rateLimit({ key: `profile:${user._id}`, limit: 30, windowSeconds: 600 });
  const input = await parseBody(request, profileUpdateSchema);
  const users = await usersCollection();

  const set: Partial<UserDoc> = { updatedAt: new Date() };
  const unset: Record<string, ''> = {};

  if (input.name !== undefined) set.name = input.name;
  if (input.bio !== undefined) set.bio = input.bio;
  if (input.image !== undefined) {
    if (input.image === null) unset.image = '';
    else set.image = input.image;
  }
  if (input.username !== undefined && input.username !== user.username) {
    const taken = await users.findOne({ username: input.username }, { projection: { _id: 1 } });
    if (taken) throw new ApiError(409, 'That username is taken');
    set.username = input.username;
  }
  if (input.location !== undefined) {
    if (input.location === null) {
      unset.location = '';
      unset.place = '';
    } else {
      set.location = geoPoint(input.location.latitude, input.location.longitude);
      set.place = input.location.place;
    }
  }
  if (input.preferences) {
    set.preferences = { ...user.preferences, ...input.preferences };
  }

  const updated = await users.findOneAndUpdate(
    { _id: user._id },
    { $set: set, ...(Object.keys(unset).length ? { $unset: unset } : {}) },
    { returnDocument: 'after' }
  );
  return ok(toMe(updated!));
});

/** Permanently deletes the account and the content the user created. */
export const DELETE = route(async (request) => {
  const user = await requireUser();
  const body = (await request.json().catch(() => ({}))) as { password?: string; confirm?: string };

  if (user.passwordHash) {
    if (!body.password || !(await bcrypt.compare(body.password, user.passwordHash))) {
      throw badRequest('Your password is incorrect');
    }
  } else if (body.confirm !== user.username) {
    throw badRequest('Type your username to confirm');
  }

  const db = await getDatabase();
  const userId = user._id;

  const likes = await db.collection('likes').find({ userId }, { projection: { postId: 1 } }).toArray();
  const comments = await db.collection('comments').find({ authorId: userId }, { projection: { postId: 1 } }).toArray();
  const favorites = await db.collection('favorites').find({ userId }, { projection: { listingId: 1 } }).toArray();

  const decrement = (ids: ObjectId[], field: string) => {
    const counts = new Map<string, { id: ObjectId; n: number }>();
    for (const id of ids) {
      const entry = counts.get(id.toString()) ?? { id, n: 0 };
      entry.n += 1;
      counts.set(id.toString(), entry);
    }
    return [...counts.values()].map(({ id, n }) => ({
      updateOne: { filter: { _id: id }, update: { $inc: { [field]: -n } } },
    }));
  };

  const postOps = [
    ...decrement(likes.map((l) => l.postId), 'likeCount'),
    ...decrement(comments.map((c) => c.postId), 'commentCount'),
  ];
  const listingOps = decrement(favorites.map((f) => f.listingId), 'favoriteCount');
  const userPosts = await db.collection('posts').find({ authorId: userId }, { projection: { _id: 1 } }).toArray();
  const postIds = userPosts.map((p) => p._id);
  const conversations = await db.collection('conversations').find({ participants: userId }, { projection: { _id: 1 } }).toArray();
  const conversationIds = conversations.map((c) => c._id);

  await Promise.all([
    postOps.length ? db.collection('posts').bulkWrite(postOps, { ordered: false }) : null,
    listingOps.length ? db.collection('listings').bulkWrite(listingOps, { ordered: false }) : null,
  ]);
  await Promise.all([
    db.collection('posts').deleteMany({ authorId: userId }),
    db.collection('comments').deleteMany({ $or: [{ authorId: userId }, { postId: { $in: postIds } }] }),
    db.collection('likes').deleteMany({ $or: [{ userId }, { postId: { $in: postIds } }] }),
    db.collection('listings').deleteMany({ sellerId: userId }),
    db.collection('favorites').deleteMany({ userId }),
    db.collection('messages').deleteMany({ conversationId: { $in: conversationIds } }),
    db.collection('conversations').deleteMany({ _id: { $in: conversationIds } }),
    db.collection('notifications').deleteMany({ $or: [{ userId }, { actorId: userId }] }),
    db.collection('passwordResets').deleteMany({ userId }),
    db.collection('emergencyContacts').deleteMany({ submittedBy: userId, status: 'pending' }),
    db.collection('reports').deleteMany({ $or: [{ reporterId: userId }, { targetId: { $in: [userId, ...postIds] } }] }),
  ]);
  await (await usersCollection()).deleteOne({ _id: userId });

  return ok({ success: true });
});
