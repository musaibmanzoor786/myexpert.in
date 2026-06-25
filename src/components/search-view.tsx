'use client';

import { SearchInterface } from '@/components/search-interface';
import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { getExperts } from '@/services/expert-service';
import type { Expert } from '@/lib/types';
import { ExpertCard } from '@/components/expert-card';
import { Sparkles, Loader2, ChevronDown, ChevronLeft, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FindingServiceScreen } from '@/components/location/finding-service-screen';
import { type QueryDocumentSnapshot } from 'firebase/firestore';
import { useLocationStore } from '@/lib/location-store';
import { getDistance } from '@/lib/utils';

export function SearchView() {
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
    const [showAll, setShowAll] = useState(false);

    const { lat, lng } = useLocationStore();

    // Trigger radar and expert load whenever service query param changes
    useEffect(() => {
        if (!service) {
            setExperts([]);
            setLoading(false);
            setShowRadar(false);
            return;
        }

        setShowRadar(true);
        setLoading(true);

        // Run the radar animation smoothly for exactly 3 seconds
        const radarTimer = setTimeout(() => {
            setShowRadar(false);
        }, 3000);

        // Fetch experts silently in parallel
        async function loadExperts() {
            try {
                // Use global coordinates or default Srinagar fallback coordinates (34.0837, 74.7973)
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
                console.error("Error loading experts silently:", error);
            } finally {
                setLoading(false);
            }
        }

        loadExperts();

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
        } catch (e) {
            console.error(e);
        } finally {
            setLoadingMore(false);
        }
    };
    
    const serviceDisplayName = service ? service.split(' ').map(w => w ? w.charAt(0).toUpperCase() + w.slice(1) : '').join(' ') : 'this service';
    
    // Sort experts entirely by distance using the saved global coordinates
    const sortedExperts = [...experts].sort((a, b) => {
        const userLat = lat || 34.0837;
        const userLng = lng || 74.7973;
        const distA = getDistance(userLat, userLng, a.currentLocation?.lat || 0, a.currentLocation?.lng || 0);
        const distB = getDistance(userLat, userLng, b.currentLocation?.lat || 0, b.currentLocation?.lng || 0);
        return distA - distB;
    });

    if (!service) {
        return <SearchInterface />;
    }

    if (showRadar) {
        return <FindingServiceScreen serviceName={serviceDisplayName} />;
    }

    const displayedExperts = showAll ? sortedExperts : sortedExperts.slice(0, 5);

    return (
        <div className="w-full px-5 py-4 max-w-2xl mx-auto space-y-5 animate-in fade-in duration-500 pb-24 font-sans">
            
            {/* Header / Back Action */}
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
                <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-primary/10 text-primary border border-primary/10 text-xs font-black uppercase tracking-widest w-full justify-center">
                    <Sparkles className="w-4 h-4 fill-current animate-pulse" />
                    We found {experts.length} verified {experts.length === 1 ? 'expert' : 'experts'} near you
                </div>
            )}

            {/* Listing Layer */}
            <div className="w-full space-y-4">
                {sortedExperts.length > 0 ? (
                    <div className="flex flex-col gap-4">
                        {displayedExperts.map(expert => (
                            <ExpertCard key={expert.id} expert={expert} problem={problem ?? undefined} />
                        ))}

                        {!showAll && sortedExperts.length > 5 && (
                            <Button 
                                variant="outline" 
                                onClick={() => setShowAll(true)}
                                className="h-12 w-full rounded-2xl font-black border-primary text-primary hover:bg-primary/5 active:scale-95 transition-all text-xs uppercase tracking-widest"
                            >
                                See More Experts
                                <ChevronDown className="ml-1.5 w-4 h-4" />
                            </Button>
                        )}
                        
                        {showAll && hasMore && (
                            <Button 
                                onClick={loadMore} 
                                disabled={loadingMore} 
                                className="h-12 w-full rounded-2xl font-black uppercase tracking-widest text-xs" 
                                size="lg"
                            >
                                {loadingMore ? <Loader2 className="w-4 h-4 animate-spin" /> : "Load More"}
                            </Button>
                        )}
                    </div>
                ) : (
                    /* Clean premium empty state that replaces "We're expanding" placeholders */
                    <div className="flex flex-col items-center justify-center text-center py-12 px-4 min-h-[50vh] w-full bg-white border border-slate-100/80 rounded-3xl shadow-sm animate-in fade-in duration-500">
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
                            Back to Home
                        </Button>
                    </div>
                )}
            </div>

            {/* Pagination Loading indicator */}
            {hasMore && experts.length > 0 && !showAll && (
                <div className="flex justify-center mt-4">
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
