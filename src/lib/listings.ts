import type { Filter, ObjectId } from 'mongodb';
import { getDatabase, toObjectId } from './mongodb';
import { withinRadius } from './geo';
import { escapeRegex } from './api';
import { loadUsersById } from './users';
import { toListingDTO } from './serializers';
import type { ListingCategory, ListingDoc, ListingDTO, Paginated } from '@/types';

export async function listingsCollection() {
  const db = await getDatabase();
  return db.collection<ListingDoc>('listings');
}

export interface ListingQuery {
  viewerId?: ObjectId;
  lat?: number;
  lng?: number;
  radiusKm?: number;
  category?: ListingCategory;
  q?: string;
  minPrice?: number;
  maxPrice?: number;
  sort?: 'latest' | 'price_asc' | 'price_desc';
  sellerId?: ObjectId;
  includeSold?: boolean;
  favoritesOf?: ObjectId;
  cursor?: string | null;
  limit?: number;
}

export async function queryListings(query: ListingQuery): Promise<Paginated<ListingDTO>> {
  const listings = await listingsCollection();
  const limit = Math.min(query.limit ?? 24, 60);
  const and: Filter<ListingDoc>[] = [
    query.includeSold ? { status: { $in: ['active', 'sold'] } } : { status: 'active' },
  ];

  const hasOrigin = query.lat !== undefined && query.lng !== undefined;
  if (hasOrigin && query.radiusKm) and.push({ location: withinRadius(query.lat!, query.lng!, query.radiusKm) });
  if (query.category) and.push({ category: query.category });
  if (query.sellerId) and.push({ sellerId: query.sellerId });
  if (query.minPrice !== undefined) and.push({ price: { $gte: query.minPrice } });
  if (query.maxPrice !== undefined) and.push({ price: { $lte: query.maxPrice } });
  if (query.q) {
    const regex = new RegExp(escapeRegex(query.q.slice(0, 80)), 'i');
    and.push({ $or: [{ title: regex }, { description: regex }] });
  }
  if (query.favoritesOf) {
    const favorites = await (await getDatabase())
      .collection('favorites')
      .find({ userId: query.favoritesOf }, { projection: { listingId: 1 } })
      .sort({ createdAt: -1 })
      .limit(500)
      .toArray();
    and.push({ _id: { $in: favorites.map((f) => f.listingId as ObjectId) } });
  }

  const offset = Math.max(0, Number(query.cursor) || 0);
  const sort: Record<string, 1 | -1> =
    query.sort === 'price_asc' ? { price: 1, _id: -1 } : query.sort === 'price_desc' ? { price: -1, _id: -1 } : { _id: -1 };

  let docs = await listings.find({ $and: and }).sort(sort).skip(offset).limit(limit + 1).toArray();
  let nextCursor: string | null = null;
  if (docs.length > limit) {
    docs = docs.slice(0, limit);
    nextCursor = String(offset + limit);
  }

  const origin = hasOrigin ? { latitude: query.lat!, longitude: query.lng! } : undefined;
  return { items: await hydrateListings(docs, query.viewerId, origin), nextCursor };
}

export async function hydrateListings(
  docs: ListingDoc[],
  viewerId?: ObjectId,
  origin?: { latitude: number; longitude: number }
): Promise<ListingDTO[]> {
  if (docs.length === 0) return [];
  const [sellers, favorites] = await Promise.all([
    loadUsersById(docs.map((d) => d.sellerId)),
    viewerId
      ? (await getDatabase())
          .collection('favorites')
          .find({ userId: viewerId, listingId: { $in: docs.map((d) => d._id) } }, { projection: { listingId: 1 } })
          .toArray()
      : Promise.resolve([]),
  ]);
  const favoriteSet = new Set(favorites.map((f) => f.listingId.toString()));
  return docs.map((doc) => toListingDTO(doc, { sellers, favorites: favoriteSet, viewerId, origin }));
}

export async function getListingById(id: string, viewerId?: ObjectId): Promise<ListingDTO | null> {
  const objectId = toObjectId(id);
  if (!objectId) return null;
  const listings = await listingsCollection();
  const doc = await listings.findOne({ _id: objectId, status: { $in: ['active', 'sold'] } });
  if (!doc) return null;
  const [dto] = await hydrateListings([doc], viewerId);
  return dto;
}
