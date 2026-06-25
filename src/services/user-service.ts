'use client';

import { db } from '@/lib/firebase';
import type { Expert, UserProfile, Customer, UserAddress } from '@/lib/types';
import {
  doc,
  setDoc,
  getDoc,
  serverTimestamp,
  updateDoc,
  writeBatch,
  collection,
  query,
  where,
  getDocs,
  limit,
  addDoc,
  deleteDoc,
  orderBy,
} from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

/* ---------------- USER PROFILE ---------------- */

/**
 * Creates a new user profile document in Firestore.
 * Strictly adheres to "check before create" and uses auth.uid.
 */
export async function createUserProfile(
  uid: string,
  email: string | null,
  fullName?: string,
  phone?: string
) {
  if (!db) return;

  const userRef = doc(db, 'users', uid);
  
  try {
    // 1. Check if document already exists
    const snap = await getDoc(userRef);
    if (snap.exists()) {
      console.log("User profile already exists, skipping creation.");
      return;
    }

    // 2. Prepare standardized user document
    const userData = {
      uid,
      email: email || null,
      fullName: fullName || '',
      role: null,
      phone: phone || '',
      location: '',
      createdAt: serverTimestamp(),
      profileComplete: false,
      isActive: false,
    };

    // 3. Create document (will only succeed if auth matches rules)
    await setDoc(userRef, userData);
  } catch (serverError: any) {
    console.error("Failed to create user profile:", serverError);
    const permissionError = new FirestorePermissionError({
      path: userRef.path,
      operation: 'create',
      requestResourceData: { uid, email, fullName, phone },
    });
    errorEmitter.emit('permission-error', permissionError);
  }
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  if (!db) return null;

  try {
    const snap = await getDoc(doc(db, 'users', uid));
    if (!snap.exists()) return null;
    return snap.data() as UserProfile;
  } catch (error) {
    console.error("Error fetching profile:", error);
    return null;
  }
}

export async function getUserByMobile(mobileNumber: string): Promise<UserProfile | null> {
  if (!db) return null;
  const usersRef = collection(db, 'users');
  const q = query(usersRef, where('phone', '==', mobileNumber), limit(1));
  const querySnapshot = await getDocs(q);

  if (querySnapshot.empty) {
    return null;
  }

  return querySnapshot.docs[0].data() as UserProfile;
}


/* ---------------- USER ROLE ---------------- */

export async function setUserRole(uid: string, role: 'customer' | 'expert') {
  if (!db) return;
  const userRef = doc(db, 'users', uid);
  
  const updateData = { 
    role,
    profileComplete: false 
  };
  
  return setDoc(userRef, updateData, { merge: true }).catch((serverError) => {
     const permissionError = new FirestorePermissionError({
      path: userRef.path,
      operation: 'update',
      requestResourceData: updateData,
    });
    errorEmitter.emit('permission-error', permissionError);
    throw serverError;
  });
}

/* ---------------- CUSTOMER PROFILE ---------------- */

export async function createCustomerProfile(
  uid: string,
  email: string, 
  data: {
    fullName?: string;
    mobileNumber?: string;
    location?: string;
  }
) {
  if (!db) return;
  const userRef = doc(db, 'users', uid);
  const updateData = {
    fullName: data.fullName || '',
    phone: data.mobileNumber || '',
    location: data.location || '',
    role: 'customer',
    profileComplete: true,
  };
  
  try {
    await setDoc(userRef, updateData, { merge: true });
  } catch (serverError: any) {
    console.error(serverError);
    const permissionError = new FirestorePermissionError({
      path: userRef.path,
      operation: 'update',
      requestResourceData: updateData,
    });
    errorEmitter.emit('permission-error', permissionError);
    throw serverError;
  }
}

/* ---------------- EXPERT PROFILE ---------------- */

