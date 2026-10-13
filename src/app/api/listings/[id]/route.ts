import { route, ok, parseBody, notFound, forbidden } from '@/lib/api';
import { getCurrentUser, requireUser } from '@/lib/session';
import { updateListingSchema } from '@/lib/validation';
import { getListingById, listingsCollection } from '@/lib/listings';
import { getDatabase, toObjectId } from '@/lib/mongodb';

type Context = { params: Promise<{ id: string }> };

export const GET = route<Context>(async (_request, { params }) => {
  const { id } = await params;
  const viewer = await getCurrentUser();
  const listing = await getListingById(id, viewer?._id);
  if (!listing) throw notFound('This listing is no longer available');
  return ok(listing);
});

async function loadOwned(id: string) {
  const user = await requireUser();
  const listingId = toObjectId(id);
  if (!listingId) throw notFound();
  const listings = await listingsCollection();
  const listing = await listings.findOne({ _id: listingId }, { projection: { sellerId: 1 } });
  if (!listing) throw notFound();
  if (!listing.sellerId.equals(user._id) && user.role !== 'admin') throw forbidden();
  return { user, listingId, listings };
}

export const PATCH = route<Context>(async (request, { params }) => {
  const { id } = await params;
  const { listingId, listings, user } = await loadOwned(id);
  const { status } = await parseBody(request, updateListingSchema);
  await listings.updateOne({ _id: listingId }, { $set: { status, updatedAt: new Date() } });
  const listing = await getListingById(id, user._id);
  return ok(listing);
});

export const DELETE = route<Context>(async (_request, { params }) => {
  const { id } = await params;
  const { listingId, listings } = await loadOwned(id);
  await Promise.all([
    listings.deleteOne({ _id: listingId }),
    (await getDatabase()).collection('favorites').deleteMany({ listingId }),
  ]);
  return ok({ success: true });
});
