import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { requirePageUser } from '@/lib/session';
import AdminClient from './AdminClient';

export const metadata: Metadata = { title: 'Moderation', robots: { index: false } };

export default async function AdminPage() {
  const user = await requirePageUser('/admin');
  if (user.role !== 'admin') notFound();
  return <AdminClient />;
}
