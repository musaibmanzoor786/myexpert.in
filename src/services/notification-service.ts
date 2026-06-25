
'use client';

import { db } from '@/lib/firebase';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  doc, 
  updateDoc, 
  writeBatch, 
  limit, 
  getDocs,
  addDoc,
  deleteDoc,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import type { AppNotification, NotificationType } from '@/lib/types';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

/**
 * Subscribes to notifications for a user, filtered by the last 7 days.
 */
export function subscribeToNotifications(userId: string, callback: (notifications: AppNotification[]) => void) {
  if (!db) return () => {};

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const cutoffTimestamp = Timestamp.fromDate(sevenDaysAgo);

  const notificationsRef = collection(db, 'users', userId, 'notifications');
  const q = query(
    notificationsRef,
    where('timestamp', '>=', cutoffTimestamp),
    orderBy('timestamp', 'desc'),
    limit(50)
  );

  const unsubscribe = onSnapshot(q, (snapshot) => {
    const notifications: AppNotification[] = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as AppNotification));
    callback(notifications);
  }, (serverError) => {
    const permissionError = new FirestorePermissionError({
      path: `users/${userId}/notifications`,
      operation: 'list',
    });
    errorEmitter.emit('permission-error', permissionError);
  });

  return unsubscribe;
}

/**
 * Creates a notification for a user.
 */
export async function createNotification(
  userId: string, 
  data: { 
    title: string; 
    message: string; 
    type: NotificationType;
    relatedEntityId?: string;
    relatedEntityType?: 'Booking' | 'Promotion' | 'System';
  }
) {
  if (!db) return;
  const notificationsRef = collection(db, 'users', userId, 'notifications');
  const payload = {
    ...data,
    userId,
    isRead: false,
    timestamp: serverTimestamp(),
  };

  return addDoc(notificationsRef, payload).catch((serverError) => {
    const permissionError = new FirestorePermissionError({
      path: notificationsRef.path,
      operation: 'create',
      requestResourceData: payload,
    });
    errorEmitter.emit('permission-error', permissionError);
  });
}

/**
 * Deletes a notification.
 */
export async function deleteNotification(userId: string, notificationId: string) {
  if (!db) return;
  const docRef = doc(db, 'users', userId, 'notifications', notificationId);
  try {
    await deleteDoc(docRef);
  } catch (serverError) {
    console.error(serverError);
    const permissionError = new FirestorePermissionError({
      path: docRef.path,
      operation: 'delete',
    });
    errorEmitter.emit('permission-error', permissionError);
  }
}

/**
 * Marks a single notification as read.
 */
export function markNotificationAsRead(userId: string, notificationId: string) {
  if (!db) return;
  const docRef = doc(db, 'users', userId, 'notifications', notificationId);
  updateDoc(docRef, { isRead: true }).catch((serverError) => {
    const permissionError = new FirestorePermissionError({
      path: docRef.path,
      operation: 'update',
      requestResourceData: { isRead: true },
    });
    errorEmitter.emit('permission-error', permissionError);
  });
}

/**
 * Marks all unread notifications as read.
 */
export async function markAllNotificationsAsRead(userId: string) {
  if (!db) return;
  const notificationsRef = collection(db, 'users', userId, 'notifications');
  const q = query(notificationsRef, where('isRead', '==', false));
  
  try {
    const snapshot = await getDocs(q);
    if (snapshot.empty) return;

    const batch = writeBatch(db);
    snapshot.docs.forEach(doc => {
      batch.update(doc.ref, { isRead: true });
    });
    await batch.commit();
  } catch (serverError) {
    console.error(serverError);
    const permissionError = new FirestorePermissionError({
      path: `users/${userId}/notifications`,
      operation: 'update',
    });
    errorEmitter.emit('permission-error', permissionError);
  }
}
