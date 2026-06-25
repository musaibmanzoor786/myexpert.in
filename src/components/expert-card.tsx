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
    router.push(`/experts/${expert.id}`);
  };

  const handleViewProfileClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    handleCardClick();
  }
  
  const handleBookClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) {
      router.push('/login');
      return;
    }
    setIsModalOpen(true);
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
        onClick={handleCardClick}
        className="group relative w-full overflow-hidden border-border/40 bg-card transition-all duration-300 active:scale-[0.98] shadow-sm hover:shadow-xl hover:border-primary/20"
      >
        <CardContent className="p-4">
            <div className="flex gap-4">
                {/* Profile Photo with Status Ring */}
                <div className="relative shrink-0">
                    <Avatar className="w-16 h-16 rounded-2xl border-2 border-background shadow-sm">
                        <AvatarImage src={expert.profilePictureUrl} alt={expert.name} className="object-cover" />
                        <AvatarFallback className="bg-primary/5 text-primary text-xl font-black rounded-2xl">
                            {getInitials(expert.name)}
                        </AvatarFallback>
                    </Avatar>
                    <div className={cn(
                        "absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-background flex items-center justify-center",
                        expert.status === 'busy' ? "bg-orange-500" : "bg-green-500"
                    )}>
                        {expert.status === 'busy' ? <ZapOff className="w-3 h-3 text-white" /> : <Zap className="w-3 h-3 text-white fill-current" />}
                    </div>
                </div>

                {/* Info Section */}
                <div className="flex-1 min-w-0 py-0.5">
                    <div className="flex justify-between items-start gap-2">
                        <h3 className="text-base font-black tracking-tight flex items-center gap-1.5 truncate">
                          {expert.name}
                          {expert.isVerified && <CheckCircle className="w-4 h-4 text-primary fill-primary/10 shrink-0" />}
                        </h3>
                    </div>
                    
                    <div className="flex items-center gap-2 mt-1">
                        <div className="flex items-center gap-1">
                            <Star className="w-3 h-3 fill-yellow-500 text-yellow-500" />
                            <span className="text-xs font-black">{expert.rating || 'New'}</span>
                        </div>
                        <span className="text-[10px] text-muted-foreground font-bold">•</span>
                        <span className="text-xs text-muted-foreground font-bold truncate">
                            {expert.title}
                        </span>
                        {expert.status === 'busy' && (
                            <>
                                <span className="text-[10px] text-muted-foreground font-bold">•</span>
                                <span className="text-xs font-black text-orange-600 truncate">Busy</span>
                            </>
                        )}
                    </div>

                    <div className="flex items-center gap-3 mt-2 text-[11px] text-muted-foreground font-medium">
                        <div className="flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-primary/60" />
                            <span className="truncate">{expert.area || expert.location}</span>
                        </div>
                        {calculatedDistance !== null && (
                            <div className="flex items-center gap-1 text-primary">
                                <span className="text-muted-foreground/30">•</span>
                                <span className="font-extrabold text-[11px] flex items-center gap-0.5 whitespace-nowrap">
                                    📍 {calculatedDistance.toFixed(1)} km away
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            
            {/* Quick Action Bar */}
            <div className="mt-4 pt-4 border-t border-border/40 flex items-center gap-2">
                <Button 
                    onClick={handleBookClick} 
                    disabled={expert.status === 'busy'}
                    size="sm"
                    className="flex-1 h-10 rounded-xl text-xs font-black uppercase tracking-wider shadow-none"
                >
                    {expert.status === 'busy' ? 'Busy' : 'Book Now'}
                </Button>
                <Button 
                    variant="secondary"
                    onClick={handleViewProfileClick}
                    size="sm"
                    className="flex-1 h-10 rounded-xl text-xs font-black uppercase tracking-wider bg-secondary/50 hover:bg-secondary"
                >
                    Profile
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