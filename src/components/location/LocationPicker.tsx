'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Loader2, MapPin, Navigation, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import { Modal } from '@/components/ui/Modal';
import { useLocationStore, useUIStore } from '@/store/useStore';
import { api } from '@/lib/client';
import { getBrowserLocation } from '@/lib/utils';
import type { Place, UserLocation } from '@/types';

/** Global modal for choosing the user's area. Mounted once in the app shell. */
export function LocationPicker() {
  const open = useUIStore((s) => s.locationPickerOpen);
  const close = useUIStore((s) => s.closeLocationPicker);
  return (
    <Modal open={open} onClose={close} title="Choose your area" size="sm">
      <PickerBody close={close} />
    </Modal>
  );
}

function PickerBody({ close }: { close: () => void }) {
  const setLocation = useLocationStore((s) => s.setLocation);
  const { status } = useSession();

  const [query, setQuery] = useState('');
  const [found, setFound] = useState<UserLocation[]>([]);
  const [searching, setSearching] = useState(false);
  const [detecting, setDetecting] = useState(false);
  const results = query.trim().length < 2 ? [] : found;

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) return;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const data = await api<{ results: UserLocation[] }>(`/api/geocode?q=${encodeURIComponent(trimmed)}`, {
          signal: controller.signal,
        });
        setFound(data.results);
      } catch (error) {
        if ((error as Error).name !== 'AbortError') setFound([]);
      } finally {
        setSearching(false);
      }
    }, 450);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  const choose = async (location: UserLocation) => {
    setLocation(location);
    close();
    toast.success(`Location set to ${location.place.label}`);
    if (status === 'authenticated') {
      api('/api/me', { method: 'PATCH', body: { location } }).catch(() => undefined);
    }
  };

  const detect = async () => {
    setDetecting(true);
    try {
      const coords = await getBrowserLocation();
      let place: Place = { label: 'Current location' };
      try {
        const data = await api<{ place: Place }>(`/api/geocode?lat=${coords.latitude}&lon=${coords.longitude}`);
        place = data.place;
      } catch {
        // Keep the coordinates even if reverse geocoding is unavailable.
      }
      await choose({ ...coords, place });
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setDetecting(false);
    }
  };

  return (
    <div className="space-y-4">
      <button
        onClick={detect}
        disabled={detecting}
        className="w-full flex items-center justify-center gap-2 rounded-xl bg-community-500 hover:bg-community-600 text-white font-semibold py-3 transition-colors disabled:opacity-60"
      >
        {detecting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Navigation className="w-5 h-5" />}
        {detecting ? 'Detecting…' : 'Use my current location'}
      </button>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-200" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-white px-2 text-gray-400">or search</span>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Neighborhood, city or postcode"
          className="input-field pl-9"
        />
        {searching && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-gray-400" />}
      </div>

      {results.length > 0 && (
        <ul className="divide-y divide-gray-100 rounded-xl border border-gray-200 overflow-hidden">
          {results.map((result, index) => (
            <li key={`${result.latitude}-${result.longitude}-${index}`}>
              <button
                onClick={() => choose(result)}
                className="w-full flex items-start gap-3 px-3 py-2.5 text-left hover:bg-gray-50"
              >
                <MapPin className="w-4 h-4 mt-0.5 text-community-500 flex-shrink-0" />
                <span>
                  <span className="block text-sm font-medium text-gray-900">{result.place.label}</span>
                  <span className="block text-xs text-gray-500">
                    {[result.place.state, result.place.country].filter(Boolean).join(', ')}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
      {query.trim().length >= 2 && !searching && results.length === 0 && (
        <p className="text-sm text-gray-500 text-center">No places found. Try a nearby city name.</p>
      )}

      <p className="text-xs text-gray-400 text-center">
        Your exact coordinates are only used to show nearby content. Posts display your neighborhood, not your address.
      </p>
    </div>
  );
}
