import type { ObjectId } from 'mongodb';
import { getDatabase } from './mongodb';
import { loadUsersById, toPublicUser } from './users';
import type { ConversationDoc, ConversationDTO, ListingDoc } from '@/types';

export async function conversationsCollection() {
  return (await getDatabase()).collection<ConversationDoc>('conversations');
}

export async function hydrateConversations(docs: ConversationDoc[], viewerId: ObjectId): Promise<ConversationDTO[]> {
  if (docs.length === 0) return [];
  const otherIds = docs.map((d) => d.participants.find((p) => !p.equals(viewerId)) ?? viewerId);
  const listingIds = docs.map((d) => d.listingId).filter((id): id is ObjectId => Boolean(id));

  const [users, listings] = await Promise.all([
    loadUsersById(otherIds),
    listingIds.length
      ? (await getDatabase())
          .collection<ListingDoc>('listings')
          .find({ _id: { $in: listingIds } }, { projection: { title: 1, images: 1, price: 1, currency: 1 } })
          .toArray()
      : Promise.resolve([] as ListingDoc[]),
  ]);
  const listingMap = new Map(listings.map((l) => [l._id.toString(), l]));

  return docs.map((doc, index) => {
    const listing = doc.listingId ? listingMap.get(doc.listingId.toString()) : undefined;
    return {
      id: doc._id.toString(),
      otherUser: users.get(otherIds[index].toString()) ?? toPublicUser(null),
      listing: listing
        ? {
            id: listing._id.toString(),
            title: listing.title,
            image: listing.images[0],
            price: listing.price,
            currency: listing.currency,
          }
        : undefined,
      lastMessage: doc.lastMessage
        ? {
            text: doc.lastMessage.text,
            isMine: doc.lastMessage.senderId.equals(viewerId),
            createdAt: doc.lastMessage.createdAt.toISOString(),
          }
        : undefined,
      unreadCount: doc.unread?.[viewerId.toString()] ?? 0,
      updatedAt: doc.updatedAt.toISOString(),
    };
  });
}
