'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Heart, MessageCircle, Share2, MoreHorizontal, MapPin, Flag, Trash2, Mail, CalendarDays, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import { Avatar } from '@/components/ui/Avatar';
import { ReportDialog } from '@/components/shared/ReportDialog';
import { Comments } from './Comments';
import { POST_TYPE_META, SEVERITY_META, EMERGENCY_CATEGORY_LABELS } from './postMeta';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { api, imageUrl } from '@/lib/client';
import { cn, formatDistance, formatRelativeTime } from '@/lib/utils';
import type { PostDTO } from '@/types';

interface PostCardProps {
  post: PostDTO;
  onUpdate?: (id: string, patch: Partial<PostDTO>) => void;
  onDelete?: (id: string) => void;
  defaultShowComments?: boolean;
}

export function PostCard({ post, onUpdate, onDelete, defaultShowComments = false }: PostCardProps) {
  const router = useRouter();
  const requireAuth = useRequireAuth();
  const [showComments, setShowComments] = useState(defaultShowComments);
  const [menuOpen, setMenuOpen] = useState(false);
  const [reporting, setReporting] = useState(false);
  const [liking, setLiking] = useState(false);
  const meta = POST_TYPE_META[post.type];
  const TypeIcon = meta.icon;
  const isActiveEmergency = post.type === 'emergency' && post.expiresAt && new Date(post.expiresAt) > new Date();

  const like = () =>
    requireAuth(async () => {
      if (liking) return;
      setLiking(true);
      const optimistic = { likedByMe: !post.likedByMe, likeCount: post.likeCount + (post.likedByMe ? -1 : 1) };
      onUpdate?.(post.id, optimistic);
      try {
        const result = await api<{ liked: boolean; likeCount: number }>(`/api/posts/${post.id}/like`, { method: 'POST' });
        onUpdate?.(post.id, { likedByMe: result.liked, likeCount: result.likeCount });
      } catch (error) {
        onUpdate?.(post.id, { likedByMe: post.likedByMe, likeCount: post.likeCount });
        toast.error((error as Error).message);
      } finally {
        setLiking(false);
      }
    });

  const share = async () => {
    const url = `${window.location.origin}/posts/${post.id}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: `${meta.label} on LocalVibe`, text: post.text.slice(0, 120), url });
      } else {
        await navigator.clipboard.writeText(url);
        toast.success('Link copied');
      }
    } catch {
      // User cancelled the share sheet.
    }
  };

  const remove = async () => {
    setMenuOpen(false);
    if (!confirm('Delete this post? This cannot be undone.')) return;
    try {
      await api(`/api/posts/${post.id}`, { method: 'DELETE' });
      toast.success('Post deleted');
      onDelete?.(post.id);
    } catch (error) {
      toast.error((error as Error).message);
    }
  };

  return (
    <article
      className={cn(
        'bg-white rounded-2xl border shadow-sm overflow-hidden',
        isActiveEmergency ? 'border-emergency-300 ring-1 ring-emergency-200' : 'border-gray-200'
      )}
    >
      {post.type === 'emergency' && post.emergency && (
        <div className={cn('flex items-center gap-2 px-4 py-2 text-sm font-semibold border-b', SEVERITY_META[post.emergency.severity].className)}>
          <AlertTriangle className="w-4 h-4" />
          {EMERGENCY_CATEGORY_LABELS[post.emergency.category]} · {SEVERITY_META[post.emergency.severity].label} severity
          {!isActiveEmergency && <span className="ml-auto text-xs font-normal opacity-75">Expired</span>}
        </div>
      )}

      <div className="p-4">
        <header className="flex items-start gap-3">
          <Link href={`/u/${post.author.username}`}>
            <Avatar name={post.author.name} image={post.author.image} />
          </Link>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <Link href={`/u/${post.author.username}`} className="font-semibold text-gray-900 hover:underline truncate">
                {post.author.name}
              </Link>
              <span className={cn('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium', meta.badge)}>
                <TypeIcon className="w-3 h-3" />
                {meta.label}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-x-1.5 text-xs text-gray-500 mt-0.5">
              <MapPin className="w-3 h-3" />
              <span className="truncate max-w-[12rem]">{post.place.label}</span>
              {formatDistance(post.distanceKm) && <span>· {formatDistance(post.distanceKm)}</span>}
              <span>·</span>
              <Link href={`/posts/${post.id}`} className="hover:underline">
                {formatRelativeTime(post.createdAt)}
              </Link>
            </div>
          </div>

          <div className="relative">
            <button onClick={() => setMenuOpen((v) => !v)} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700" aria-label="Post options">
              <MoreHorizontal className="w-5 h-5" />
            </button>
            {menuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                <div className="absolute right-0 top-9 z-20 w-48 rounded-xl border border-gray-200 bg-white py-1 shadow-lg">
                  {post.isOwner ? (
                    <button onClick={remove} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50">
                      <Trash2 className="w-4 h-4" /> Delete post
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={() => {
                          setMenuOpen(false);
                          requireAuth(() => router.push(`/messages/new?to=${post.author.id}`));
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        <Mail className="w-4 h-4" /> Message {post.author.name.split(' ')[0]}
                      </button>
                      <button
                        onClick={() => {
                          setMenuOpen(false);
                          requireAuth(() => setReporting(true));
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        <Flag className="w-4 h-4" /> Report post
                      </button>
                    </>
                  )}
                </div>
              </>
            )}
          </div>
        </header>

        {post.type === 'event' && post.event && (
          <div className="mt-3 flex items-center gap-3 rounded-xl bg-violet-50 border border-violet-100 px-3 py-2">
            <CalendarDays className="w-5 h-5 text-violet-600" />
            <div className="text-sm">
              <p className="font-semibold text-violet-900">
                {new Date(post.event.startsAt).toLocaleString(undefined, { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
              </p>
              {post.event.venue && <p className="text-violet-700">{post.event.venue}</p>}
            </div>
          </div>
        )}

        <p className="mt-3 text-[15px] text-gray-800 whitespace-pre-wrap break-words leading-relaxed">{post.text}</p>

        {post.tags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {post.tags.map((tag) => (
              <Link key={tag} href={`/feed?q=${encodeURIComponent(tag)}`} className="text-sm text-community-600 hover:underline">
                #{tag}
              </Link>
            ))}
          </div>
        )}
      </div>

      {post.images.length > 0 && (
        <div className={cn('grid gap-0.5 bg-gray-100', post.images.length === 1 ? 'grid-cols-1' : 'grid-cols-2')}>
          {post.images.map((src, index) => (
            <a
              key={src}
              href={src}
              target="_blank"
              rel="noopener noreferrer"
              className={cn('block bg-gray-100', post.images.length === 3 && index === 0 && 'row-span-2')}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imageUrl(src, post.images.length === 1 ? 900 : 500)}
                alt=""
                loading="lazy"
                className={cn('w-full object-cover', post.images.length === 1 ? 'max-h-[28rem]' : 'h-48 sm:h-56', post.images.length === 3 && index === 0 && 'h-full')}
              />
            </a>
          ))}
        </div>
      )}

      <footer className="px-4 py-2">
        <div className="flex items-center gap-1 -mx-2">
          <button
            onClick={like}
            className={cn('flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors', post.likedByMe ? 'text-rose-600' : 'text-gray-500 hover:bg-rose-50 hover:text-rose-600')}
            aria-pressed={post.likedByMe}
          >
            <Heart className={cn('w-5 h-5', post.likedByMe && 'fill-current')} />
            {post.likeCount > 0 && post.likeCount}
          </button>
          <button
            onClick={() => setShowComments((v) => !v)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-gray-500 hover:bg-community-50 hover:text-community-600"
          >
            <MessageCircle className="w-5 h-5" />
            {post.commentCount > 0 && post.commentCount}
          </button>
          <button onClick={share} className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-700">
            <Share2 className="w-5 h-5" />
            <span className="hidden sm:inline">Share</span>
          </button>
        </div>
        {showComments && (
          <Comments
            postId={post.id}
            isPostOwner={post.isOwner}
            onCountChange={(delta) => onUpdate?.(post.id, { commentCount: Math.max(0, post.commentCount + delta) })}
          />
        )}
      </footer>

      {reporting && <ReportDialog open onClose={() => setReporting(false)} targetType="post" targetId={post.id} />}
    </article>
  );
}
