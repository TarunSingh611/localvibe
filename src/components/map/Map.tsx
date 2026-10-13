'use client';

import dynamic from 'next/dynamic';
import type { LeafletMapProps } from './LeafletMap';

export type { MapMarker } from './LeafletMap';

/** Leaflet touches `window`, so the map only renders on the client. */
const LeafletMap = dynamic(() => import('./LeafletMap'), {
  ssr: false,
  loading: () => <div className="h-full w-full min-h-[12rem] animate-pulse bg-gray-100" />,
});

export function MapView(props: LeafletMapProps) {
  return <LeafletMap {...props} />;
}
