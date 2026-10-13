import { ObjectId } from 'mongodb';
import { getDatabase } from './mongodb';
import type { MeDTO, PublicUser, UserDoc } from '@/types';

export async function usersCollection() {
  const db = await getDatabase();
  return db.collection<UserDoc>('users');
}

export function isAdminEmail(email: string): boolean {
  const admins = (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return admins.includes(email.toLowerCase());
}

export async function generateUniqueUsername(seed: string): Promise<string> {
  const users = await usersCollection();
  const base =
    seed
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, '')
      .slice(0, 14) || 'neighbor';
  const padded = base.length < 3 ? `${base}user` : base;

  for (let attempt = 0; attempt < 10; attempt++) {
    const candidate = attempt === 0 ? padded : `${padded}${Math.floor(1000 + Math.random() * 9000)}`;
    const exists = await users.findOne({ username: candidate }, { projection: { _id: 1 } });
    if (!exists) return candidate;
  }
  return `${padded}${Date.now().toString(36)}`;
}

export function newUserDoc(input: {
  email: string;
  name: string;
  username: string;
  passwordHash?: string;
  image?: string;
  provider: UserDoc['provider'];
}): UserDoc {
  const now = new Date();
  return {
    _id: new ObjectId(),
    email: input.email.toLowerCase(),
    name: input.name,
    username: input.username,
    passwordHash: input.passwordHash,
    image: input.image,
    role: isAdminEmail(input.email) ? 'admin' : 'user',
    provider: input.provider,
    preferences: { radiusKm: 10, emailNotifications: true },
    createdAt: now,
    updatedAt: now,
  };
}

export function toPublicUser(user: Pick<UserDoc, '_id' | 'name' | 'username' | 'image'> | null | undefined): PublicUser {
  if (!user) {
    return { id: '', name: 'Deleted user', username: 'deleted' };
  }
  return {
    id: user._id.toString(),
    name: user.name,
    username: user.username,
    image: user.image,
  };
}

export function toMe(user: UserDoc): MeDTO {
  return {
    id: user._id.toString(),
    email: user.email,
    name: user.name,
    username: user.username,
    image: user.image,
    bio: user.bio,
    place: user.place,
    lat: user.location?.coordinates[1],
    lng: user.location?.coordinates[0],
    role: user.role,
    provider: user.provider,
    preferences: user.preferences,
    createdAt: user.createdAt.toISOString(),
  };
}

export const PUBLIC_USER_PROJECTION = { name: 1, username: 1, image: 1 } as const;

/** Loads public profiles for a set of user ids in one query. */
export async function loadUsersById(ids: ObjectId[]): Promise<Map<string, PublicUser>> {
  const unique = [...new Map(ids.map((id) => [id.toString(), id])).values()];
  if (unique.length === 0) return new Map();
  const users = await usersCollection();
  const docs = await users.find({ _id: { $in: unique } }, { projection: PUBLIC_USER_PROJECTION }).toArray();
  return new Map(docs.map((doc) => [doc._id.toString(), toPublicUser(doc)]));
}
