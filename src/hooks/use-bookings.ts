'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/auth-context';
import type { Booking } from '@/lib/types';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot, DocumentData, QuerySnapshot, Timestamp, updateDoc, doc, limit } from 'firebase/firestore';
import { useToast } from './use-toast';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

function docToBooking(doc: DocumentData): Booking {
    const data = doc.data();
    return {
        id: doc.id,
        ...data,
    } as Booking;
}

export function useBookings(view: 'customer' | 'expert') {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const handleExpiry = useCallback(async (bookingsToExpire: Booking[]) => {
    if (!db || bookingsToExpire.length === 0) return;
    
    const promises = bookingsToExpire.map(booking => {
      const bookingRef = doc(db, 'bookings', booking.id);
      return updateDoc(bookingRef, { status: 'expired' }).catch(err => {
        console.error(`Failed to expire booking ${booking.id}:`, err);
      });
    });

    await Promise.all(promises);
  }, []);

  useEffect(() => {
    if (!user?.uid || !db) {
      setLoading(false);
      return;
    }
    
    setLoading(true);

    const q = query(
        collection(db, 'bookings'), 
        where('participantIds', 'array-contains', user.uid),
        limit(100) 
    );

    const unsubscribe = onSnapshot(q, 
      (querySnapshot: QuerySnapshot<DocumentData>) => {
        const bookingsData = querySnapshot.docs.map(docToBooking);
        const now = Timestamp.now();
        const toExpire: Booking[] = [];

        const processed = bookingsData.map(booking => {
            if (booking.status === 'pending' && booking.expiresAt && now.seconds > booking.expiresAt.seconds) {
                toExpire.push(booking);
                return { ...booking, status: 'expired' as const };
            }
            return booking;
        });

        if (toExpire.length > 0) {
            handleExpiry(toExpire);
        }
        
        const sorted = processed.sort((a, b) => {
            const timeA = a.createdAt?.toMillis() || 0;
            const timeB = b.createdAt?.toMillis() || 0;
            return timeB - timeA;
        });

        setBookings(sorted);
        setLoading(false);
      },
      (serverError) => {
        const permissionError = new FirestorePermissionError({
            path: 'bookings',
            operation: 'list',
        });
        errorEmitter.emit('permission-error', permissionError);
        setLoading(false);
      }
    );
    
    return () => unsubscribe();
  }, [user?.uid, view, toast, handleExpiry]);

  return { bookings, loading };
}