'use client';

import type { User } from 'firebase/auth';
import { createContext, useContext, useEffect, useState, ReactNode, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { auth, firebaseConfig, db } from '@/lib/firebase';
import { onAuthStateChanged, signOut as firebaseSignOut } from 'firebase/auth';
import { collection, query, where, onSnapshot, doc, limit, Timestamp } from 'firebase/firestore';
import { setUserRole as dbSetUserRole, updateUserLocationData } from '@/services/user-service';
import type { UserProfile } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { isFirebaseConfigured } from '@/lib/firebase';
import FirebaseNotConfigured from '@/components/firebase-not-configured';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { useLocationStore } from '@/lib/location-store';
import { requestNotificationPermission } from '@/lib/fcm-setup';

export type AppTab = 'home' | 'search' | 'history' | 'profile';

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  profileLoaded: boolean;
  isCatchingLocation: boolean;
  isFirebaseConfigured: boolean;
  pendingBookingsCount: number;
  logout: () => void;
  setUserRole: (role: 'customer' | 'expert') => Promise<void>;
  isLocationLoading: boolean;
  activeTab: AppTab;
  setActiveTab: (tab: AppTab) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [isCatchingLocation, setIsCatchingLocation] = useState(false);
  const [pendingBookingsCount, setPendingBookingsCount] = useState(0);
  const [isLocationLoading, setLocationLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<AppTab>('home');
  
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();
  
  // Refs for tracking alerted IDs to prevent duplicate sounds
  const notifiedBookingIds = useRef(new Set<string>());
  const notifiedStatusChanges = useRef(new Set<string>());
  
  // Audio Refs
  const newRequestAudioRef = useRef<HTMLAudioElement | null>(null);
  const statusUpdateAudioRef = useRef<HTMLAudioElement | null>(null);
  
  const hasAttemptedCatch = useRef(false);

  const isConfigured = isFirebaseConfigured(firebaseConfig);
  const { setLocation: setLocationInStore } = useLocationStore();

  useEffect(() => {
    // Audio initializations moved to BookingNotificationManager which uses synthesized audio Context
  }, []);

  useEffect(() => {
    if (!isConfigured || !auth || !db) {
      setLoading(false);
      return;
    }
    
    let profileUnsubscribe: () => void = () => {};

    const authUnsubscribe = onAuthStateChanged(auth, (currentUser) => {
      profileUnsubscribe();
      
      if (currentUser) {
        setUser(currentUser);
        requestNotificationPermission(currentUser.uid).catch(console.warn);
        const userDocRef = doc(db, 'users', currentUser.uid);
        profileUnsubscribe = onSnapshot(userDocRef, 
          (docSnap) => {
            if (docSnap.exists()) {
              const profile = docSnap.data() as UserProfile;
              setUserProfile(profile);
              if (profile.locationData) {
                setLocationInStore({
                  lat: profile.locationData.lat,
                  lng: profile.locationData.lng,
                  area: profile.locationData.area,
                  address: profile.locationData.fullAddress
                });
              }
            } else {
              setUserProfile(null);
            }
            setProfileLoaded(true);
            setLoading(false);
          },
          (serverError) => {
            errorEmitter.emit('permission-error', new FirestorePermissionError({ path: userDocRef.path, operation: 'get' }));
            setProfileLoaded(true);
            setLoading(false);
          }
        );
      } else {
        setUser(null);
        setUserProfile(null);
        setProfileLoaded(true);
        setLoading(false);
      }
    });

    return () => {
      authUnsubscribe();
      profileUnsubscribe();
    };
  }, [isConfigured, setLocationInStore]);
  
  // GLOBAL REAL-TIME ALERT SYSTEM
  useEffect(() => {
    if (!user?.uid || !db) {
      setPendingBookingsCount(0);
      return;
    }

    const q = query(
      collection(db, 'bookings'),
      where('participantIds', 'array-contains', user.uid),
      limit(100) 
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
        const now = new Date();
        
        // Update pending count for Experts
        if (userProfile?.role === 'expert') {
            const pendingDocs = snapshot.docs.filter(doc => {
                const data = doc.data();
                const expiresAt = data.expiresAt?.toDate();
                return data.status === 'pending' && data.expertId === user.uid && (!expiresAt || expiresAt > now);
            });
            setPendingBookingsCount(pendingDocs.length);
        }

        snapshot.docChanges().forEach((change) => {
            const bookingId = change.doc.id;
            const data = change.doc.data();

            // 1. EXPERT: Alert for New Incoming Requests
            if (change.type === "added" && userProfile?.role === 'expert') {
                if (data.expertId === user.uid && data.status === 'pending' && !notifiedBookingIds.current.has(bookingId)) {
                    notifiedBookingIds.current.add(bookingId);
                    
                    // Toast is disabled here to avoid double overlapping notifications.
                    // Instead, a clean native Bottom-Sheet popup is managed by BookingNotificationManager.
                }
            }

            // 2. CUSTOMER: Alert for Status Changes (Accepted/Rejected)
            if (change.type === "modified" && userProfile?.role === 'customer') {
                if (data.userId === user.uid) {
                    const statusKey = `${bookingId}_${data.status}`;
                    if (['accepted', 'rejected'].includes(data.status) && !notifiedStatusChanges.current.has(statusKey)) {
                        notifiedStatusChanges.current.add(statusKey);
                        
                        // Visual notification is handled by BookingNotificationManager popup
                        // but we keep the static Toast here too.
                        if (data.status === 'accepted') {
                            toast({
                                title: "Booking Accepted! 🎉",
                                description: `${data.expertName} has accepted your request. Check your history for the start code.`,
                            });
                        } else if (data.status === 'rejected') {
                            toast({
                                variant: 'warning',
                                title: "Request Declined",
                                description: `Sorry, ${data.expertName} is currently busy. Please try another expert.`,
                            });
                        }
                    }
                }
            }
        });

        // Cleanup local cache for expired IDs
        const currentIds = new Set(snapshot.docs.map(d => d.id));
        notifiedBookingIds.current.forEach(id => {
            if (!currentIds.has(id)) notifiedBookingIds.current.delete(id);
        });
    });

    return () => unsubscribe();
  }, [user?.uid, userProfile?.role, toast]);


  const logout = async () => {
    if (auth) {
      setLoading(true);
      await firebaseSignOut(auth);
      router.push('/login');
    }
  };

  const setUserRole = async (role: 'customer' | 'expert') => {
    if (user) await dbSetUserRole(user.uid, role);
  };

  if (!isConfigured) {
    if (pathname !== '/') return <FirebaseNotConfigured />;
    return <>{children}</>;
  }

  return (
    <AuthContext.Provider value={{ 
        user, userProfile, loading, profileLoaded, isCatchingLocation, logout, setUserRole, 
        isFirebaseConfigured: isConfigured, isLocationLoading, pendingBookingsCount, activeTab, setActiveTab 
    }}>
        {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === null) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
