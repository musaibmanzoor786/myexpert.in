'use client';

import { useAuth } from '@/context/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo } from 'react';
import { CustomerProfileSetupForm } from '@/components/customer-profile-setup-form';
import type { Customer } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { ChevronLeft, Loader2 } from 'lucide-react';

export default function EditCustomerProfilePage() {
    const { user, userProfile, loading: authLoading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login');
        } else if (!authLoading && user && userProfile?.role && userProfile.role !== 'customer') {
            router.push('/'); 
        }
    }, [user, userProfile, authLoading, router]);

    // Construct customer data from userProfile which is already in context
    const customerData = useMemo(() => {
        if (!user || !userProfile) return null;
        return {
            uid: user.uid,
            fullName: userProfile.fullName,
            mobileNumber: userProfile.phone,
            location: userProfile.location,
        } as Customer;
    }, [user, userProfile]);

    return (
        <div className="min-h-screen bg-white flex flex-col w-full max-w-4xl mx-auto">
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
                    <CustomerProfileSetupForm customerData={customerData} />
                )}
            </div>
        </div>
    );
}
