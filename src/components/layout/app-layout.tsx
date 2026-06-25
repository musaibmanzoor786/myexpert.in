'use client';

import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { BottomNavbar } from './bottom-navbar';
import { useAuth } from '@/context/auth-context';
import { useEffect, useMemo, useState } from 'react';
import { GlobalLoader } from '../ui/global-loader';
import { useToast } from '@/hooks/use-toast';
import { SplashScreen } from '../splash-screen';

/**
 * AppLayout manages the global native-feel scaffolding.
 * It handles routing security, offline detection, and the splash screen lifecycle.
 */
export function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, userProfile, loading, profileLoaded, isCatchingLocation } = useAuth();
  const { toast } = useToast();
  const [mounted, setMounted] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);
  
  useEffect(() => {
    // Reset redirecting state once navigation completes to the target
    setIsRedirecting(false);
  }, [pathname]);
  
  const isAdmin = useMemo(() => user?.email === 'suhaibmanzoormugloo13@gmail.com', [user]);
  
  const noLayoutPaths = useMemo(() => [
    '/login', 
    '/signup', 
    '/verify-email', 
    '/select-location', 
    '/pick-role',
    '/profile-setup',
    '/customer-profile-setup',
    '/edit-customer-profile',
    '/edit-expert-profile',
    '/about',
    '/terms',
    '/privacy',
    '/refund-policy'
  ], []);
  
  const showLayout = !noLayoutPaths.some((path) => pathname === path);

  // Native-style Offline Detection
  useEffect(() => {
    const handleOffline = () => {
      toast({
        variant: 'warning',
        description: "Please check your internet connection",
      });
    };

    window.addEventListener('offline', handleOffline);
    return () => window.removeEventListener('offline', handleOffline);
  }, [toast]);

  // Robust Native Routing Engine
  useEffect(() => {
    if (loading || !profileLoaded || isCatchingLocation || !mounted) return;

    const publicPaths = ['/login', '/signup'];
    const isPublicPath = publicPaths.includes(pathname);
    const informationalPaths = ['/about', '/terms', '/privacy', '/refund-policy'];
    const isInformationalPath = informationalPaths.includes(pathname);
    const isExpertProfile = pathname.startsWith('/experts/');
    const isLocationPath = pathname === '/select-location';

    if (!user) {
      if (!isPublicPath && !isInformationalPath && !isExpertProfile && !isLocationPath) {
        setIsRedirecting(true);
        router.replace('/login');
      }
    } else {
      const hasLocation = !!userProfile?.locationData || !!userProfile?.location;
      const isProfileComplete = !!userProfile?.profileComplete;
      const hasRole = !!userProfile?.role;
      const isAdmin = user?.email === 'suhaibmanzoormugloo13@gmail.com';

      if (isAdmin && pathname !== '/admin') {
        setIsRedirecting(true);
        router.replace('/admin');
        return;
      }

      if (isPublicPath) {
        setIsRedirecting(true);
        router.replace('/');
      } else if (!hasRole && pathname !== '/pick-role' && !isAdmin) {
        setIsRedirecting(true);
        router.replace('/pick-role');
      } else if (hasRole && !isProfileComplete) {
        const setupPath = userProfile.role === 'expert' ? '/profile-setup' : '/customer-profile-setup';
        if (pathname !== setupPath) {
          setIsRedirecting(true);
          router.replace(setupPath);
        }
      } else if (isProfileComplete && !hasLocation && !isLocationPath) {
        setIsRedirecting(true);
        router.replace('/select-location');
      }
    }
  }, [user, userProfile, loading, isCatchingLocation, pathname, router, mounted]);

  const legalPages = ['/about', '/terms', '/privacy', '/refund-policy'];
  const isLegalPage = legalPages.includes(pathname);
  const isDashboard = pathname === '/';

  // NATIVE BOOT: Show splash if loading OR silently catching location
  const isBooting = loading || isCatchingLocation || isRedirecting;

  if (!mounted) {
    return (
      <div className="flex flex-col min-h-screen bg-background safe-bottom overflow-x-hidden">
        <GlobalLoader />
        <main className={cn(
          "flex-grow w-full transform-gpu block",
          !showLayout ? "w-full" : (isDashboard ? "pb-[calc(4rem+env(safe-area-inset-bottom)+2rem)] md:pb-32" : "py-4 pb-[calc(4rem+env(safe-area-inset-bottom)+1rem)] md:pb-12")
        )}>
          {children}
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background safe-bottom overflow-x-hidden">
      {isBooting && <SplashScreen message={isCatchingLocation ? "Pinpointing Location..." : (isRedirecting ? "Setting up..." : undefined)} />}

      <GlobalLoader />
      
      <main className={cn(
        "flex-grow w-full transform-gpu",
        !showLayout ? "w-full" : (isDashboard ? "pb-[calc(4rem+env(safe-area-inset-bottom)+2rem)] md:pb-32" : "py-4 pb-[calc(4rem+env(safe-area-inset-bottom)+1rem)] md:pb-12"),
        isBooting ? "hidden" : "block"
      )}>
        {!isBooting && children}
      </main>

      {showLayout && !isLegalPage && <BottomNavbar />}
    </div>
  );
}
