import { db } from '@/lib/firebase';
import { 
    collection, 
    query, 
    where, 
    getDocs,
    doc,
    updateDoc,
    deleteDoc, // Imported deleteDoc
    orderBy,
    getCountFromServer,
    limit,
    startAfter,
    QueryDocumentSnapshot,
    DocumentData,
    writeBatch
} from 'firebase/firestore';
import type { Expert, UserProfile, Booking } from '@/lib/types';

export const getAdminStats = async () => {
    // using getCountFromServer for much cheaper reads
    const expertsColl = collection(db, 'experts');
    const customersColl = collection(db, 'users');
    const bookingsColl = collection(db, 'bookings');
    
    const [
        totalExpertsSnap, 
        onlineExpertsSnap, 
        busyExpertsSnap, 
        pendingExpertsSnap, 
        totalCustomersSnap
    ] = await Promise.all([
        getCountFromServer(query(expertsColl, where('isVerified', '==', true))),
        getCountFromServer(query(expertsColl, where('isVerified', '==', true), where('online', '==', true))),
        getCountFromServer(query(expertsColl, where('isVerified', '==', true), where('workingNow', '==', true))),
        getCountFromServer(query(expertsColl, where('isVerified', '==', false))),
        getCountFromServer(query(customersColl, where('role', '==', 'customer')))
    ]);

    const today = new Date();
    today.setHours(0,0,0,0);
    const todaysBookingsSnap = await getCountFromServer(query(bookingsColl, where('createdAt', '>=', today)));
    
    return {
        totalExperts: totalExpertsSnap.data().count,
        onlineExperts: onlineExpertsSnap.data().count,
        busyExperts: busyExpertsSnap.data().count,
        pendingExperts: pendingExpertsSnap.data().count,
        totalCustomers: totalCustomersSnap.data().count,
        todaysBookings: todaysBookingsSnap.data().count
    };
};

export const getPendingExperts = async (lastVisible?: QueryDocumentSnapshot<DocumentData> | null) => {
    let q = query(
        collection(db, 'experts'), 
        where('isVerified', '==', false),
        limit(3)
    );
    if (lastVisible) {
        q = query(q, startAfter(lastVisible));
    }
    const snap = await getDocs(q);
    const lastDoc = snap.docs[snap.docs.length - 1];
    return {
        data: snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Expert)),
        lastDoc: lastDoc || null
    };
};

export const getAllExperts = async (lastVisible?: QueryDocumentSnapshot<DocumentData> | null) => {
    let q = query(collection(db, 'experts'), limit(3));
    if (lastVisible) {
        q = query(q, startAfter(lastVisible));
    }
    const snap = await getDocs(q);
    const lastDoc = snap.docs[snap.docs.length - 1];
    return {
        data: snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Expert)),
        lastDoc: lastDoc || null
    };
};

export const getAllCustomers = async (lastVisible?: QueryDocumentSnapshot<DocumentData> | null) => {
    let q = query(collection(db, 'users'), where('role', '==', 'customer'), limit(3));
    if (lastVisible) {
        q = query(q, startAfter(lastVisible));
    }
    const snap = await getDocs(q);
    const lastDoc = snap.docs[snap.docs.length - 1];
    return {
        data: snap.docs.map(doc => ({ uid: doc.id, ...doc.data() } as UserProfile)),
        lastDoc: lastDoc || null
    };
};

export const approveExpert = async (expertId: string) => {
    const batch = writeBatch(db);
    const expertRef = doc(db, 'experts', expertId);
    const userRef = doc(db, 'users', expertId);
    batch.update(expertRef, { isVerified: true, isRejected: false });
    batch.update(userRef, { isVerified: true });
    await batch.commit();
};

export const rejectExpert = async (expertId: string) => {
    const batch = writeBatch(db);
    const expertRef = doc(db, 'experts', expertId);
    const userRef = doc(db, 'users', expertId);
    batch.update(expertRef, { isVerified: false, isRejected: true });
    batch.update(userRef, { isVerified: false });
    await batch.commit();
};

export const deleteExpert = async (expertId: string) => {
    const expertRef = doc(db, 'experts', expertId);
    await deleteDoc(expertRef);
};

export const updateExpertAdmin = async (expertId: string, data: Partial<Expert>) => {
    const expertRef = doc(db, 'experts', expertId);
    await updateDoc(expertRef, data);
};

export const getAllBookings = async (lastVisible?: QueryDocumentSnapshot<DocumentData> | null) => {
    let q = query(collection(db, 'bookings'), orderBy('createdAt', 'desc'), limit(3));
    if (lastVisible) {
        q = query(q, startAfter(lastVisible));
    }
    const snap = await getDocs(q);
    const lastDoc = snap.docs[snap.docs.length - 1];
    return {
        data: snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Booking)),
        lastDoc: lastDoc || null
    };
};
