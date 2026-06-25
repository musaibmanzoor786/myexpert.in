'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/auth-context';
import { updateExpertStatus, getExpertById } from '@/services/expert-service';
import type { Expert, ExpertStatus } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Loader2, Power, Zap, ShieldCheck, Briefcase } from 'lucide-react';
import { useBookings } from '@/hooks/use-bookings';
import { useRouter } from 'next/navigation';
import { useLocationStore } from '@/lib/location-store';
import { ConfirmLocationSheet } from '@/components/confirm-location-sheet';

export function StatusToggle() {
  const { user, userProfile } = useAuth();
  const { toast } = useToast();
  const { bookings } = useBookings('expert');
  const router = useRouter();
  const { area: displayArea } = useLocationStore();

  const [expert, setExpert] = useState<Expert | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const isVerified = userProfile?.isVerified || false;

  const currentHub = userProfile?.location?.split(',')[0] || (displayArea !== 'Select Location' ? displayArea : '') || 'Nearby';


  // Busy-Lock logic
  const activeJob = bookings.find(b => b.status === 'accepted' || b.status === 'in_progress');
  const isBusy = !!activeJob;

  useEffect(() => {
    const fetchStatus = () => {
      if (user?.uid) {
          getExpertById(user.uid).then(setExpert);
      }
    };
    fetchStatus();

    window.addEventListener('expert-status-changed', fetchStatus);
    return () => window.removeEventListener('expert-status-changed', fetchStatus);
  }, [user?.uid]);

  // Offline handler
  useEffect(() => {
    const handleOffline = async () => {
      if (isBusy) return;
      if (user?.uid && expert?.status === 'online') {
          await updateExpertStatus(user.uid, 'offline');
          setExpert(prev => prev ? {...prev, status: 'offline'} : null);
      }
    };

    window.addEventListener('offline', handleOffline);
    return () => window.removeEventListener('offline', handleOffline);
  }, [user?.uid, expert?.status, isBusy]);

  const changeStatusTo = async (newStatus: ExpertStatus) => {
    setIsLoading(true);
    try {
      await updateExpertStatus(user!.uid, newStatus);
      setExpert(prev => prev ? {...prev, status: newStatus} : null);
      toast({
        variant: newStatus === 'offline' ? 'warning' : 'success',
        description: `Status: ${newStatus.charAt(0).toUpperCase() + newStatus.slice(1)}`,
      });
    } catch (error) {
      console.error('Failed to update status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggle = async () => {
    if (isBusy || !user || isLoading || !isVerified || !expert) return;

    const currentStatus = expert.status || 'offline';

    if (currentStatus === 'offline') {
      setIsConfirmOpen(true);
      return;
    }

    await changeStatusTo('offline');
  };

  const status = expert?.status || 'offline';

  if (isBusy) {
    return (
        <div className="flex flex-col gap-3 p-5 rounded-[2.5rem] bg-sky-50 border-2 border-sky-200 shadow-md">
            <div className="flex items-center gap-3">
                <div className="h-14 w-14 flex items-center justify-center rounded-2xl bg-sky-500 text-white shadow-lg">
                    <Briefcase className="w-7 h-7" />
                </div>
                <div className="flex-1">
                    <p className="font-black text-sky-900 leading-none">You are Busy</p>
                    <p className="text-[10px] font-black text-sky-900/70 mt-1 uppercase tracking-[0.2em]">Status locked while on an active job.</p>
                </div>
            </div>
            <button 
                onClick={() => router.push('/history?tab=active')}
                className="w-full py-3 bg-sky-500 text-white font-black text-xs uppercase tracking-widest rounded-xl hover:bg-sky-600 transition-colors"
            >
                View Active Job
            </button>
        </div>
    );
  }

  return (
    <>
      <div
        onClick={handleToggle}
        className={cn(
          "flex items-center justify-between p-4 bg-white rounded-2xl border border-gray-100 shadow-sm cursor-pointer transition-all active:scale-[0.99]",
          !isVerified && "opacity-60 cursor-not-allowed"
        )}
      >
        <div className="flex flex-col">
          <span className="font-semibold text-gray-800 text-base">
            {!isVerified ? "Profile Under Verification" : "I am Available"}
          </span>
          <span className="text-xs text-gray-400 mt-0.5">
            {!isVerified 
              ? "We are reviewing your profile" 
              : status === 'online' 
              ? "Ready to accept incoming booking requests" 
              : "Offline — Not accepting any bookings"}
          </span>
        </div>

        <div className="flex items-center gap-3">
          {isLoading && <Loader2 className="w-4 h-4 animate-spin text-gray-400" />}
          <div
            className={cn(
              "w-11 h-6 rounded-full relative transition-colors duration-200 ease-in-out",
              status === 'online' ? "bg-[#22C55E]" : "bg-gray-200"
            )}
          >
            <div
              className={cn(
                "w-5 h-5 bg-white rounded-full absolute top-0.5 left-0.5 transition-transform duration-200 ease-in-out shadow-sm",
                status === 'online' ? "translate-x-5" : "translate-x-0"
              )}
            />
          </div>
        </div>
      </div>

      <ConfirmLocationSheet 
        open={isConfirmOpen} 
        onOpenChange={setIsConfirmOpen} 
        onConfirm={() => changeStatusTo('online')} 
        onChangeLocation={() => {
          setIsConfirmOpen(false);
          router.push('/select-location');
        }} 
        currentHub={currentHub} 
      />
    </>
  );
}
