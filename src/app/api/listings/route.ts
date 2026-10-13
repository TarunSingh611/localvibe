import { ObjectId } from 'mongodb';
import { route, ok, parseBody, unauthorized } from '@/lib/api';
import { getCurrentUser, requireUser } from '@/lib/session';
import { rateLimit } from '@/lib/rate-limit';
import { createListingSchema } from '@/lib/validation';
import { listingsCollection, queryListings, hydrateListings } from '@/lib/listings';
import { geoPoint } from '@/lib/geo';
import { toObjectId } from '@/lib/mongodb';
import { LISTING_CATEGORIES, type ListingCategory, type ListingDoc } from '@/types';

export const dynamic = 'force-dynamic';

function numberParam(value: string | null): number | undefined {
  if (value === null || value === '') return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export const GET = route(async (request) => {
  const { searchParams } = new URL(request.url);
  const viewer = await getCurrentUser();
  const category = searchParams.get('category');
  const sort = searchParams.get('sort');
  const favoritesOnly = searchParams.get('favorites') === '1';
  if (favoritesOnly && !viewer) throw unauthorized();
  const sellerId = toObjectId(searchParams.get('seller') ?? '');

  const result = await queryListings({
    viewerId: viewer?._id,
    lat: numberParam(searchParams.get('lat')),
    lng: numberParam(searchParams.get('lng')),
    radiusKm: numberParam(searchParams.get('radiusKm')),
    category:
      category && (LISTING_CATEGORIES as readonly string[]).includes(category) ? (category as ListingCategory) : undefined,
    q: searchParams.get('q')?.trim() || undefined,
    minPrice: numberParam(searchParams.get('minPrice')),
    maxPrice: numberParam(searchParams.get('maxPrice')),
    sort: sort === 'price_asc' || sort === 'price_desc' ? sort : 'latest',
    favoritesOf: favoritesOnly ? viewer!._id : undefined,
    sellerId: sellerId ?? undefined,
    includeSold: Boolean(sellerId),
    cursor: searchParams.get('cursor'),
  });
  return ok(result);
});

export const POST = route(async (request) => {
  const user = await requireUser();
  await rateLimit({ key: `listing:${user._id}`, limit: 10, windowSeconds: 3600 });
  const input = await parseBody(request, createListingSchema);

  const now = new Date();
  const listing: ListingDoc = {
    _id: new ObjectId(),
    sellerId: user._id,
    title: input.title,
    description: input.description,
    price: Math.round(input.price * 100) / 100,
    currency: input.currency,
    category: input.category,
    condition: input.condition,
    images: input.images,
    location: geoPoint(input.location.latitude, input.location.longitude),
    place: input.location.place,
    status: 'active',
    favoriteCount: 0,
    reportCount: 0,
    createdAt: now,
    updatedAt: now,
  };
  await (await listingsCollection()).insertOne(listing);

  const [dto] = await hydrateListings([listing], user._id);
  return ok(dto, { status: 201 });
});
