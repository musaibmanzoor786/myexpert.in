'use client';

import { useState, useEffect } from 'react';
import { Search, Sparkles } from 'lucide-react';
import { useLocationStore } from '@/lib/location-store';

export function FindingServiceScreen({ serviceName }: { serviceName: string }) {
  const { area: city } = useLocationStore();
  const [statusText, setStatusText] = useState("Locating nearby professionals...");

  useEffect(() => {
    const t1 = setTimeout(() => {
      setStatusText("Checking availability...");
    }, 1000);

    const t2 = setTimeout(() => {
      setStatusText("Connecting with best match...");
    }, 2000);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  return (
    <div className="fixed inset-0 z-[100] bg-white flex flex-col items-center justify-center animate-in fade-in duration-300 p-8 font-sans">
      <div className="relative flex flex-col items-center gap-12 w-full max-w-sm">
        
        {/* Premium Sweeping Radar Graphic */}
        <div className="relative w-64 h-64 rounded-full flex items-center justify-center bg-primary/5 border border-primary/10 overflow-hidden shadow-sm">
          {/* Conic rotating sweeping beam */}
          <div 
            className="absolute inset-0 pointer-events-none rounded-full"
            style={{
              background: 'conic-gradient(from 0deg, rgba(0, 168, 150, 0.4) 0%, rgba(0, 168, 150, 0) 30%, transparent 100%)',
              animation: 'spin 3s linear infinite',
            }}
          />

          {/* Pulse 1 */}
          <div 
            className="absolute inset-4 rounded-full border border-primary/20 animate-ping opacity-25" 
            style={{ animationDuration: '3s', animationDelay: '0s' }} 
          />
          {/* Pulse 2 */}
          <div 
            className="absolute inset-12 rounded-full border border-primary/30 animate-ping opacity-25" 
            style={{ animationDuration: '3s', animationDelay: '1s' }} 
          />
          {/* Pulse 3 */}
          <div 
            className="absolute inset-20 rounded-full border border-primary/40 animate-ping opacity-25" 
            style={{ animationDuration: '3s', animationDelay: '2s' }} 
          />

          {/* Concentric Circle Outlines */}
          <div className="absolute inset-8 rounded-full border border-primary/5" />
          <div className="absolute inset-16 rounded-full border border-primary/5" />
          <div className="absolute inset-24 rounded-full border border-primary/5" />

          {/* Glowing Center Node with Search Symbol */}
          <div className="relative z-10 w-16 h-16 bg-primary rounded-3xl flex items-center justify-center text-white shadow-xl shadow-primary/25 border border-white/20">
            <Search className="w-7 h-7 text-white animate-pulse" />
          </div>

          <div className="absolute -top-1 -right-1 bg-yellow-400 p-2 rounded-full shadow-lg border-2 border-white">
            <Sparkles className="w-4 h-4 text-yellow-950 fill-yellow-905" />
          </div>
        </div>

        {/* Status Text Region */}
        <div className="text-center space-y-4 w-full">
          <div className="space-y-1">
            <h2 className="text-xl font-black text-slate-900 tracking-tight">
              Finding <span className="text-primary">{serviceName}</span>
            </h2>
            <p className="text-sm font-bold text-muted-foreground">
              in {city || 'your area'}
            </p>
          </div>

          {/* Cycling Message Banner */}
          <div className="h-6 flex items-center justify-center">
            <span className="text-xs uppercase font-black tracking-widest text-primary animate-pulse">
              {statusText}
            </span>
          </div>

          <p className="text-xs text-slate-400 font-semibold px-4">
            Connecting you to Srinagar's topmost certified professionals...
          </p>
        </div>
      </div>
      
      {/* Dynamic Keyframe style injector to guarantee spinning radar */}
      <style jsx global>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
