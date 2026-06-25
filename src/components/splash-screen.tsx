'use client';

import { useEffect, useState } from 'react';

interface SplashScreenProps {
  message?: string;
}

/**
 * High-fidelity Splash Screen that acts as a native-feel boot overlay.
 */
export function SplashScreen({ message }: SplashScreenProps) {
  // Use the custom local identity message as default or when message is "Setting up..."
  const isDefaultOrSettingUp = !message || message === "Setting up...";
  
  const [displayText, setDisplayText] = useState(
    isDefaultOrSettingUp ? "Kashmir’s Own Local Home Expert Booking App." : message
  );
  
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (!isDefaultOrSettingUp) {
      setDisplayText(message);
      return;
    }

    // Set a timer to transition the text after 3 seconds
    const timer = setTimeout(() => {
      setIsVisible(false); // Fade out
      
      const changeTextTimer = setTimeout(() => {
        setDisplayText("Trusted Experts, Just a Tap Away.");
        setIsVisible(true); // Fade in
      }, 400); // Wait for fade out to finish before changing text and fading back in

      return () => clearTimeout(changeTextTimer);
    }, 3000);

    return () => clearTimeout(timer);
  }, [message, isDefaultOrSettingUp]);

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#00B894] animate-in fade-in duration-300">
      {/* Ambient Glow */}
      <div className="absolute w-[300px] h-[300px] bg-white/10 rounded-full blur-[80px] pointer-events-none" />
      
      <div className="relative z-10 flex flex-col items-center space-y-6 max-w-xs sm:max-w-sm px-4">
        <div className="relative group flex items-center justify-center">
          <div className="absolute inset-0 bg-white/20 rounded-full blur-xl scale-150 transition-transform duration-1000" />
          <span className="relative z-10 text-white text-5xl font-black tracking-tight select-none font-sans drop-shadow-sm">
            MyExpert
          </span>
        </div>
        
        <div className="text-center min-h-[4rem] flex items-center justify-center">
          <p 
            className={`text-white font-semibold tracking-wide text-base transition-all duration-300 ease-in-out px-4 leading-relaxed ${
              isVisible ? 'opacity-90 transform translate-y-0 scale-100' : 'opacity-0 transform translate-y-2 scale-95'
            }`}
          >
            {displayText}
          </p>
        </div>
      </div>

      {/* Loading Rhythm Indicator */}
      <div className="absolute bottom-16 flex gap-1.5">
        <div className="w-1.5 h-1.5 bg-white/40 rounded-full animate-pulse" />
        <div className="w-1.5 h-1.5 bg-white/40 rounded-full animate-pulse delay-150" />
        <div className="w-1.5 h-1.5 bg-white/40 rounded-full animate-pulse delay-300" />
      </div>
    </div>
  );
}

