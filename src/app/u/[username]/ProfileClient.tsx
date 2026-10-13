'use client';

import { useState } from 'react';
import Link from 'next/link';
import { MapPin, CalendarDays, MessageCircle, Settings, Ban, Flag, Newspaper, ShoppingBag, BadgeCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { EmptyState, Spinner } from '@/components/ui/Feedback';
import { PostCard } from '@/components/posts/PostCard';
import { ListingCard } from '@/components/marketplace/ListingCard';
import { LoadMore } from '@/components/shared/LoadMore';
import { ReportDialog } from '@/components/shared/ReportDialog';
import { usePaginated } from '@/hooks/usePaginated';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { api } from '@/lib/client';
import { cn } from '@/lib/utils';
import type { ListingDTO, PostDTO } from '@/types';

export interface ProfileData {
  id: string;
  name: string;
  username: string;
  image?: string;
  bio?: string;
  area?: string;
  joinedAt: string;
  isMe: boolean;
  isBlocked: boolean;
  isAdmin: boolean;
}

export default function ProfileClient({ profile, signedIn }: { profile: ProfileData; signedIn: boolean }) {
  const requireAuth = useRequireAuth();
  const [tab, setTab] = useState<'posts' | 'listings'>('posts');
  const [blocked, setBlocked] = useState(profile.isBlocked);
  const [reporting, setReporting] = useState(false);

  const posts = usePaginated<PostDTO>(tab === 'posts' ? '/api/posts' : null, { author: profile.id });
  const listings = usePaginated<ListingDTO>(tab === 'listings' ? '/api/listings' : null, { seller: profile.id });

  const toggleBlock = () =>
    requireAuth(async () => {
      if (!blocked && !confirm(`Block ${profile.name}? They won't be able to message you.`)) return;
      try {
        const result = await api<{ blocked: boolean }>(`/api/users/${profile.id}/block`, { method: 'POST' });
        setBlocked(result.blocked);
        toast.success(result.blocked ? 'User blocked' : 'User unblocked');
      } catch (e) {
        toast.error((e as Error).message);
      }
    });

  const joined = new Date(profile.joinedAt).toLocaleDateString([], { month: 'long', year: 'numeric' });

  return (
    <div className="max-w-3xl mx-auto px-4 py-5 lg:py-8">
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="h-24 bg-gradient-to-r from-community-500 via-sky-400 to-marketplace-500" />
        <div className="px-5 pb-5">
          <div className="flex items-end justify-between -mt-10 mb-3">
            <Avatar name={profile.name} image={profile.image} size="xl" className="ring-4 ring-white" />
            <div className="flex gap-2">
              {profile.isMe ? (
                <Link href="/settings" className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50">
                  <Settings className="w-4 h-4" /> Edit profile
                </Link>
              ) : (
                <>
                  {!blocked && (
                    <Link
                      href={signedIn ? `/messages/new?to=${profile.id}` : `/auth/signin?callbackUrl=${encodeURIComponent(`/messages/new?to=${profile.id}`)}`}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-community-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-community-600"
                    >
                      <MessageCircle className="w-4 h-4" /> Message
                    </Link>
                  )}
                  <Button variant="outline" size="sm" onClick={toggleBlock} aria-label={blocked ? 'Unblock' : 'Block'}>
                    <Ban className="w-4 h-4" />
                    <span className="ml-1.5">{blocked ? 'Unblock' : 'Block'}</span>
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => requireAuth(() => setReporting(true))} aria-label="Report">
                    <Flag className="w-4 h-4" />
                  </Button>
                </>
              )}
            </div>
          </div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-1.5">
            {profile.name}
            {profile.isAdmin && <BadgeCheck className="w-5 h-5 text-community-500" aria-label="Moderator" />}
          </h1>
          <p className="text-sm text-gray-500">@{profile.username}</p>
          {profile.bio && <p className="mt-3 text-gray-700 whitespace-pre-wrap">{profile.bio}</p>}
          <div className="mt-3 flex flex-wrap gap-4 text-sm text-gray-500">
            {profile.area && (
              <span className="flex items-center gap-1"><MapPin className="w-4 h-4" />{profile.area}</span>
            )}
            <span className="flex items-center gap-1"><CalendarDays className="w-4 h-4" />Joined {joined}</span>
          </div>
        </div>
      </div>

      <div className="mt-5 flex gap-2 border-b border-gray-200">
        {([
          ['posts', 'Posts', Newspaper],
          ['listings', 'For sale', ShoppingBag],
        ] as const).map(([key, label, Icon]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={cn(
              'flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold border-b-2 -mb-px',
              tab === key ? 'border-community-500 text-community-700' : 'border-transparent text-gray-500 hover:text-gray-800'
            )}
          >
            <Icon className="w-4 h-4" /> {label}
          </button>
        ))}
      </div>

      <div className="mt-4">
        {tab === 'posts' ? (
          <div className="space-y-4">
            {posts.loading ? (
              <Spinner />
            ) : posts.items.length === 0 ? (
              <EmptyState icon={Newspaper} title="No posts yet" description={profile.isMe ? 'Share something with your neighborhood.' : undefined} />
            ) : (
              posts.items.map((post) => <PostCard key={post.id} post={post} onUpdate={posts.update} onDelete={posts.remove} />)
            )}
            <LoadMore hasMore={posts.hasMore} loading={posts.loadingMore} onLoadMore={posts.loadMore} />
          </div>
        ) : (
          <>
            {listings.loading ? (
              <Spinner />
            ) : listings.items.length === 0 ? (
              <EmptyState icon={ShoppingBag} title="Nothing for sale" />
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {listings.items.map((listing) => (
                  <ListingCard key={listing.id} listing={listing} onUpdate={listings.update} />
                ))}
              </div>
            )}
            <LoadMore hasMore={listings.hasMore} loading={listings.loadingMore} onLoadMore={listings.loadMore} />
          </>
        )}
      </div>

      {reporting && <ReportDialog open onClose={() => setReporting(false)} targetType="user" targetId={profile.id} />}
    </div>
  );
}
