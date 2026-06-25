'use client';

import { useAuth } from '@/context/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { CustomerProfileSetupForm } from '@/components/customer-profile-setup-form';
import { Loader2, ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function CustomerProfileSetupPage() {
    const { user, userProfile, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading) {
            if (!user) {
                router.push('/login');
            } else if (userProfile?.role === 'expert') {
                router.push('/profile-setup');
            } else if (userProfile?.profileComplete) {
                router.push('/');
            }
        }
    }, [user, userProfile, loading, router]);

    return (
        // REMOVED 'max-w' constraints. This div is now truly 100% width and height.
        <div className="min-h-screen w-full bg-white flex flex-col">
            
            {/* Header: Full width, feels like a Browser/App top bar */}
            <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md h-16 flex items-center border-b border-slate-100 px-4 w-full">
                <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => window.history.length > 2 ? router.back() : router.push('/')} 
                    className="rounded-full h-10 w-10 active:scale-90 transition-transform"
                >
                    <ChevronLeft className="h-6 w-6" />
                </Button>
                <h1 className="text-lg font-black tracking-tight absolute left-1/2 -translate-x-1/2">
                    Profile Details
                </h1>
            </header>

            {/* Main Content: Full width on laptop, no more centering card */}
            <main className="flex-1 w-full p-4 md:p-8 lg:p-12">
                {loading ? (
                    <div className="flex flex-col items-center justify-center h-[60vh]">
                        <Loader2 className="h-10 w-10 animate-spin text-primary opacity-40" />
                    </div>
                ) : (
                    // The form will now take up as much space as the screen allows, 
                    // mimicking a professional SaaS application feel.
                    <div className="w-full h-full animate-in fade-in duration-500">
                        <CustomerProfileSetupForm customerData={null} />
                    </div>
                )}
            </main>
        </div>
    );
}