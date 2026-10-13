'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { MapPin, Loader2, LocateFixed } from 'lucide-react';
import { MapView, type MapMarker } from '@/components/map/Map';
import { POST_TYPE_META } from '@/components/posts/postMeta';
import { useLocationStore, useUIStore } from '@/store/useStore';
import { api, buildQuery } from '@/lib/client';
import { cn, formatPrice, formatRelativeTime } from '@/lib/utils';
import type { ListingDTO, Paginated, PostDTO, PostType } from '@/types';

type Layer = PostType | 'listing';

const LAYER_COLORS: Record<Layer, string> = {
  community: '#0ea5e9',
  event: '#8b5cf6',
  question: '#f59e0b',
  lostfound: '#14b8a6',
  emergency: '#ef4444',
  listing: '#22c55e',
};

const LAYER_LABELS: Record<Layer, string> = {
  community: POST_TYPE_META.community.label,
  event: POST_TYPE_META.event.label,
  question: POST_TYPE_META.question.label,
  lostfound: POST_TYPE_META.lostfound.label,
  emergency: POST_TYPE_META.emergency.label,
  listing: 'For sale',
};

const DEFAULT_CENTER: [number, number] = [20, 0];
const QUERY_RADIUS_KM = 15;

export default function MapClient() {
  const { location, hydrated } = useLocationStore();
  const openPicker = useUIStore((s) => s.openLocationPicker);
  const [panned, setPanned] = useState<{ lat: number; lng: number; base: string } | null>(null);
  const [posts, setPosts] = useState<PostDTO[]>([]);
  const [listings, setListings] = useState<ListingDTO[]>([]);
  const [fetchedQuery, setFetchedQuery] = useState<string | null>(null);
  const [hidden, setHidden] = useState<Set<Layer>>(new Set());
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  const locationKey = location ? `${location.latitude},${location.longitude}` : '';
  const center = useMemo<[number, number] | null>(
    () => (!hydrated ? null : location ? [location.latitude, location.longitude] : DEFAULT_CENTER),
    [hydrated, location]
  );
  const queryCenter =
    panned && panned.base === locationKey ? panned : location ? { lat: location.latitude, lng: location.longitude } : null;
  const query = queryCenter
    ? buildQuery({ lat: queryCenter.lat.toFixed(3), lng: queryCenter.lng.toFixed(3), radiusKm: QUERY_RADIUS_KM, limit: 50 })
    : null;
  const loading = query !== null && fetchedQuery !== query;

  useEffect(() => {
    if (!query) return;
    const controller = new AbortController();
    Promise.all([
      api<Paginated<PostDTO>>(`/api/posts${query}`, { signal: controller.signal }),
      api<Paginated<ListingDTO>>(`/api/listings${query}`, { signal: controller.signal }),
    ])
      .then(([p, l]) => {
        setPosts(p.items);
        setListings(l.items);
      })
      .catch(() => {})
      .finally(() => !controller.signal.aborted && setFetchedQuery(query));
    return () => controller.abort();
  }, [query]);

  const onMoveEnd = useCallback(
    (c: { lat: number; lng: number }, zoom: number) => {
      if (zoom < 10) return;
      if (debounce.current) clearTimeout(debounce.current);
      debounce.current = setTimeout(() => {
        setPanned((prev) => {
          if (prev && prev.base === locationKey && Math.abs(prev.lat - c.lat) < 0.02 && Math.abs(prev.lng - c.lng) < 0.02) return prev;
          return { lat: c.lat, lng: c.lng, base: locationKey };
        });
      }, 500);
    },
    [locationKey]
  );

  const markers = useMemo<MapMarker[]>(() => {
    const result: MapMarker[] = [];
    for (const post of posts) {
      if (hidden.has(post.type)) continue;
      const isActiveEmergency = post.type === 'emergency' && post.expiresAt && new Date(post.expiresAt) > new Date();
      result.push({
        id: `p-${post.id}`,
        lat: post.lat,
        lng: post.lng,
        color: LAYER_COLORS[post.type],
        pulse: Boolean(isActiveEmergency),
        title: post.text.length > 90 ? `${post.text.slice(0, 90)}…` : post.text,
        subtitle: `${LAYER_LABELS[post.type]} · ${post.author.name} · ${formatRelativeTime(post.createdAt)}`,
        href: `/posts/${post.id}`,
      });
    }
    if (!hidden.has('listing')) {
      for (const listing of listings) {
        result.push({
          id: `l-${listing.id}`,
          lat: listing.lat,
          lng: listing.lng,
          color: LAYER_COLORS.listing,
          title: listing.title,
          subtitle: `${formatPrice(listing.price, listing.currency)} · ${listing.place.label}`,
          href: `/marketplace/${listing.id}`,
        });
      }
    }
    return result;
  }, [posts, listings, hidden]);

  const toggle = (layer: Layer) =>
    setHidden((current) => {
      const next = new Set(current);
      if (next.has(layer)) next.delete(layer);
      else next.add(layer);
      return next;
    });

  return (
    <div className="relative h-[calc(100dvh-8.5rem)] lg:h-[100dvh]">
      {center && (
        <MapView
          center={center}
          zoom={location ? 13 : 2}
          markers={markers}
          showCenter={Boolean(location)}
          onMoveEnd={onMoveEnd}
          className="h-full w-full"
        />
      )}

      <div className="absolute top-3 inset-x-3 z-[500] flex flex-col gap-2 pointer-events-none">
        <div className="flex gap-2 overflow-x-auto scrollbar-none pointer-events-auto">
          {(Object.keys(LAYER_COLORS) as Layer[]).map((layer) => (
            <button
              key={layer}
              onClick={() => toggle(layer)}
              className={cn(
                'flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold shadow-md whitespace-nowrap border',
                hidden.has(layer) ? 'bg-white/80 text-gray-400 border-gray-200' : 'bg-white text-gray-800 border-white'
              )}
            >
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: hidden.has(layer) ? '#d1d5db' : LAYER_COLORS[layer] }} />
              {LAYER_LABELS[layer]}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 pointer-events-auto self-start">
          <span className="rounded-full bg-white px-3 py-1.5 text-xs font-medium text-gray-700 shadow-md flex items-center gap-1.5">
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <MapPin className="w-3.5 h-3.5 text-community-500" />}
            {markers.length} nearby
          </span>
        </div>
      </div>

      {hydrated && !location && (
        <div className="absolute inset-x-3 bottom-4 z-[500] mx-auto max-w-md rounded-2xl bg-white p-4 shadow-xl text-center">
          <p className="font-semibold text-gray-900">Where are you?</p>
          <p className="text-sm text-gray-500 mb-3">Set your neighborhood to see what&apos;s happening around you.</p>
          <button onClick={openPicker} className="inline-flex items-center gap-2 rounded-lg bg-community-500 px-4 py-2 text-sm font-medium text-white hover:bg-community-600">
            <LocateFixed className="w-4 h-4" /> Set location
          </button>
        </div>
      )}
    </div>
  );
}
