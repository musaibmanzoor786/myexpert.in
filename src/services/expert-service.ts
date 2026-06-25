
import { 
    doc, 
    updateDoc, 
    serverTimestamp, 
    getDoc, 
    collection,
    getDocs,
    query,
    where,
    limit,
    startAfter,
    type QueryDocumentSnapshot
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Expert, ExpertStatus } from '@/lib/types';
import { getDistance } from '@/lib/utils';

export const updateExpertStatus = async (
    expertId: string, 
    status: ExpertStatus
) => {
    const expertRef = doc(db, 'experts', expertId);
    
    let updateFields: { 
        status: ExpertStatus;
        online: boolean; 
        workingNow: boolean; 
    };

    switch(status) {
        case 'online':
            updateFields = { status, online: true, workingNow: false };
            break;
        case 'busy':
            updateFields = { status, online: true, workingNow: true };
            break;
        case 'offline':
        default:
            updateFields = { status, online: false, workingNow: false };
            break;
    }

    await updateDoc(expertRef, {
        ...updateFields,
        lastSeen: serverTimestamp(),
    });
};

export const getExperts = async (
    params?: { userLocation?: { lat: number; lng: number }, serviceType?: string, limitCount?: number, radiusKm?: number },
    lastVisible?: QueryDocumentSnapshot
): Promise<{ experts: Expert[], lastVisible?: QueryDocumentSnapshot }> => {
    let expertsQuery = query(collection(db, 'experts'));
    
    // Remove serviceType query:
    // if (params?.serviceType) {
    //     expertsQuery = query(expertsQuery, where('serviceType', '==', params.serviceType));
    // }

    if (lastVisible) {
        expertsQuery = query(expertsQuery, startAfter(lastVisible));
    }

    // Limit to requested count or default to 10
    expertsQuery = query(expertsQuery, limit(params?.limitCount || 20)); // Increased limit to ensure we have enough to filter, though fully robust would need more

    const snap = await getDocs(expertsQuery);
    
    // Get the last document to use for pagination
    const lastDoc = snap.docs.length > 0 ? snap.docs[snap.docs.length - 1] : undefined;

    let experts = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Expert));
    
    // Ignore offline experts completely and ensure they are verified (or historically undefined)
    experts = experts.filter(e => e.isVerified !== false && (e.isActive || e.online || e.workingNow));

    if (params?.serviceType) {
        const queryService = params.serviceType.toLowerCase();
        experts = experts.filter(e => {
            if (Array.isArray(e.serviceType)) {
                return e.serviceType.some(s => s.toLowerCase().includes(queryService));
            }
            return typeof e.serviceType === 'string' && e.serviceType.toLowerCase().includes(queryService);
        });
    }

    if (params?.userLocation) {
        experts.forEach(e => {
            const lat = e.currentLocation?.lat;
            const lng = e.currentLocation?.lng;
            if (lat && lng) {
                const distance = getDistance(params.userLocation!.lat, params.userLocation!.lng, lat, lng);
                e.distanceKm = distance;
            } else {
                e.distanceKm = 99999;
            }
        });
        
        // Sort by distance
        experts.sort((a, b) => (a.distanceKm || 0) - (b.distanceKm || 0));
    }

    return { experts, lastVisible: lastDoc };
};

export const getExpertById = async (id: string): Promise<Expert | null> => {
    const expertRef = doc(db, 'experts', id);
    const snap = await getDoc(expertRef);
    if (!snap.exists()) return null;
    return { id: snap.id, ...snap.data() } as Expert;
};

export const getServicesAvailability = async (): Promise<Record<string, boolean>> => {
    return {};
};
