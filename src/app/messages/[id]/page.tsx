import type { Metadata } from 'next';
import { requirePageUser } from '@/lib/session';
import ThreadClient from './ThreadClient';

export const metadata: Metadata = { title: 'Conversation' };

export default async function ThreadPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requirePageUser(`/messages/${id}`);
  return <ThreadClient conversationId={id} />;
}
