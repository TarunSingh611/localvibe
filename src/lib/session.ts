import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from './auth';
import { toObjectId } from './mongodb';
import { usersCollection } from './users';
import { forbidden, unauthorized } from './api';
import type { UserDoc } from '@/types';

/** Returns the signed-in user from the database, or null for guests and suspended accounts. */
export async function getCurrentUser(): Promise<UserDoc | null> {
  const session = await getServerSession(authOptions);
  const id = session?.user?.id ? toObjectId(session.user.id) : null;
  if (!id) return null;
  const users = await usersCollection();
  const user = await users.findOne({ _id: id });
  if (!user || user.banned) return null;
  return user;
}

export async function requireUser(): Promise<UserDoc> {
  const session = await getServerSession(authOptions);
  const id = session?.user?.id ? toObjectId(session.user.id) : null;
  if (!id) throw unauthorized();
  const users = await usersCollection();
  const user = await users.findOne({ _id: id });
  if (!user) throw unauthorized();
  if (user.banned) throw forbidden('Your account has been suspended for violating the Community Guidelines.');
  return user;
}

/** For server pages: returns the user or redirects guests to sign in and back to `path`. */
export async function requirePageUser(path: string): Promise<UserDoc> {
  const user = await getCurrentUser();
  if (!user) redirect(`/auth/signin?callbackUrl=${encodeURIComponent(path)}`);
  return user;
}

export async function requireAdmin(): Promise<UserDoc> {
  const user = await requireUser();
  if (user.role !== 'admin') throw forbidden();
  return user;
}
