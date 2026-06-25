'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { safeStringify } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/auth-context';
import { createBooking } from '@/services/booking-service';
import type { Expert } from '@/lib/types';
import { Phone, MapPin, MessageSquare, Home, ArrowLeft, ChevronRight, Loader2 } from 'lucide-react';
import { ScrollArea } from './ui/scroll-area';
import { useLoadingStore } from '@/lib/loading-store';

interface BookingConfirmationModalProps {
  expert: Expert;
  isOpen: boolean;
  onClose: () => void;
  problem?: string;
}

export function BookingConfirmationModal({ expert, isOpen, onClose, problem }: BookingConfirmationModalProps) {
  const router = useRouter();
  const { user, userProfile } = useAuth();
  const { toast } = useToast();
  const { isLoading, setIsLoading } = useLoadingStore();

  const [contactNumber, setContactNumber] = useState(userProfile?.phone?.replace('+91', '') || '');
  const [problemDescription, setProblemDescription] = useState(problem || '');

  const handleBooking = async () => {
    if (!user || !userProfile) {
      router.push('/login');
      return;
    }
    
    if (contactNumber.length !== 10) {
        toast({ variant: 'warning', description: 'Enter valid 10-digit number' });
        return;
    }

    setIsLoading(true);

    // FIX: Replaced complex object stringification with safe primitive logging 
    // to stop the AI Studio preview window telemetry from throwing circular reference errors.
    console.log("Booking initiated for Expert ID:", expert?.id || 'Unknown');
    console.log("Expert Service Type:", expert?.serviceType || 'Unknown');
    console.log("Booking Problem Context Provided:", !!problemDescription);

    const finishBooking = (coords: { lat: number, lng: number } | null) => {
        createBooking({
            userId: user!.uid,
            userName: userProfile!.fullName || 'Customer',
            userPhone: `+91${contactNumber}`,
            userArea: userProfile?.location || 'Nearby',
            userAddress: userProfile?.locationData?.fullAddress || userProfile?.location || 'Saved Location',
            expert,
            problemDescription: problemDescription,
            userLocation: coords,
        })
        .then(() => {
            toast({ title: 'Request Sent! 🚀', description: 'Expert notified instantly.' });
            window.dispatchEvent(new CustomEvent('customer-booking-requested', {
                detail: {
                    expertName: expert.fullName,
                    service: expert.serviceType
                }
            }));
            router.push('/history');
            onClose();
        })
        .catch(() => toast({ variant: 'destructive', description: 'Booking failed. Try again.' }))
        .finally(() => setIsLoading(false));
    };

    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (p) => finishBooking({ lat: p.coords.latitude, lng: p.coords.longitude }),
            () => finishBooking(userProfile?.locationData ? { lat: userProfile.locationData.lat, lng: userProfile.locationData.lng } : null),
            { timeout: 5000 }
        );
    } else {
        finishBooking(null);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent 
        side="bottom" 
        className="h-[92dvh] w-screen max-w-none sm:max-w-none p-0 border-none rounded-t-[2.5rem] flex flex-col bg-background shadow-2xl"
      >
        <SheetHeader className="px-6 pt-6 pb-4 border-b border-border/10 flex flex-row items-center shrink-0">
          <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full h-10 w-10 shrink-0">
            <ArrowLeft className="h-6 w-6" />
          </Button>
          <div className="flex-1 text-center pr-10">
            <SheetTitle className="text-xl font-black tracking-tight">Confirm Booking</SheetTitle>
            <SheetDescription className="text-[10px] font-bold text-primary uppercase tracking-widest">Safe & Secure</SheetDescription>
          </div>
        </SheetHeader>
        
        <ScrollArea className="flex-1">
          <div className="px-6 py-6 space-y-8 max-w-2xl mx-auto pb-32">
            <section className="space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Arrival Location</h2>
                    <Button variant="link" onClick={() => { onClose(); router.push('/select-location'); }} className="h-auto p-0 text-primary font-bold text-[10px] uppercase">Change</Button>
                </div>
                <div className="bg-secondary/30 rounded-2xl p-4 border border-border/50 flex gap-4 items-center">
                    <div className="bg-primary/10 p-2.5 rounded-xl"><MapPin className="w-5 h-5 text-primary" /></div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-foreground truncate">{userProfile?.location || 'Your Area'}</p>
                        <p className="text-[10px] text-muted-foreground font-medium truncate mt-0.5">{userProfile?.locationData?.fullAddress || 'Saved Address'}</p>
                    </div>
                </div>
            </section>

            <section className="space-y-6">
                <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Your Call Number</Label>
                    <div className="flex items-center h-14 rounded-2xl border-2 border-transparent bg-secondary/40 focus-within:bg-white focus-within:border-primary/20 transition-all overflow-hidden px-4">
                        <span className="font-bold text-muted-foreground mr-2">+91</span>
                        <Input
                            type="tel"
                            placeholder="10 digit mobile number"
                            value={contactNumber}
                            onChange={(e) => setContactNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
                            className="h-full border-0 bg-transparent text-base font-bold focus-visible:ring-0 p-0"
                        />
                    </div>
                </div>
                
                <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Issue Details (Optional)</Label>
                    <Textarea
                        placeholder={`Tell the ${expert.serviceType.toLowerCase()} what's wrong...`}
                        value={problemDescription}
                        onChange={(e) => setProblemDescription(e.target.value)}
                        className="min-h-[120px] rounded-2xl border-2 border-transparent bg-secondary/40 focus-within:bg-white focus-within:border-primary/20 text-sm font-medium transition-all resize-none p-4"
                    />
                </div>
            </section>

            <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 space-y-2">
              <h4 className="text-[12px] font-black text-gray-900 flex items-center gap-2">
                  <span className="text-sm">🛡️</span> IMPORTANT SAFETY NOTICE
              </h4>
              <ul className="text-[12px] font-bold text-gray-600 space-y-1">
                  <li>• Fix price on call with the expert.</li>
                  <li>• Stay home (or ensure a family member is present) until the service is complete.</li>
                  <li>• We do not handle payments—please pay the expert directly.</li>
              </ul>
            </div>
          </div>
        </ScrollArea>

        <footer className="sticky bottom-0 p-6 bg-background border-t border-border/10 z-50">
          <Button 
                onClick={handleBooking} 
                disabled={isLoading || contactNumber.length !== 10}
                className="w-full h-16 rounded-2xl text-base font-black uppercase tracking-widest shadow-2xl shadow-primary/30"
          >
            {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : 'Confirm Request'}
            {!isLoading && <ChevronRight className="ml-2 w-5 h-5" />}
          </Button>
        </footer>
      </SheetContent>
    </Sheet>
  );
}