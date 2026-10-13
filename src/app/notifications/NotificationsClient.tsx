'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Bell, Heart, MessageCircle, AlertTriangle, ShieldAlert, Info, CheckCheck } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { EmptyState, PageHeader, Spinner } from '@/components/ui/Feedback';
import { useCountsStore } from '@/hooks/useCounts';
import { api } from '@/lib/client';
import { cn, formatRelativeTime } from '@/lib/utils';
import type { NotificationDTO, NotificationType } from '@/types';

const TYPE_ICON: Record<NotificationType, { icon: typeof Bell; className: string }> = {
  like: { icon: Heart, className: 'bg-rose-100 text-rose-600' },
  comment: { icon: MessageCircle, className: 'bg-sky-100 text-sky-600' },
  message: { icon: MessageCircle, className: 'bg-sky-100 text-sky-600' },
  emergency: { icon: AlertTriangle, className: 'bg-red-100 text-red-600' },
  moderation: { icon: ShieldAlert, className: 'bg-amber-100 text-amber-700' },
  system: { icon: Info, className: 'bg-gray-100 text-gray-600' },
};

export default function NotificationsClient() {
  const refreshCounts = useCountsStore((s) => s.refresh);
  const [items, setItems] = useState<NotificationDTO[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [marking, setMarking] = useState(false);

  useEffect(() => {
    api<{ items: NotificationDTO[] }>('/api/notifications')
      .then((data) => setItems(data.items))
      .catch((e) => setError(e.message));
  }, []);

  const unread = items?.filter((n) => !n.read).length ?? 0;

  const markAllRead = async () => {
    setMarking(true);
    try {
      await api('/api/notifications', { method: 'POST' });
      setItems((current) => current?.map((n) => ({ ...n, read: true })) ?? null);
      refreshCounts();
    } finally {
      setMarking(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-5 lg:py-8">
      <PageHeader
        title="Notifications"
        subtitle={unread ? `${unread} unread` : 'You are all caught up'}
        actions={
          unread > 0 && (
            <Button variant="outline" size="sm" onClick={markAllRead} loading={marking}>
              <CheckCheck className="w-4 h-4 mr-1.5" /> Mark all read
            </Button>
          )
        }
      />
      {items === null && !error && <Spinner />}
      {error && <p className="text-center text-sm text-red-600 py-10">{error}</p>}
      {items?.length === 0 && (
        <EmptyState icon={Bell} title="No notifications yet" description="Likes, comments, messages and nearby emergency alerts will show up here." />
      )}
      {items && items.length > 0 && (
        <ul className="bg-white rounded-2xl border border-gray-200 divide-y divide-gray-100 overflow-hidden">
          {items.map((n) => {
            const meta = TYPE_ICON[n.type];
            const Icon = meta.icon;
            return (
              <li key={n.id}>
                <Link href={n.link} className={cn('flex items-start gap-3 px-4 py-3.5 hover:bg-gray-50', !n.read && 'bg-community-50/60')}>
                  <div className="relative flex-shrink-0">
                    {n.actor ? (
                      <Avatar name={n.actor.name} image={n.actor.image} />
                    ) : (
                      <div className={cn('w-10 h-10 rounded-full flex items-center justify-center', meta.className)}>
                        <Icon className="w-5 h-5" />
                      </div>
                    )}
                    {n.actor && (
                      <span className={cn('absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center ring-2 ring-white', meta.className)}>
                        <Icon className="w-3 h-3" />
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-800">{n.text}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{formatRelativeTime(n.createdAt)}</p>
                  </div>
                  {!n.read && <span className="w-2.5 h-2.5 rounded-full bg-community-500 mt-1.5 flex-shrink-0" />}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
