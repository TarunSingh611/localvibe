import type { Metadata } from 'next';
import MapClient from './MapClient';

export const metadata: Metadata = {
  title: 'Map',
  description: 'See posts, events, alerts and items for sale around you on a live map.',
};

export default function MapPage() {
  return <MapClient />;
}
