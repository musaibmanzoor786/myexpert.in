'use client';

import { useState, useEffect } from 'react';
import type { Booking } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Timer, AlertCircle, XCircle } from 'lucide-react';
import { useAuth } from '@/context/auth-context';

interface BookingCountdownProps {
  booking: Booking;
  onExpire?: () => void;
}

const CountdownDisplay = ({ time, className }: { time: number; className?: string }) => {
  const minutes = Math.floor(time / 60000);
  const seconds = Math.floor((time % 60000) / 1000);

  return (
    <div className={cn("flex items-center justify-center gap-2 font-black transform-gpu", className)}>
      <Timer className="w-5 h-5 animate-pulse" />
      <span className="font-mono tabular-nums text-2xl tracking-tight">
        {minutes.toString().padStart(2, '0')}:{seconds.toString().padStart(2, '0')}
      </span>
    </div>
  );
};

export function BookingCountdown({ booking, onExpire }: BookingCountdownProps) {
  const { user } = useAuth();
  const [remainingTime, setRemainingTime] = useState<number | null>(null);

  const isExpert = user?.uid === booking.expertId;

  useEffect(() => {
    if ((booking.status !== 'pending' && booking.status !== 'expired') || !booking.expiresAt) {
      setRemainingTime(null);
      return;
    }

    const calculateRemaining = () => {
      const now = Date.now();
      const deadline = typeof booking.expiresAt?.toMillis === 'function' 
        ? booking.expiresAt.toMillis() 
        : (booking.expiresAt as any)?.seconds * 1000 || 0;
      return Math.max(0, deadline - now);
    };

    setRemainingTime(calculateRemaining());

    const interval = setInterval(() => {
      const time = calculateRemaining();
      setRemainingTime(time);
      if (time === 0) {
        clearInterval(interval);
        if (onExpire && booking.status === 'pending') {
          onExpire();
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [booking.status, booking.expiresAt, onExpire]);

  if (booking.status !== 'pending' && booking.status !== 'expired' && booking.status !== 'rejected') {
    return null;
  }

  if (remainingTime !== null && remainingTime <= 0) {
      return (
        <div className="p-4 bg-red-50/80 text-red-900 rounded-2xl text-center space-y-1 border border-red-100 animate-in fade-in zoom-in-95 duration-500">
            <div className="flex items-center justify-center gap-2">
                <XCircle className="w-4 h-4 text-red-600" />
                <p className="text-[13px] font-black uppercase tracking-tight">Time Up</p>
            </div>
            <p className="text-[11px] font-bold opacity-60">This request is no longer valid</p>
        </div>
      );
  }

  if (remainingTime === null || remainingTime <= 0) {
    return null;
  }

  return (
    <div className="p-4 bg-orange-50 text-orange-900 rounded-2xl text-center space-y-2 border border-orange-100 animate-in fade-in zoom-in-95 duration-500">
      <div className="flex items-center justify-center gap-2">
          <AlertCircle className="w-4 h-4 text-orange-600" />
          <p className="text-[11px] font-black uppercase tracking-widest">
              {isExpert ? 'Action Required' : 'Waiting for Expert'}
          </p>
      </div>
      <CountdownDisplay time={remainingTime} className="text-orange-700" />
      <p className="text-[9px] text-orange-600/60 uppercase tracking-[0.2em] font-black">
          Automatic cancellation in 03:00
      </p>
    </div>
  );
}
