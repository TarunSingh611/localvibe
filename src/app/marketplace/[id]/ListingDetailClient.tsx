'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Heart, Share2, Flag, MapPin, Clock, Tag, ShieldCheck, CheckCircle2, Trash2, RotateCcw, Send } from 'lucide-react';
import toast from 'react-hot-toast';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { ReportDialog } from '@/components/shared/ReportDialog';
import { MapView } from '@/components/map/Map';
import { CATEGORY_LABELS, CONDITION_LABELS } from '@/components/marketplace/listingMeta';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { api, imageUrl } from '@/lib/client';
import { cn, formatPrice, formatRelativeTime } from '@/lib/utils';
import type { ListingDTO } from '@/types';

export default function ListingDetailClient({ initialListing }: { initialListing: ListingDTO }) {
  const router = useRouter();
  const requireAuth = useRequireAuth();
  const [listing, setListing] = useState(initialListing);
  const [activeImage, setActiveImage] = useState(0);
  const [message, setMessage] = useState('Hi! Is this still available?');
  const [sending, setSending] = useState(false);
  const [reporting, setReporting] = useState(false);
  const [busy, setBusy] = useState(false);

  const toggleFavorite = () =>
    requireAuth(async () => {
      const result = await api<{ isFavorite: boolean }>(`/api/listings/${listing.id}/favorite`, { method: 'POST' }).catch((e) => {
        toast.error(e.message);
        return null;
      });
      if (result) setListing((l) => ({ ...l, isFavorite: result.isFavorite }));
    });

  const share = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) await navigator.share({ title: listing.title, url });
      else {
        await navigator.clipboard.writeText(url);
        toast.success('Link copied');
      }
    } catch {
      // Share cancelled.
    }
  };

  const sendMessage = (event: React.FormEvent) => {
    event.preventDefault();
    requireAuth(async () => {
      setSending(true);
      try {
        const { conversationId } = await api<{ conversationId: string }>('/api/conversations', {
          body: { recipientId: listing.seller.id, listingId: listing.id, text: message },
        });
        router.push(`/messages/${conversationId}`);
      } catch (error) {
        toast.error((error as Error).message);
        setSending(false);
      }
    });
  };

  const setStatus = async (status: 'active' | 'sold') => {
    setBusy(true);
    try {
      const updated = await api<ListingDTO>(`/api/listings/${listing.id}`, { method: 'PATCH', body: { status } });
      setListing(updated);
      toast.success(status === 'sold' ? 'Marked as sold' : 'Listing is active again');
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!confirm('Delete this listing permanently?')) return;
    setBusy(true);
    try {
      await api(`/api/listings/${listing.id}`, { method: 'DELETE' });
      toast.success('Listing deleted');
      router.replace('/marketplace');
    } catch (error) {
      toast.error((error as Error).message);
      setBusy(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-5 lg:py-8">
      <Link href="/marketplace" className="inline-flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900 mb-4">
        <ArrowLeft className="w-4 h-4" /> Marketplace
      </Link>

      <div className="grid lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 space-y-3">
          <div className="relative aspect-[4/3] bg-gray-100 rounded-2xl overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={imageUrl(listing.images[activeImage], 1200)} alt={listing.title} className="w-full h-full object-contain" />
            {listing.status === 'sold' && (
              <span className="absolute top-3 left-3 rounded-full bg-gray-900/85 px-3 py-1 text-sm font-bold text-white">SOLD</span>
            )}
          </div>
          {listing.images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto scrollbar-none">
              {listing.images.map((src, index) => (
                <button
                  key={src}
                  onClick={() => setActiveImage(index)}
                  className={cn('w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 border-2', index === activeImage ? 'border-community-500' : 'border-transparent')}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={imageUrl(src, 200)} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}

          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <h2 className="font-semibold text-gray-900 mb-2">Description</h2>
            <p className="text-gray-700 whitespace-pre-wrap break-words leading-relaxed">{listing.description}</p>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h1 className="text-xl font-bold text-gray-900">{listing.title}</h1>
                <p className={cn('text-2xl font-bold mt-1', listing.price === 0 ? 'text-marketplace-600' : 'text-gray-900')}>
                  {formatPrice(listing.price, listing.currency)}
                </p>
              </div>
              <div className="flex gap-1">
                {!listing.isOwner && (
                  <button onClick={toggleFavorite} className={cn('p-2 rounded-full border', listing.isFavorite ? 'bg-rose-500 border-rose-500 text-white' : 'border-gray-200 text-gray-500 hover:text-rose-500')} aria-label="Save">
                    <Heart className={cn('w-5 h-5', listing.isFavorite && 'fill-current')} />
                  </button>
                )}
                <button onClick={share} className="p-2 rounded-full border border-gray-200 text-gray-500 hover:text-gray-800" aria-label="Share">
                  <Share2 className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
              <span className="flex items-center gap-1.5 text-gray-600"><Tag className="w-4 h-4" />{CATEGORY_LABELS[listing.category]}</span>
              <span className="flex items-center gap-1.5 text-gray-600"><CheckCircle2 className="w-4 h-4" />{CONDITION_LABELS[listing.condition]}</span>
              <span className="flex items-center gap-1.5 text-gray-600"><MapPin className="w-4 h-4" />{listing.place.label}</span>
              <span className="flex items-center gap-1.5 text-gray-600"><Clock className="w-4 h-4" />{formatRelativeTime(listing.createdAt)}</span>
            </div>
          </div>

          {listing.isOwner ? (
            <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-2">
              <p className="text-sm text-gray-600 mb-2">This is your listing · {listing.favoriteCount} saved</p>
              {listing.status === 'active' ? (
                <Button variant="marketplace" className="w-full" onClick={() => setStatus('sold')} loading={busy}>
                  <CheckCircle2 className="w-4 h-4 mr-2" /> Mark as sold
                </Button>
              ) : (
                <Button variant="outline" className="w-full" onClick={() => setStatus('active')} loading={busy}>
                  <RotateCcw className="w-4 h-4 mr-2" /> Relist
                </Button>
              )}
              <Button variant="ghost" className="w-full text-red-600 hover:bg-red-50" onClick={remove} disabled={busy}>
                <Trash2 className="w-4 h-4 mr-2" /> Delete listing
              </Button>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-200 p-5">
              <Link href={`/u/${listing.seller.username}`} className="flex items-center gap-3 mb-4">
                <Avatar name={listing.seller.name} image={listing.seller.image} size="lg" />
                <div>
                  <p className="font-semibold text-gray-900">{listing.seller.name}</p>
                  <p className="text-sm text-gray-500">@{listing.seller.username} · View profile</p>
                </div>
              </Link>
              {listing.status === 'active' ? (
                <form onSubmit={sendMessage} className="space-y-2">
                  <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={2} maxLength={2000} className="input-field resize-none" />
                  <Button type="submit" className="w-full" loading={sending} disabled={!message.trim()}>
                    <Send className="w-4 h-4 mr-2" /> Message seller
                  </Button>
                </form>
              ) : (
                <p className="text-sm text-gray-500 text-center py-2">This item has been sold.</p>
              )}
              <button onClick={() => requireAuth(() => setReporting(true))} className="mt-3 flex items-center gap-1.5 text-xs text-gray-400 hover:text-orange-500 mx-auto">
                <Flag className="w-3.5 h-3.5" /> Report listing
              </button>
            </div>
          )}

          <div className="rounded-2xl overflow-hidden border border-gray-200 bg-white">
            <MapView center={[listing.lat, listing.lng]} zoom={13} radiusKm={1} showCenter={false} interactive={false} className="h-44 w-full" />
            <p className="px-4 py-2 text-xs text-gray-500">Approximate area. Exact address is shared only when you arrange pickup.</p>
          </div>

          <div className="flex gap-2 rounded-2xl bg-marketplace-50 border border-marketplace-100 p-4 text-sm text-marketplace-900">
            <ShieldCheck className="w-5 h-5 flex-shrink-0 text-marketplace-600" />
            <div>
              <p className="font-semibold">Stay safe</p>
              <p className="text-marketplace-800 text-xs mt-0.5">Meet in a public place, inspect the item before paying, and never pay in advance or share verification codes.</p>
            </div>
          </div>
        </div>
      </div>

      {reporting && <ReportDialog open onClose={() => setReporting(false)} targetType="listing" targetId={listing.id} />}
    </div>
  );
}
