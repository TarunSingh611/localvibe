'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { MessageCircle, ShoppingBag } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { EmptyState, PageHeader, Spinner } from '@/components/ui/Feedback';
import { api } from '@/lib/client';
import { cn, formatRelativeTime } from '@/lib/utils';
import type { ConversationDTO } from '@/types';

const POLL_MS = 20_000;

export default function ConversationsClient() {
  const [items, setItems] = useState<ConversationDTO[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const data = await api<{ items: ConversationDTO[] }>('/api/conversations');
      setItems(data.items);
      setError(null);
    } catch (e) {
      setError((e as Error).message);
    }
  }, []);

  useEffect(() => {
    load();
    const interval = setInterval(() => document.visibilityState === 'visible' && load(), POLL_MS);
    return () => clearInterval(interval);
  }, [load]);

  return (
    <div className="max-w-2xl mx-auto px-4 py-5 lg:py-8">
      <PageHeader title="Messages" subtitle="Chats with neighbors and sellers" />
      {items === null && !error && <Spinner />}
      {error && items === null && <p className="text-center text-sm text-red-600 py-10">{error}</p>}
      {items?.length === 0 && (
        <EmptyState
          icon={MessageCircle}
          title="No conversations yet"
          description="Message a seller from the marketplace or a neighbor from their post to start chatting."
          action={<Link href="/marketplace" className="text-sm font-semibold text-community-600">Browse the marketplace →</Link>}
        />
      )}
      {items && items.length > 0 && (
        <ul className="bg-white rounded-2xl border border-gray-200 divide-y divide-gray-100 overflow-hidden">
          {items.map((c) => (
            <li key={c.id}>
              <Link href={`/messages/${c.id}`} className="flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50">
                <Avatar name={c.otherUser.name} image={c.otherUser.image} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline justify-between gap-2">
                    <p className={cn('truncate text-gray-900', c.unreadCount ? 'font-bold' : 'font-medium')}>{c.otherUser.name}</p>
                    {c.lastMessage && <span className="text-xs text-gray-400 flex-shrink-0">{formatRelativeTime(c.lastMessage.createdAt)}</span>}
                  </div>
                  {c.listing && (
                    <p className="flex items-center gap-1 text-xs text-marketplace-700 truncate">
                      <ShoppingBag className="w-3 h-3 flex-shrink-0" /> {c.listing.title}
                    </p>
                  )}
                  <p className={cn('text-sm truncate', c.unreadCount ? 'text-gray-900 font-medium' : 'text-gray-500')}>
                    {c.lastMessage?.isMine && 'You: '}
                    {c.lastMessage?.text}
                  </p>
                </div>
                {c.unreadCount > 0 && (
                  <span className="min-w-[1.25rem] h-5 px-1.5 rounded-full bg-community-500 text-white text-xs font-bold flex items-center justify-center">
                    {c.unreadCount}
                  </span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
