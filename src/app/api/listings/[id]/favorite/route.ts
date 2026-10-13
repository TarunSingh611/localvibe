import { MongoServerError } from 'mongodb';
import { route, ok, notFound } from '@/lib/api';
import { requireUser } from '@/lib/session';
import { rateLimit } from '@/lib/rate-limit';
import { listingsCollection } from '@/lib/listings';
import { getDatabase, toObjectId } from '@/lib/mongodb';

type Context = { params: Promise<{ id: string }> };

export const POST = route<Context>(async (_request, { params }) => {
  const { id } = await params;
  const user = await requireUser();
  await rateLimit({ key: `favorite:${user._id}`, limit: 120, windowSeconds: 600 });

  const listingId = toObjectId(id);
  if (!listingId) throw notFound();
  const listings = await listingsCollection();
  const exists = await listings.findOne({ _id: listingId }, { projection: { _id: 1 } });
  if (!exists) throw notFound();

  const favorites = (await getDatabase()).collection('favorites');
  let isFavorite: boolean;
  try {
    await favorites.insertOne({ listingId, userId: user._id, createdAt: new Date() });
    isFavorite = true;
  } catch (error) {
    if (!(error instanceof MongoServerError && error.code === 11000)) throw error;
    await favorites.deleteOne({ listingId, userId: user._id });
    isFavorite = false;
  }
  await listings.updateOne({ _id: listingId }, { $inc: { favoriteCount: isFavorite ? 1 : -1 } });

  return ok({ isFavorite });
});
