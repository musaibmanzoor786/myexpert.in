import { messaging } from './firebase';
import { getToken } from 'firebase/messaging';
import { db } from './firebase';
import { doc, updateDoc, setDoc } from 'firebase/firestore';
import { safeStringify } from '@/lib/utils';

export async function requestNotificationPermission(userId: string) {
    if (!messaging) {
        console.warn('FCM is not supported or not initialized.');
        return;
    }

    try {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
            console.log('Notification permission granted.');
            
            // Get the VAPID key if provided in env
            const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
            
            // Registering the SW with config as query param so SW knows the projectId etc
            let swReg = await navigator.serviceWorker.getRegistration('/firebase-messaging-sw.js');
            if(!swReg) {
                const configStr = encodeURIComponent(safeStringify({
                    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
                    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
                    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
                    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
                }));
                swReg = await navigator.serviceWorker.register(`/firebase-messaging-sw.js?config=${configStr}`);
            }
            
            const currentToken = await getToken(messaging, { 
                vapidKey,
                serviceWorkerRegistration: swReg
            });

            if (currentToken) {
                console.log('FCM Token grabbed successfully.');
                // Save the token to Firestore user document
                if (db) {
                    await setDoc(doc(db, 'users', userId), {
                        fcmToken: currentToken
                    }, { merge: true });
                }
            } else {
                console.log('No registration token available. Request permission to generate one.');
            }
        } else {
            console.log('Unable to get permission to notify.');
        }
    } catch (error) {
        console.error('An error occurred while retrieving token. ', error);
    }
}
