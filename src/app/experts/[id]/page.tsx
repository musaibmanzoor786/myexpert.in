
'use client';

import { getExpertById } from '@/services/expert-service';
import { getExpertReviews } from '@/services/review-service';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
    MapPin, User, ShieldCheck, BadgeCheck, ArrowLeft, Star, CheckCircle2, MessageSquare, Award
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

  const [expert, setExpert] = useState<Expert | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [reviewsLoaded, setReviewsLoaded] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
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
            setLoading(true);
            const expertData = await getExpertById(id);
            
            if (expertData) {
              setExpert(expertData);
            } else {
              setNotFound(true);
            }
        } catch (error) {
            console.error("Failed to fetch expert data", error);
            setNotFound(true);
        } finally {
            setLoading(false);
        }
    }
    fetchData();
  }, [id]);

  const handleLoadReviews = async () => {
    if (reviewsLoaded || loadingReviews) return;
    setLoadingReviews(true);
    try {
        const data = await getExpertReviews(id);
        setReviews(data);
        setReviewsLoaded(true);
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
        <div className="relative animate-in fade-in duration-500 w-full max-w-4xl mx-auto pb-32">
             {/* Sticky Navigation Header - ALWAYS RENDER IMMEDIATELY */}
             <div className="absolute top-4 left-4 z-30 bg-transparent">
                <Button 
                    variant="ghost" 
                    size="icon" 
                    className="bg-background/80 hover:bg-background backdrop-blur-md rounded-full shadow-md h-10 w-10 border border-border/50 active:scale-90 transition-transform"
                    onClick={() => window.history.length > 2 ? router.back() : router.push('/')}
                >
                    <ArrowLeft className="w-5 h-5" />
                </Button>
            </div>

            <div className="space-y-6">
                {loading ? (
                    // INSTANT SKELETON: Show layout while expert data fetches
                    <ExpertProfileSkeleton />
                ) : !expert ? null : (
                    <div className="animate-in fade-in slide-in-from-bottom-2 duration-700">
                        {/* Hero Profile Section */}
                        <div className="relative pt-14 pb-6 px-4 bg-gradient-to-b from-primary/10 via-primary/5 to-background text-center">
                            <div className="relative w-28 h-28 mx-auto mb-4">
                                {expert.profilePictureUrl ? (
                                    <Image 
                                        src={expert.profilePictureUrl}
                                        alt={expert.name}
                                        width={112}
                                        height={112}
                                        className="rounded-[2.5rem] border-4 border-background shadow-2xl object-cover"
                                        onError={(e) => e.currentTarget.style.display = 'none'}
                                    />
                                ) : (
                                    <div className="w-full h-full bg-secondary rounded-[2.5rem] flex items-center justify-center border-4 border-background shadow-2xl">
                                        <User className="w-12 h-12 text-muted-foreground/30" />
                                    </div>
                                )}
                                {expert.isVerified && (
                                    <div className="absolute -bottom-1 -right-1 bg-primary text-white rounded-2xl p-1.5 border-4 border-background shadow-lg">
                                        <CheckCircle2 className="w-4 h-4" />
                                    </div>
                                )}
                            </div>
                            
                            <h1 className="text-2xl font-black tracking-tight text-foreground leading-none">{expert.name}</h1>
                            <p className="text-sm font-bold text-primary uppercase tracking-widest mt-1.5">{expert.title}</p>
                            
                            <div className="flex items-center justify-center gap-2 mt-4">
                                <div className="flex items-center gap-1 bg-yellow-400 text-yellow-950 px-2 py-0.5 rounded-lg text-[10px] font-black">
                                    <Star className="w-2.5 h-2.5 fill-current" />
                                    {expert.rating || 'New'}
                                </div>
                                <div className="flex items-center gap-1.5 bg-green-100 text-green-700 px-2 py-0.5 rounded-lg text-[10px] font-black border border-green-200">
                                    <CheckCircle2 className="w-3 h-3" />
                                    {expert.reviewCount || 0} JOBS
                                </div>
                                <div className="flex items-center gap-1.5 bg-blue-100 text-blue-700 px-2 py-0.5 rounded-lg text-[10px] font-black border border-blue-200">
                                    <ShieldCheck className="w-3 h-3" />
                                    VERIFIED
                                </div>
                            </div>
                        </div>
                        
                        {/* Quick Info Row */}
                        <div className="px-4 mt-6">
                            <div className="flex items-center gap-3 p-3 bg-secondary/40 rounded-2xl border border-border/50">
                                <div className="bg-background p-2 rounded-xl shadow-sm">
                                    <MapPin className="w-4 h-4 text-primary"/>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-[10px] uppercase font-black tracking-widest text-muted-foreground leading-none">Location</p>
                                    <p className="text-sm font-bold mt-1 truncate text-foreground">{expert.area || expert.location}</p>
                                    {calculatedDistance !== null && (
                                        <p className="text-xs text-primary font-black mt-1 flex items-center">
                                            📍 {calculatedDistance.toFixed(1)} km away
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="px-4 mt-8 space-y-8">
                            {/* About Section */}
                            <section>
                                <h2 className="text-lg font-black mb-3 px-1 flex items-center gap-2 uppercase tracking-tight">
                                    <User className="w-4 h-4 text-primary" /> About
                                </h2>
                                <Card className="rounded-[2rem] border-none bg-card shadow-sm">
                                    <CardContent className="p-5">
                                        <p className="text-foreground/80 leading-relaxed text-sm italic">
                                            "{expert.summary || expert.bio}"
                                        </p>
                                        {expert.experience && (
                                            <div className="mt-4 pt-4 border-t flex items-center gap-2 text-primary font-black text-[10px] uppercase tracking-wider">
                                                <Award className="w-3.5 h-3.5" />
                                                {expert.experience}+ Years Experience
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </section>

                            {/* Services Section */}
                            <section>
                                <h2 className="text-lg font-black mb-3 px-1 flex items-center gap-2 uppercase tracking-tight">
                                    <CheckCircle2 className="w-4 h-4 text-primary" /> Services
                                </h2>
                                <div className="flex wrap gap-2">
                                    {expert.services.map((service, index) => (
                                        <Badge key={index} variant="secondary" className="text-[11px] font-bold py-2 px-4 rounded-xl bg-background border border-border/60 hover:border-primary/50 transition-colors">
                                            {service.name}
                                        </Badge>
                                    ))}
                                </div>
                            </section>
                            
                            {/* Reviews Section */}
                            <section>
                                <div className="flex justify-between items-center mb-3 px-1">
                                    <h2 className="text-lg font-black flex items-center gap-2 uppercase tracking-tight">
                                        <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" /> Reviews
                                    </h2>
                                    <span className="text-[10px] font-black text-muted-foreground bg-secondary px-2 py-0.5 rounded-md">
                                        {expert.reviewCount || 0} TOTAL
                                    </span>
                                </div>
                                
                                {!reviewsLoaded ? (
                                    <Card className="border-dashed bg-secondary/10 hover:bg-secondary/20 transition-all cursor-pointer rounded-[2rem]" onClick={handleLoadReviews}>
                                        <CardContent className="p-8 text-center flex flex-col items-center gap-2">
                                            {loadingReviews ? (
                                                <div className="flex flex-col items-center gap-2">
                                                    <Skeleton className="w-6 h-6 rounded-full" />
                                                    <Skeleton className="h-2 w-24" />
                                                </div>
                                            ) : (
                                                <>
                                                    <MessageSquare className="w-6 h-6 text-primary opacity-40" />
                                                    <p className="text-xs font-black text-primary uppercase tracking-widest">View {expert.reviewCount || 0} reviews</p>
                                                </>
                                            )}
                                        </CardContent>
                                    </Card>
                                ) : (
                                    <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-500">
                                        {reviews.length > 0 ? (
                                            reviews.map((review) => (
                                                <Card key={review.id} className="border-none shadow-sm rounded-2xl overflow-hidden">
                                                    <CardContent className="p-5 space-y-3">
                                                        <div className="flex justify-between items-start">
                                                            <div className="flex items-center gap-2">
                                                                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-black text-xs">
                                                                    {review.customerName ? review.customerName.charAt(0) : '?'}
                                                                </div>
                                                                <div>
                                                                    <p className="font-bold text-sm leading-none">{review.customerName || 'Customer'}</p>
                                                                    <p className="text-[9px] text-muted-foreground uppercase font-black tracking-tight mt-1">
                                                                        {formatDistanceToNow(review.createdAt.toDate(), { addSuffix: true })}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-0.5">
                                                                {[...Array(5)].map((_, i) => (
                                                                    <Star 
                                                                        key={i} 
                                                                        className={cn("w-2.5 h-2.5", i < review.rating ? "fill-yellow-500 text-yellow-500" : "text-muted")} 
                                                                    />
                                                                ))}
                                                            </div>
                                                        </div>
                                                        <p className="text-sm text-foreground/80 leading-snug">"{review.comment}"</p>
                                                    </CardContent>
                                                </Card>
                                            ))
                                        ) : (
                                            <Card className="border-dashed bg-secondary/20 rounded-[2rem]">
                                                <CardContent className="p-8 text-center flex flex-col items-center gap-3">
                                                    <MessageSquare className="w-8 h-8 text-muted-foreground/20" />
                                                    <p className="text-xs text-muted-foreground font-black uppercase tracking-widest">No reviews yet</p>
                                                </CardContent>
                                            </Card>
                                        )}
                                    </div>
                                )}
                            </section>

                            {/* Trust Banner */}
                            <Card className="bg-primary/5 border-2 border-primary/10 rounded-[2rem] overflow-hidden">
                                <CardHeader className="pb-3 pt-5 px-6">
                                    <CardTitle className="flex items-center gap-2 text-primary text-base font-black uppercase tracking-tight">
                                        <ShieldCheck className="w-5 h-5" /> Why MyExpert?
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4 text-sm font-medium px-6 pb-6">
                                    <div className="flex items-start gap-4">
                                        <BadgeCheck className="w-5 h-5 text-primary shrink-0"/>
                                        <div>
                                            <p className="text-foreground font-bold text-xs">Identity Verified Professionals</p>
                                            <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-tight">Vetted for your peace of mind.</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-4">
                                        <ShieldCheck className="w-5 h-5 text-primary shrink-0"/>
                                        <div>
                                            <p className="text-foreground font-bold text-xs">Platform Guaranteed</p>
                                            <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-tight">Safe and secure service delivery.</p>
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
            <div className="fixed bottom-0 left-0 right-0 w-full max-w-4xl mx-auto bg-background/80 backdrop-blur-lg border-t border-border/50 p-4 z-40 animate-in slide-in-from-bottom duration-500 md:rounded-t-2xl md:border-x">
                <div className="w-full mx-auto flex items-center gap-3">
                    <Button 
                        onClick={handleBookClick} 
                        size="lg" 
                        className="w-full h-14 rounded-2xl text-base font-black uppercase tracking-widest shadow-xl shadow-primary/20 active:scale-[0.98] transition-transform" 
                        disabled={isBusy || !isAvailable}
                    >
                        {isBusy ? 'Busy' : 'Book Now'}
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
