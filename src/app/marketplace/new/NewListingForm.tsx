'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, MapPin, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/Button';
import { ImagePicker } from '@/components/shared/ImagePicker';
import { CATEGORY_LABELS, CONDITION_LABELS } from '@/components/marketplace/listingMeta';
import { useLocationStore, useUIStore } from '@/store/useStore';
import { api } from '@/lib/client';
import { currencyForCountry } from '@/lib/utils';
import {
  CURRENCIES,
  LISTING_CATEGORIES,
  LISTING_CONDITIONS,
  type Currency,
  type ListingCategory,
  type ListingCondition,
  type ListingDTO,
} from '@/types';

export default function NewListingForm() {
  const router = useRouter();
  const location = useLocationStore((s) => s.location);
  const openPicker = useUIStore((s) => s.openLocationPicker);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [isFree, setIsFree] = useState(false);
  const [chosenCurrency, setCurrency] = useState<Currency | null>(null);
  const [category, setCategory] = useState<ListingCategory>('other');
  const [condition, setCondition] = useState<ListingCondition>('good');
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const guessedCurrency = currencyForCountry(location?.place.countryCode);
  const currency: Currency =
    chosenCurrency ?? ((CURRENCIES as readonly string[]).includes(guessedCurrency) ? (guessedCurrency as Currency) : 'USD');

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!location) {
      openPicker();
      return;
    }
    setSubmitting(true);
    try {
      const listing = await api<ListingDTO>('/api/listings', {
        body: {
          title,
          description,
          price: isFree ? 0 : Number(price),
          currency,
          category: isFree ? 'free-stuff' : category,
          condition,
          images,
          location,
        },
      });
      toast.success('Your item is live!');
      router.replace(`/marketplace/${listing.id}`);
    } catch (error) {
      toast.error((error as Error).message);
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-5 lg:py-8">
      <Link href="/marketplace" className="inline-flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900 mb-4">
        <ArrowLeft className="w-4 h-4" /> Marketplace
      </Link>
      <h1 className="text-2xl font-bold text-gray-900 mb-5">Sell an item</h1>

      <form onSubmit={submit} className="space-y-5 bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
        <div>
          <label className="label">Photos (up to 6)</label>
          <ImagePicker value={images} onChange={setImages} max={6} kind="listing" onUploadingChange={setUploading} />
          <p className="text-xs text-gray-500 mt-1.5">Good, well-lit photos sell faster. The first photo is the cover.</p>
        </div>

        <div>
          <label className="label" htmlFor="title">Title</label>
          <input id="title" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={100} required minLength={3} placeholder="e.g. IKEA bookshelf, white" className="input-field" />
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Price</label>
            <div className="flex gap-2">
              <select value={currency} onChange={(e) => setCurrency(e.target.value as Currency)} className="input-field w-24" disabled={isFree}>
                {CURRENCIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              <input
                type="number"
                min={0}
                step="0.01"
                value={isFree ? '' : price}
                onChange={(e) => setPrice(e.target.value)}
                required={!isFree}
                disabled={isFree}
                placeholder={isFree ? 'Free' : '0'}
                className="input-field"
              />
            </div>
            <label className="mt-2 flex items-center gap-2 text-sm text-gray-600">
              <input type="checkbox" checked={isFree} onChange={(e) => setIsFree(e.target.checked)} className="rounded border-gray-300 text-marketplace-600 focus:ring-marketplace-500" />
              Give it away for free
            </label>
          </div>
          <div>
            <label className="label">Condition</label>
            <select value={condition} onChange={(e) => setCondition(e.target.value as ListingCondition)} className="input-field">
              {LISTING_CONDITIONS.map((c) => (
                <option key={c} value={c}>{CONDITION_LABELS[c]}</option>
              ))}
            </select>
          </div>
        </div>

        {!isFree && (
          <div>
            <label className="label">Category</label>
            <select value={category} onChange={(e) => setCategory(e.target.value as ListingCategory)} className="input-field">
              {LISTING_CATEGORIES.filter((c) => c !== 'free-stuff').map((c) => (
                <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label className="label" htmlFor="description">Description</label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={5}
            maxLength={3000}
            required
            minLength={10}
            placeholder="Size, age, brand, any defects, pickup details…"
            className="input-field resize-none"
          />
        </div>

        <button type="button" onClick={openPicker} className="flex items-center gap-2 text-sm text-gray-600 hover:text-community-700">
          <MapPin className="w-4 h-4 text-community-500" />
          {location ? (
            <>Pickup area: <strong>{location.place.label}</strong> · change</>
          ) : (
            <strong className="text-emergency-600">Set your pickup area</strong>
          )}
        </button>

        <div className="flex items-start gap-2 rounded-xl bg-marketplace-50 border border-marketplace-100 p-3 text-xs text-marketplace-800">
          <ShieldCheck className="w-4 h-4 flex-shrink-0" />
          Only your neighborhood is shown, never your address. Meet in a public place and never send money in advance.
        </div>

        <Button type="submit" variant="marketplace" className="w-full py-2.5" loading={submitting} disabled={uploading || images.length === 0}>
          {images.length === 0 ? 'Add a photo to publish' : 'Publish listing'}
        </Button>
      </form>
    </div>
  );
}
