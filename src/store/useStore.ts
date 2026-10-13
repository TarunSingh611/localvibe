import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { UserLocation } from '@/types';

export const RADIUS_OPTIONS = [1, 5, 10, 25, 50, 100] as const;

interface LocationState {
  location: UserLocation | null;
  radiusKm: number | null; // null = everywhere
  hydrated: boolean;
  setLocation: (location: UserLocation | null) => void;
  setRadiusKm: (radiusKm: number | null) => void;
}

export const useLocationStore = create<LocationState>()(
  persist(
    (set) => ({
      location: null,
      radiusKm: 10,
      hydrated: false,
      setLocation: (location) => set({ location }),
      setRadiusKm: (radiusKm) => set({ radiusKm }),
    }),
    {
      name: 'localvibe-location',
      partialize: (state) => ({ location: state.location, radiusKm: state.radiusKm }),
      onRehydrateStorage: () => () => {
        useLocationStore.setState({ hydrated: true });
      },
    }
  )
);

interface UIState {
  locationPickerOpen: boolean;
  openLocationPicker: () => void;
  closeLocationPicker: () => void;
}

export const useUIStore = create<UIState>()((set) => ({
  locationPickerOpen: false,
  openLocationPicker: () => set({ locationPickerOpen: true }),
  closeLocationPicker: () => set({ locationPickerOpen: false }),
}));
