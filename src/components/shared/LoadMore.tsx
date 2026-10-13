'use client';

import { useEffect, useRef } from 'react';
import { Loader2 } from 'lucide-react';

/** Triggers `onLoadMore` when scrolled into view, with a manual fallback button. */
export function LoadMore({ hasMore, loading, onLoadMore }: { hasMore: boolean; loading: boolean; onLoadMore: () => void }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!hasMore || !ref.current) return;
    const observer = new IntersectionObserver((entries) => entries[0]?.isIntersecting && onLoadMore(), { rootMargin: '400px' });
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [hasMore, onLoadMore]);

  if (!hasMore) return null;
  return (
    <div ref={ref} className="flex justify-center py-6">
      {loading ? (
        <Loader2 className="w-6 h-6 animate-spin text-community-500" />
      ) : (
        <button onClick={onLoadMore} className="text-sm font-medium text-community-600 hover:underline">
          Load more
        </button>
      )}
    </div>
  );
}
