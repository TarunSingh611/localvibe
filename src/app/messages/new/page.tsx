import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { requirePageUser } from '@/lib/session';
import { toObjectId } from '@/lib/mongodb';
import { toPublicUser, usersCollection } from '@/lib/users';
import { conversationsCollection } from '@/lib/conversations';
import NewMessageForm from './NewMessageForm';

export const metadata: Metadata = { title: 'New message' };

export default async function NewMessagePage({ searchParams }: { searchParams: Promise<{ to?: string }> }) {
  const { to } = await searchParams;
  const me = await requirePageUser(`/messages/new?to=${to ?? ''}`);
  const recipientId = toObjectId(to ?? '');
  if (!recipientId) notFound();
  if (recipientId.equals(me._id)) redirect('/messages');

  const recipient = await (await usersCollection()).findOne({ _id: recipientId, banned: { $ne: true } });
  if (!recipient) notFound();

  const existing = await (await conversationsCollection()).findOne(
    { participants: { $all: [me._id, recipientId], $size: 2 }, listingId: { $exists: false } },
    { projection: { _id: 1 } }
  );
  if (existing) redirect(`/messages/${existing._id}`);

  return <NewMessageForm recipient={toPublicUser(recipient)} />;
}
