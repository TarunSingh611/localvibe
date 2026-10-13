'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { create } from 'zustand';
import { api } from '@/lib/client';

interface CountsState {
  notifications: number;
  messages: number;
  set: (counts: { notifications: number; messages: number }) => void;
  refresh: () => Promise<void>;
}

export const useCountsStore = create<CountsState>()((set) => ({
  notifications: 0,
  messages: 0,
  set: (counts) => set(counts),
  refresh: async () => {
    try {
      set(await api<{ notifications: number; messages: number }>('/api/me/counts'));
    } catch {
      // Badge counts are best-effort.
    }
  },
}));

const POLL_MS = 25_000;

/** Polls unread counts while the tab is visible. Mount once in the app shell. */
export function useCountsPolling() {
  const { status } = useSession();
  const refresh = useCountsStore((s) => s.refresh);
  const reset = useCountsStore((s) => s.set);

  useEffect(() => {
    if (status !== 'authenticated') {
      reset({ notifications: 0, messages: 0 });
      return;
    }
    refresh();
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') refresh();
    }, POLL_MS);
    const onVisible = () => document.visibilityState === 'visible' && refresh();
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [status, refresh, reset]);
}
