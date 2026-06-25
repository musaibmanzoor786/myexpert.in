'use client';

import { useAuth } from '@/context/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ExpertProfileSetupForm } from '@/components/expert-profile-setup-form';
import type { Expert } from '@/lib/types';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Loader2, ChevronLeft } from 'lucide-react';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

export default function ProfileSetupPage() {
    const { user, userProfile, loading: authLoading } = useAuth();
    const [expertData, setExpertData] = useState<Expert | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login');
        } else if (!authLoading && user && userProfile?.role && userProfile.role !== 'expert') {
            router.push('/'); 
        }
    }, [user, userProfile, authLoading, router]);

    useEffect(() => {
        if (!user || !db) return;

        const expertRef = doc(db, 'experts', user.uid);
        const unsubscribe = onSnapshot(expertRef, (doc) => {
            if (doc.exists()) {
                setExpertData({ id: doc.id, ...doc.data() } as Expert);
            } else {
                setExpertData(null);
            }
            setLoading(false);
        }, (serverError) => {
            const permissionError = new FirestorePermissionError({
                path: expertRef.path,
                operation: 'get',
            });
            errorEmitter.emit('permission-error', permissionError);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user]);

    return (
        <div className="min-h-screen bg-white flex flex-col">
            <header className="sticky top-0 z-20 bg-white border-b border-border/40 px-4 h-16 flex items-center justify-between">
                <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => window.history.length > 2 ? router.back() : router.push('/')} 
                    className="rounded-full h-10 w-10 active:scale-90 transition-transform"
                >
                    <ChevronLeft className="h-6 w-6" />
                </Button>
                <h1 className="text-lg font-bold text-foreground absolute left-1/2 -translate-x-1/2">
                    Profile details
                </h1>
                <div className="w-10" />
            </header>

            <div className="flex-1 px-4 pt-6 pb-32">
                {authLoading ? (
                    <div className="flex flex-col items-center justify-center pt-20">
                        <Loader2 className="h-10 w-10 animate-spin text-primary opacity-20" />
                    </div>
                ) : (
                    <>
                        {loading && !expertData ? (
                            <div className="space-y-8 animate-in fade-in duration-500">
                                <div className="flex justify-center py-4">
                                    <Skeleton className="w-32 h-32 rounded-full" />
                                </div>
                                <div className="space-y-6">
                                    {[1, 2, 3, 4, 5].map(i => (
                                        <Skeleton key={i} className="h-14 w-full rounded-2xl" />
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <ExpertProfileSetupForm expertData={expertData} />
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
