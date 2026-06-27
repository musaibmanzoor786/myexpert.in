'use client';

import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { 
    Search, Loader2, ChevronDown, Bell, MapPin, 
    ShieldCheck, ArrowRight, Wind, Sparkles as SparklesIcon, 
    Wrench as WrenchIcon, Zap as ZapIcon, Hammer as HammerIcon, 
    PaintRoller as PaintRollerIcon, ChefHat as ChefHatIcon, Star,
    Cctv as CctvIcon, GraduationCap, Award, Clock
} from "lucide-react";
import { getCachedServices } from '@/services/service-cache';
import { useAuth } from '@/context/auth-context';
import { Card, CardContent } from '@/components/ui/card';
import { ExpertHome } from './expert-home';
import Link from 'next/link';
import placeholderImages from '@/lib/placeholder-images.json';
import { Carousel, CarouselContent, CarouselItem, type CarouselApi } from '@/components/ui/carousel';
import { cn, getDistance } from '@/lib/utils';
import { whyChooseUsData } from '@/lib/constants';
import { useLocationStore } from '@/lib/location-store';
import { useRouter } from 'next/navigation';
import Autoplay from 'embla-carousel-autoplay';
import { Avatar, AvatarFallback } from './ui/avatar';
import { getServicesAvailability } from '@/services/expert-service';
import { updateUserLocationAndAddress } from '@/services/user-service';
import { UnserviceableArea } from '@/components/unserviceable-area';
import type { Expert, Service } from '@/lib/types';
import { ExpertCard } from './expert-card';
import Image from 'next/image';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { handleFirestoreError, OperationType } from '@/firebase/errors';

const INITIAL_QUICK_SERVICES = [
    { id: 'electrician', name: 'Electrician', service: 'Electrician', iconName: 'Zap', color: 'bg-amber-500/[0.06] border-amber-500/10 text-amber-600', clicks: 0 },
    { id: 'plumber', name: 'Plumber', service: 'Plumber', iconName: 'Wrench', color: 'bg-blue-500/[0.06] border-blue-500/10 text-blue-600', clicks: 0 },
    { id: 'ac', name: 'AC Service', service: 'Electrician', iconName: 'Wind', color: 'bg-teal-500/[0.06] border-teal-500/10 text-teal-600', clicks: 0 },
    { id: 'clean', name: 'Deep Clean', service: 'Painter', iconName: 'Sparkles', color: 'bg-emerald-500/[0.06] border-emerald-500/10 text-emerald-600', clicks: 0 },
    { id: 'carpenter', name: 'Carpenter', service: 'Carpenter', iconName: 'Hammer', color: 'bg-orange-500/[0.06] border-orange-500/10 text-orange-700', clicks: 0 },
    { id: 'painter', name: 'Painter', service: 'Painter', iconName: 'PaintRoller', color: 'bg-sky-500/[0.06] border-sky-500/10 text-sky-600', clicks: 0 },
    { id: 'cook', name: 'Home Cook', service: 'Cook', iconName: 'ChefHat', color: 'bg-rose-500/[0.06] border-rose-500/10 text-rose-500', clicks: 0 },
    { id: 'cctv', name: 'CCTV Setup', service: 'Electrician', iconName: 'Cctv', color: 'bg-violet-500/[0.06] border-violet-500/10 text-violet-600', clicks: 0 },
];

