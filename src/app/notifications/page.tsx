import type { Metadata } from 'next';
import { requirePageUser } from '@/lib/session';
import NotificationsClient from './NotificationsClient';

export const metadata: Metadata = { title: 'Notifications' };

export default async function NotificationsPage() {
  await requirePageUser('/notifications');
  return <NotificationsClient />;
}
