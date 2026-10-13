'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle } from 'lucide-react';

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="max-w-md mx-auto px-5 py-24 text-center">
      <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-5">
        <AlertTriangle className="w-8 h-8 text-red-500" />
      </div>
      <h1 className="text-2xl font-bold text-gray-900">Something went wrong</h1>
      <p className="mt-2 text-gray-600">Please try again. If the problem continues, come back in a few minutes.</p>
      <div className="mt-6 flex gap-3 justify-center">
        <button onClick={reset} className="rounded-lg bg-community-500 px-5 py-2.5 font-medium text-white hover:bg-community-600">
          Try again
        </button>
        <Link href="/feed" className="rounded-lg border border-gray-300 px-5 py-2.5 font-medium text-gray-700 hover:bg-gray-50">
          Go to feed
        </Link>
      </div>
    </div>
  );
}
