'use client';

import type { Booking } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Calendar, Phone, Check, X, MapPin, MessageSquare, Map, ChevronDown, ChevronUp, Navigation } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { doc, setDoc, Timestamp, serverTimestamp, collection, query, where, getDocs, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { OtpVerificationModal } from './otp-verification-modal';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { formatDistance } from '@/lib/utils';
import { BookingCountdown } from './booking-countdown';
import { BookingTimeline } from './booking-timeline';
import { Badge } from '@/components/ui/badge';
import { updateExpertStatus } from '@/services/expert-service';

interface BookingCardExpertProps {
  booking: Booking;
}

export function BookingCardExpert({ booking: initialBooking }: BookingCardExpertProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [booking, setBooking] = useState(initialBooking);
  const [isOtpModalOpen, setIsOtpModalOpen] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [review, setReview] = useState<{ rating: number; comment: string } | null>(null);
  const [loadingReview, setLoadingReview] = useState(false);

  const safeStatus = booking.status || 'pending';

  useEffect(() => {
    if (safeStatus !== 'completed' || !db || !booking.id || !booking.expertId) return;
    
    let active = true;
    setLoadingReview(true);
    
    const reviewsRef = collection(db, 'experts', booking.expertId, 'reviews');
    const q = query(reviewsRef, where('bookingId', '==', booking.id), limit(1));
    
    getDocs(q)
      .then((snapshot) => {
        if (!active) return;
        if (!snapshot.empty) {
          const docData = snapshot.docs[0].data();
          setReview({
            rating: docData.rating,
            comment: docData.comment || ""
          });
        } else {
          setReview(null);
        }
      })
      .catch((err) => {
        console.error('Failed to load review for booking', booking.id, err);
      })
      .finally(() => {
        if (active) setLoadingReview(false);
      });

    return () => {
      active = false;
    };
  }, [booking.id, booking.expertId, safeStatus]);
  // Include 'completed' in archived to prevent experts from calling or navigating after job is done
  const isArchived = ['cancelled', 'rejected', 'expired', 'completed'].includes(safeStatus);
  const bookingDate = booking.scheduledDate instanceof Timestamp ? booking.scheduledDate.toDate() : new Date();

  const handleStatusUpdate = (newStatus: 'accepted' | 'rejected') => {
    if (!db || !booking.id) return;
    setIsLoading(true);

    const bookingRef = doc(db, 'bookings', booking.id);
    let updateData: any = { status: newStatus };

    if (newStatus === 'accepted') {
      updateData = {
        status: 'accepted',
        verificationCode: Math.floor(100000 + Math.random() * 900000).toString(),
        acceptedAt: serverTimestamp(),
      };
      setBooking(prev => ({ ...prev, ...updateData, acceptedAt: Timestamp.now() }));
      toast({ title: '✅ Job Confirmed' });
      updateExpertStatus(booking.expertId, 'busy');
    } else {
        setBooking(prev => ({...prev, status: newStatus}));
        toast({ title: 'Request Declined' });
    }
    
    setDoc(bookingRef, updateData, { merge: true }).catch(() => setBooking(initialBooking)).finally(() => setIsLoading(false));
  };

  const handleCompleteJob = () => {
    if (!db || !booking.id) return;
    setIsLoading(true);
    const bookingRef = doc(db, 'bookings', booking.id);
    setDoc(bookingRef, { status: 'completed', completedAt: serverTimestamp() }, { merge: true })
        .then(async () => {
            setBooking(prev => ({ ...prev, status: 'completed', completedAt: Timestamp.now() }));
            setIsExpanded(false); // Collapse immediately on completion
            await updateExpertStatus(booking.expertId, 'online');
        })
        .finally(() => setIsLoading(false));
  };

  const handleNavigate = () => {
    if (!booking.userLocation?.lat || !booking.userLocation?.lng) {
      toast({ variant: "warning", description: "GPS coordinates missing" });
      return;
    }
    setIsNavigating(true);
    setTimeout(() => setIsNavigating(false), 1500);
    
    const { lat, lng } = booking.userLocation;
    // Native mobile wrapper triggers
    const url = /android/i.test(navigator.userAgent) 
        ? `geo:${lat},${lng}?q=${lat},${lng}(Customer)` 
        : `maps://maps.apple.com/?daddr=${lat},${lng}`;
    
    window.location.href = url;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending': return <Badge variant="secondary" className="bg-orange-50 text-orange-600 border-none text-[9px] font-black uppercase h-5">New Lead</Badge>;
      case 'accepted': return <Badge variant="secondary" className="bg-primary/5 text-primary border-none text-[9px] font-black uppercase h-5">Active</Badge>;
      case 'in_progress': return <Badge variant="secondary" className="bg-blue-50 text-blue-600 border-none text-[9px] font-black uppercase h-5">Live</Badge>;
      case 'completed': return <Badge variant="secondary" className="bg-secondary text-muted-foreground border-none text-[9px] font-black uppercase h-5">Done</Badge>;
      case 'cancelled': return <Badge variant="secondary" className="bg-secondary/50 text-muted-foreground/60 border-none text-[9px] font-black uppercase h-5">Cancelled</Badge>;
      case 'rejected': return <Badge variant="secondary" className="bg-red-50 text-red-600/60 border-none text-[9px] font-black uppercase h-5">Rejected</Badge>;
      case 'expired': return <Badge variant="secondary" className="bg-orange-50 text-orange-600/60 border-none text-[9px] font-black uppercase h-5">Time Up</Badge>;
      default: return null;
    }
  };

  return (
    <>
    <Card className={cn("overflow-hidden shadow-none border-border/40 transition-all", {
        "border-primary/40 ring-1 ring-primary/5": safeStatus === 'pending',
        "border-green-200 bg-green-50/20": ['accepted', 'in_progress'].includes(safeStatus),
        "opacity-70": isArchived,
    })}>
      <CardContent className="p-0">
        <div 
          onClick={() => !isArchived && setIsExpanded(!isExpanded)}
          className={cn("p-4 flex items-center gap-3", !isArchived && "cursor-pointer active:bg-secondary/20")}
        >
          <Avatar className="w-10 h-10 rounded-xl border shrink-0">
            <AvatarFallback className="rounded-xl text-[10px] bg-primary/10 text-primary font-black">
              {booking.userName.substring(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <h3 className="font-black text-sm truncate text-foreground">{booking.userName}</h3>
              {getStatusBadge(safeStatus)}
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <p className="text-[10px] text-muted-foreground font-black uppercase tracking-tight">{booking.service}</p>
              {!isArchived && <span className="text-[10px] text-muted-foreground/30">•</span>}
              <p className="text-[10px] text-muted-foreground font-bold">
                {isArchived ? bookingDate.toLocaleDateString() : (booking.userArea?.split(',')[0] || 'Nearby')}
              </p>
            </div>
            {safeStatus === 'completed' && (
              <div className="mt-1.5 flex flex-col gap-1 w-full text-[11px] text-muted-foreground font-medium">
                {loadingReview ? (
                  <span className="text-[10px] animate-pulse">Loading review...</span>
                ) : review ? (
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="flex items-center gap-0.5 font-bold text-foreground bg-amber-500/10 text-amber-600 px-1.5 py-0.5 rounded-md text-[10px]">
                      ★ {review.rating.toFixed(1)}
                    </span>
                    {review.comment ? (
                      <span className="text-gray-700 italic truncate max-w-[150px] sm:max-w-[200px]">
                        "{review.comment}"
                      </span>
                    ) : (
                      <span className="text-muted-foreground/40 italic">(No written comment)</span>
                    )}
                  </div>
                ) : (
                  <span className="text-[10px] text-muted-foreground/60 italic">No reviews left yet</span>
                )}
              </div>
            )}
          </div>

          {!isArchived && (
            <div className="ml-1">
                {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground/40" /> : <ChevronDown className="w-4 h-4 text-muted-foreground/40" />}
            </div>
          )}
        </div>

        {isExpanded && !isArchived && (
          <div className="px-4 pb-4 space-y-4 animate-in slide-in-from-top-1 duration-300">
            <div className="pt-2 border-t border-border/20 space-y-3">
                <div className="p-3 border border-border/40 rounded-xl space-y-3 bg-white shadow-inner">
                    <div className="flex items-start gap-3">
                        <MapPin className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                        <div className="min-w-0">
                            <p className="text-[11px] font-black text-foreground">
                                {booking.distanceKm != null ? `${formatDistance(booking.distanceKm)} from you` : 'Location Shared'}
                            </p>
                            <p className="text-[10px] text-muted-foreground leading-tight mt-1">{booking.userAddress || booking.userArea}</p>
                        </div>
                    </div>
                
                    {booking.problemDescription && (
                        <div className="flex items-start gap-3 border-t pt-3">
                            <MessageSquare className="w-4 h-4 text-muted-foreground/30 mt-0.5 shrink-0" />
                            <div className="min-w-0">
                                <p className="text-[9px] font-black text-muted-foreground/60 uppercase">Details</p>
                                <p className="text-[12px] text-foreground/80 leading-snug mt-1">{booking.problemDescription}</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <BookingTimeline booking={booking} />

            {safeStatus === 'pending' && <BookingCountdown booking={booking} onExpire={() => handleStatusUpdate('rejected')} />}

            <div className="pt-1 flex flex-col gap-2">
                {safeStatus === 'pending' ? (
                  <div className="flex gap-2">
                    <Button size="lg" className="flex-1 h-12 rounded-xl text-xs font-black uppercase" onClick={() => handleStatusUpdate('accepted')} disabled={isLoading}>
                        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
                        Accept Job
                    </Button>
                    <Button variant="ghost" className="flex-1 h-12 rounded-xl text-xs font-black uppercase text-red-600" onClick={() => handleStatusUpdate('rejected')} disabled={isLoading}>
                        Decline
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex gap-2">
                        {safeStatus === 'accepted' && (
                            <Button size="lg" className="flex-1 h-12 rounded-xl text-xs font-black uppercase shadow-xl shadow-primary/20" onClick={() => setIsOtpModalOpen(true)}>
                                Enter Start Code
                            </Button>
                        )}
                        {safeStatus === 'in_progress' && (
                            <Button size="lg" className="flex-1 h-12 rounded-xl text-xs font-black uppercase bg-green-600 hover:bg-green-700" onClick={handleCompleteJob} disabled={isLoading}>
                                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Finish Job'}
                            </Button>
                        )}
                        <Button variant="outline" size="lg" className="w-12 h-12 rounded-xl border-border/60 shrink-0" asChild>
                            <a href={`tel:${booking.userPhone}`}><Phone className="h-5 w-5" /></a>
                        </Button>
                    </div>
                    
                    {['accepted', 'in_progress'].includes(safeStatus) && (
                        <Button
                            size="lg"
                            variant="secondary"
                            className="w-full h-12 rounded-xl text-xs font-black uppercase bg-blue-50 text-blue-600 hover:bg-blue-100 border-none"
                            onClick={handleNavigate}
                            disabled={isNavigating}
                        >
                            {isNavigating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Navigation className="mr-2 h-4 w-4" />}
                            Open Map Navigation
                        </Button>
                    )}
                  </div>
                )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
    {isOtpModalOpen && (
      <OtpVerificationModal
        booking={booking}
        isOpen={isOtpModalOpen}
        onClose={() => setIsOtpModalOpen(false)}
        onVerified={() => setBooking(prev => ({...prev, status: 'in_progress', startedAt: Timestamp.now()}))}
      />
    )}
    </>
  );
}