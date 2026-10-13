'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Search, Flame, Clock, MapPin, Newspaper, PartyPopper } from 'lucide-react';
import { PostCard } from '@/components/posts/PostCard';
import { CreatePostModal } from '@/components/posts/CreatePostModal';
import { POST_TYPE_META } from '@/components/posts/postMeta';
import { LocationBar } from '@/components/location/LocationBar';
import { LoadMore } from '@/components/shared/LoadMore';
import { Avatar } from '@/components/ui/Avatar';
import { Spinner, EmptyState } from '@/components/ui/Feedback';
import { Button } from '@/components/ui/Button';
import { useLocationStore, useUIStore } from '@/store/useStore';
import { usePaginated } from '@/hooks/usePaginated';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { cn } from '@/lib/utils';
import { POST_TYPES, type PostDTO, type PostType } from '@/types';

export default function FeedClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  const requireAuth = useRequireAuth();
  const { location, radiusKm, hydrated } = useLocationStore();
  const openPicker = useUIStore((s) => s.openLocationPicker);

  const [type, setType] = useState<PostType | 'all'>('all');
  const [sort, setSort] = useState<'latest' | 'top'>('latest');
  const [searchInput, setSearchInput] = useState(searchParams.get('q') ?? '');
  const [q, setQ] = useState(searchParams.get('q') ?? '');
  const [composeOpen, setComposeOpen] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setQ(searchInput.trim()), 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const composeParam = searchParams.get('compose') === '1';
  const showCompose = composeOpen || (composeParam && status === 'authenticated');

  useEffect(() => {
    if (composeParam && status === 'unauthenticated') requireAuth();
  }, [composeParam, status, requireAuth]);

  const closeCompose = () => {
    setComposeOpen(false);
    if (composeParam) router.replace('/feed', { scroll: false });
  };

  useEffect(() => {
    if (searchParams.get('welcome') === '1' && hydrated && !location) openPicker();
  }, [searchParams, hydrated, location, openPicker]);

  const feed = usePaginated<PostDTO>(hydrated ? '/api/posts' : null, {
    lat: location?.latitude,
    lng: location?.longitude,
    radiusKm: location ? radiusKm : null,
    type: type === 'all' ? null : type,
    sort,
    q,
  });

  return (
    <div className="max-w-2xl mx-auto px-4 py-5 lg:py-8">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <h1 className="text-2xl font-bold text-gray-900">Local feed</h1>
        <LocationBar />
      </div>

      {hydrated && !location && (
        <button
          onClick={openPicker}
          className="w-full mb-4 flex items-center gap-3 rounded-2xl bg-gradient-to-r from-community-500 to-marketplace-500 p-4 text-left text-white shadow-sm"
        >
          <MapPin className="w-8 h-8 flex-shrink-0" />
          <span>
            <span className="block font-semibold">Set your neighborhood</span>
            <span className="block text-sm opacity-90">You&apos;re seeing posts from everywhere. Pick your area to see what&apos;s happening nearby.</span>
          </span>
        </button>
      )}

      <button
        onClick={() => requireAuth(() => setComposeOpen(true))}
        className="w-full mb-4 flex items-center gap-3 rounded-2xl bg-white border border-gray-200 p-3 text-left shadow-sm hover:border-community-300"
      >
        <Avatar name={session?.user.name ?? 'You'} image={session?.user.image} />
        <span className="flex-1 rounded-full bg-gray-100 px-4 py-2.5 text-sm text-gray-500">
          {session ? `What's happening, ${session.user.name?.split(' ')[0]}?` : 'Sign in to post to your neighborhood'}
        </span>
      </button>

      <div className="sticky top-14 lg:top-0 z-20 -mx-4 px-4 py-2 bg-gray-50/95 backdrop-blur space-y-2">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search posts, tags, places"
              className="input-field pl-9 rounded-full"
            />
          </div>
          <div className="flex rounded-full bg-white border border-gray-200 p-0.5">
            <button
              onClick={() => setSort('latest')}
              className={cn('flex items-center gap-1 rounded-full px-3 text-sm font-medium', sort === 'latest' ? 'bg-community-500 text-white' : 'text-gray-600')}
            >
              <Clock className="w-4 h-4" /> <span className="hidden sm:inline">Latest</span>
            </button>
            <button
              onClick={() => setSort('top')}
              className={cn('flex items-center gap-1 rounded-full px-3 text-sm font-medium', sort === 'top' ? 'bg-community-500 text-white' : 'text-gray-600')}
            >
              <Flame className="w-4 h-4" /> <span className="hidden sm:inline">Top</span>
            </button>
          </div>
        </div>
        <div className="flex gap-2 overflow-x-auto scrollbar-none">
          <button onClick={() => setType('all')} className={cn('chip', type === 'all' ? 'chip-active' : 'chip-idle')}>
            <Newspaper className="w-4 h-4" /> All
          </button>
          {POST_TYPES.map((t) => {
            const Icon = POST_TYPE_META[t].icon;
            return (
              <button key={t} onClick={() => setType(t)} className={cn('chip', type === t ? 'chip-active' : 'chip-idle')}>
                <Icon className="w-4 h-4" /> {POST_TYPE_META[t].label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-3 space-y-4">
        {feed.loading ? (
          <Spinner label="Loading your neighborhood…" />
        ) : feed.error ? (
          <EmptyState icon={Newspaper} title="Couldn't load the feed" description={feed.error} action={<Button onClick={() => window.location.reload()}>Retry</Button>} />
        ) : feed.items.length === 0 ? (
          <EmptyState
            icon={PartyPopper}
            title={q ? 'No posts match your search' : 'It’s quiet around here'}
            description={
              q ? 'Try different words or widen your distance.'
                : location ? `Be the first to post in ${location.place.label}. Introduce yourself, share a tip or ask a question.`
                : 'Be the first to post!'
            }
            action={<Button onClick={() => requireAuth(() => setComposeOpen(true))}>Create the first post</Button>}
          />
        ) : (
          feed.items.map((post) => <PostCard key={post.id} post={post} onUpdate={feed.update} onDelete={feed.remove} />)
        )}
        <LoadMore hasMore={feed.hasMore} loading={feed.loadingMore} onLoadMore={feed.loadMore} />
      </div>

      <CreatePostModal open={showCompose} onClose={closeCompose} onCreated={feed.prepend} />
    </div>
  );
}
