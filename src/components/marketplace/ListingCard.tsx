'use client';

import Link from 'next/link';
import { Heart, MapPin } from 'lucide-react';
import toast from 'react-hot-toast';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { api, imageUrl } from '@/lib/client';
import { cn, formatDistance, formatPrice, formatRelativeTime } from '@/lib/utils';
import type { ListingDTO } from '@/types';

export function ListingCard({ listing, onUpdate }: { listing: ListingDTO; onUpdate?: (id: string, patch: Partial<ListingDTO>) => void }) {
  const requireAuth = useRequireAuth();

  const toggleFavorite = (event: React.MouseEvent) => {
    event.preventDefault();
    requireAuth(async () => {
      onUpdate?.(listing.id, { isFavorite: !listing.isFavorite });
      try {
        const result = await api<{ isFavorite: boolean }>(`/api/listings/${listing.id}/favorite`, { method: 'POST' });
        onUpdate?.(listing.id, { isFavorite: result.isFavorite });
      } catch (error) {
        onUpdate?.(listing.id, { isFavorite: listing.isFavorite });
        toast.error((error as Error).message);
      }
    });
  };

  return (
    <Link href={`/marketplace/${listing.id}`} className="group block bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      <div className="relative aspect-square bg-gray-100">
        {listing.images[0] && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imageUrl(listing.images[0], 400)} alt={listing.title} loading="lazy" className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform" />
        )}
        {listing.status === 'sold' && (
          <span className="absolute top-2 left-2 rounded-full bg-gray-900/80 px-2.5 py-1 text-xs font-bold text-white">SOLD</span>
        )}
        {!listing.isOwner && (
          <button
            onClick={toggleFavorite}
            className={cn('absolute top-2 right-2 p-2 rounded-full shadow-sm transition-colors', listing.isFavorite ? 'bg-rose-500 text-white' : 'bg-white/90 text-gray-500 hover:text-rose-500')}
            aria-label={listing.isFavorite ? 'Remove from saved' : 'Save'}
          >
            <Heart className={cn('w-4 h-4', listing.isFavorite && 'fill-current')} />
          </button>
        )}
      </div>
      <div className="p-3">
        <p className={cn('text-lg font-bold', listing.price === 0 ? 'text-marketplace-600' : 'text-gray-900')}>
          {formatPrice(listing.price, listing.currency)}
        </p>
        <h3 className="text-sm text-gray-800 line-clamp-2 min-h-[2.5rem]">{listing.title}</h3>
        <div className="mt-1.5 flex items-center gap-1 text-xs text-gray-500">
          <MapPin className="w-3 h-3 flex-shrink-0" />
          <span className="truncate">{formatDistance(listing.distanceKm) ?? listing.place.label}</span>
          <span className="ml-auto flex-shrink-0">{formatRelativeTime(listing.createdAt)}</span>
        </div>
      </div>
    </Link>
  );
}
