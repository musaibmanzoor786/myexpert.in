
'use client';

import { MapPin } from 'lucide-react';

interface LocationConfirmedScreenProps {
  area: string;
  address: string;
}

export function LocationConfirmedScreen({ area, address }: LocationConfirmedScreenProps) {
  return (
    <div className="fixed inset-0 z-[100] bg-white flex flex-col items-center justify-center p-8 animate-in fade-in duration-500">
      <div className="flex flex-col items-center text-center animate-in zoom-in-95 duration-700">
        {/* Map Circle Illustration */}
        <div className="relative w-48 h-48 mb-10">
          <div className="absolute inset-0 bg-[#F0FDF9] rounded-full" />
          
          {/* Subtle Grid Lines inside circle */}
          <div className="absolute inset-0 opacity-10" style={{
            backgroundImage: 'radial-gradient(#00B894 1px, transparent 1px)',
            backgroundSize: '20px 20px'
          }} />

          {/* Centered Pin */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
            <div className="relative">
              <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-4 h-1.5 bg-black/10 rounded-full blur-[2px]" />
              <MapPin className="w-12 h-12 text-[#00B894] fill-[#00B894]/10 animate-bounce" />
            </div>
          </div>
        </div>

        <div className="space-y-3 max-w-xs">
          <h2 className="text-2xl font-black text-[#1A1A1A] leading-tight tracking-tight">
            {area}
          </h2>
          <p className="text-sm text-[#888888] font-medium leading-relaxed px-4">
            {address}
          </p>
        </div>
      </div>
    </div>
  );
}
