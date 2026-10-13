'use client';

import { useEffect } from 'react';
import { SessionProvider, useSession } from 'next-auth/react';
import { Toaster } from 'react-hot-toast';
import { LocationPicker } from '@/components/location/LocationPicker';
import { useCountsPolling } from '@/hooks/useCounts';
import { useLocationStore } from '@/store/useStore';
import { api } from '@/lib/client';
import type { MeDTO } from '@/types';

/** Restores a signed-in user's saved area when this device has none yet. */
function AppBootstrap() {
  const { status } = useSession();
  const hydrated = useLocationStore((s) => s.hydrated);
  const location = useLocationStore((s) => s.location);
  const setLocation = useLocationStore((s) => s.setLocation);
  const setRadiusKm = useLocationStore((s) => s.setRadiusKm);
  useCountsPolling();

  useEffect(() => {
    if (status !== 'authenticated' || !hydrated || location) return;
    api<MeDTO>('/api/me')
      .then((me) => {
        if (me.place && me.lat !== undefined && me.lng !== undefined) {
          setLocation({ latitude: me.lat, longitude: me.lng, place: me.place });
          setRadiusKm(me.preferences.radiusKm);
        }
      })
      .catch(() => undefined);
  }, [status, hydrated, location, setLocation, setRadiusKm]);

  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider refetchOnWindowFocus={false}>
      <AppBootstrap />
      {children}
      <LocationPicker />
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 3500,
          style: { background: '#1f2937', color: '#fff', borderRadius: '10px', fontSize: '14px' },
        }}
      />
    </SessionProvider>
  );
}
