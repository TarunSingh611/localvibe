import type { Metadata } from 'next';
import { requirePageUser } from '@/lib/session';
import NewListingForm from './NewListingForm';

export const metadata: Metadata = { title: 'Sell an item' };

export default async function NewListingPage() {
  await requirePageUser('/marketplace/new');
  return <NewListingForm />;
}
