import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions, googleAuthEnabled } from '@/lib/auth';
import { safeCallbackUrl } from '@/lib/redirect';
import { SignUpForm } from '@/components/auth/AuthForms';

export const metadata: Metadata = { title: 'Create your account' };

export default async function SignUpPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const callbackUrl = safeCallbackUrl(params.callbackUrl);
  const session = await getServerSession(authOptions);
  if (session) redirect(callbackUrl);

  return <SignUpForm googleEnabled={googleAuthEnabled} callbackUrl={callbackUrl} />;
}
