import type { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const now = new Date();
  return [
    { url: `${base}/`, lastModified: now, changeFrequency: 'weekly', priority: 1 },
    { url: `${base}/feed`, lastModified: now, changeFrequency: 'hourly', priority: 0.9 },
    { url: `${base}/marketplace`, lastModified: now, changeFrequency: 'hourly', priority: 0.9 },
    { url: `${base}/emergency`, lastModified: now, changeFrequency: 'daily', priority: 0.8 },
    { url: `${base}/map`, lastModified: now, changeFrequency: 'daily', priority: 0.6 },
    { url: `${base}/auth/signup`, lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${base}/guidelines`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${base}/terms`, lastModified: now, changeFrequency: 'yearly', priority: 0.2 },
    { url: `${base}/privacy`, lastModified: now, changeFrequency: 'yearly', priority: 0.2 },
  ];
}
