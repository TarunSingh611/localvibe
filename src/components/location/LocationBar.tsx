'use client';

import { MapPin, ChevronDown } from 'lucide-react';
import { useLocationStore, useUIStore, RADIUS_OPTIONS } from '@/store/useStore';

/** Shows the current area and radius, with controls to change them. */
export function LocationBar({ showRadius = true }: { showRadius?: boolean }) {
  const location = useLocationStore((s) => s.location);
  const radiusKm = useLocationStore((s) => s.radiusKm);
  const setRadiusKm = useLocationStore((s) => s.setRadiusKm);
  const openPicker = useUIStore((s) => s.openLocationPicker);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        onClick={openPicker}
        className="inline-flex items-center gap-1.5 rounded-full bg-white border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-700 hover:border-community-400 hover:text-community-700 transition-colors max-w-[16rem]"
      >
        <MapPin className="w-4 h-4 text-community-500 flex-shrink-0" />
        <span className="truncate">{location ? location.place.label : 'Set your location'}</span>
        <ChevronDown className="w-3.5 h-3.5 flex-shrink-0" />
      </button>
      {showRadius && location && (
        <select
          aria-label="Distance"
          value={radiusKm ?? 'all'}
          onChange={(e) => setRadiusKm(e.target.value === 'all' ? null : Number(e.target.value))}
          className="rounded-full bg-white border border-gray-200 px-3 py-1.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-community-500"
        >
          {RADIUS_OPTIONS.map((km) => (
            <option key={km} value={km}>
              Within {km} km
            </option>
          ))}
          <option value="all">Everywhere</option>
        </select>
      )}
    </div>
  );
}
