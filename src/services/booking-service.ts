'use client';

import { db } from '@/lib/firebase';
import {
  collection,
  addDoc,
  serverTimestamp,
  Timestamp,
  doc,
  updateDoc,
} from 'firebase/firestore';
import type { Expert } from '@/lib/types';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { getDistance } from '@/lib/utils';
import { safeStringify } from '@/lib/utils';
import { createNotification } from './notification-service';

type CreateBookingParams = {
  userId: string;
  userName: string;
  userPhone: string;
  userArea: string;
  userAddress: string;
  expert: Expert;
  problemDescription?: string;
  userLocation: { lat: number, lng: number } | null;
};

function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function createBooking({
  userId,
  userName,
  userPhone,
  userArea,
  userAddress,
  expert,
  problemDescription,
  userLocation,
}: CreateBookingParams) {
  if (!db) throw new Error('Firestore is not initialized');

  const now = Timestamp.now();
  // 3-minute hard deadline for instant response (180 seconds)
  const expiresAt = new Timestamp(now.seconds + 180, now.nanoseconds); 
  
  let distanceKm: number | null = null;
  if (userLocation && expert.currentLocation) {
    distanceKm = getDistance(
        userLocation.lat,
        userLocation.lng,
        expert.currentLocation.lat,
        expert.currentLocation.lng
    );
  }

  const bookingData = {
    userId,
    expertId: expert.id,
    participantIds: [userId, expert.id],
    status: 'pending',
    verificationCode: generateVerificationCode(),
    createdAt: now,
    acceptedAt: null,
    startedAt: null,
    completedAt: null,
    scheduledDate: now,
    timeSlot: 'instant',
    userName,
    userPhone,
    userArea,
    userAddress,
    problemDescription: problemDescription || '',
    expertName: expert.name,
    expertPhotoUrl: expert.profilePictureUrl || null,
    expertPhone: expert.phone || null,
    service: expert.serviceType,
    bookingType: 'instant',
    expiresAt: expiresAt,
    expiryType: 'today',
    userLocation: userLocation || null,
    expertLocation: expert.currentLocation || null,
    distanceKm: distanceKm,
  };

  try {
    console.log("Booking Data before Firestore addDoc:", safeStringify(bookingData, null, 2));
    const docRef = await addDoc(collection(db, 'bookings'), bookingData);
    
    // Proactive Alert Bridge (Native Chime on expert's phone)
    await createNotification(expert.id, {
        title: "New Job Request! 🚨",
        message: `${userName} needs a ${expert.serviceType} at ${userArea}. Distance: ${distanceKm ? distanceKm.toFixed(1) + 'km' : 'Nearby'}.`,
        type: 'booking',
        relatedEntityId: docRef.id,
        relatedEntityType: 'Booking'
    });

    return docRef.id;
  } catch (serverError) {
    errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: 'bookings',
        operation: 'create',
        requestResourceData: bookingData,
    }));
    throw new Error('Failed to send request. Check your connection.');
  }
}

export async function cancelBooking(bookingId: string) {
    if (!db) return;
    const bookingRef = doc(db, 'bookings', bookingId);
    try {
        await updateDoc(bookingRef, { status: 'cancelled' });
    } catch (err) {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
            path: bookingRef.path,
            operation: 'update',
            requestResourceData: { status: 'cancelled' },
        }));
    }
}