export async function createOrUpdateExpertProfile(
  uid: string,
  email: string,
  data: {
    fullName?: string;
    mobileNumber?: string;
    location?: string;
    serviceType?: string;
    bio?: string;
    experience?: number;
    profilePictureUrl?: string;
  }
) {
  if (!db) return;

  const expertRef = doc(db, 'experts', uid);
  const userRef = doc(db, 'users', uid);
  const batch = writeBatch(db);

  const expertData: any = {
      id: uid,
      role: 'expert',
      email,
      name: data.fullName || '',
      phone: data.mobileNumber || '',
      location: data.location || '',
      area: data.location || '',
      serviceType: data.serviceType || '',
      title: data.serviceType || '',
      bio: data.bio || '',
      summary: (data.bio || '').slice(0, 100),
      experience: data.experience || 0,
      isVerified: false,
      isActive: false,
      contact: {
        call: true,
        messaging: true,
        phone: data.mobileNumber || '',
      },
      services: data.serviceType
        ? [{ name: data.serviceType }]
        : [],
  };

  if (data.profilePictureUrl) {
    expertData.profilePictureUrl = data.profilePictureUrl;
  }

  const userData: any = {
    fullName: data.fullName || '',
    phone: data.mobileNumber || '',
    location: data.location || '',
    serviceType: data.serviceType || '',
    role: 'expert',
    profileComplete: true,
    isVerified: false,
  };

  if (data.profilePictureUrl) {
      userData.profilePictureUrl = data.profilePictureUrl;
  }

  batch.set(expertRef, expertData, { merge: true });
  batch.update(userRef, userData);

  try {
    await batch.commit();
  } catch (serverError: any) {
    console.error(serverError);
      const userPermissionError = new FirestorePermissionError({
        path: userRef.path,
        operation: 'update',
        requestResourceData: userData,
      });
      errorEmitter.emit('permission-error', userPermissionError);

      const expertPermissionError = new FirestorePermissionError({
        path: expertRef.path,
        operation: 'write',
        requestResourceData: expertData,
      });
      errorEmitter.emit('permission-error', expertPermissionError);
      throw serverError;
  }
}

/* ---------------- ADDRESSES ---------------- */

export async function addUserAddress(uid: string, address: Omit<UserAddress, 'id'>) {
  if (!db) return;
  const addressesRef = collection(db, 'users', uid, 'addresses');
  const data = {
    ...address,
    createdAt: serverTimestamp(),
  };
  
  return addDoc(addressesRef, data).catch((serverError) => {
    const permissionError = new FirestorePermissionError({
      path: addressesRef.path,
      operation: 'create',
      requestResourceData: data,
    });
    errorEmitter.emit('permission-error', permissionError);
  });
}

export async function updateUserAddress(uid: string, addressId: string, address: Partial<UserAddress>) {
  if (!db) return;
  const addressRef = doc(db, 'users', uid, 'addresses', addressId);
  
  return setDoc(addressRef, address, { merge: true }).catch((serverError) => {
    const permissionError = new FirestorePermissionError({
      path: addressRef.path,
      operation: 'update',
      requestResourceData: address,
    });
    errorEmitter.emit('permission-error', permissionError);
  });
}

export async function deleteUserAddress(uid: string, addressId: string) {
  if (!db) return;
  const addressRef = doc(db, 'users', uid, 'addresses', addressId);
  
  return deleteDoc(addressRef).catch((serverError) => {
    const permissionError = new FirestorePermissionError({
      path: addressRef.path,
      operation: 'delete',
    });
    errorEmitter.emit('permission-error', permissionError);
  });
}

export async function getUserAddresses(uid: string): Promise<UserAddress[]> {
  if (!db) return [];
  const addressesRef = collection(db, 'users', uid, 'addresses');
  const q = query(addressesRef, orderBy('createdAt', 'desc'), limit(10));
  const snap = await getDocs(q);
  
  return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as UserAddress));
}

/* ---------------- ONLINE STATUS & LOCATION ---------------- */

export async function updateUserLocationData(
  uid: string,
  data: { lat: number; lng: number; area: string; fullAddress: string; pincode?: string },
  role: 'customer' | 'expert' | null = null
) {
  if (!db) return;
  const batch = writeBatch(db);
  const userRef = doc(db, "users", uid);

  const updateData = {
    location: data.area,
    latitude: data.lat,
    longitude: data.lng,
    locationData: {
      lat: data.lat,
      lng: data.lng,
      area: data.area,
      fullAddress: data.fullAddress || '',                // Fallback to empty string
      pincode: data.pincode || null,
    },
    locationUpdatedAt: serverTimestamp(),
  };

  batch.set(userRef, updateData, { merge: true });

  if (role === 'expert') {
    const expertRef = doc(db, "experts", uid);
    const expertUpdate = {
        location: data.area,
        area: data.area,
        currentLocation: {
            lat: data.lat,
            lng: data.lng
        },
        lastLocationUpdatedAt: serverTimestamp(),
    };
    batch.set(expertRef, expertUpdate, { merge: true });
  }

  return batch.commit().catch((serverError) => {
    const permissionError = new FirestorePermissionError({
      path: userRef.path,
      operation: "update",
      requestResourceData: updateData,
    });
    errorEmitter.emit("permission-error", permissionError);
    throw serverError;
  });
}

