'use client';

import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { 
    Search, Loader2, ChevronDown, Bell, MapPin, 
    ShieldCheck, ArrowRight, Wind, Sparkles as SparklesIcon, 
    Wrench as WrenchIcon, Zap as ZapIcon, Hammer as HammerIcon, 
    PaintRoller as PaintRollerIcon, ChefHat as ChefHatIcon 
} from "lucide-react";
import { getCachedServices } from '@/services/service-cache';
import { useAuth } from '@/context/auth-context';
import { Card, CardContent } from '@/components/ui/card';
import { ExpertHome } from './expert-home';
import Link from 'next/link';
import placeholderImages from '@/lib/placeholder-images.json';
import { Carousel, CarouselContent, CarouselItem, type CarouselApi } from '@/components/ui/carousel';
import { cn, getDistance } from '@/lib/utils';
import { useLocationStore } from '@/lib/location-store';
import { useRouter } from 'next/navigation';
import Autoplay from 'embla-carousel-autoplay';
import { Avatar, AvatarFallback } from './ui/avatar';
import { getServicesAvailability } from '@/services/expert-service';
import { useToast } from '@/hooks/use-toast';
import { updateUserLocationAndAddress } from '@/services/user-service';
import { UnserviceableArea } from '@/components/unserviceable-area';
import type { Expert, Service } from '@/lib/types';
import Image from 'next/image';

const topMinimalServices = [
    { name: 'AC Repair', service: 'Electrician', icon: Wind, color: 'bg-indigo-50 border-indigo-100 text-indigo-500' },
    { name: 'Deep Clean', service: 'Painter', icon: SparklesIcon, color: 'bg-emerald-50 border-emerald-100 text-emerald-500' },
    { name: 'Plumber', service: 'Plumber', icon: WrenchIcon, color: 'bg-blue-50 border-blue-100 text-blue-500' },
    { name: 'Electrician', service: 'Electrician', icon: ZapIcon, color: 'bg-amber-50 border-amber-100 text-amber-500' },
    { name: 'Carpenter', service: 'Carpenter', icon: HammerIcon, color: 'bg-amber-50 border-amber-100 text-amber-700' },
    { name: 'Painter', service: 'Painter', icon: PaintRollerIcon, color: 'bg-teal-50 border-teal-100 text-teal-600' },
    { name: 'Home Cook', service: 'Cook', icon: ChefHatIcon, color: 'bg-rose-50 border-rose-100 text-rose-500' },
];

