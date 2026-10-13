import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { cache } from 'react';
import { usersCollection } from '@/lib/users';
import { getCurrentUser } from '@/lib/session';
import ProfileClient, { type ProfileData } from './ProfileClient';

const loadProfile = cache(async (username: string) => {
  const users = await usersCollection();
  return users.findOne({ username: username.toLowerCase(), banned: { $ne: true } });
});

export async function generateMetadata({ params }: { params: Promise<{ username: string }> }): Promise<Metadata> {
  const { username } = await params;
  const user = await loadProfile(username);
  if (!user) return { title: 'User not found' };
  return {
    title: `${user.name} (@${user.username})`,
    description: user.bio || `${user.name} on LocalVibe${user.place?.city ? ` · ${user.place.city}` : ''}`,
  };
}

export default async function ProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  const [user, viewer] = await Promise.all([loadProfile(decodeURIComponent(username)), getCurrentUser()]);
  if (!user) notFound();

  const profile: ProfileData = {
    id: user._id.toString(),
    name: user.name,
    username: user.username,
    image: user.image,
    bio: user.bio,
    area: user.place?.city || user.place?.state || user.place?.country,
    joinedAt: user.createdAt.toISOString(),
    isMe: Boolean(viewer?._id.equals(user._id)),
    isBlocked: Boolean(viewer?.blockedUserIds?.some((id) => id.equals(user._id))),
    isAdmin: user.role === 'admin',
  };

  return <ProfileClient profile={profile} signedIn={Boolean(viewer)} />;
}
