'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { getExperts } from '@/services/expert-service';
import type { Expert } from '@/lib/types';
import { ExpertCard } from '@/components/expert-card';
import { ChevronLeft, Sparkles, Loader2, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FindingServiceScreen } from '@/components/location/finding-service-screen';
import { type QueryDocumentSnapshot } from 'firebase/firestore';
import { useLocationStore } from '@/lib/location-store';
import { getDistance } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { ExpertCardSkeleton } from '@/components/skeletons/expert-card-skeleton';

function SearchResults() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const service = searchParams.get('service');
    const problem = searchParams.get('problem');

    const [experts, setExperts] = useState<Expert[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [lastVisible, setLastVisible] = useState<QueryDocumentSnapshot | undefined>(undefined);
    const [hasMore, setHasMore] = useState(true);
    const [showRadar, setShowRadar] = useState(false);

    const { lat, lng } = useLocationStore();

    useEffect(() => {
        if (!service) {
            setExperts([]);
            setLoading(false);
            setShowRadar(false);
            return;
        }
        
        setShowRadar(true);
        setLoading(true);

        const radarTimer = setTimeout(() => {
            setShowRadar(false);
        }, 3000);

        async function fetchInitialExperts() {
            try {
                const userLocation = lat && lng ? { lat, lng } : { lat: 34.0837, lng: 74.7973 };
                const result = await getExperts({
                    serviceType: service!,
                    userLocation: userLocation,
                    limitCount: 20,
                });
                setExperts(result.experts);
                setLastVisible(result.lastVisible);
                setHasMore(result.experts.length === 20);
            } catch (error) {
                console.error("Error loading experts on deep link search", error);
            } finally {
                setLoading(false);
            }
        }

        fetchInitialExperts();

        return () => {
            clearTimeout(radarTimer);
        };
    }, [service, lat, lng]);

    const loadMore = async () => {
        setLoadingMore(true);
        const userLocation = lat && lng ? { lat, lng } : { lat: 34.0837, lng: 74.7973 };
        
        try {
            const result = await getExperts({
                serviceType: service!,
                userLocation: userLocation,
                limitCount: 5,
            }, lastVisible);
            
            setExperts(prev => [...prev, ...result.experts]);
            setLastVisible(result.lastVisible);
            setHasMore(result.experts.length === 5);
        } catch (error) {
            console.error(error);
        } finally {
            setLoadingMore(false);
        }
    };
    
    const serviceDisplayName = service ? service.split(' ').map(w => w ? w.charAt(0).toUpperCase() + w.slice(1) : '').join(' ') : 'this service';
    
    // Sort experts client-side by exact Haversine distance
    const sortedExperts = [...experts].sort((a, b) => {
        const userLat = lat || 34.0837;
        const userLng = lng || 74.7973;
        const distA = getDistance(userLat, userLng, a.currentLocation?.lat || 0, a.currentLocation?.lng || 0);
        const distB = getDistance(userLat, userLng, b.currentLocation?.lat || 0, b.currentLocation?.lng || 0);
        return distA - distB;
    });

    if (showRadar) {
        return <FindingServiceScreen serviceName={serviceDisplayName} />;
    }

    return (
        <div className="w-full px-5 py-6 max-w-2xl mx-auto space-y-5 animate-in fade-in duration-300 pb-20 font-sans">
            <div className="flex items-center gap-3">
                <Button 
                    variant="ghost" 
                    size="icon" 
                    className="rounded-full bg-slate-100 hover:bg-slate-200" 
                    onClick={() => router.push('/')}
                >
                    <ChevronLeft className="w-5 h-5 text-slate-700" />
                </Button>
                <div>
                    <h2 className="text-lg font-black tracking-tight text-slate-900 leading-none">
                        {serviceDisplayName} Experts
                    </h2>
                    <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider mt-1">
                        Srinagar Local Services
                    </p>
                </div>
            </div>
            
            {/* Found Banner */}
            {!loading && experts.length > 0 && (
                <div className="flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-teal-500/[0.06] border border-teal-500/10 text-[11px] font-extrabold text-teal-800 tracking-wide w-full justify-center shadow-sm backdrop-blur-[2px] animate-in fade-in duration-300">
                    <div className="relative flex h-2 w-2 shrink-0">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-500"></span>
                    </div>
                    <span>We found {experts.length} verified {experts.length === 1 ? 'expert' : 'experts'} near you</span>
                </div>
            )}

            {/* Core Dynamic Window Container */}
            <div className="w-full">
                {sortedExperts.length > 0 ? (
                    <div className="grid grid-cols-1 gap-4">
                        {sortedExperts.map(expert => (
                            <ExpertCard key={expert.id} expert={expert} problem={problem ?? undefined} />
                        ))}
                    </div>
                ) : (
                    /* Clean Premium Empty State Window */
                    <div className="flex flex-col items-center justify-center text-center py-12 px-4 min-h-[50vh] w-full bg-white border border-slate-100/80 rounded-3xl shadow-sm animate-in fade-in duration-300">
                        <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 mb-6">
                            <MapPin className="w-8 h-8 opacity-60" />
                        </div>
                        <h2 className="text-lg font-black tracking-tight mb-2 text-slate-800">
                            Service Area Verification
                        </h2>
                        
                        <p className="text-slate-500 font-bold max-w-xs leading-relaxed text-xs">
                            No verified {serviceDisplayName} experts are currently online in your location at this moment. Please check again in a few moments, or select a different area from the top picker.
                        </p>
                        
                        <Button 
                            onClick={() => router.push('/')} 
                            className="mt-6 h-11 px-6 rounded-xl font-black bg-primary text-primary-foreground shadow-sm hover:bg-primary/95 transition-all hover:scale-[1.02] active:scale-95 text-xs uppercase tracking-widest"
                        >
                            Return to Home
                        </Button>
                    </div>
                )}
            </div>

            {/* Pagination Layer */}
            {hasMore && experts.length > 0 && (
                <div className="flex justify-center mt-6">
                    <Button 
                        onClick={loadMore} 
                        disabled={loadingMore} 
                        className="h-12 w-full rounded-2xl font-black uppercase tracking-widest text-xs" 
                        size="lg"
                    >
                        {loadingMore ? <Loader2 className="w-4 h-4 animate-spin" /> : "Load More"}
                    </Button>
                </div>
            )}
        </div>
    );
}

export default function SearchPage() {
    return (
        <Suspense fallback={
            <div className="p-5 space-y-4 max-w-2xl mx-auto font-sans">
                <div className="flex items-center gap-3 mb-6">
                    <Skeleton className="w-10 h-10 rounded-full" />
                    <Skeleton className="h-8 w-32" />
                </div>
                {[1, 2, 3].map(i => <ExpertCardSkeleton key={i} />)}
            </div>
        }>
            <SearchResults />
        </Suspense>
    );
}
