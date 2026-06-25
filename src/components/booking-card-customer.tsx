'use client';

import type { Booking } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Calendar, CheckCircle, XCircle, Phone, AlertTriangle, Copy, Loader2, PartyPopper, MessageSquare, Star, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { Timestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';
import { BookingCountdown } from './booking-countdown';
import { BookingTimeline } from './booking-timeline';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { cancelBooking } from '@/services/booking-service';
import { ReviewModal } from './review-modal';

interface BookingCardProps {
  booking: Booking;
}

const getDate = (value: any): Date | null => {
  if (!value) return null;
  if (value instanceof Timestamp) return value.toDate();
  if (typeof value?.toDate === 'function') return value.toDate(); 
  return null;
};

export function BookingCardCustomer({ booking: initialBooking }: BookingCardProps) {
  const { toast } = useToast();
  const [booking, setBooking] = useState(initialBooking);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const safeStatus = booking.status && ['pending', 'accepted', 'in_progress', 'marked_complete', 'completed', 'cancelled', 'rejected', 'expired', 'upcoming'].includes(booking.status) ? booking.status : 'pending';
  const isArchived = ['cancelled', 'rejected', 'expired'].includes(safeStatus);
  
  const bookingDate = getDate(booking.scheduledDate);
  
  const getInitials = (name?: string) => {
    if (!name) return '?';
    const names = name.trim().split(/\s+/);
    if (names.length > 1 && names[0] && names[names.length - 1]) {
        return (names[0][0] + names[names.length - 1][0]).toUpperCase();
    }
    if (names[0]) {
        return names[0].substring(0, 2).toUpperCase();
    }
    return '?';
  };

  const handleCopyOtp = () => {
    if (booking.verificationCode) {
        navigator.clipboard.writeText(booking.verificationCode);
        toast({
            title: "✅ Code Copied!",
            description: "The code is ready to be shared with the expert.",
        });
    }
  };

  const handleCancel = () => {
    setIsCancelling(true);
    try {
      cancelBooking(booking.id);
      setBooking(prev => ({ ...prev, status: 'cancelled' }));
      toast({
        title: 'Request Cancelled',
        description: 'Your booking request has been successfully cancelled.',
      });
    } catch (error: any) {
      console.error('Failed to cancel booking', error);
      toast({
        variant: 'destructive',
        title: 'Cancellation Failed',
        description: error.message || 'Could not cancel the booking. Please try again.',
      });
       setIsCancelling(false);
    }
  };

  const handleReportIssue = () => {
    const subject = `Issue with MyExpert Job ID: ${booking.id}`;
    const body = `Hi MyExpert Team,

I'm facing an issue with a completed job. Please look into it.

- Job ID: ${booking.id}
- Service Type: ${booking.service}
- Expert Name: ${booking.expertName}
- Expert Phone: ${booking.expertPhone || 'N/A'}
- My Phone: ${booking.userPhone || 'N/A'}

Issue Description:
[Please describe the issue you are facing here]
    `.trim();
    window.location.href = `mailto:musaibmanzoormugloo13@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending': return <Badge variant="secondary" className="bg-orange-50 text-orange-600 border-none text-[9px] font-black uppercase tracking-tighter h-5 px-1.5">Pending</Badge>;
      case 'accepted':
      case 'upcoming': return <Badge variant="secondary" className="bg-primary/5 text-primary border-none text-[9px] font-black uppercase tracking-tighter h-5 px-1.5">Confirmed</Badge>;
      case 'in_progress': return <Badge variant="secondary" className="bg-blue-50 text-blue-600 border-none text-[9px] font-black uppercase tracking-tighter h-5 px-1.5">Live</Badge>;
      case 'completed': return <Badge variant="secondary" className="bg-secondary text-muted-foreground border-none text-[9px] font-black uppercase tracking-tighter h-5 px-1.5">Finished</Badge>;
      case 'cancelled': return <Badge variant="secondary" className="bg-secondary/50 text-muted-foreground/60 border-none text-[9px] font-black uppercase tracking-tighter h-5 px-1.5">Cancelled</Badge>;
      case 'rejected': return <Badge variant="secondary" className="bg-red-50 text-red-600/60 border-none text-[9px] font-black uppercase tracking-tighter h-5 px-1.5">Rejected</Badge>;
      case 'expired': return <Badge variant="secondary" className="bg-orange-50 text-orange-600/60 border-none text-[9px] font-black uppercase tracking-tighter h-5 px-1.5">Time Up</Badge>;
      default: return null;
    }
  };

  return (
    <>
    <Card className={cn("overflow-hidden shadow-none border-border/40 transition-all duration-300", {
        "border-orange-200": safeStatus === 'pending',
        "border-primary/20": ['accepted', 'in_progress', 'upcoming'].includes(safeStatus),
        "border-border bg-background": isArchived || safeStatus === 'completed',
        "opacity-70": isArchived,
    })}>
      <CardContent className="p-0">
        {/* --- COMPACT HEADER SUMMARY --- */}
        <div 
          onClick={() => !isArchived && setIsExpanded(!isExpanded)}
          className={cn("p-3 flex items-center gap-3", !isArchived && "cursor-pointer hover:bg-secondary/10 transition-colors")}
        >
          <Avatar className="w-9 h-9 rounded-xl border shrink-0">
            <AvatarImage src={booking.expertPhotoUrl} alt={booking.expertName} />
            <AvatarFallback className="rounded-xl text-[10px] bg-secondary text-muted-foreground font-bold">{getInitials(booking.expertName)}</AvatarFallback>
          </Avatar>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-[13px] truncate text-foreground">{booking.expertName}</h3>
              {getStatusBadge(safeStatus)}
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-tight">{booking.service}</p>
              {!isArchived && <span className="text-[10px] text-muted-foreground/30">•</span>}
              <p className="text-[10px] text-muted-foreground font-medium">
                {bookingDate ? bookingDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'N/A'}
              </p>
            </div>
          </div>

          {!isArchived && (
            <div className="ml-1 p-1 bg-secondary/30 rounded-lg group-active:scale-90 transition-transform">
                {isExpanded ? <ChevronUp className="w-3.5 h-3.5 text-muted-foreground/60" /> : <ChevronDown className="w-3.5 h-3.5 text-muted-foreground/60" />}
            </div>
          )}
        </div>

        {/* --- COMPACT EXPANDABLE DETAILS --- */}
        {isExpanded && !isArchived && (
          <div className="px-3 pb-3 space-y-3 animate-in slide-in-from-top-1 duration-300">
            <div className="pt-2 border-t border-border/30 space-y-2.5">
                {booking.problemDescription && (
                    <div className="p-2.5 border border-border/30 rounded-xl bg-background">
                        <div className="flex items-start gap-2.5">
                            <MessageSquare className="w-3.5 h-3.5 text-muted-foreground/50 mt-0.5 shrink-0" />
                            <div className="min-w-0">
                                <p className="text-[9px] font-black text-muted-foreground/60 uppercase tracking-widest">Problem</p>
                                <p className="text-[12px] text-foreground/80 leading-tight mt-0.5">{booking.problemDescription}</p>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <div className="border-t border-b border-border/30 -mx-3">
               <BookingTimeline booking={booking} />
            </div>

            {(safeStatus === 'pending') && (
                <BookingCountdown booking={booking} />
            )}
            
            {(safeStatus === 'accepted' || safeStatus === 'upcoming') && booking.verificationCode && (
                 <div className="p-2.5 bg-primary/5 rounded-xl text-center space-y-1.5 border border-primary/10">
                    <p className="text-[9px] text-primary/60 font-black uppercase tracking-[0.15em]">Code for Expert</p>
                    <div className="flex items-center justify-center gap-3">
                        <div 
                            className="font-black text-lg text-primary tracking-[0.2em] font-mono cursor-pointer"
                            onClick={handleCopyOtp}
                        >
                            {booking.verificationCode}
                        </div>
                        <Button variant="ghost" size="icon" onClick={handleCopyOtp} className="text-primary hover:bg-primary/10 h-7 w-7 rounded-lg">
                            <Copy className="w-3.5 h-3.5" />
                        </Button>
                    </div>
                </div>
            )}

            {safeStatus === 'completed' && (
              <div className="bg-primary/5 border border-primary/10 rounded-xl p-3 flex items-center justify-between animate-in zoom-in-95 duration-500">
                <div className="flex items-center gap-2">
                    <div className="bg-primary/10 p-1.5 rounded-lg">
                        <PartyPopper className="w-3.5 h-3.5 text-primary" />
                    </div>
                    <span className="text-[11px] font-black text-primary uppercase tracking-tight">Job Completed</span>
                </div>
                {!booking.isReviewed && (
                    <Button 
                        variant="default" 
                        size="sm" 
                        className="h-8 px-4 text-[10px] font-black uppercase tracking-widest rounded-xl shadow-lg shadow-primary/20 active:scale-95 transition-all" 
                        onClick={() => setIsReviewModalOpen(true)}
                    >
                        Rate Service
                    </Button>
                )}
              </div>
            )}

            <div className="pt-1 flex items-center justify-end gap-2">
                {safeStatus === 'pending' && (
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 px-3 text-[10px] font-black text-red-600 uppercase tracking-wider hover:bg-red-50" disabled={isCancelling}>
                            {isCancelling ? <Loader2 className="mr-1.5 h-3 w-3 animate-spin" /> : <XCircle className="mr-1.5 h-3 w-3" />}
                            Cancel Request
                        </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="rounded-2xl">
                        <AlertDialogHeader>
                            <AlertDialogTitle className="font-black">Cancel Request?</AlertDialogTitle>
                            <AlertDialogDescription className="font-medium">
                            This will cancel your booking request. You can book again later.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter className="flex-row gap-2">
                            <AlertDialogCancel className="rounded-xl flex-1 mt-0">Go Back</AlertDialogCancel>
                            <AlertDialogAction onClick={handleCancel} className="bg-destructive text-white hover:bg-destructive/90 rounded-xl flex-1">
                            Cancel Now
                            </AlertDialogAction>
                        </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                )}
                {(safeStatus === 'accepted' || safeStatus === 'upcoming' || safeStatus === 'in_progress') && booking.expertPhone && (
                    <Button asChild size="sm" variant="outline" className="h-8 px-3 text-[10px] font-black uppercase tracking-wider rounded-lg border-border/60">
                        <a href={`tel:${booking.expertPhone}`}>
                            <Phone className="mr-1.5 h-3 w-3" /> Call Expert
                        </a>
                    </Button>
                )}
                 {safeStatus === 'completed' && (
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 px-3 text-[10px] font-black text-muted-foreground uppercase tracking-wider rounded-lg">
                                <AlertTriangle className="mr-1.5 h-3 w-3" /> Report Issue
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="rounded-2xl">
                            <AlertDialogHeader>
                                <AlertDialogTitle className="font-black text-foreground">Need help?</AlertDialogTitle>
                                <AlertDialogDescription className="font-medium text-muted-foreground/80">Report any service quality concerns to our support team.</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter className="flex-row gap-2">
                                <AlertDialogCancel className="rounded-xl flex-1 mt-0">Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={handleReportIssue} className="bg-destructive text-white rounded-xl flex-1">Send Email</AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                )}
                <Button variant="secondary" size="sm" className="h-8 px-3 text-[10px] font-black uppercase tracking-wider rounded-lg bg-secondary/50 hover:bg-secondary" asChild>
                    <Link href={`/experts/${booking.expertId}`}>Expert Profile</Link>
                </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>

    {isReviewModalOpen && (
        <ReviewModal
            booking={booking}
            isOpen={isReviewModalOpen}
            onClose={() => setIsReviewModalOpen(false)}
            onSuccess={() => setBooking(prev => ({ ...prev, isReviewed: true }))}
        />
    )}
    </>
  );
}
