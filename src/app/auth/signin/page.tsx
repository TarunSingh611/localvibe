import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions, googleAuthEnabled } from '@/lib/auth';
import { safeCallbackUrl } from '@/lib/redirect';
import { SignInForm } from '@/components/auth/AuthForms';

export const metadata: Metadata = { title: 'Sign in' };

export default async function SignInPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const callbackUrl = safeCallbackUrl(params.callbackUrl);
  const session = await getServerSession(authOptions);
  if (session) redirect(callbackUrl);

  const error = typeof params.error === 'string' ? params.error : undefined;
  return <SignInForm googleEnabled={googleAuthEnabled} callbackUrl={callbackUrl} initialError={error} />;
}
