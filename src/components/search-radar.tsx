'use client';

import { useEffect, useState } from 'react';
import { User, MapPin } from 'lucide-react';
import { useLocationStore } from '@/lib/location-store';

interface SearchRadarProps {
  serviceName: string;
}

const serviceEmojiMap: Record<string, string> = {
  'plumber': '🔧',
  'electrician': '⚡',
  'carpenter': '🪚',
  'painter': '🖌️',
  'cook': '🍳',
  'photographer': '📸',
  'mehendi': '🌸',
  'mehendi artist': '🌸',
};

// Fixed positions for discovery circles (angle in degrees, radius in %)
const discoveredPositions = [
  { angle: 45, radius: 35, delay: 0.25 },
  { angle: 120, radius: 25, delay: 0.66 },
  { angle: 200, radius: 40, delay: 1.1 },
  { angle: 280, radius: 20, delay: 1.5 },
  { angle: 330, radius: 30, delay: 1.8 },
];

export function SearchRadar({ serviceName }: SearchRadarProps) {
  const { area: city } = useLocationStore();
  const [activeExperts, setActiveExperts] = useState<number[]>([]);

  useEffect(() => {
    // Reveal experts based on sweep timing (2s rotation)
    const timers = discoveredPositions.map((pos, index) => {
      return setTimeout(() => {
        setActiveExperts((prev) => [...prev, index]);
      }, pos.delay * 1000);
    });

    return () => timers.forEach(clearTimeout);
  }, []);

  const emoji = serviceEmojiMap[serviceName.toLowerCase()] || '🔍';

  return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col items-center justify-center overflow-hidden animate-in fade-in duration-500">
      {/* --- RADAR SECTION --- */}
      <div className="relative w-full aspect-square max-w-[320px] flex items-center justify-center">
        
        {/* Outer subtle circle */}
        <div className="absolute inset-0 border border-primary/40 rounded-full scale-[0.7]" />
        
        {/* Inner concentric circles */}
        <div className="absolute inset-0 border border-primary/20 rounded-full scale-[0.45]" />
        <div className="absolute inset-0 border border-primary/20 rounded-full scale-[0.2]" />

        {/* Rotating Sweep Line & Trail */}
        <div className="absolute inset-0 animate-radar-sweep origin-center">
          {/* The trail glow */}
          <div 
            className="absolute top-1/2 left-1/2 w-1/2 h-1/2 -translate-y-full origin-bottom-left opacity-30"
            style={{
              background: 'conic-gradient(from 180deg at 0% 100%, transparent 0deg, hsl(var(--primary)) 90deg)',
              maskImage: 'radial-gradient(circle at bottom left, black, transparent 70%)',
              WebkitMaskImage: 'radial-gradient(circle at bottom left, black, transparent 70%)',
            }}
          />
          {/* The main sweep line */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1.5px] h-1/2 bg-primary/60 origin-bottom" />
        </div>

        {/* Discovered Expert Circles */}
        {discoveredPositions.map((pos, index) => {
          const isFound = activeExperts.includes(index);
          if (!isFound) return null;

          return (
            <div
              key={index}
              className="absolute animate-pop-in"
              style={{
                top: `calc(50% + ${Math.sin((pos.angle - 90) * (Math.PI / 180)) * pos.radius}%)`,
                left: `calc(50% + ${Math.cos((pos.angle - 90) * (Math.PI / 180)) * pos.radius}%)`,
              }}
            >
              <div className="w-10 h-10 bg-white border border-primary rounded-full flex items-center justify-center shadow-lg animate-pulse-subtle">
                <User className="w-5 h-5 text-primary" />
              </div>
            </div>
          );
        })}

        {/* Center Service Icon */}
        <div className="relative z-10 w-14 h-14 bg-white border-2 border-primary rounded-full flex items-center justify-center shadow-xl">
          <span className="text-2xl">{emoji}</span>
        </div>
      </div>

      {/* --- TEXT SECTION --- */}
      <div className="mt-12 text-center space-y-5 px-8 max-w-sm">
        <h2 className="text-2xl sm:text-3xl font-black text-[#1A1A1A] leading-[1.1] tracking-tighter">
          Finding The Best <span className="text-primary uppercase">{serviceName}</span> Experts Near You
        </h2>

        <div className="flex flex-col items-center gap-3">
          <div className="flex items-center justify-center gap-1.5 text-[#888888] font-bold text-sm bg-secondary/50 px-4 py-1.5 rounded-full">
            <MapPin className="w-4 h-4" />
            <span>{city}</span>
          </div>

          {/* Animated Dots */}
          <div className="flex justify-center gap-2 pt-2">
            <div className="w-2.5 h-2.5 bg-primary rounded-full animate-dot-blink shadow-[0_0_8px_rgba(var(--primary),0.4)]" />
            <div className="w-2.5 h-2.5 bg-primary rounded-full animate-dot-blink [animation-delay:0.2s] shadow-[0_0_8px_rgba(var(--primary),0.4)]" />
            <div className="w-2.5 h-2.5 bg-primary rounded-full animate-dot-blink [animation-delay:0.4s] shadow-[0_0_8px_rgba(var(--primary),0.4)]" />
          </div>
        </div>
      </div>
    </div>
  );
}
