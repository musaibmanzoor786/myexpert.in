
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/auth-context';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot, limit } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

export function useBookingsSummary() {
  const { user, userProfile } = useAuth();
  const [newRequestsCount, setNewRequestsCount] = useState(0);
  const [todaysJobsCount, setTodaysJobsCount] = useState(0);
  const [totalCompletedCount, setTotalCompletedCount] = useState(0);

  useEffect(() => {
    if (!user?.uid || !db) {
      return;
    }

    const bookingsQuery = query(
      collection(db, 'bookings'),
      where('participantIds', 'array-contains', user.uid),
      limit(100) // Slightly higher limit for summary statistics
    );

    const unsubscribe = onSnapshot(bookingsQuery, (snapshot) => {
      let pendingCount = 0;
      let todaysCount = 0;
      let completedCount = 0;
      
      const startOfDay = new Date(new Date().setHours(0, 0, 0, 0));
      const endOfDay = new Date(new Date().setHours(23, 59, 59, 999));

      snapshot.forEach(doc => {
        const booking = doc.data();

        // 1. Pending requests for this expert
        if (booking.status === 'pending' && userProfile?.role === 'expert' && booking.expertId === user.uid) {
          pendingCount++;
        }
        
        // 2. Completed jobs total
        if (booking.status === 'completed') {
          completedCount++;
        }
        
        // 3. Today's active jobs
        const scheduledDate = booking.scheduledDate?.toDate();
        if (scheduledDate && scheduledDate >= startOfDay && scheduledDate <= endOfDay) {
          if (['accepted', 'in_progress', 'upcoming'].includes(booking.status)) {
            todaysCount++;
          }
        }
      });

      setNewRequestsCount(pendingCount);
      setTodaysJobsCount(todaysCount);
      setTotalCompletedCount(completedCount);

    }, (serverError) => {
        const permissionError = new FirestorePermissionError({
            path: 'bookings',
            operation: 'list',
        });
        errorEmitter.emit('permission-error', permissionError);
    });

    return () => unsubscribe();
  }, [user?.uid, userProfile?.role]);

  return { newRequestsCount, todaysJobsCount, totalCompletedCount };
}
