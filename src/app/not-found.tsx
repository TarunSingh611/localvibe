import Link from 'next/link';
import { MapPinOff } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="max-w-md mx-auto px-5 py-24 text-center">
      <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-5">
        <MapPinOff className="w-8 h-8 text-gray-400" />
      </div>
      <h1 className="text-2xl font-bold text-gray-900">We couldn&apos;t find that</h1>
      <p className="mt-2 text-gray-600">The page may have been removed, or the link is wrong.</p>
      <Link href="/feed" className="mt-6 inline-block rounded-lg bg-community-500 px-5 py-2.5 font-medium text-white hover:bg-community-600">
        Back to the feed
      </Link>
    </div>
  );
}
