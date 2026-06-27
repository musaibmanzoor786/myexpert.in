'use client';

import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { Expert } from '@/lib/types';
import { MapPin, CheckCircle, Zap, ZapOff, Star, ChevronRight } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { useState, useMemo } from 'react';
import { BookingConfirmationModal } from './booking-confirmation-modal';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { cn, getDistance } from '@/lib/utils';
import { useLocationStore } from '@/lib/location-store';

interface ExpertCardProps {
  expert: Expert;
  problem?: string;
}

export function ExpertCard({ expert, problem }: ExpertCardProps) {
  const { user } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const router = useRouter();
  
  const { lat, lng } = useLocationStore();

  const calculatedDistance = useMemo(() => {
    const latVal = lat || 34.0837; // fallback to Srinagar
    const lngVal = lng || 74.7973;
    if (expert.currentLocation?.lat && expert.currentLocation?.lng) {
      return getDistance(latVal, lngVal, expert.currentLocation.lat, expert.currentLocation.lng);
    }
    return null;
  }, [lat, lng, expert.currentLocation]);
  
  const handleCardClick = () => {
    if (expert.status === 'busy') return;
    if (typeof window !== 'undefined') {
      sessionStorage.setItem(`expert_profile_${expert.id}`, JSON.stringify(expert));
    }
    router.push(`/experts/${expert.id}`);
  };

  const handleViewProfileClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (expert.status === 'busy') return;
    handleCardClick();
  }
  
  const handleBookClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (expert.status === 'busy') return;
    if (typeof window !== 'undefined') {
      sessionStorage.setItem(`expert_profile_${expert.id}`, JSON.stringify(expert));
    }
    router.push(`/experts/${expert.id}`);
  };
  
  const getInitials = (name: string) => {
    if (!name) return '';
    const names = name.trim().split(/\s+/);
    if (names.length > 1 && names[0] && names[names.length - 1]) {
      return (names[0][0] + names[names.length - 1][0]).toUpperCase();
    }
    if (names[0]) {
      return names[0].substring(0, 2).toUpperCase();
    }
    return '';
  };

  return (
    <>
      <Card 
        onClick={expert.status === 'busy' ? undefined : handleCardClick}
        className={cn(
          "group relative w-full overflow-hidden border border-slate-100 bg-white transition-all duration-300 shadow-sm rounded-[2rem]",
          expert.status === 'busy' 
            ? "opacity-60 saturate-50 cursor-not-allowed" 
            : "hover:-translate-y-0.5 hover:shadow-md hover:border-primary/20 active:scale-[0.99] cursor-pointer"
        )}
      >
        <CardContent className="p-5">
            <div className="flex gap-4">
                {/* Profile Photo with Status Ring */}
                <div className="relative shrink-0">
                    <Avatar className="w-16 h-16 rounded-[1.5rem] border-2 border-slate-50 shadow-sm">
                        <AvatarImage src={expert.profilePictureUrl} alt={expert.name} className="object-cover" />
                        <AvatarFallback className="bg-primary/5 text-primary text-xl font-black rounded-[1.5rem]">
                            {getInitials(expert.name)}
                        </AvatarFallback>
                    </Avatar>
                    <div className={cn(
                        "absolute -bottom-1 -right-1 px-1.5 py-0.5 rounded-full text-[8px] font-black uppercase text-white border border-white shadow-sm",
                        expert.status === 'busy' ? "bg-orange-500" : "bg-green-500"
                    )}>
                        {expert.status === 'busy' ? 'Busy' : 'Online'}
                    </div>
                </div>

                {/* Info Section */}
                <div className="flex-1 min-w-0 py-0.5">
                    <div className="flex justify-between items-start gap-2">
                        <h3 className="text-base font-black tracking-tight text-slate-800 flex items-center gap-1.5 truncate group-hover:text-primary transition-colors">
                          {expert.name}
                          {expert.isVerified && <CheckCircle className="w-4 h-4 text-primary fill-primary/10 shrink-0" />}
                        </h3>
                    </div>
                    
                    <div className="flex items-center flex-wrap gap-2 mt-1">
                        <div className="inline-flex items-center gap-1 bg-amber-500/[0.08] text-amber-700 border border-amber-500/10 px-2 py-0.5 rounded-lg text-[10px] font-black">
                            <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                            <span>{expert.rating || 'New'}</span>
                        </div>
                        <span className="text-xs text-slate-500 font-extrabold truncate bg-slate-50 border border-slate-100 px-2 py-0.5 rounded-lg">
                             {expert.title || expert.serviceType}
                        </span>
                    </div>

                    <div className="flex items-center gap-3 mt-2.5 text-[11px] text-slate-500 font-medium">
                        <div className="flex items-center gap-1 bg-slate-50/50 px-2 py-0.5 rounded-lg border border-slate-100/50">
                            <MapPin className="w-3 h-3 text-slate-400" />
                            <span className="truncate max-w-[120px]">{expert.area || expert.location}</span>
                        </div>
                        {calculatedDistance !== null && (
                            <div className="flex items-center gap-1 text-primary bg-primary/[0.04] px-2 py-0.5 rounded-lg border border-primary/5">
                                <span className="font-extrabold text-[11px] flex items-center gap-0.5 whitespace-nowrap">
                                    📍 {calculatedDistance.toFixed(1)} km away
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            
            {/* Quick Action Bar */}
            <div className="mt-4 pt-4 border-t border-slate-100">
                <Button 
                    onClick={handleBookClick} 
                    disabled={expert.status === 'busy'}
                    size="sm"
                    className="w-full h-11 rounded-2xl text-xs font-black uppercase tracking-wider transition-all duration-300 bg-primary hover:bg-primary/90 text-white shadow-md hover:shadow-primary/10 active:scale-95 disabled:bg-slate-100 disabled:text-slate-400 disabled:shadow-none"
                >
                    {expert.status === 'busy' ? 'Currently Busy' : 'Book Now'}
                </Button>
            </div>
        </CardContent>
      </Card>
      {isModalOpen && (
        <BookingConfirmationModal
          expert={expert}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          problem={problem}
        />
      )}
    </>
  );
}