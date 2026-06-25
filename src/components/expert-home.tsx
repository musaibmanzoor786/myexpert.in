
'use client';

import { useAuth } from '@/context/auth-context';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { 
    CalendarCheck, Inbox, ShieldCheck, ChevronDown, 
    Bell, Star, MessageSquare, Loader2, 
    MapPin, CheckCircle2, AlertCircle
} from 'lucide-react';
import { useBookingsSummary } from '@/hooks/use-bookings-summary';
import { StatusToggle } from './ui/status-toggle';
import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useLocationStore } from '@/lib/location-store';
import { getExpertReviews } from '@/services/review-service';
import { getExpertById } from '@/services/expert-service';
import { useToast } from '@/hooks/use-toast';
import type { Review, Expert } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { useBookings } from '@/hooks/use-bookings';
import { BookingCardExpert } from './booking-card-expert';

const StatCard = ({ count, label, icon: Icon, colorClass, hasAlert = false }: { count: number, label: string, icon: React.ElementType, colorClass: string, hasAlert?: boolean }) => (
    <Card className={cn(
        "border-none shadow-sm transition-all duration-500",
        hasAlert ? "bg-orange-50/80 ring-2 ring-orange-500/20" : "bg-background/50 backdrop-blur-sm"
    )}>
        <CardContent className="p-3 flex flex-col items-center text-center relative overflow-hidden">
            {hasAlert && <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full animate-ping" />}
            <div className={cn("p-2 rounded-xl mb-2 shadow-inner", colorClass)}>
                <Icon className={cn("w-4 h-4", hasAlert && "animate-pulse")} />
            </div>
            <span className={cn("text-xl font-black", hasAlert ? "text-orange-700" : "text-foreground")}>{count}</span>
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mt-1">{label}</p>
        </CardContent>
    </Card>
);

export function ExpertHome() {
    const { user, userProfile, pendingBookingsCount, setActiveTab } = useAuth();
    const router = useRouter();
    const { newRequestsCount, todaysJobsCount, totalCompletedCount } = useBookingsSummary();
    const { bookings: allBookings, loading: bookingsLoading } = useBookings('expert');
    const { area: displayArea, setLocation: setLocationInStore } = useLocationStore();
    const [reviews, setReviews] = useState<Review[]>([]);
    const [loadingReviews, setLoadingReviews] = useState(true);
    const [expertDetails, setExpertDetails] = useState<Expert | null>(null);

    const greeting = useMemo(() => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good Morning';
        if (hour < 17) return 'Good Afternoon';
        return 'Good Evening';
    }, []);

    useEffect(() => {
        if (userProfile?.location && displayArea === 'Select Location') {
            setLocationInStore({ 
                lat: userProfile.latitude || 0, 
                lng: userProfile.longitude || 0, 
                area: userProfile.location?.split(',')[0] || 'Nearby',
                address: userProfile.location
            });
        }
    }, [userProfile?.location, userProfile?.latitude, userProfile?.longitude, displayArea, setLocationInStore]);

    useEffect(() => {
        if (!user?.uid) {
            setLoadingReviews(false);
            return;
        }
        
        async function fetchData() {
            try {
                const expert = await getExpertById(user!.uid);
                setExpertDetails(expert);
                const data = await getExpertReviews(user!.uid);
                setReviews(data.slice(0, 3));
            } catch (error) {
                console.error("Failed to fetch expert dashboard data", error);
            } finally {
                setLoadingReviews(false);
            }
        }
        fetchData();
    }, [user?.uid]);

    const recentRequests = useMemo(() => {
        return allBookings.filter(b => b.status === 'pending').slice(0, 2);
    }, [allBookings]);

    const profession = userProfile?.serviceType || expertDetails?.serviceType || 'Service Professional';
    
    return (
        <>
        <div className="space-y-6 pb-10 animate-in fade-in duration-700 w-full max-w-7xl mx-auto">
            {/* Native-Style Gradient Header */}
            <div className="relative px-6 pt-10 pb-6 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent rounded-b-[2.5rem] shadow-sm">
                <div className="flex items-start justify-between mb-6">
                    <div className="flex items-center gap-4">
                        <button onClick={() => setActiveTab('profile')} className="relative active:scale-95 transition-transform">
                            <Avatar className="h-14 w-14 border-2 border-background shadow-md">
                                <AvatarImage src={(userProfile as any)?.profilePictureUrl} />
                                <AvatarFallback className="bg-primary text-white font-bold">
                                    {userProfile?.fullName?.charAt(0) || 'E'}
                                </AvatarFallback>
                            </Avatar>
                            {userProfile?.isActive && (
                                <span className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 border-2 border-background rounded-full animate-pulse" />
                            )}
                        </button>
                        <div>
                            <h1 className="text-xl font-black tracking-tight">{greeting}, {userProfile?.fullName?.split(' ')[0]}</h1>
                            <p className="text-xs font-bold text-primary uppercase tracking-widest">{profession}</p>
                            <div className="flex items-center gap-1.5 mt-1">
                                <div className="flex items-center bg-yellow-400 text-yellow-950 px-1.5 py-0.5 rounded-md text-[10px] font-black">
                                    <Star className="w-2.5 h-2.5 fill-current mr-1" />
                                    {expertDetails?.rating || userProfile?.rating || 'New'}
                                </div>
                                <span className="text-[10px] text-muted-foreground font-bold">({expertDetails?.reviewCount || userProfile?.reviewCount || 0} reviews)</span>
                            </div>
                        </div>
                    </div>
                    <Link href="/notifications" className="relative group">
                        <Button variant="outline" size="icon" className="rounded-full bg-background/80 backdrop-blur-sm border-none shadow-sm h-11 w-11 hover:bg-white transition-all">
                            <Bell className={cn("h-5 w-5", pendingBookingsCount > 0 && "animate-bounce")} />
                            {pendingBookingsCount > 0 && (
                                <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white ring-2 ring-background">
                                    {pendingBookingsCount}
                                </span>
                            )}
                        </Button>
                    </Link>
                </div>

                <button 
                    onClick={() => router.push('/select-location')}
                    className="flex items-center gap-3 p-3 rounded-2xl bg-background/60 backdrop-blur-md w-full text-left transition-all active:scale-95 shadow-sm border border-white/20 group"
                >
                    <div className="w-8 h-8 flex items-center justify-center bg-primary/10 rounded-xl group-hover:bg-primary/20 transition-colors">
                        <svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-primary">
                            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                        </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground leading-none">Your Hub</p>
                        <h2 className="text-sm font-bold text-foreground mt-0.5 flex items-center gap-1 truncate">
                            {displayArea}
                            <ChevronDown className="w-3 h-3 text-muted-foreground group-hover:text-primary transition-colors" />
                        </h2>
                    </div>
                </button>
            </div>

            <div className="px-2.5 sm:px-4">
                <StatusToggle />
            </div>

            <div className="grid grid-cols-3 gap-3 md:gap-6 px-2.5 sm:px-4">
                <StatCard 
                    count={newRequestsCount} 
                    label="Requests" 
                    icon={Inbox} 
                    colorClass="bg-orange-100 text-orange-600"
                    hasAlert={newRequestsCount > 0}
                />
                <StatCard 
                    count={todaysJobsCount} 
                    label="Today" 
                    icon={CalendarCheck} 
                    colorClass="bg-blue-100 text-blue-600"
                />
                <StatCard 
                    count={totalCompletedCount} 
                    label="Done" 
                    icon={CheckCircle2} 
                    colorClass="bg-green-100 text-green-600"
                />
            </div>

            <section className="space-y-4 px-2.5 sm:px-4">
                <div className="flex justify-between items-center">
                    <h2 className="text-lg font-black tracking-tight">Recent Requests</h2>
                    {recentRequests.length > 0 && (
                        <Button variant="link" asChild className="p-0 h-auto text-primary font-black text-xs uppercase tracking-widest">
                            <Link href="/history?tab=requests">View All</Link>
                        </Button>
                    )}
                </div>

                {bookingsLoading ? (
                    <div className="flex justify-center py-8">
                        <Loader2 className="w-6 h-6 animate-spin text-primary" />
                    </div>
                ) : recentRequests.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                        {recentRequests.map((booking) => (
                            <div key={booking.id} className="relative">
                                {booking.status === 'pending' && (
                                    <div className="absolute -top-1 -right-1 z-10">
                                        <span className="flex h-3 w-3">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                                        </span>
                                    </div>
                                )}
                                <BookingCardExpert booking={booking} />
                            </div>
                        ))}
                    </div>
                ) : (
                    <Card className="border-dashed bg-secondary/20 rounded-[2rem]">
                        <CardContent className="p-10 text-center flex flex-col items-center">
                            <div className="w-14 h-14 bg-background rounded-full flex items-center justify-center mb-4 shadow-sm">
                                <Inbox className="w-7 h-7 text-muted-foreground/30" />
                            </div>
                            <p className="text-sm text-muted-foreground font-black">All quiet here!</p>
                            <p className="text-[11px] text-muted-foreground/60 mt-1 uppercase font-bold tracking-wider">Stay online to receive requests</p>
                        </CardContent>
                    </Card>
                )}
            </section>
        </div>
        </>
    );
}
