'use client';

import { cn } from '@/lib/utils';
import type { Booking, BookingStatus } from '@/lib/types';
import { Check, Hourglass, Timer, XCircle, AlertTriangle } from 'lucide-react';
import { Timestamp } from 'firebase/firestore';
import { useEffect, useState } from 'react';

interface TimelineStepProps {
  status: 'completed' | 'active' | 'inactive';
  label: string;
  timestamp: Timestamp | null;
  isFirst?: boolean;
  isLast?: boolean;
}

const Step = ({ status, label, timestamp, isFirst = false, isLast = false }: TimelineStepProps) => {
  const [formattedTime, setFormattedTime] = useState<string | null>(null);

  useEffect(() => {
    if (timestamp && status !== 'inactive') {
      const date = timestamp.toDate();
      setFormattedTime(date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }));
    } else {
      setFormattedTime(null);
    }
  }, [timestamp, status]);

  const statusStyles = {
    completed: {
      circle: 'bg-primary border-primary shadow-sm shadow-primary/20',
      icon: 'text-white',
      line: 'bg-primary',
      label: 'text-foreground',
    },
    active: {
      circle: 'bg-background border-primary ring-4 ring-primary/10',
      icon: 'text-primary',
      line: 'bg-border',
      label: 'text-primary font-black scale-105',
    },
    inactive: {
      circle: 'bg-muted border-muted',
      icon: 'text-muted-foreground',
      line: 'bg-border',
      label: 'text-muted-foreground/60',
    },
  };

  const styles = statusStyles[status];
  
  const getIcon = () => {
      if (status === 'completed') return <Check className={cn('w-3 h-3', styles.icon)} />;
      if (status === 'active') {
          if (label === 'Live') return <Timer className={cn('w-2.5 h-2.5 animate-pulse', styles.icon)} />;
          return <Hourglass className={cn('w-2.5 h-2.5', styles.icon)} />;
      }
      return null;
  }

  return (
    <div className="flex-1 flex flex-col items-center relative transform-gpu transition-all duration-500">
      {!isFirst && (
        <div
          className={cn(
            'absolute top-[10px] right-1/2 h-[1px] w-full transition-colors duration-700',
            (status === 'completed' || status === 'active') ? 'bg-primary/40' : 'bg-border/40'
          )}
        />
      )}
      <div className="relative z-10">
        <div
          className={cn(
            'w-5 h-5 rounded-full flex items-center justify-center border transition-all duration-500',
            styles.circle
          )}
        >
          {getIcon()}
        </div>
      </div>
      <p className={cn('text-[9px] mt-2 text-center font-bold uppercase tracking-tight transition-all duration-500', styles.label)}>{label}</p>
      {formattedTime && (
        <p className="text-[8px] mt-0.5 text-center text-muted-foreground font-bold animate-in fade-in duration-1000">
          {formattedTime}
        </p>
      )}
    </div>
  );
};

interface BookingTimelineProps {
  booking: Booking;
}

export function BookingTimeline({ booking }: BookingTimelineProps) {
  const { status, createdAt, acceptedAt, startedAt, completedAt } = booking;
  
  const validStatuses: BookingStatus[] = ['pending', 'accepted', 'in_progress', 'marked_complete', 'completed', 'rejected', 'cancelled', 'upcoming', 'expired'];
  const safeStatus = validStatuses.includes(status) ? status : 'pending';

  if (safeStatus === 'rejected' || safeStatus === 'cancelled' || safeStatus === 'expired') {
    let Icon = XCircle;
    let text = 'Cancelled';
    let color = 'text-red-600';

    if(safeStatus === 'rejected') {
        text = 'Declined by Expert';
    }
    if(safeStatus === 'expired') {
        text = 'Request Expired';
        Icon = AlertTriangle;
        color = 'text-orange-600';
    }
    
    return (
      <div className={cn("text-center py-4 flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest bg-secondary/10 animate-in fade-in zoom-in-95 duration-500", color)}>
        <Icon className="w-4 h-4"/>
        <p>{text}</p>
      </div>
    );
  }

  const steps = [
    { label: 'Requested', timestamp: createdAt },
    { label: 'Accepted', timestamp: acceptedAt },
    { label: 'Live', timestamp: startedAt },
    { label: 'Done', timestamp: completedAt },
  ];
  
  const getStepStatus = (stepIndex: number): 'completed' | 'active' | 'inactive' => {
      const statusMap: Record<BookingStatus, number> = {
          pending: 0,
          accepted: 1,
          upcoming: 1,
          in_progress: 2,
          marked_complete: 2,
          completed: 3,
          cancelled: -1,
          rejected: -1,
          expired: -1
      };
      
      const currentStep = statusMap[safeStatus] ?? -1;

      if (stepIndex < currentStep) return 'completed';
      if (stepIndex === currentStep) return 'active';
      return 'inactive';
  };

  return (
    <div className="w-full px-2 pt-4 pb-4">
      <div className="flex justify-between items-start">
        {steps.map((step, index) => (
          <Step
            key={step.label}
            label={step.label}
            timestamp={step.timestamp}
            status={getStepStatus(index)}
            isFirst={index === 0}
            isLast={index === steps.length - 1}
          />
        ))}
      </div>
    </div>
  );
}