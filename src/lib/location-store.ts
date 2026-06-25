
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { safeStringify } from '@/lib/utils';

interface LocationState {
    lat: number | null;
    lng: number | null;
    area: string;
    address: string;
    setLocation: (location: { lat: number | null; lng: number | null; area: string; address: string }) => void;
}

export const useLocationStore = create<LocationState>()(
    persist(
        (set) => ({
            lat: null,
            lng: null,
            area: 'Select Location',
            address: '',
            setLocation: (location) => set(location),
        }),
        {
            name: 'location-storage',
            storage: createJSONStorage(() => typeof window !== 'undefined' ? localStorage : {
                getItem: () => null,
                setItem: () => {},
                removeItem: () => {},
            }),
        }
    )
);