export function HomePage() {
    const { user, userProfile, loading: authLoading, pendingBookingsCount, setActiveTab } = useAuth();
    const [loading, setLoading] = useState(true);
    const [topServices, setTopServices] = useState<Service[]>([]);
    const [availability, setAvailability] = useState<Record<string, boolean>>({});
    const [imageError, setImageError] = useState<Record<string, boolean>>({});
    const [bannerError, setBannerError] = useState<Record<number, boolean>>({});
    const [isAreaServiceable, setIsAreaServiceable] = useState<boolean>(true);
    const [busyPopupMessage, setBusyPopupMessage] = useState<string | null>(null);
    const [nearbyExperts, setNearbyExperts] = useState<Expert[]>([]);
    
    const { toast } = useToast();
    const [api, setApi] = useState<CarouselApi>()
    const [current, setCurrent] = useState(0)
    const [count, setCount] = useState(0)
    
    const router = useRouter();
    const { lat, lng, area: displayArea, address: displayAddress, setLocation: setLocationInStore } = useLocationStore();

    useEffect(() => {
        setTopServices(getCachedServices());
    }, []);

    useEffect(() => {
        if (busyPopupMessage) {
            const timer = setTimeout(() => {
                setBusyPopupMessage(null);
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [busyPopupMessage]);

    useEffect(() => {
        if (userProfile?.location && displayArea === 'Select Location') {
            setLocationInStore({ 
                lat: userProfile.latitude || 34.0837, 
                lng: userProfile.longitude || 74.7973, 
                area: userProfile.location.split(',')[0],
                address: userProfile.location
            });
        }
    }, [userProfile?.location, userProfile?.latitude, userProfile?.longitude, displayArea, setLocationInStore]);

    useEffect(() => {
        if (!api) return;
        setCount(api.scrollSnapList().length)
        setCurrent(api.selectedScrollSnap())
        api.on("select", () => {
            setCurrent(api.selectedScrollSnap())
        })
    }, [api]);

    // Native Location Permission Requested ONLY ONCE on startup for Customer Layout
    useEffect(() => {
        if (!authLoading && userProfile && userProfile.role === 'customer') {
            const requested = sessionStorage.getItem('locationRequestedAppLoad');
            if (!requested) {
                sessionStorage.setItem('locationRequestedAppLoad', 'true');
                if (navigator.geolocation) {
                    navigator.geolocation.getCurrentPosition(
                        async (position) => {
                            const { latitude, longitude } = position.coords;
                            try {
                                const response = await fetch(`/api/reverse-geocode?lat=${latitude}&lng=${longitude}`);
                                if (response.ok) {
                                    const data = await response.json();
                                    const areaVal = data.area || 'Srinagar';
                                    const addressVal = data.formattedLocation || 'Srinagar, Kashmir';
                                    setLocationInStore({
                                        lat: latitude,
                                        lng: longitude,
                                        area: areaVal,
                                        address: addressVal
                                    });
                                    if (user?.uid) {
                                        updateUserLocationAndAddress(user.uid, { lat: latitude, lng: longitude, address: addressVal });
                                    }
                                } else {
                                    setLocationInStore({
                                        lat: latitude,
                                        lng: longitude,
                                        area: 'Srinagar',
                                        address: 'Srinagar, Kashmir'
                                    });
                                    if (user?.uid) {
                                        updateUserLocationAndAddress(user.uid, { lat: latitude, lng: longitude, address: 'Srinagar, Kashmir' });
                                    }
                                }
                            } catch (e) {
                                setLocationInStore({
                                    lat: latitude,
                                    lng: longitude,
                                    area: 'Srinagar',
                                    address: 'Srinagar, Kashmir'
                                });
                            }
                        },
                        (error) => {
                            console.warn("Geolocation permission error or declined on app startup", error);
                            // Populate Srinagar defaults securely
                            if (!lat || !lng) {
                                setLocationInStore({
                                    lat: 34.0837,
                                    lng: 74.7973,
                                    area: 'Srinagar',
                                    address: 'Srinagar, Kashmir'
                                });
                            }
                        },
                        { enableHighAccuracy: true, timeout: 8000 }
                    );
                }
            }
        }
    }, [authLoading, userProfile, user?.uid, lat, lng, setLocationInStore]);

    // Load available experts near customer
    useEffect(() => {
        async function fetchNearbyExperts() {
            try {
                const { getExperts } = await import('@/services/expert-service');
                const userLocation = lat && lng ? { lat, lng } : { lat: 34.0837, lng: 74.7973 };
                const res = await getExperts({
                    userLocation,
                    limitCount: 15
                });
                setNearbyExperts(res.experts);
            } catch (err) {
                console.error("Error fetching nearby home experts:", err);
            }
        }
        if (!authLoading && userProfile && userProfile.role === 'customer') {
            fetchNearbyExperts();
        }
    }, [authLoading, userProfile, lat, lng]);

    // Sort experts client-side using Haversine algorithm against saved coordinates
    const sortedHomeExperts = useMemo(() => {
        if (!nearbyExperts.length) return [];
        const userLat = lat || 34.0837;
        const userLng = lng || 74.7973;

        return [...nearbyExperts]
            .map(e => {
                let dist = 999;
                if (e.currentLocation?.lat && e.currentLocation?.lng) {
                    dist = getDistance(userLat, userLng, e.currentLocation.lat, e.currentLocation.lng);
                }
                return { ...e, calculatedDistance: dist };
            })
            .sort((a, b) => a.calculatedDistance - b.calculatedDistance);
    }, [nearbyExperts, lat, lng]);

    useEffect(() => {
        async function fetchInitialData() {
            if (!authLoading) {
                try {
                    const availData = await getServicesAvailability();
                    setAvailability(availData);
                } catch (err) {
                    console.error("Error fetching availability:", err);
                }
                setLoading(false);
            }
        }
        fetchInitialData();
    }, [authLoading]);

    useEffect(() => {
        if (!lat || !lng) return;
        let isMounted = true;
        
        async function checkArea() {
            try {
                const { getExperts } = await import('@/services/expert-service');
                const expertsResult = await getExperts({
                    userLocation: { lat: lat!, lng: lng! },
                    radiusKm: 15
                });
                const onlineExperts = expertsResult.experts.filter(e => e.online || e.isActive || e.status === 'online');
                if (isMounted) setIsAreaServiceable(true); // Gracefully handle all service areas to never lock the customer out
            } catch (err) {
                console.error("Check area error", err);
                if (isMounted) setIsAreaServiceable(true);
            }
        }
        checkArea();
        return () => { isMounted = false; };
    }, [lat, lng]);

    const isExpertRole = userProfile?.role === 'expert';
    const { banners } = placeholderImages;
    
    if (authLoading || loading) {
        return (
            <div className="flex justify-center items-center h-[calc(100vh-300px)]">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
        );
    }

    if (isExpertRole) {
        return <ExpertHome />;
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-20 font-sans bg-slate-50/50">
            
            {/* High-Impact Native Header */}
            <div className="relative bg-gradient-to-b from-primary/10 via-primary/5 to-background rounded-b-[2rem] shadow-sm pb-6">
                <div className="px-5 pt-8 pb-3">
                    <div className="flex items-center justify-between mb-4">
                        <Link 
                            href="/select-location"
                            className="flex items-start gap-2 text-left transition-all active:scale-95 group max-w-[75%]"
                        >
                            <div className="mt-0.5 bg-primary/10 p-1.5 rounded-xl shrink-0 group-hover:bg-primary/20 transition-colors flex items-center justify-center">
                                <MapPin className="w-4 h-4 text-primary" />
                            </div>
                            <div className="flex flex-col min-w-0">
                                <div className="flex items-center gap-1">
                                    <span className="text-base font-black tracking-tight text-slate-850 truncate">
                                        {displayArea || 'Srinagar'}
                                    </span>
                                    <ChevronDown className="w-3 h-3 text-primary shrink-0 opacity-70" />
                                </div>
                                <p className="text-[10px] font-bold text-muted-foreground truncate uppercase tracking-wider mt-0.5">
                                    {displayAddress || 'Srinagar, Kashmir'}
                                </p>
                            </div>
                        </Link>
                        
                        <div className="flex items-center gap-2">
                            <Link href="/notifications" className="relative">
                                <Button variant="ghost" size="icon" className="rounded-full bg-background/80 backdrop-blur-md h-9 w-9 shadow-sm border border-slate-100 hover:bg-white transition-all active:scale-90">
                                    <Bell className="h-4 w-4 text-foreground" />
                                    {pendingBookingsCount > 0 && (
                                        <span className="absolute -top-0.5 -right-0.5 flex h-3 w-3 items-center justify-center rounded-full bg-red-500 text-[6px] font-bold text-white border border-background">
                                            {pendingBookingsCount}
                                        </span>
                                    )}
                                </Button>
                            </Link>
                            <button onClick={() => setActiveTab('profile')} className="active:scale-90 transition-transform">
                                <Avatar className="h-9 w-9 border-2 border-background shadow-md">
                                    <AvatarFallback className="bg-primary text-white font-bold text-[9px]">
                                        {userProfile?.fullName?.charAt(0) || 'U'}
                                    </AvatarFallback>
                                </Avatar>
                            </button>
                        </div>
                    </div>
                    
                    {/* New Search Bar */}
                    <button
                        onClick={() => setActiveTab('search')}
                        className="w-full flex items-center gap-3 bg-white rounded-2xl py-3 px-4 shadow-[0_4px_16px_-4px_rgba(0,0,0,0.04)] border border-slate-100 active:scale-[0.98] transition-all text-left"
                    >
                        <Search className="w-5 h-5 text-primary opacity-60" />
                        <span className="text-sm font-bold text-muted-foreground">Search for services, repairs ...</span>
                    </button>
                </div>

                {/* Promotional Banners Section: Strictly aligned layout */}
                <div className="pt-0">
                    <Carousel
                        setApi={setApi}
                        plugins={[Autoplay({ delay: 4000 })]}
                        className="w-full px-4"
                        opts={{ align: "start", loop: true }}
                    >
                        <CarouselContent>
                            {banners.map((banner, index) => (
                                <CarouselItem key={index} className="basis-full">
                                    <Card className="overflow-hidden border-none shadow-xl rounded-[2rem] bg-slate-100 aspect-video relative flex items-center justify-center active:scale-[0.98] transition-transform group">
                                        {bannerError[index] ? (
                                            <div className="w-full h-full bg-secondary flex items-center justify-center text-muted-foreground text-xs font-bold">Image Unavailable</div>
                                        ) : (
                                            <div className="relative w-full h-full flex items-center justify-center">
                                                <Image 
                                                    src={banner.url} 
                                                    alt={banner.alt} 
                                                    fill 
                                                    className="object-contain w-full h-full transition-transform duration-700 group-hover:scale-105"
                                                    referrerPolicy="no-referrer"
                                                    onError={() => setBannerError(prev => ({ ...prev, [index]: true }))}
                                                />
                                            </div>
                                        )}
                                    </Card>
                                </CarouselItem>
                            ))}
                        </CarouselContent>
                    </Carousel>
                    <div className="flex justify-center items-center gap-1 mt-3">
                        {Array.from({ length: count }).map((_, index) => (
                            <div
                                key={index}
                                className={cn(
                                    "h-1 rounded-full transition-all duration-500",
                                    current === index ? "w-4 bg-primary" : "w-1 bg-muted"
                                )}
                            />
                        ))}
                    </div>
                </div>
            </div>

            {/* UPGRADE: Top Services scrollbar-hidden section */}
            <section className="space-y-3 px-4">
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 pl-1">
                    Top Services
                </h3>
                <div className="flex gap-4 overflow-x-auto no-scrollbar pb-1.5 px-1">
                    {topMinimalServices.map((item, idx) => {
                        const IconComponent = item.icon;
                        return (
                            <button
                                key={idx}
                                onClick={() => router.push(`/search?service=${encodeURIComponent(item.service)}`)}
                                className="flex flex-col items-center gap-1.5 shrink-0 group active:scale-95 transition-all text-center"
                            >
                                <div className={cn("w-14 h-14 rounded-full border flex items-center justify-center transition-all bg-white group-hover:shadow-sm", item.color)}>
                                    <IconComponent className="w-5 h-5 shrink-0" />
                                </div>
                                <span className="text-[10px] font-extrabold text-slate-700">
                                    {item.name}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </section>

            {/* Popular Services Grid */}
            <section className="space-y-3 px-4 mt-6">
                <div className="flex justify-between items-end pl-1">
                    <h2 className="text-base font-black tracking-tight text-slate-800">Popular Services</h2>
                </div>
                <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-3">
                    {topServices.map(service => {
                        return (
                            <Link 
                                href={`/book/${service.name.toLowerCase()}`} 
                                key={service.name} 
                                className={cn(
                                    "flex flex-col items-center gap-1.5 group active:scale-90 transition-all text-center"
                                )}
                            >
                                <div className="aspect-square w-full bg-white rounded-2xl flex items-center justify-center transition-all duration-300 group-hover:bg-primary/5 border border-slate-100 shadow-sm overflow-hidden p-0 relative">
                                    {service.imageUrl && !imageError[service.name] ? (
                                        <Image 
                                            src={service.imageUrl} 
                                            alt={service.name} 
                                            width={80} 
                                            height={80} 
                                            className="w-full h-full object-contain p-2" 
                                            onError={() => setImageError(prev => ({ ...prev, [service.name]: true }))}
                                        />
                                    ) : (
                                        <service.icon className="w-1/2 h-1/2 text-primary" />
                                    )}
                                </div>
                                <span className={cn(
                                    "text-[10px] font-black text-slate-700 leading-tight line-clamp-1 truncate w-full"
                                )}>
                                    {service.name}
                                </span>
                            </Link>
                        )
                    })}
                </div>
            </section>

            {/* UPGRADE: Top Experts Near You slide list */}
            {sortedHomeExperts.length > 0 && (
                <section className="space-y-3 px-4 mt-6">
                    <div className="flex justify-between items-center pl-1">
                        <h2 className="text-base font-black tracking-tight text-slate-800">Top Experts Near You</h2>
                    </div>
                    <div className="flex gap-4 overflow-x-auto no-scrollbar pb-3 px-1">
                        {sortedHomeExperts.map((expert) => {
                            const initial = expert.name?.trim().split(/\s+/).map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'EX';
                            return (
                                <div 
                                    key={expert.id}
                                    onClick={() => router.push(`/experts/${expert.id}`)}
                                    className="w-40 bg-white border border-slate-100 shadow-sm rounded-[2rem] p-4 shrink-0 flex flex-col items-center text-center cursor-pointer hover:border-primary/20 hover:shadow-md active:scale-95 transition-all group"
                                >
                                    {/* Avatar/Badge representation */}
                                    <div className="relative mb-3">
                                        <div className="w-16 h-16 rounded-[1.75rem] bg-slate-50 border border-slate-100 overflow-hidden flex items-center justify-center relative">
                                            {expert.profilePictureUrl ? (
                                                <Image 
                                                    src={expert.profilePictureUrl} 
                                                    alt={expert.name} 
                                                    width={64} 
                                                    height={64}
                                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform" 
                                                    referrerPolicy="no-referrer"
                                                />
                                            ) : (
                                                <span className="text-sm font-black text-primary">{initial}</span>
                                            )}
                                        </div>
                                        {expert.isVerified && (
                                            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-primary text-white text-[9px] font-black rounded-full flex items-center justify-center border-2 border-white">
                                                ✓
                                            </div>
                                        )}
                                    </div>
                                    
                                    <h4 className="text-xs font-black text-slate-805 line-clamp-1 truncate w-full group-hover:text-primary transition-colors">
                                        {expert.name}
                                    </h4>
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest line-clamp-1 mt-0.5 mt-1 truncate w-full">
                                        {expert.title || expert.serviceType}
                                    </p>
                                    
                                    <div className="flex flex-col items-center gap-1 mt-3 w-full bg-slate-50 rounded-2xl p-2 border border-slate-100/50">
                                        <div className="flex items-center gap-1">
                                            <span className="text-amber-500 text-xs">★</span>
                                            <span className="text-[10px] font-black">{expert.rating || 'New'}</span>
                                        </div>
                                        <span className="text-[10px] font-extrabold text-primary whitespace-nowrap">
                                            📍 {expert.calculatedDistance ? `${expert.calculatedDistance.toFixed(1)} km away` : 'Nearby'}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </section>
            )}

            <p className="text-center text-xs font-medium text-slate-400 px-5 mt-6 mb-10">
                The more you book, the more services we will bring.
            </p>
        </div>
    );
}
