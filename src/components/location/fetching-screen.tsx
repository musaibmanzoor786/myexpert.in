
'use client';

import { MapPin } from 'lucide-react';

export function LocationFetchingScreen() {
  return (
    <div className="fixed inset-0 z-[100] bg-white flex flex-col items-center justify-center animate-in fade-in duration-500">
      <div className="relative flex flex-col items-center gap-8">
        {/* Pulsing Pin Wrapper */}
        <div className="relative">
          <div className="absolute inset-0 bg-[#00B894]/20 rounded-full animate-ping scale-150" />
          <div className="relative w-20 h-20 bg-[#00B894]/10 rounded-full flex items-center justify-center animate-pulse-subtle">
            <MapPin className="w-10 h-10 text-[#00B894] fill-[#00B894]/20" />
          </div>
        </div>

        <div className="text-center space-y-2">
          <h2 className="text-xl font-black text-[#1A1A1A] tracking-tight">
            Fetching your location...
          </h2>
          <div className="flex justify-center gap-1.5 pt-2">
            <div className="w-1.5 h-1.5 bg-[#00B894]/40 rounded-full animate-bounce [animation-delay:-0.3s]" />
            <div className="w-1.5 h-1.5 bg-[#00B894]/40 rounded-full animate-bounce [animation-delay:-0.15s]" />
            <div className="w-1.5 h-1.5 bg-[#00B894]/40 rounded-full animate-bounce" />
          </div>
        </div>
      </div>
    </div>
  );
}
