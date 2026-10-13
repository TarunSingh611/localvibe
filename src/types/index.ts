import type { ObjectId } from 'mongodb';

export const POST_TYPES = ['community', 'event', 'question', 'lostfound', 'emergency'] as const;
export type PostType = (typeof POST_TYPES)[number];

export const SEVERITIES = ['low', 'medium', 'high', 'critical'] as const;
export type Severity = (typeof SEVERITIES)[number];

export const EMERGENCY_CATEGORIES = [
  'fire',
  'medical',
  'crime',
  'weather',
  'power',
  'water',
  'traffic',
  'other',
] as const;
export type EmergencyCategory = (typeof EMERGENCY_CATEGORIES)[number];

export const LISTING_CATEGORIES = [
  'electronics',
  'furniture',
  'home-garden',
  'clothing',
  'books',
  'sports',
  'vehicles',
  'toys-games',
  'services',
  'free-stuff',
  'other',
] as const;
export type ListingCategory = (typeof LISTING_CATEGORIES)[number];

export const LISTING_CONDITIONS = ['new', 'like-new', 'good', 'fair'] as const;
export type ListingCondition = (typeof LISTING_CONDITIONS)[number];

export const CURRENCIES = ['USD', 'EUR', 'GBP', 'INR', 'CAD', 'AUD', 'NZD', 'SGD', 'AED', 'JPY', 'BRL', 'MXN', 'ZAR'] as const;
export type Currency = (typeof CURRENCIES)[number];

export const REPORT_REASONS = ['spam', 'scam', 'harassment', 'misinformation', 'inappropriate', 'other'] as const;
export type ReportReason = (typeof REPORT_REASONS)[number];

export const CONTACT_TYPES = ['police', 'fire', 'medical', 'utility', 'helpline', 'other'] as const;
export type ContactType = (typeof CONTACT_TYPES)[number];

export interface GeoPoint {
  type: 'Point';
  coordinates: [number, number]; // [longitude, latitude]
}

export interface Place {
  label: string;
  city?: string;
  state?: string;
  country?: string;
  countryCode?: string;
}

export interface UserLocation {
  latitude: number;
  longitude: number;
  place: Place;
}

// ---------- Database documents ----------

export interface UserDoc {
  _id: ObjectId;
  email: string;
  passwordHash?: string;
  name: string;
  username: string;
  image?: string;
  bio?: string;
  location?: GeoPoint;
  place?: Place;
  role: 'user' | 'admin';
  banned?: boolean;
  blockedUserIds?: ObjectId[];
  provider: 'credentials' | 'google';
  preferences: {
    radiusKm: number;
    emailNotifications: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface PostDoc {
  _id: ObjectId;
  authorId: ObjectId;
  type: PostType;
  text: string;
  images: string[];
  tags: string[];
  location: GeoPoint;
  place: Place;
  event?: { startsAt: Date; venue?: string };
  emergency?: { severity: Severity; category: EmergencyCategory };
  likeCount: number;
  commentCount: number;
  reportCount: number;
  status: 'active' | 'hidden';
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface CommentDoc {
  _id: ObjectId;
  postId: ObjectId;
  authorId: ObjectId;
  text: string;
  status: 'active' | 'hidden';
  createdAt: Date;
}

export interface ListingDoc {
  _id: ObjectId;
  sellerId: ObjectId;
  title: string;
  description: string;
  price: number;
  currency: Currency;
  category: ListingCategory;
  condition: ListingCondition;
  images: string[];
  location: GeoPoint;
  place: Place;
  status: 'active' | 'sold' | 'hidden';
  favoriteCount: number;
  reportCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ConversationDoc {
  _id: ObjectId;
  participants: ObjectId[];
  listingId?: ObjectId;
  lastMessage?: { text: string; senderId: ObjectId; createdAt: Date };
  unread: Record<string, number>;
  createdAt: Date;
  updatedAt: Date;
}

export interface MessageDoc {
  _id: ObjectId;
  conversationId: ObjectId;
  senderId: ObjectId;
  text: string;
  createdAt: Date;
}

export type NotificationType = 'like' | 'comment' | 'message' | 'emergency' | 'moderation' | 'system';

export interface NotificationDoc {
  _id: ObjectId;
  userId: ObjectId;
  type: NotificationType;
  actorId?: ObjectId;
  text: string;
  link: string;
  read: boolean;
  createdAt: Date;
}

export interface ReportDoc {
  _id: ObjectId;
  targetType: 'post' | 'comment' | 'listing' | 'user';
  targetId: ObjectId;
  reporterId: ObjectId;
  reason: ReportReason;
  details?: string;
  status: 'open' | 'resolved' | 'dismissed';
  action?: string;
  resolvedBy?: ObjectId;
  resolvedAt?: Date;
  createdAt: Date;
}

export interface EmergencyContactDoc {
  _id: ObjectId;
  name: string;
  phone: string;
  type: ContactType;
  description?: string;
  place: Place;
  location?: GeoPoint;
  submittedBy: ObjectId;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: Date;
}

// ---------- API DTOs ----------

export interface PublicUser {
  id: string;
  name: string;
  username: string;
  image?: string;
}

export interface PostDTO {
  id: string;
  type: PostType;
  text: string;
  images: string[];
  tags: string[];
  place: Place;
  lat: number;
  lng: number;
  event?: { startsAt: string; venue?: string };
  emergency?: { severity: Severity; category: EmergencyCategory };
  likeCount: number;
  commentCount: number;
  likedByMe: boolean;
  isOwner: boolean;
  author: PublicUser;
  distanceKm?: number;
  expiresAt?: string;
  createdAt: string;
}

export interface CommentDTO {
  id: string;
  text: string;
  author: PublicUser;
  isOwner: boolean;
  createdAt: string;
}

export interface ListingDTO {
  id: string;
  title: string;
  description: string;
  price: number;
  currency: Currency;
  category: ListingCategory;
  condition: ListingCondition;
  images: string[];
  place: Place;
  lat: number;
  lng: number;
  status: 'active' | 'sold' | 'hidden';
  favoriteCount: number;
  isFavorite: boolean;
  isOwner: boolean;
  seller: PublicUser;
  distanceKm?: number;
  createdAt: string;
}

export interface ConversationDTO {
  id: string;
  otherUser: PublicUser;
  listing?: { id: string; title: string; image?: string; price: number; currency: Currency };
  lastMessage?: { text: string; isMine: boolean; createdAt: string };
  unreadCount: number;
  updatedAt: string;
}

export interface MessageDTO {
  id: string;
  text: string;
  isMine: boolean;
  createdAt: string;
}

export interface NotificationDTO {
  id: string;
  type: NotificationType;
  text: string;
  link: string;
  read: boolean;
  actor?: PublicUser;
  createdAt: string;
}

export interface EmergencyContactDTO {
  id: string;
  name: string;
  phone: string;
  type: ContactType;
  description?: string;
  place: Place;
  source: 'official' | 'community';
}

export interface MeDTO {
  id: string;
  email: string;
  name: string;
  username: string;
  image?: string;
  bio?: string;
  place?: Place;
  lat?: number;
  lng?: number;
  role: 'user' | 'admin';
  provider: 'credentials' | 'google';
  preferences: UserDoc['preferences'];
  createdAt: string;
}

export interface Paginated<T> {
  items: T[];
  nextCursor: string | null;
}
