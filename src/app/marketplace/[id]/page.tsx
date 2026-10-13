import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { cache } from 'react';
import { getListingById } from '@/lib/listings';
import { getCurrentUser } from '@/lib/session';
import { formatPrice } from '@/lib/utils';
import ListingDetailClient from './ListingDetailClient';

const loadListing = cache(async (id: string) => {
  const viewer = await getCurrentUser();
  return getListingById(id, viewer?._id);
});

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const listing = await loadListing(id);
  if (!listing) return { title: 'Listing not found' };
  const title = `${listing.title} · ${formatPrice(listing.price, listing.currency)}`;
  return {
    title,
    description: `${listing.description.slice(0, 140)} · ${listing.place.label}`,
    openGraph: { title, images: listing.images[0] ? [listing.images[0]] : undefined },
  };
}

export default async function ListingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const listing = await loadListing(id);
  if (!listing) notFound();
  return <ListingDetailClient initialListing={listing} />;
}
