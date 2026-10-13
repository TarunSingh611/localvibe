import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'LocalVibe',
    short_name: 'LocalVibe',
    description: 'Your neighborhood, connected: local feed, marketplace and emergency alerts.',
    start_url: '/feed',
    display: 'standalone',
    background_color: '#f9fafb',
    theme_color: '#0ea5e9',
    icons: [
      { src: '/icon', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/apple-icon', sizes: '180x180', type: 'image/png' },
    ],
  };
}
