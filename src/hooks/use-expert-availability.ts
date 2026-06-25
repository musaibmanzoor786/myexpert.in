
'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot, limit } from 'firebase/firestore';
import type { TimeSlot } from '@/lib/types';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

export function useExpertAvailability(expertId: string, date: Date | undefined) {
  const [bookedSlots, setBookedSlots] = useState<Set<TimeSlot>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!expertId || !db) {
      setLoading(false);
      return;
    }

    setLoading(true);
    
    const bookingsRef = collection(db, 'bookings');
    
    // Security Rule compliant query
    const q = query(
      bookingsRef,
      where('participantIds', 'array-contains', expertId),
      limit(15)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const slots = new Set<TimeSlot>();
      
      // Perform date filtering on the client to avoid complex index requirements and permission errors
      if (date) {
          const startOfDay = new Date(date);
          startOfDay.setHours(0, 0, 0, 0);
          const endOfDay = new Date(date);
          endOfDay.setHours(23, 59, 59, 999);

          snapshot.forEach((doc) => {
            const booking = doc.data();
            const scheduledDate = booking.scheduledDate?.toDate();
            
            if (scheduledDate && scheduledDate >= startOfDay && scheduledDate <= endOfDay) {
                if (['accepted', 'in_progress'].includes(booking.status) && booking.timeSlot) {
                    slots.add(booking.timeSlot);
                }
            }
          });
      }
      
      setBookedSlots(slots);
      setLoading(false);
    }, (serverError) => {
      const permissionError = new FirestorePermissionError({
        path: 'bookings',
        operation: 'list',
      });
      errorEmitter.emit('permission-error', permissionError);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [expertId, date]);

  return { bookedSlots, loading };
}
