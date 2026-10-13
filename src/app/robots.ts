import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const base = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/', '/admin', '/settings', '/messages', '/notifications', '/auth/reset-password'],
    },
    sitemap: `${base}/sitemap.xml`,
  };
}
