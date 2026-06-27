
'use client';

import { db } from '@/lib/firebase';
import {
  collection,
  doc,
  getDocs,
  runTransaction,
  orderBy,
  limit,
  serverTimestamp,
  query,
  startAfter,
  type QueryDocumentSnapshot,
} from 'firebase/firestore';
import type { Review } from '@/lib/types';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

/**
 * Adds a review for an expert and updates the expert's average rating atomically.
 * Logic: avg_rating = ((old_avg_rating * old_total_reviews) + new_rating) / new_total_reviews
 */
export async function addReview(
  expertId: string,
  customerId: string,
  customerName: string,
  bookingId: string,
  rating: number,
  comment: string
) {
  if (!db) return;

  const expertRef = doc(db, 'experts', expertId);
  const reviewsRef = collection(db, 'experts', expertId, 'reviews');
  const bookingRef = doc(db, 'bookings', bookingId);

  const reviewData = {
    expertId,
    customerId,
    customerName,
    bookingId,
    rating,
    comment,
    createdAt: serverTimestamp(),
  };

  try {
    await runTransaction(db, async (transaction) => {
      // 1. Get current expert data to calculate new average
      const expertDoc = await transaction.get(expertRef);
      if (!expertDoc.exists()) throw new Error('Expert not found');

      const expertData = expertDoc.data();
      const oldAvg = expertData.rating || 0;
      const oldCount = expertData.reviewCount || 0;

      // 2. Calculate new stats using the optimized formula
      const newCount = oldCount + 1;
      const newAvg = ((oldAvg * oldCount) + rating) / newCount;

      // 3. Create the review document
      const newReviewRef = doc(reviewsRef);
      transaction.set(newReviewRef, reviewData);

      // 4. Update expert aggregates (Minimize future reads by denormalizing)
      transaction.update(expertRef, {
        rating: parseFloat(newAvg.toFixed(1)),
        reviewCount: newCount,
      });

      // 5. Mark booking as reviewed
      transaction.update(bookingRef, { isReviewed: true });
    });
  } catch (error: any) {
    console.error('Review transaction failed:', error);
    const permissionError = new FirestorePermissionError({
      path: `experts/${expertId}/reviews`,
      operation: 'create',
      requestResourceData: reviewData,
    });
    errorEmitter.emit('permission-error', permissionError);
    throw error;
  }
}

/**
 * Fetches reviews for an expert. 
 * Optimized to be called only when user explicitly requests the list.
 */
export async function getExpertReviews(expertId: string, limitCount = 20): Promise<Review[]> {
  if (!db) return [];

  try {
    const reviewsRef = collection(db, 'experts', expertId, 'reviews');
    const q = query(reviewsRef, orderBy('createdAt', 'desc'), limit(limitCount));
    const snapshot = await getDocs(q);

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Review[];
  } catch (error) {
    console.error('Error fetching reviews:', error);
    return [];
  }
}

export async function getExpertReviewsPaginated(
  expertId: string,
  limitCount = 3,
  lastVisible?: QueryDocumentSnapshot
): Promise<{ reviews: Review[]; lastVisible?: QueryDocumentSnapshot }> {
  if (!db) return { reviews: [] };

  try {
    const reviewsRef = collection(db, 'experts', expertId, 'reviews');
    let q = query(reviewsRef, orderBy('createdAt', 'desc'), limit(limitCount));
    if (lastVisible) {
      q = query(q, startAfter(lastVisible));
    }
    const snapshot = await getDocs(q);
    const reviews = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Review[];

    const lastDoc = snapshot.docs.length > 0 ? snapshot.docs[snapshot.docs.length - 1] : undefined;
    return { reviews, lastVisible: lastDoc };
  } catch (error) {
    console.error('Error fetching reviews paginated:', error);
    return { reviews: [] };
  }
}
