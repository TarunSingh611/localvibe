'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { Search, Plus, ShoppingBag, Heart, SlidersHorizontal } from 'lucide-react';
import { ListingCard } from '@/components/marketplace/ListingCard';
import { CATEGORY_LABELS } from '@/components/marketplace/listingMeta';
import { LocationBar } from '@/components/location/LocationBar';
import { LoadMore } from '@/components/shared/LoadMore';
import { Spinner, EmptyState } from '@/components/ui/Feedback';
import { useLocationStore } from '@/store/useStore';
import { usePaginated } from '@/hooks/usePaginated';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { cn } from '@/lib/utils';
import { LISTING_CATEGORIES, type ListingCategory, type ListingDTO } from '@/types';

export default function MarketplaceClient() {
  const { status } = useSession();
  const requireAuth = useRequireAuth();
  const { location, radiusKm, hydrated } = useLocationStore();
  const [category, setCategory] = useState<ListingCategory | 'all'>('all');
  const [sort, setSort] = useState<'latest' | 'price_asc' | 'price_desc'>('latest');
  const [searchInput, setSearchInput] = useState('');
  const [q, setQ] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [savedOnly, setSavedOnly] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setQ(searchInput.trim()), 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const listings = usePaginated<ListingDTO>(hydrated ? '/api/listings' : null, {
    lat: location?.latitude,
    lng: location?.longitude,
    radiusKm: location && !savedOnly ? radiusKm : null,
    category: category === 'all' ? null : category,
    sort,
    q,
    minPrice: minPrice || null,
    maxPrice: maxPrice || null,
    favorites: savedOnly && status === 'authenticated' ? 1 : null,
  });

  return (
    <div className="max-w-6xl mx-auto px-4 py-5 lg:py-8">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Marketplace</h1>
          <p className="text-sm text-gray-500">Buy, sell and give away with neighbors. No fees, ever.</p>
        </div>
        <Link
          href="/marketplace/new"
          className="inline-flex items-center gap-2 rounded-lg bg-marketplace-500 hover:bg-marketplace-600 px-4 py-2 text-sm font-semibold text-white"
        >
          <Plus className="w-4 h-4" /> Sell something
        </Link>
      </div>

      <div className="space-y-3 mb-5">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[12rem]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input value={searchInput} onChange={(e) => setSearchInput(e.target.value)} placeholder="Search the marketplace" className="input-field pl-9 rounded-full" />
          </div>
          <button onClick={() => setShowFilters((v) => !v)} className={cn('chip', showFilters ? 'chip-active' : 'chip-idle')}>
            <SlidersHorizontal className="w-4 h-4" /> Filters
          </button>
          <button
            onClick={() => requireAuth(() => setSavedOnly((v) => !v))}
            className={cn('chip', savedOnly ? 'border-rose-500 bg-rose-500 text-white' : 'chip-idle')}
          >
            <Heart className={cn('w-4 h-4', savedOnly && 'fill-current')} /> Saved
          </button>
        </div>

        {showFilters && (
          <div className="flex flex-wrap items-end gap-3 rounded-2xl bg-white border border-gray-200 p-3">
            <LocationBar />
            <div className="flex items-center gap-2">
              <input type="number" min={0} value={minPrice} onChange={(e) => setMinPrice(e.target.value)} placeholder="Min price" className="input-field w-28" />
              <span className="text-gray-400">–</span>
              <input type="number" min={0} value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} placeholder="Max price" className="input-field w-28" />
            </div>
            <select value={sort} onChange={(e) => setSort(e.target.value as typeof sort)} className="input-field w-auto">
              <option value="latest">Newest first</option>
              <option value="price_asc">Price: low to high</option>
              <option value="price_desc">Price: high to low</option>
            </select>
          </div>
        )}

        <div className="flex gap-2 overflow-x-auto scrollbar-none">
          <button onClick={() => setCategory('all')} className={cn('chip', category === 'all' ? 'chip-active' : 'chip-idle')}>All</button>
          {LISTING_CATEGORIES.map((c) => (
            <button key={c} onClick={() => setCategory(c)} className={cn('chip', category === c ? 'chip-active' : 'chip-idle')}>
              {CATEGORY_LABELS[c]}
            </button>
          ))}
        </div>
        {!showFilters && location && (
          <p className="text-xs text-gray-500">
            Showing items {savedOnly ? 'you saved' : radiusKm ? `within ${radiusKm} km of ${location.place.label}` : 'from everywhere'}.
          </p>
        )}
      </div>

      {listings.loading ? (
        <Spinner label="Loading listings…" />
      ) : listings.items.length === 0 ? (
        <EmptyState
          icon={savedOnly ? Heart : ShoppingBag}
          title={savedOnly ? 'No saved items yet' : 'No items found nearby'}
          description={savedOnly ? 'Tap the heart on a listing to save it for later.' : 'Try a wider distance, a different category, or list the first item yourself.'}
          action={!savedOnly && <Link href="/marketplace/new" className="inline-flex rounded-lg bg-marketplace-500 px-4 py-2 text-sm font-semibold text-white">List an item</Link>}
        />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
          {listings.items.map((listing) => (
            <ListingCard key={listing.id} listing={listing} onUpdate={listings.update} />
          ))}
        </div>
      )}
      <LoadMore hasMore={listings.hasMore} loading={listings.loadingMore} onLoadMore={listings.loadMore} />
    </div>
  );
}
