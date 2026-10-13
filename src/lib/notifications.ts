import { ObjectId } from 'mongodb';
import { getDatabase } from './mongodb';
import type { NotificationDoc, NotificationType } from '@/types';

interface NotifyInput {
  userId: ObjectId;
  type: NotificationType;
  text: string;
  link: string;
  actorId?: ObjectId;
}

export async function notify(input: NotifyInput): Promise<void> {
  if (input.actorId && input.actorId.equals(input.userId)) return;
  const db = await getDatabase();
  await db.collection<NotificationDoc>('notifications').insertOne({
    _id: new ObjectId(),
    userId: input.userId,
    type: input.type,
    actorId: input.actorId,
    text: input.text,
    link: input.link,
    read: false,
    createdAt: new Date(),
  });
}

export async function notifyMany(inputs: NotifyInput[]): Promise<void> {
  const docs = inputs
    .filter((input) => !(input.actorId && input.actorId.equals(input.userId)))
    .map<NotificationDoc>((input) => ({
      _id: new ObjectId(),
      userId: input.userId,
      type: input.type,
      actorId: input.actorId,
      text: input.text,
      link: input.link,
      read: false,
      createdAt: new Date(),
    }));
  if (docs.length === 0) return;
  const db = await getDatabase();
  await db.collection<NotificationDoc>('notifications').insertMany(docs, { ordered: false });
}

export function truncate(text: string, length = 60): string {
  const clean = text.replace(/\s+/g, ' ').trim();
  return clean.length > length ? `${clean.slice(0, length - 1)}…` : clean;
}
