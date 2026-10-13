import type { ObjectId } from 'mongodb';
import { calculateDistance } from './utils';
import type {
  CommentDoc,
  CommentDTO,
  ListingDoc,
  ListingDTO,
  PostDoc,
  PostDTO,
  PublicUser,
} from '@/types';
import { toPublicUser } from './users';

interface Origin {
  latitude: number;
  longitude: number;
}

function distanceFrom(origin: Origin | undefined, coordinates: [number, number]): number | undefined {
  if (!origin) return undefined;
  const meters = calculateDistance(origin.latitude, origin.longitude, coordinates[1], coordinates[0]);
  return Math.round(meters / 100) / 10;
}

export function toPostDTO(
  post: PostDoc,
  ctx: { authors: Map<string, PublicUser>; liked: Set<string>; viewerId?: ObjectId; origin?: Origin }
): PostDTO {
  return {
    id: post._id.toString(),
    type: post.type,
    text: post.text,
    images: post.images,
    tags: post.tags,
    place: post.place,
    lat: post.location.coordinates[1],
    lng: post.location.coordinates[0],
    event: post.event ? { startsAt: post.event.startsAt.toISOString(), venue: post.event.venue } : undefined,
    emergency: post.emergency,
    likeCount: post.likeCount,
    commentCount: post.commentCount,
    likedByMe: ctx.liked.has(post._id.toString()),
    isOwner: Boolean(ctx.viewerId?.equals(post.authorId)),
    author: ctx.authors.get(post.authorId.toString()) ?? toPublicUser(null),
    distanceKm: distanceFrom(ctx.origin, post.location.coordinates),
    expiresAt: post.expiresAt?.toISOString(),
    createdAt: post.createdAt.toISOString(),
  };
}

export function toCommentDTO(
  comment: CommentDoc,
  ctx: { authors: Map<string, PublicUser>; viewerId?: ObjectId }
): CommentDTO {
  return {
    id: comment._id.toString(),
    text: comment.text,
    author: ctx.authors.get(comment.authorId.toString()) ?? toPublicUser(null),
    isOwner: Boolean(ctx.viewerId?.equals(comment.authorId)),
    createdAt: comment.createdAt.toISOString(),
  };
}

export function toListingDTO(
  listing: ListingDoc,
  ctx: { sellers: Map<string, PublicUser>; favorites: Set<string>; viewerId?: ObjectId; origin?: Origin }
): ListingDTO {
  return {
    id: listing._id.toString(),
    title: listing.title,
    description: listing.description,
    price: listing.price,
    currency: listing.currency,
    category: listing.category,
    condition: listing.condition,
    images: listing.images,
    place: listing.place,
    lat: listing.location.coordinates[1],
    lng: listing.location.coordinates[0],
    status: listing.status,
    favoriteCount: listing.favoriteCount,
    isFavorite: ctx.favorites.has(listing._id.toString()),
    isOwner: Boolean(ctx.viewerId?.equals(listing.sellerId)),
    seller: ctx.sellers.get(listing.sellerId.toString()) ?? toPublicUser(null),
    distanceKm: distanceFrom(ctx.origin, listing.location.coordinates),
    createdAt: listing.createdAt.toISOString(),
  };
}
