import { initializeApp, getApps, getApp, type FirebaseOptions } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getStorage, type FirebaseStorage } from 'firebase/storage';
import { getMessaging, isSupported } from 'firebase/messaging';
import { firebaseConfig as rawConfig } from '@/firebase/config';

// Ensure config matches what we expect
const firebaseConfig = {
    ...rawConfig,
    // Add missing mapping if necessary
    apiKey: (rawConfig as any).apiKey,
    authDomain: (rawConfig as any).authDomain,
    projectId: (rawConfig as any).projectId,
    storageBucket: (rawConfig as any).storageBucket,
    messagingSenderId: (rawConfig as any).messagingSenderId,
    appId: (rawConfig as any).appId,
};

export const isFirebaseConfigured = (config: any): boolean => {
    return !!config.apiKey && !!config.projectId;
};

const isConfigured = isFirebaseConfigured(firebaseConfig);

const app = isConfigured ? (getApps().length === 0 ? initializeApp(firebaseConfig) : getApp()) : null;
const auth = (app ? getAuth(app) : null) as unknown as Auth;
const db = (app ? getFirestore(app) : null) as unknown as Firestore;
const storage = (app ? getStorage(app) : null) as unknown as FirebaseStorage;

let messaging: ReturnType<typeof getMessaging> | null = null;
if (app && typeof window !== 'undefined') {
  isSupported().then(supported => {
    if (supported) {
      messaging = getMessaging(app);
    }
  });
}

export { app, auth, db, storage, messaging, firebaseConfig };
