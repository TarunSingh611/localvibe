'use client';

import { useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { usePathname, useRouter } from 'next/navigation';

/**
 * Returns a guard that runs `action` for signed-in users and sends guests to
 * sign in, returning them to the current page afterwards.
 */
export function useRequireAuth() {
  const { status } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  return useCallback(
    (action?: () => void) => {
      if (status === 'authenticated') {
        action?.();
        return true;
      }
      if (status === 'unauthenticated') {
        const callbackUrl = typeof window !== 'undefined' ? window.location.pathname + window.location.search : pathname;
        router.push(`/auth/signin?callbackUrl=${encodeURIComponent(callbackUrl)}`);
      }
      return false;
    },
    [status, router, pathname]
  );
}
