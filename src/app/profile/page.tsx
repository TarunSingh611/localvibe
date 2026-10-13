import { redirect } from 'next/navigation';
import { requirePageUser } from '@/lib/session';

export default async function ProfileRedirect() {
  const user = await requirePageUser('/profile');
  redirect(`/u/${user.username}`);
}
