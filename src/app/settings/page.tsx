import type { Metadata } from 'next';
import { requirePageUser } from '@/lib/session';
import { toMe } from '@/lib/users';
import SettingsClient from './SettingsClient';

export const metadata: Metadata = { title: 'Settings' };

export default async function SettingsPage() {
  const user = await requirePageUser('/settings');
  return <SettingsClient initialMe={toMe(user)} hasPassword={Boolean(user.passwordHash)} />;
}