export async function updateUserLocationString(
  uid: string,
  location: string,
  role: 'customer' | 'expert' | null
) {
  if (!db) {
    throw new Error("Firestore is not initialized.");
  }
  
  const batch = writeBatch(db);
  const userRef = doc(db, "users", uid);

  const userUpdate = {
    location: location,
    latitude: null,
    longitude: null,
    locationUpdatedAt: serverTimestamp(),
  };
  batch.set(userRef, userUpdate, { merge: true });

  let expertRef: any = null;
  let expertUpdate: any = null;
  if (role === 'expert') {
    expertRef = doc(db, "experts", uid);
    expertUpdate = {
        location: location,
        area: location,
        currentLocation: null,
        lastLocationUpdatedAt: serverTimestamp(),
    };
    batch.set(expertRef, expertUpdate, { merge: true });
  }

  return batch.commit().catch((serverError) => {
    const userPermissionError = new FirestorePermissionError({
      path: userRef.path,
      operation: "update",
      requestResourceData: userUpdate,
    });
    errorEmitter.emit("permission-error", userPermissionError);

    if (role === 'expert' && expertRef && expertUpdate) {
        const expertPermissionError = new FirestorePermissionError({
            path: expertRef.path,
            operation: 'update',
            requestResourceData: expertUpdate,
          });
        errorEmitter.emit('permission-error', expertPermissionError);
    }
    throw serverError;
  });
}

export async function updateUserLocationAndAddress(
  uid: string,
  data: { lat: number; lng: number; address: string }
) {
  if (!db) return;
  const userRef = doc(db, "users", uid);

  const updateData = {
    latitude: data.lat,
    longitude: data.lng,
    location: data.address,
    locationUpdatedAt: serverTimestamp(),
  };

  return setDoc(userRef, updateData, { merge: true }).catch((serverError) => {
    const permissionError = new FirestorePermissionError({
      path: userRef.path,
      operation: "update",
      requestResourceData: updateData,
    });
    errorEmitter.emit("permission-error", permissionError);
    throw serverError;
  });
}

export async function updateExpertLocationAndAddress(
  uid: string,
  data: { lat: number; lng: number; address: string }
) {
  if (!db) return;
  const batch = writeBatch(db);
  const userRef = doc(db, "users", uid);
  const expertRef = doc(db, "experts", uid);

  const userUpdate = {
    location: data.address,
    latitude: data.lat,
    longitude: data.lng,
  };
  batch.set(userRef, userUpdate, { merge: true });

  const expertUpdate = {
    location: data.address,
    area: data.address,
    currentLocation: {
      lat: data.lat,
      lng: data.lng,
    },
    lastLocationUpdatedAt: serverTimestamp(),
  };
  batch.set(expertRef, expertUpdate, { merge: true });
  
  return batch.commit().catch((serverError) => {
    const userPermissionError = new FirestorePermissionError({
      path: userRef.path,
      operation: "update",
      requestResourceData: userUpdate,
    });
    errorEmitter.emit("permission-error", userPermissionError);

    const expertPermissionError = new FirestorePermissionError({
        path: expertRef.path,
        operation: 'update',
        requestResourceData: expertUpdate,
      });
    errorEmitter.emit('permission-error', expertPermissionError);
    throw serverError;
  });
}


export async function updateExpertLocation(
  uid: string,
  location: { lat: number; lng: number }
) {
  if (!db) return;

  const expertRef = doc(db, 'experts', uid);
  const expertUpdateData = {
      currentLocation: {
          lat: location.lat,
          lng: location.lng,
      },
      lastLocationUpdatedAt: serverTimestamp(),
  };

  return setDoc(expertRef, expertUpdateData, { merge: true }).catch((serverError) => {
    const permissionError = new FirestorePermissionError({
        path: expertRef.path,
        operation: 'update',
        requestResourceData: expertUpdateData,
    });
    errorEmitter.emit('permission-error', permissionError);
    throw serverError;
  });
}

export async function updateExpertStatus(
  uid: string,
  status: {
    online?: boolean;
    acceptingBookings?: boolean;
    workingNow?: boolean;
    location?: { lat: number; lng: number };
  }
) {
  if (!db) return;

  const batch = writeBatch(db);
  const expertRef = doc(db, 'experts', uid);
  
  const expertUpdateData: { [key: string]: any } = {
    ...status,
    lastSeen: serverTimestamp(),
  };
  
  if (status.online !== undefined) {
      expertUpdateData.isActive = status.online; // Backward compatibility
  }
  
  if (status.location) {
    expertUpdateData.currentLocation = {
      lat: status.location.lat,
      lng: status.location.lng,
    };
    expertUpdateData.lastLocationUpdatedAt = serverTimestamp();
  }
  
  batch.set(expertRef, expertUpdateData, { merge: true });

  const userRef = doc(db, 'users', uid);
  const userUpdateData: { [key: string]: any } = {};
  if (status.online !== undefined) {
      userUpdateData.isActive = status.online;
  }
  
  if (Object.keys(userUpdateData).length > 0) {
      batch.set(userRef, userUpdateData, { merge: true });
  }

  return batch.commit().catch((serverError) => {
    const expertPermissionError = new FirestorePermissionError({
      path: expertRef.path,
      operation: 'update',
      requestResourceData: expertUpdateData,
    });
    errorEmitter.emit('permission-error', expertPermissionError);
    throw serverError;
  });
}
