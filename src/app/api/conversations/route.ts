import { ObjectId } from 'mongodb';
import { route, ok, parseBody, notFound, badRequest, forbidden } from '@/lib/api';
import { requireUser } from '@/lib/session';
import { rateLimit } from '@/lib/rate-limit';
import { startConversationSchema } from '@/lib/validation';
import { conversationsCollection, hydrateConversations } from '@/lib/conversations';
import { getDatabase, toObjectId } from '@/lib/mongodb';
import { usersCollection } from '@/lib/users';
import type { ConversationDoc, MessageDoc } from '@/types';

export const dynamic = 'force-dynamic';

export const GET = route(async () => {
  const user = await requireUser();
  const conversations = await conversationsCollection();
  const docs = await conversations
    .find({ participants: user._id, lastMessage: { $exists: true } })
    .sort({ updatedAt: -1 })
    .limit(100)
    .toArray();
  return ok({ items: await hydrateConversations(docs, user._id) });
});

export const POST = route(async (request) => {
  const user = await requireUser();
  await rateLimit({ key: `dm-start:${user._id}`, limit: 20, windowSeconds: 3600 });
  const input = await parseBody(request, startConversationSchema);

  const recipientId = toObjectId(input.recipientId);
  if (!recipientId) throw notFound('User not found');
  if (recipientId.equals(user._id)) throw badRequest('You cannot message yourself');

  const recipient = await (await usersCollection()).findOne(
    { _id: recipientId },
    { projection: { banned: 1, blockedUserIds: 1 } }
  );
  if (!recipient || recipient.banned) throw notFound('User not found');
  if (recipient.blockedUserIds?.some((id) => id.equals(user._id)) || user.blockedUserIds?.some((id) => id.equals(recipientId))) {
    throw forbidden('You cannot message this user');
  }

  const listingId = input.listingId ? toObjectId(input.listingId) ?? undefined : undefined;
  const participants = [user._id, recipientId].sort((a, b) => a.toString().localeCompare(b.toString()));
  const conversations = await conversationsCollection();
  const now = new Date();

  let conversation = await conversations.findOne({
    participants: { $all: participants, $size: 2 },
    listingId: listingId ?? { $exists: false },
  });
  if (!conversation) {
    conversation = {
      _id: new ObjectId(),
      participants,
      ...(listingId ? { listingId } : {}),
      unread: {},
      createdAt: now,
      updatedAt: now,
    } as ConversationDoc;
    await conversations.insertOne(conversation);
  }

  await (await getDatabase()).collection<MessageDoc>('messages').insertOne({
    _id: new ObjectId(),
    conversationId: conversation._id,
    senderId: user._id,
    text: input.text,
    createdAt: now,
  });
  await conversations.updateOne(
    { _id: conversation._id },
    {
      $set: { lastMessage: { text: input.text, senderId: user._id, createdAt: now }, updatedAt: now },
      $inc: { [`unread.${recipientId}`]: 1 },
    }
  );

  return ok({ conversationId: conversation._id.toString() }, { status: 201 });
});
