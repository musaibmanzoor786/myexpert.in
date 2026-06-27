
'use client';

import { getExpertById } from '@/services/expert-service';
import { getExpertReviewsPaginated } from '@/services/review-service';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
    MapPin, User, ShieldCheck, BadgeCheck, ArrowLeft, Star, CheckCircle2, MessageSquare, Award, Loader2
} from 'lucide-react';
import type { Expert, Review } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { useEffect, useState, useMemo } from 'react';
import { BookingConfirmationModal } from '@/components/booking-confirmation-modal';
import { useAuth } from '@/context/auth-context';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { cn, getDistance } from '@/lib/utils';
import { useLocationStore } from '@/lib/location-store';
import { ExpertProfileSkeleton } from '@/components/skeletons/expert-profile-skeleton';
import { Skeleton } from '@/components/ui/skeleton';

export default function ExpertProfilePage() {
  const params = useParams();
  const id = params.id as string;
  const { user } = useAuth();
  const router = useRouter();

  const [expert, setExpert] = useState<Expert | null>(() => {
    if (typeof window !== 'undefined' && id) {
      const cached = sessionStorage.getItem(`expert_profile_${id}`);
      if (cached) {
        try {
          return JSON.parse(cached);
        } catch (e) {
          return null;
        }
      }
    }
    return null;
  });
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(() => !expert);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [reviewsLoaded, setReviewsLoaded] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [lastVisibleReview, setLastVisibleReview] = useState<any>(undefined);
  const [hasMoreReviews, setHasMoreReviews] = useState(false);
  
  const { lat, lng } = useLocationStore();

  const calculatedDistance = useMemo(() => {
    const latVal = lat || 34.0837; // fallback to Srinagar
    const lngVal = lng || 74.7973;
    if (expert?.currentLocation?.lat && expert?.currentLocation?.lng) {
      return getDistance(latVal, lngVal, expert.currentLocation.lat, expert.currentLocation.lng);
    }
    return null;
  }, [lat, lng, expert?.currentLocation]);
  
  useEffect(() => {
    if (!id) return;
    async function fetchData() {
        try {
            if (!expert) {
                setLoading(true);
            }
            const expertData = await getExpertById(id);
            
            if (expertData) {
              setExpert(expertData);
              if (typeof window !== 'undefined') {
                sessionStorage.setItem(`expert_profile_${id}`, JSON.stringify(expertData));
              }
              // Auto load first 3 reviews
              setLoadingReviews(true);
              const res = await getExpertReviewsPaginated(id, 3);
              setReviews(res.reviews);
              setLastVisibleReview(res.lastVisible);
              setHasMoreReviews(res.reviews.length === 3);
              setReviewsLoaded(true);
            } else {
              setNotFound(true);
            }
        } catch (error) {
            console.error("Failed to fetch expert data", error);
            setNotFound(true);
        } finally {
            setLoading(false);
            setLoadingReviews(false);
        }
    }
    fetchData();
  }, [id]);

  const handleLoadMoreReviews = async () => {
    if (loadingReviews || !hasMoreReviews) return;
    setLoadingReviews(true);
    try {
        const res = await getExpertReviewsPaginated(id, 3, lastVisibleReview);
        setReviews(prev => [...prev, ...res.reviews]);
        setLastVisibleReview(res.lastVisible);
        setHasMoreReviews(res.reviews.length === 3);
    } catch (error) {
        console.error("Failed to fetch reviews", error);
    } finally {
        setLoadingReviews(false);
    }
  };
  
  const handleBookClick = () => {
    if (!user) {
        router.push('/login');
        return;
    }
    setIsModalOpen(true);
  }

  if (notFound) {
    return (
        <div className="text-center py-20 animate-in fade-in duration-500">
            <h1 className="text-2xl font-bold">Expert Not Found</h1>
            <p className="text-muted-foreground mt-2">The profile you are looking for does not exist or is no longer available.</p>
            <Button asChild className="mt-6">
                <Link href="/">Go to Homepage</Link>
            </Button>
        </div>
    )
  }

  const isAvailable = expert?.isActive;
  const isBusy = expert?.status === 'busy';

  return (
    <>
        <div className="relative animate-in fade-in duration-500 w-full max-w-2xl mx-auto pb-36">
             {/* Sticky Navigation Header */}
             <div className="absolute top-6 left-4 z-30 bg-transparent">
                <Button 
                    variant="ghost" 
                    size="icon" 
                    className="bg-white/90 hover:bg-white text-slate-800 backdrop-blur-md rounded-full shadow-md h-10 w-10 border border-slate-100 active:scale-90 transition-transform"
                    onClick={() => window.history.length > 2 ? router.back() : router.push('/')}
                >
                    <ArrowLeft className="w-5 h-5 stroke-[2.5]" />
                </Button>
            </div>

            <div className="space-y-6">
                {loading ? (
                    <ExpertProfileSkeleton />
                ) : !expert ? null : (
                    <div className="animate-in fade-in slide-in-from-bottom-3 duration-700">
                        {/* Hero Profile Section */}
                        <div className="relative pt-16 pb-8 px-5 bg-gradient-to-b from-primary/[0.08] via-primary/[0.02] to-transparent text-center border-b border-slate-100/60">
                            {/* Decorative Top Accent */}
                            <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-primary via-teal-400 to-amber-400" />
                            
                            <div className="relative w-32 h-32 mx-auto mb-5">
                                <div className="absolute inset-0 rounded-[2.5rem] bg-gradient-to-tr from-primary to-teal-400 animate-pulse opacity-25 blur-sm" />
                                <div className="relative w-full h-full rounded-[2.5rem] p-1 bg-white shadow-xl">
                                    {expert.profilePictureUrl ? (
                                        <Image 
                                            src={expert.profilePictureUrl}
                                            alt={expert.name}
                                            width={120}
                                            height={120}
                                            className="rounded-[2.25rem] w-full h-full object-cover"
                                            onError={(e) => e.currentTarget.style.display = 'none'}
                                        />
                                    ) : (
                                        <div className="w-full h-full bg-slate-50 rounded-[2.25rem] flex items-center justify-center border border-slate-100">
                                            <span className="text-2xl font-black text-primary">
                                                {expert.name?.trim().split(/\s+/).map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                                            </span>
                                        </div>
                                    )}
                                </div>
                                {expert.isVerified && (
                                    <div className="absolute -bottom-1 -right-1 bg-teal-500 text-white rounded-2xl p-1.5 border-4 border-white shadow-md">
                                        <ShieldCheck className="w-4 h-4 fill-current stroke-[2.5]" />
                                    </div>
                                )}
                            </div>
                            
                            <h1 className="text-2xl font-black tracking-tight text-slate-800 leading-none flex items-center justify-center gap-1.5">
                                {expert.name}
                            </h1>
                            <p className="text-xs font-black text-primary uppercase tracking-widest mt-2 bg-primary/[0.04] border border-primary/10 inline-block px-3.5 py-1 rounded-full">
                                {expert.title || expert.serviceType}
                            </p>
                            
                            {/* Stats Cards Row */}
                            <div className="flex items-center justify-center gap-2.5 mt-5">
                                <div className="flex items-center gap-1.5 bg-amber-500/[0.08] text-amber-700 px-3 py-1.5 rounded-2xl text-[10px] font-black border border-amber-500/10">
                                    <Star className="w-3.5 h-3.5 fill-current text-amber-500" />
                                    <span>{expert.rating || 'New'}</span>
                                </div>
                                <div className="flex items-center gap-1.5 bg-teal-500/[0.08] text-teal-700 px-3 py-1.5 rounded-2xl text-[10px] font-black border border-teal-500/10">
                                    <CheckCircle2 className="w-3.5 h-3.5 stroke-[2.5]" />
                                    <span>{expert.reviewCount || 0} JOBS</span>
                                </div>
                                <div className="flex items-center gap-1.5 bg-slate-100 text-slate-700 px-3 py-1.5 rounded-2xl text-[10px] font-black border border-slate-200">
                                    <Award className="w-3.5 h-3.5" />
                                    <span>{expert.experience || '3'}+ YRS EXP</span>
                                </div>
                            </div>
                        </div>
                        
                        {/* Profile Details Sections */}
                        <div className="px-5 mt-6 space-y-6">
                            {/* Quick Details Cards Grid */}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="flex items-center gap-3 p-3.5 bg-slate-50/50 rounded-2xl border border-slate-100">
                                    <div className="bg-white p-2 rounded-xl shadow-sm border border-slate-100 shrink-0">
                                        <MapPin className="w-4 h-4 text-primary"/>
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-[9px] uppercase font-black tracking-widest text-slate-400 leading-none">Location</p>
                                        <p className="text-xs font-black mt-1 truncate text-slate-700">{expert.area || expert.location}</p>
                                        {calculatedDistance !== null && (
                                            <p className="text-[10px] text-primary font-black mt-0.5">
                                                📍 {calculatedDistance.toFixed(1)} km away
                                            </p>
                                        )}
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 p-3.5 bg-slate-50/50 rounded-2xl border border-slate-100">
                                    <div className="bg-white p-2 rounded-xl shadow-sm border border-slate-100 shrink-0">
                                        <span className="relative flex h-2 w-2">
                                            <span className={cn(
                                                "animate-ping absolute inline-flex h-full w-full rounded-full opacity-75",
                                                isBusy ? "bg-orange-400" : "bg-green-400"
                                            )}></span>
                                            <span className={cn(
                                                "relative inline-flex rounded-full h-2 w-2",
                                                isBusy ? "bg-orange-500" : "bg-green-500"
                                            )}></span>
                                        </span>
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-[9px] uppercase font-black tracking-widest text-slate-400 leading-none">Status</p>
                                        <p className={cn(
                                            "text-xs font-black mt-1 uppercase tracking-wider",
                                            isBusy ? "text-orange-600" : "text-green-600"
                                        )}>
                                            {isBusy ? 'Busy Now' : 'Available'}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* About Section */}
                            <section>
                                <h2 className="text-xs font-black mb-2.5 px-1 flex items-center gap-2 uppercase tracking-widest text-slate-400">
                                    <User className="w-3.5 h-3.5 text-primary" /> Profile Bio
                                </h2>
                                <Card className="rounded-[1.5rem] border border-slate-100 bg-white shadow-sm overflow-hidden">
                                    <CardContent className="p-5 relative">
                                        <div className="absolute top-3 right-4 text-slate-100/80 font-serif text-5xl pointer-events-none select-none">“</div>
                                        <p className="text-slate-600 leading-relaxed text-sm italic font-medium pr-6">
                                            {expert.summary || expert.bio || `Independent and certified professional providing top quality home service solutions. Dedicated to safety, timeliness, and total client satisfaction across Kashmir.`}
                                        </p>
                                    </CardContent>
                                </Card>
                            </section>

                            {/* Services Section */}
                            <section>
                                <h2 className="text-xs font-black mb-2.5 px-1 flex items-center gap-2 uppercase tracking-widest text-slate-400">
                                    <CheckCircle2 className="w-3.5 h-3.5 text-primary" /> Offered Services
                                </h2>
                                <div className="flex flex-wrap gap-2">
                                    {expert.services?.map((service, index) => (
                                        <Badge 
                                            key={index} 
                                            variant="secondary" 
                                            className="text-[11px] font-extrabold py-2 px-3.5 rounded-xl bg-white text-slate-700 border border-slate-100 hover:border-primary/20 transition-all shadow-none flex items-center gap-1.5"
                                        >
                                            <span className="w-1.5 h-1.5 rounded-full bg-primary/60" />
                                            {service.name}
                                        </Badge>
                                    ))}
                                </div>
                            </section>
                            
                            {/* Reviews Section */}
                            <section>
                                <div className="flex justify-between items-center mb-2.5 px-1">
                                    <h2 className="text-xs font-black flex items-center gap-2 uppercase tracking-widest text-slate-400">
                                        <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" /> Customer Reviews
                                    </h2>
                                    <span className="text-[9px] font-black text-slate-500 bg-slate-100 px-2 py-0.5 rounded-lg">
                                        {expert.reviewCount || 0} TOTAL
                                    </span>
                                </div>
                                
                                <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-500">
                                    {reviews.length > 0 ? (
                                        <>
                                            {reviews.map((review) => (
                                                <Card key={review.id} className="border border-slate-100 shadow-none bg-slate-50/20 rounded-2xl overflow-hidden">
                                                    <CardContent className="p-4 space-y-3">
                                                        <div className="flex justify-between items-start">
                                                            <div className="flex items-center gap-2.5">
                                                                <div className="w-8 h-8 rounded-xl bg-primary/[0.06] flex items-center justify-center text-primary font-black text-xs border border-primary/5">
                                                                    {review.customerName ? review.customerName.charAt(0).toUpperCase() : '?'}
                                                                </div>
                                                                <div>
                                                                    <p className="font-extrabold text-xs text-slate-700 leading-none">{review.customerName || 'Verified Customer'}</p>
                                                                    <p className="text-[9px] text-slate-400 uppercase font-bold tracking-tight mt-1">
                                                                        {review.createdAt && typeof review.createdAt.toDate === 'function' 
                                                                            ? formatDistanceToNow(review.createdAt.toDate(), { addSuffix: true }) 
                                                                            : 'Recently'}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-0.5 bg-amber-500/[0.04] px-1.5 py-0.5 rounded-lg border border-amber-500/5">
                                                                <Star className="w-2.5 h-2.5 fill-current text-amber-500" />
                                                                <span className="text-[10px] font-black text-amber-700">{review.rating}</span>
                                                            </div>
                                                        </div>
                                                        <p className="text-xs text-slate-600 leading-relaxed pl-1.5 border-l-2 border-slate-100">
                                                            "{review.comment}"
                                                        </p>
                                                    </CardContent>
                                                </Card>
                                            ))}
                                            {hasMoreReviews && (
                                                <div className="flex justify-center mt-4">
                                                    <Button 
                                                        onClick={handleLoadMoreReviews} 
                                                        disabled={loadingReviews}
                                                        variant="outline"
                                                        size="sm"
                                                        className="font-black text-[10px] uppercase tracking-wider rounded-xl py-2 px-6 bg-white border border-slate-100 hover:bg-slate-50 text-slate-700"
                                                    >
                                                        {loadingReviews ? (
                                                            <>
                                                                <Loader2 className="w-4 h-4 mr-2 animate-spin text-primary" />
                                                                Loading...
                                                            </>
                                                        ) : (
                                                            'See More Reviews'
                                                        )}
                                                    </Button>
                                                </div>
                                            )}
                                        </>
                                    ) : loadingReviews ? (
                                        <div className="space-y-3">
                                            {[1, 2].map((i) => (
                                                <Card key={i} className="border border-slate-100 shadow-none rounded-2xl overflow-hidden p-5 bg-white">
                                                    <CardContent className="p-0">
                                                        <div className="flex justify-between items-center">
                                                            <div className="flex items-center gap-2">
                                                                <Skeleton className="w-8 h-8 rounded-full" />
                                                                <div className="space-y-1">
                                                                    <Skeleton className="h-3 w-20" />
                                                                    <Skeleton className="h-2 w-12" />
                                                                </div>
                                                            </div>
                                                            <Skeleton className="h-3 w-16" />
                                                        </div>
                                                        <Skeleton className="h-4 w-full mt-3" />
                                                    </CardContent>
                                                </Card>
                                            ))}
                                        </div>
                                    ) : (
                                        <Card className="border-dashed border-slate-200 bg-slate-50/20 rounded-2xl">
                                            <CardContent className="p-8 text-center flex flex-col items-center gap-2.5">
                                                <MessageSquare className="w-6 h-6 text-slate-300" />
                                                <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest">No reviews posted yet</p>
                                            </CardContent>
                                        </Card>
                                    )}
                                </div>
                            </section>

                            {/* Trust Banner */}
                            <Card className="bg-primary/[0.01] border border-primary/5 rounded-[1.5rem] overflow-hidden">
                                <CardHeader className="pb-2.5 pt-4 px-5">
                                    <CardTitle className="flex items-center gap-2 text-primary text-xs font-black uppercase tracking-widest">
                                        <ShieldCheck className="w-4 h-4" /> Why book on MyExpert?
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3 text-xs font-medium px-5 pb-5">
                                    <div className="flex items-start gap-3">
                                        <BadgeCheck className="w-4 h-4 text-teal-600 shrink-0 mt-0.5"/>
                                        <div>
                                            <p className="text-slate-700 font-black text-xs">Verified Local Professionals</p>
                                            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-tight mt-0.5">Vetted for your ultimate peace of mind.</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <ShieldCheck className="w-4 h-4 text-teal-600 shrink-0 mt-0.5"/>
                                        <div>
                                            <p className="text-slate-700 font-black text-xs">Secure Direct Connection</p>
                                            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-tight mt-0.5">Reliable and direct home service delivery.</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                )}
            </div>
        </div>

        {/* Fixed Bottom Action Bar */}
        {!loading && expert && (
            <div className="fixed bottom-0 left-0 right-0 w-full max-w-2xl mx-auto bg-white/90 backdrop-blur-lg border-t border-slate-100 p-4 z-40 animate-in slide-in-from-bottom duration-500 md:rounded-t-3xl md:border-x shadow-[0_-8px_30px_rgb(0,0,0,0.03)]">
                <div className="w-full mx-auto flex items-center gap-3">
                    <Button 
                        onClick={handleBookClick} 
                        size="lg" 
                        className="w-full h-14 rounded-2xl text-xs font-black uppercase tracking-widest bg-primary hover:bg-primary/90 text-white shadow-xl shadow-primary/20 active:scale-[0.98] transition-transform" 
                        disabled={isBusy || !isAvailable}
                    >
                        {isBusy ? 'Currently Busy' : 'Instant Book Now'}
                    </Button>
                </div>
            </div>
        )}

        {isModalOpen && expert && (
            <BookingConfirmationModal
                expert={expert}
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
            />
        )}
    </>
  );
}
