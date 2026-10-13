import type { Filter, ObjectId } from 'mongodb';
import { getDatabase } from './mongodb';
import { withinRadius } from './geo';
import { escapeRegex } from './api';
import { loadUsersById } from './users';
import { toPostDTO } from './serializers';
import type { PostDoc, PostDTO, PostType, Paginated } from '@/types';
import { toObjectId } from './mongodb';

export async function postsCollection() {
  const db = await getDatabase();
  return db.collection<PostDoc>('posts');
}

export interface PostQuery {
  viewerId?: ObjectId;
  lat?: number;
  lng?: number;
  radiusKm?: number;
  type?: PostType;
  q?: string;
  sort?: 'latest' | 'top';
  authorId?: ObjectId;
  activeEmergenciesOnly?: boolean;
  cursor?: string | null;
  limit?: number;
}

export async function queryPosts(query: PostQuery): Promise<Paginated<PostDTO>> {
  const posts = await postsCollection();
  const limit = Math.min(query.limit ?? 20, 50);
  const and: Filter<PostDoc>[] = [{ status: 'active' }];

  const hasOrigin = query.lat !== undefined && query.lng !== undefined;
  if (hasOrigin && query.radiusKm) {
    and.push({ location: withinRadius(query.lat!, query.lng!, query.radiusKm) });
  }
  if (query.type) and.push({ type: query.type });
  if (query.authorId) and.push({ authorId: query.authorId });
  if (query.activeEmergenciesOnly) and.push({ type: 'emergency', expiresAt: { $gt: new Date() } });
  if (query.q) {
    const regex = new RegExp(escapeRegex(query.q.slice(0, 80)), 'i');
    and.push({ $or: [{ text: regex }, { tags: regex }, { 'place.label': regex }] });
  }

  let docs: PostDoc[];
  let nextCursor: string | null = null;

  if (query.sort === 'top') {
    const offset = Math.max(0, Number(query.cursor) || 0);
    and.push({ createdAt: { $gt: new Date(Date.now() - 7 * 24 * 3600 * 1000) } });
    docs = await posts
      .aggregate<PostDoc>([
        { $match: { $and: and } },
        { $addFields: { _score: { $add: ['$likeCount', { $multiply: ['$commentCount', 2] }] } } },
        { $sort: { _score: -1, _id: -1 } },
        { $skip: offset },
        { $limit: limit + 1 },
        { $project: { _score: 0 } },
      ])
      .toArray();
    if (docs.length > limit) {
      docs = docs.slice(0, limit);
      nextCursor = String(offset + limit);
    }
  } else {
    const cursorId = query.cursor ? toObjectId(query.cursor) : null;
    if (cursorId) and.push({ _id: { $lt: cursorId } });
    docs = await posts.find({ $and: and }).sort({ _id: -1 }).limit(limit + 1).toArray();
    if (docs.length > limit) {
      docs = docs.slice(0, limit);
      nextCursor = docs[docs.length - 1]._id.toString();
    }
  }

  const origin = hasOrigin ? { latitude: query.lat!, longitude: query.lng! } : undefined;
  return { items: await hydratePosts(docs, query.viewerId, origin), nextCursor };
}

export async function hydratePosts(
  docs: PostDoc[],
  viewerId?: ObjectId,
  origin?: { latitude: number; longitude: number }
): Promise<PostDTO[]> {
  if (docs.length === 0) return [];
  const db = await getDatabase();
  const [authors, likes] = await Promise.all([
    loadUsersById(docs.map((d) => d.authorId)),
    viewerId
      ? db
          .collection('likes')
          .find({ userId: viewerId, postId: { $in: docs.map((d) => d._id) } }, { projection: { postId: 1 } })
          .toArray()
      : Promise.resolve([]),
  ]);
  const liked = new Set(likes.map((like) => like.postId.toString()));
  return docs.map((doc) => toPostDTO(doc, { authors, liked, viewerId, origin }));
}

export async function getPostById(id: string, viewerId?: ObjectId): Promise<PostDTO | null> {
  const objectId = toObjectId(id);
  if (!objectId) return null;
  const posts = await postsCollection();
  const doc = await posts.findOne({ _id: objectId, status: 'active' });
  if (!doc) return null;
  const [dto] = await hydratePosts([doc], viewerId);
  return dto;
}
