import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import 'leaflet/dist/leaflet.css';
import './globals.css';
import { Providers } from './providers';
import { Navigation } from '@/components/layout/Navigation';
import { MobileBottomNav } from '@/components/layout/MobileBottomNav';

const inter = Inter({ subsets: ['latin'] });

const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
const description =
  'LocalVibe is your neighborhood app: local news and events, a marketplace to buy, sell and give away nearby, and real-time emergency alerts from people around you.';

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  title: {
    default: 'LocalVibe - Your neighborhood, connected',
    template: '%s · LocalVibe',
  },
  description,
  applicationName: 'LocalVibe',
  keywords: ['neighborhood', 'local community', 'local marketplace', 'emergency alerts', 'hyperlocal', 'events near me'],
  openGraph: {
    type: 'website',
    siteName: 'LocalVibe',
    title: 'LocalVibe - Your neighborhood, connected',
    description,
    url: appUrl,
  },
  twitter: {
    card: 'summary_large_image',
    title: 'LocalVibe - Your neighborhood, connected',
    description,
  },
  appleWebApp: { capable: true, title: 'LocalVibe', statusBarStyle: 'default' },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#0ea5e9',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} bg-gray-50 text-gray-900 antialiased`}>
        <Providers>
          <Navigation />
          <main className="lg:ml-64 min-h-screen pb-20 lg:pb-0">{children}</main>
          <MobileBottomNav />
        </Providers>
      </body>
    </html>
  );
}
