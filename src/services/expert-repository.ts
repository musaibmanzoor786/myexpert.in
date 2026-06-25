import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import type { Expert } from '@/lib/types';

const CACHE_KEY = 'expert_profile_cache_';
const CACHE_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours

export const expertRepository = {
    async getExpertById(id: string, forceRefresh: boolean = false): Promise<Expert | null> {
        const cached = localStorage.getItem(`${CACHE_KEY}${id}`);
        if (cached && !forceRefresh) {
            const { data, timestamp } = JSON.parse(cached);
            if (Date.now() - timestamp < CACHE_DURATION_MS) {
                return data as Expert;
            }
        }

        const expertRef = doc(db, 'experts', id);
        const snap = await getDoc(expertRef);
        if (!snap.exists()) return null;

        const data = { id: snap.id, ...snap.data() } as Expert;
        localStorage.setItem(`${CACHE_KEY}${id}`, JSON.stringify({ data, timestamp: Date.now() }));
        return data;
    },

    async updateExpertProfilePicture(expertId: string, newUrl: string): Promise<void> {
        const expertRef = doc(db, 'experts', expertId);
        await updateDoc(expertRef, { profilePictureUrl: newUrl });

        // Update local cache
        const cached = localStorage.getItem(`${CACHE_KEY}${expertId}`);
        if (cached) {
            const { data, timestamp } = JSON.parse(cached);
            localStorage.setItem(`${CACHE_KEY}${expertId}`, JSON.stringify({
                data: { ...data, profilePictureUrl: newUrl },
                timestamp
            }));
        }
    },

    async updateExpertData(expertId: string, data: Partial<Pick<Expert, 'phone'>>): Promise<void> {
        const expertRef = doc(db, 'experts', expertId);
        await updateDoc(expertRef, data);

        // Update local cache
        const cached = localStorage.getItem(`${CACHE_KEY}${expertId}`);
        if (cached) {
            const parsed = JSON.parse(cached);
            localStorage.setItem(`${CACHE_KEY}${expertId}`, JSON.stringify({
                data: { ...parsed.data, ...data },
                timestamp: parsed.timestamp
            }));
        }
    }
};
