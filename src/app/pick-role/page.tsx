'use client';

import { useAuth } from '@/context/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, User, Briefcase, ArrowRight, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function PickRolePage() {
    const { user, userProfile, setUserRole, loading: authLoading } = useAuth();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const router = useRouter();
    const { toast } = useToast();

    useEffect(() => {
        if (!authLoading) {
            if (!user) {
                router.push('/login');
            } else if (userProfile?.role && userProfile.profileComplete) {
                router.push('/');
            }
        }
    }, [user, userProfile, authLoading, router]);

    const handleRoleSelection = async (role: 'customer' | 'expert') => {
        setIsSubmitting(true);
        try {
            await setUserRole(role);
            toast({
                title: "Welcome!",
                description: `You are now set up as a ${role}.`,
            });
            
            // Direct redirect to the relevant setup page to avoid "flashing" the home screen
            router.push(role === 'expert' ? '/profile-setup' : '/customer-profile-setup');
        } catch (error) {
            console.error(error);
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Could not set your role. Please try again.',
            });
            setIsSubmitting(false);
        }
    };

    if (authLoading || !user || (userProfile?.role && userProfile.profileComplete)) {
        return (
            <div className="flex justify-center items-center h-full min-h-screen">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
        );
    }
    
    return (
        <div className="w-full flex flex-col min-h-screen bg-background p-6">
            <div className="flex-1 flex flex-col justify-center max-w-md mx-auto space-y-10 py-12">
                <div className="text-center space-y-4">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-widest mb-2">
                        <Sparkles className="w-3.5 h-3.5" />
                        One Last Step
                    </div>
                    <h1 className="text-4xl font-black tracking-tight text-foreground sm:text-5xl">
                        Ready to <span className="text-primary">grow?</span>
                    </h1>
                    <p className="text-muted-foreground text-lg font-medium">How would you like to use MyExpert?</p>
                </div>

                <div className="grid grid-cols-1 gap-4">
                    <button
                        onClick={() => handleRoleSelection('customer')}
                        disabled={isSubmitting}
                        className="group relative flex items-center gap-4 sm:gap-6 p-4 sm:p-6 rounded-3xl border-2 border-transparent bg-card shadow-2xl shadow-black/5 hover:border-primary/30 transition-all text-left overflow-hidden ring-1 ring-black/5 active:scale-[0.98] disabled:opacity-50"
                    >
                        <div className="bg-primary/10 p-3 sm:p-4 rounded-2xl group-hover:bg-primary group-hover:text-white transition-all duration-500 group-hover:rotate-[360deg]">
                            <User className="w-6 h-6 sm:w-8 sm:h-8" />
                        </div>
                        <div className="flex-1">
                            <h3 className="font-black text-lg sm:text-xl leading-tight">I'm a Customer</h3>
                            <p className="text-xs sm:text-sm text-muted-foreground mt-1 font-medium">Book trusted services near you</p>
                        </div>
                        <div className="bg-secondary/50 p-2 rounded-full opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0 duration-300">
                            <ArrowRight className="w-5 h-5 text-primary" />
                        </div>
                    </button>

                    <button
                        onClick={() => handleRoleSelection('expert')}
                        disabled={isSubmitting}
                        className="group relative flex items-center gap-4 sm:gap-6 p-4 sm:p-6 rounded-3xl border-2 border-transparent bg-card shadow-2xl shadow-black/5 hover:border-primary/30 transition-all text-left overflow-hidden ring-1 ring-black/5 active:scale-[0.98] disabled:opacity-50"
                    >
                        <div className="bg-primary/10 p-3 sm:p-4 rounded-2xl group-hover:bg-primary group-hover:text-white transition-all duration-500 group-hover:rotate-[360deg]">
                            <Briefcase className="w-6 h-6 sm:w-8 sm:h-8" />
                        </div>
                        <div className="flex-1">
                            <h3 className="font-black text-lg sm:text-xl leading-tight">I'm an Expert</h3>
                            <p className="text-xs sm:text-sm text-muted-foreground mt-1 font-medium">Offer your services & earn</p>
                        </div>
                        <div className="bg-secondary/50 p-2 rounded-full opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0 duration-300">
                            <ArrowRight className="w-5 h-5 text-primary" />
                        </div>
                    </button>
                </div>

                {isSubmitting && (
                    <div className="flex justify-center pt-4">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                )}
            </div>
        </div>
    );
}
