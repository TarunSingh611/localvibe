import type { Metadata } from 'next';
import { requirePageUser } from '@/lib/session';
import ConversationsClient from './ConversationsClient';

export const metadata: Metadata = { title: 'Messages' };

export default async function MessagesPage() {
  await requirePageUser('/messages');
  return <ConversationsClient />;
}
