
'use client';

import { Button } from '@/components/ui/button';
import { Target, MapPin, ShieldCheck, ChevronLeft } from 'lucide-react';

interface LocationPermissionScreenProps {
  onUseCurrent: () => void;
  onEnterManual: () => void;
  onBack?: () => void;
}

export function LocationPermissionScreen({ onUseCurrent, onEnterManual, onBack }: LocationPermissionScreenProps) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white animate-in slide-in-from-bottom-10 duration-500">
      {onBack && (
        <button onClick={onBack} className="absolute top-4 left-4 p-2 bg-gray-100 rounded-full">
            <ChevronLeft className="h-6 w-6 text-gray-700" />
        </button>
      )}
      <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
        <div className="relative mb-10 w-32 h-32 flex items-center justify-center rounded-3xl bg-[#00B894]/10">
           <MapPin className="h-16 w-16 text-[#00B894]" />
        </div>
        <div className="space-y-4">
          <h1 className="text-2xl font-bold tracking-tight text-[#1A1A1A]">
            Find Experts Near You
          </h1>
          <p className="text-muted-foreground text-center px-6">
            We use your location to connect you with the top-rated professionals in your immediate neighborhood.
          </p>
        </div>
      </div>

      <div className="p-6 pb-safe-area space-y-4">
        <Button 
          onClick={onUseCurrent}
          className="w-full h-14 rounded-2xl bg-[#00B894] hover:bg-[#00A383] text-lg font-bold shadow-lg shadow-[#00B894]/20 active:scale-95 transition-all text-white"
        >
          Allow Location Access
        </Button>
        
        <div className="flex justify-center">
            <button 
              onClick={onEnterManual}
              className="py-2 text-[#00B894] font-semibold text-sm transition-colors"
            >
              Not Now, Enter Manually
            </button>
        </div>
      </div>
    </div>
  );
}
