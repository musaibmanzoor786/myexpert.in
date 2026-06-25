'use client';

import { useAuth } from '@/context/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import type { Customer, Expert } from '@/lib/types';
import { CustomerProfile } from '@/components/customer-profile';
import { ExpertProfileDisplay } from '@/components/expert-profile-display';
import { doc, onSnapshot, collection, query, where, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Link from 'next/link';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

export function ProfileView() {
    const { user, userProfile, loading: authLoading } = useAuth();
    const [customerData, setCustomerData] = useState<Customer | null>(null);
    const [expertData, setExpertData] = useState<Expert | null>(null);
    const [dataLoading, setDataLoading] = useState(true);
    const [completedJobsCount, setCompletedJobsCount] = useState(0);
    const [customerBookingsCount, setCustomerBookingsCount] = useState(0);
    const router = useRouter();

    useEffect(() => {
        if (!authLoading) {
            if (!user) {
                router.push('/login');
            } else if (!userProfile?.role) {
                router.push('/pick-role');
            }
        }
    }, [user, userProfile, authLoading, router]);

    useEffect(() => {
        if (authLoading || !user?.uid || !userProfile?.role || !db) {
            if(!authLoading) setDataLoading(false);
            return;
        };

        setDataLoading(true);
        let unsubscribe = () => {};
        let bookingsUnsubscribe = () => {};

        if (userProfile.role === 'customer') {
            const userRef = doc(db, 'users', user.uid);
            unsubscribe = onSnapshot(userRef, (snap) => {
                if (snap.exists()) {
                    const data = snap.data();
                    setCustomerData({
                        uid: user.uid,
                        fullName: data.fullName,
                        mobileNumber: data.phone,
                        location: data.location,
                    } as Customer);
                }
                setDataLoading(false);
            }, (serverError) => {
                const permissionError = new FirestorePermissionError({
                    path: userRef.path,
                    operation: 'get',
                });
                errorEmitter.emit('permission-error', permissionError);
                setDataLoading(false);
            });
            
            const bookingsQuery = query(
                collection(db, 'bookings'), 
                where('participantIds', 'array-contains', user.uid),
                limit(50)
            );
            bookingsUnsubscribe = onSnapshot(bookingsQuery, (snapshot) => {
                // Filter only completed bookings
                const completedCount = snapshot.docs.filter(doc => doc.data().status === 'completed').length;
                setCustomerBookingsCount(completedCount);
            }, (serverError) => {
                const permissionError = new FirestorePermissionError({
                    path: 'bookings',
                    operation: 'list',
                });
                errorEmitter.emit('permission-error', permissionError);
            });

        } else if (userProfile.role === 'expert') {
            const expertRef = doc(db, 'experts', user.uid);
            unsubscribe = onSnapshot(expertRef, (snap) => {
                if (snap.exists()) {
                    setExpertData({ id: snap.id, ...snap.data() } as Expert);
                }
                setDataLoading(false);
            }, (serverError) => {
                const permissionError = new FirestorePermissionError({
                    path: expertRef.path,
                    operation: 'get',
                });
                errorEmitter.emit('permission-error', permissionError);
                setDataLoading(false);
            });
            
            const bookingsQuery = query(
                collection(db, 'bookings'),
                where('participantIds', 'array-contains', user.uid),
                limit(50)
            );
            bookingsUnsubscribe = onSnapshot(bookingsQuery, (snapshot) => {
                // Filter only completed bookings
                const completedCount = snapshot.docs.filter(doc => doc.data().status === 'completed').length;
                setCompletedJobsCount(completedCount);
            }, (serverError) => {
                 const permissionError = new FirestorePermissionError({
                    path: 'bookings',
                    operation: 'list',
                });
                errorEmitter.emit('permission-error', permissionError);
            });
        }
        
        return () => {
          unsubscribe();
          bookingsUnsubscribe();
        };
    }, [user?.uid, userProfile?.role, authLoading]);

    useEffect(() => {
        if (!authLoading && userProfile?.role === 'customer' && !dataLoading && !customerData) {
            router.push('/customer-profile-setup');
        }
    }, [authLoading, userProfile?.role, dataLoading, customerData, router]);

    if (authLoading || dataLoading) {
        return (
            <div className="flex justify-center items-center h-[calc(100vh-200px)]">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
        );
    }
    
    if (userProfile?.role === 'expert') {
        if (expertData) {
            return <ExpertProfileDisplay expert={expertData} completedJobs={completedJobsCount} />;
        }
        return (
            <div className="flex justify-center items-center min-h-[60vh]">
                <Card className="max-w-md text-center">
                    <CardHeader>
                        <CardTitle>Welcome {userProfile?.fullName || 'Expert'} 👋</CardTitle>
                        <CardDescription>Complete your profile to start receiving bookings.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button asChild className="w-full">
                            <Link href="/profile-setup">Complete Profile</Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (userProfile?.role === 'customer') {
        if (customerData) {
            return <CustomerProfile customer={customerData} bookingsCount={customerBookingsCount} />;
        }
        return null; 
    }

    return (
        <div className="flex justify-center items-center h-[calc(100vh-200px)]">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
    );
}