const getQuickServiceIcon = (iconName: string) => {
    switch (iconName) {
        case 'Wind': return Wind;
        case 'Sparkles': return SparklesIcon;
        case 'Wrench': return WrenchIcon;
        case 'Zap': return ZapIcon;
        case 'Hammer': return HammerIcon;
        case 'PaintRoller': return PaintRollerIcon;
        case 'ChefHat': return ChefHatIcon;
        case 'Cctv': return CctvIcon;
        default: return ZapIcon;
    }
};

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
    const [lastVisibleExpert, setLastVisibleExpert] = useState<any>(undefined);
    const [hasMoreExperts, setHasMoreExperts] = useState(false);
    const [loadingMoreExperts, setLoadingMoreExperts] = useState(false);
    
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

    // Load available experts near customer in real-time
    useEffect(() => {
        if (authLoading || !userProfile || userProfile.role !== 'customer') return;

        setLoadingMoreExperts(true);
        const path = 'experts';
        const expertsQuery = query(collection(db, path));
        
        const unsubscribe = onSnapshot(expertsQuery, (snap) => {
            let expertsList = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Expert));
            
            // Ignore offline experts completely and ensure they are verified (or historically undefined)
            expertsList = expertsList.filter(e => e.isVerified !== false && (e.isActive || e.online || e.workingNow || e.status === 'online' || e.status === 'busy'));

            setNearbyExperts(expertsList);
            setLoadingMoreExperts(false);
        }, (err) => {
            try {
                handleFirestoreError(err, OperationType.LIST, path);
            } catch (e) {
                console.error("Real-time experts collection error:", e);
            }
            setLoadingMoreExperts(false);
        });

        return () => unsubscribe();
    }, [authLoading, userProfile]);

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
            .sort((a, b) => a.calculatedDistance - b.calculatedDistance)
            .slice(0, 10);
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

            {/* UPGRADE: Top Services side scrollbar-hidden section */}
            <section className="space-y-2 px-4">
                <div className="flex justify-between items-center pl-1">
                    <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-400">
                        Quick Shortcuts
                    </h3>
                </div>
                
                <div className="flex gap-2.5 overflow-x-auto no-scrollbar pb-2 px-1">
                    {INITIAL_QUICK_SERVICES.map((item) => {
                        const IconComponent = getQuickServiceIcon(item.iconName);
                        
                        return (
                            <button
                                key={item.id}
                                onClick={() => router.push(`/search?service=${encodeURIComponent(item.service)}`)}
                                className="flex flex-col items-center gap-1.5 p-1.5 w-[68px] shrink-0 rounded-[1rem] bg-white border border-slate-100 hover:border-primary/20 active:scale-95 transition-all text-center relative group shadow-sm"
                            >
                                <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center transition-all group-hover:scale-105", item.color)}>
                                    <IconComponent className="w-4.5 h-4.5 shrink-0 stroke-[2.2]" />
                                </div>
                                <span className="text-[9px] font-black text-slate-700 leading-tight truncate w-full px-0.5">
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
                <div className="grid grid-cols-3 gap-3">
                    {topServices.map(service => {
                        return (
                            <Link 
                                href={`/book/${service.name.toLowerCase()}`} 
                                key={service.name} 
                                className={cn(
                                    "flex flex-col items-center gap-1.5 group transition-all text-center"
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

            {/* UPGRADE: Top Experts Near You section */}
            <section className="space-y-3 px-4 mt-6">
                <div className="flex justify-between items-center pl-1">
                    <h2 className="text-base font-black tracking-tight text-slate-800">Top Experts Near You</h2>
                </div>

                {/* Skeletons/Loaders for initial loading */}
                {loadingMoreExperts && sortedHomeExperts.length === 0 ? (
                    <div className="space-y-3">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="flex gap-4 p-4 bg-white border border-slate-100 rounded-[2rem] animate-pulse shadow-sm">
                                <div className="w-16 h-16 bg-slate-100 rounded-[1.5rem] shrink-0" />
                                <div className="flex-1 space-y-2 py-1">
                                    <div className="h-4 bg-slate-100 rounded w-1/3" />
                                    <div className="h-3 bg-slate-100 rounded w-1/2" />
                                    <div className="h-3 bg-slate-100 rounded w-1/4" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : sortedHomeExperts.length > 0 ? (
                    <div className="flex gap-3 overflow-x-auto no-scrollbar pb-3 px-1 snap-x snap-mandatory">
                        {sortedHomeExperts.map((expert) => {
                            const isBusy = expert.status === 'busy';
                            const initial = expert.name?.trim().split(/\s+/).map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'EX';
                            return (
                                <Card 
                                    key={expert.id}
                                    onClick={() => {
                                        if (!isBusy) {
                                            if (typeof window !== 'undefined') {
                                                sessionStorage.setItem(`expert_profile_${expert.id}`, JSON.stringify(expert));
                                            }
                                            router.push(`/experts/${expert.id}`);
                                        }
                                    }}
                                    className={cn(
                                        "w-[calc(50%-6px)] min-w-[155px] snap-start shrink-0 overflow-hidden border border-slate-100 bg-white shadow-sm transition-all duration-300 rounded-[1.5rem]",
                                        isBusy 
                                            ? "opacity-60 saturate-50 cursor-not-allowed" 
                                            : "hover:shadow-md hover:border-primary/20 cursor-pointer"
                                    )}
                                >
                                    <CardContent className="p-3 flex flex-col items-center text-center space-y-2">
                                        {/* Avatar with status/busy badge */}
                                        <div className="relative">
                                            <div className="w-14 h-14 rounded-[1.25rem] bg-slate-50 border border-slate-100 overflow-hidden flex items-center justify-center">
                                                {expert.profilePictureUrl ? (
                                                    <Image 
                                                        src={expert.profilePictureUrl} 
                                                        alt={expert.name} 
                                                        width={56} 
                                                        height={56}
                                                        className="w-full h-full object-cover" 
                                                        referrerPolicy="no-referrer"
                                                    />
                                                ) : (
                                                    <span className="text-xs font-black text-primary">{initial}</span>
                                                )}
                                            </div>
                                            {/* Status Badge */}
                                            <div className={cn(
                                                "absolute -bottom-1 -right-1 px-1.5 py-0.5 rounded-full text-[8px] font-black uppercase text-white border border-white shadow-sm",
                                                isBusy ? "bg-orange-500" : "bg-green-500"
                                            )}>
                                                {isBusy ? 'Busy' : 'Online'}
                                            </div>
                                        </div>

                                        {/* Name & Title */}
                                        <div className="w-full">
                                            <h4 className="text-xs font-black text-slate-800 line-clamp-1 truncate">
                                                {expert.name}
                                            </h4>
                                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest line-clamp-1 mt-0.5 truncate">
                                                {expert.title || (Array.isArray(expert.serviceType) ? expert.serviceType[0] : expert.serviceType)}
                                            </p>
                                        </div>

                                        {/* Rating & Distance */}
                                        <div className="flex items-center justify-center gap-2 w-full text-[9px] font-bold text-slate-500">
                                            <div className="flex items-center gap-0.5">
                                                <Star className="w-3 h-3 text-amber-500 fill-current" />
                                                <span>{expert.rating || 'New'}</span>
                                            </div>
                                            <span>•</span>
                                            <span className="text-primary truncate max-w-[80px]">
                                                {expert.calculatedDistance ? `${expert.calculatedDistance.toFixed(1)} km` : 'Nearby'}
                                            </span>
                                        </div>

                                        {/* Action button */}
                                        <Button 
                                            variant={isBusy ? "secondary" : "default"}
                                            disabled={isBusy}
                                            className="w-full h-8 text-[10px] font-black uppercase tracking-wider rounded-xl py-1 mt-1"
                                        >
                                            {isBusy ? 'Busy' : 'Book Now'}
                                        </Button>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                ) : (
                    <p className="text-center text-xs font-medium text-slate-400 py-6 bg-white border border-slate-100 rounded-[2rem] shadow-sm">
                        No nearby active experts found.
                    </p>
                )}
            </section>



            {/* Why Choose Us */}
            <div className="border-b border-slate-100 p-5 space-y-4">
                {/* Heading & Subheading */}
                <div className="space-y-1 pl-1">
                    <h3 className="text-sm font-black text-slate-800 tracking-tight">Why Choose Us?</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        Verified experts for every service you need.
                    </p>
                </div>

                {/* 3 columns of visual cards showing experts and text below them */}
                <div className="grid grid-cols-3 gap-6">
                    {whyChooseUsData.map((item, index) => (
                        <div key={index} className="flex flex-col items-center space-y-3">
                            <div className="w-full aspect-[2/3] rounded-[2rem] overflow-hidden border border-slate-100 relative bg-slate-50 shadow-inner">
                                <Image 
                                    src={item.imageUrl} 
                                    alt={item.title} 
                                    fill
                                    className="object-cover"
                                    referrerPolicy="no-referrer"
                                />
                            </div>
                            <p className="text-[10px] font-black text-slate-600 text-center leading-snug">
                                {item.title}: {item.description}
                            </p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Brand Promo Banner */}
            <div className="py-8 flex flex-col items-center">
                {/* Brand Name */}
                <div className="text-center z-10 mb-2">
                    <span className="text-5xl font-black text-primary tracking-tight block">MyExpert</span>
                    <span className="text-sm font-bold text-slate-600 mt-1 block">
                        Trusted Experts for Everyday Needs
                    </span>
                </div>

                {/* Three core pillars */}
                <div className="w-[90%] mx-auto mt-6 bg-slate-100 rounded-2xl p-4 flex justify-between items-center z-10 border border-slate-200">
                    <div className="flex flex-col items-center text-center space-y-2">
                        <ShieldCheck className="w-6 h-6 text-primary" />
                        <span className="text-xs font-black text-slate-700">Verified</span>
                    </div>
                    <div className="flex flex-col items-center text-center space-y-2">
                        <HammerIcon className="w-6 h-6 text-primary" />
                        <span className="text-xs font-black text-slate-700">Skilled</span>
                    </div>
                    <div className="flex flex-col items-center text-center space-y-2">
                        <Clock className="w-6 h-6 text-primary" />
                        <span className="text-xs font-black text-slate-700">Reliable</span>
                    </div>
                </div>
            </div>

            <p className="text-center text-xs font-medium text-slate-400 px-5 mt-6 mb-10">
                The more you book, the more services we will bring.
            </p>
        </div>
    );
}
