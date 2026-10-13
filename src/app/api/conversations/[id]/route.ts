import { ObjectId } from 'mongodb';
import { route, ok, parseBody, notFound, forbidden } from '@/lib/api';
import { requireUser } from '@/lib/session';
import { rateLimit } from '@/lib/rate-limit';
import { messageSchema } from '@/lib/validation';
import { conversationsCollection, hydrateConversations } from '@/lib/conversations';
import { getDatabase, toObjectId } from '@/lib/mongodb';
import { usersCollection } from '@/lib/users';
import type { MessageDoc, MessageDTO } from '@/types';

export const dynamic = 'force-dynamic';

type Context = { params: Promise<{ id: string }> };

async function loadConversation(id: string) {
  const user = await requireUser();
  const conversationId = toObjectId(id);
  if (!conversationId) throw notFound();
  const conversations = await conversationsCollection();
  const conversation = await conversations.findOne({ _id: conversationId, participants: user._id });
  if (!conversation) throw notFound('Conversation not found');
  return { user, conversation, conversations };
}

/** Returns the conversation and its messages. Pass ?after=<ISO date> to poll for new messages only. */
export const GET = route<Context>(async (request, { params }) => {
  const { id } = await params;
  const { user, conversation, conversations } = await loadConversation(id);
  const after = new URL(request.url).searchParams.get('after');
  const afterDate = after ? new Date(after) : null;

  const messages = (await getDatabase()).collection<MessageDoc>('messages');
  const filter = afterDate && !Number.isNaN(afterDate.getTime())
    ? { conversationId: conversation._id, createdAt: { $gt: afterDate } }
    : { conversationId: conversation._id };
  const docs = (await messages.find(filter).sort({ createdAt: -1 }).limit(200).toArray()).reverse();

  if (conversation.unread?.[user._id.toString()]) {
    await conversations.updateOne({ _id: conversation._id }, { $set: { [`unread.${user._id}`]: 0 } });
    conversation.unread[user._id.toString()] = 0;
  }

  const [dto] = await hydrateConversations([conversation], user._id);
  return ok({
    conversation: dto,
    messages: docs.map<MessageDTO>((m) => ({
      id: m._id.toString(),
      text: m.text,
      isMine: m.senderId.equals(user._id),
      createdAt: m.createdAt.toISOString(),
    })),
  });
});

export const POST = route<Context>(async (request, { params }) => {
  const { id } = await params;
  const { user, conversation, conversations } = await loadConversation(id);
  await rateLimit({ key: `dm:${user._id}`, limit: 60, windowSeconds: 300 });
  const { text } = await parseBody(request, messageSchema);

  const otherId = conversation.participants.find((p) => !p.equals(user._id))!;
  const other = await (await usersCollection()).findOne({ _id: otherId }, { projection: { banned: 1, blockedUserIds: 1 } });
  if (!other || other.banned || other.blockedUserIds?.some((b) => b.equals(user._id)) || user.blockedUserIds?.some((b) => b.equals(otherId))) {
    throw forbidden('You cannot message this user');
  }

  const now = new Date();
  const message: MessageDoc = { _id: new ObjectId(), conversationId: conversation._id, senderId: user._id, text, createdAt: now };
  await (await getDatabase()).collection<MessageDoc>('messages').insertOne(message);
  await conversations.updateOne(
    { _id: conversation._id },
    {
      $set: { lastMessage: { text, senderId: user._id, createdAt: now }, updatedAt: now, [`unread.${user._id}`]: 0 },
      $inc: { [`unread.${otherId}`]: 1 },
    }
  );

  return ok<MessageDTO>({ id: message._id.toString(), text, isMine: true, createdAt: now.toISOString() }, { status: 201 });
});
