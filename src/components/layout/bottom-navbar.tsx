'use client';

import { usePathname, useRouter } from 'next/navigation';
import { Home, Search, Calendar, Briefcase, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth, type AppTab } from '@/context/auth-context';

const navItems: { id: AppTab; icon: any; label: string }[] = [
  { id: 'home', icon: Home, label: 'Home' },
  { id: 'search', icon: Search, label: 'Search' },
  { id: 'history', icon: Calendar, label: 'Bookings' },
  { id: 'profile', icon: User, label: 'Profile' },
];

export function BottomNavbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, userProfile, pendingBookingsCount, activeTab, setActiveTab } = useAuth();

  if (!user) {
    return null;
  }
  
  const isAdmin = user.email === 'suhaibmanzoormugloo13@gmail.com';
  const isExpert = userProfile?.role === 'expert';                
  
  // Filter out tabs for admin or expert (exclude search for experts)
  const filteredNavItems = isAdmin 
    ? [] 
    : isExpert 
      ? navItems.filter((item) => item.id !== 'search') 
      : navItems;
  
  if (filteredNavItems.length === 0) {
    return null;
  }
  
  // HIDE NAVBAR for immersive "active task" routes (Searching, Booking, Detailed Expert View)
  const immersiveRoutes = ['/book/', '/experts/', '/search', '/select-location'];
  const isImmersive = immersiveRoutes.some(route => pathname.startsWith(route));
  
  if (isImmersive) {
      return null;
  }

  const handleTabClick = (tabId: AppTab) => {
    if (pathname !== '/') {
      router.push('/');
    }
    setActiveTab(tabId);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 border-t bg-background/95 backdrop-blur-3xl z-50 flex items-center justify-center shadow-lg w-full pb-[env(safe-area-inset-bottom)] h-[calc(4rem+env(safe-area-inset-bottom))]">
      <div className="flex h-full w-full items-center justify-between px-4">
        {filteredNavItems.map((item) => {
          let Icon = item.icon;
          let label = item.label;

          if (item.id === 'history' && isExpert) {
            Icon = Briefcase;
            label = 'Jobs';
          }
          
          const isActive = activeTab === item.id && pathname === '/';
          const isJobsOrBookingsTab = item.id === 'history';
          const showBadge = isJobsOrBookingsTab && isExpert && pendingBookingsCount > 0;

          return (
            <button
              key={item.id}
              onClick={() => handleTabClick(item.id)}
              className={cn(
                "flex flex-col items-center justify-center gap-1 transition-all duration-300 ease-out active:scale-95 flex-1 py-2",
                isActive ? 'text-primary' : 'text-muted-foreground hover:text-primary'
              )}
            >
              <div className="relative">
                <Icon className={cn("w-5 h-5", isActive && "stroke-[2.5px]")} />
                {showBadge && (
                    <span className="absolute -top-1 -right-2 flex h-3 w-3 items-center justify-center rounded-full bg-red-500 text-[6px] font-black text-white border border-background">
                        {pendingBookingsCount}
                    </span>
                )}
              </div>
              <span className={cn("text-[10px] font-semibold tracking-tight", isActive ? "opacity-100" : "opacity-70")}>{label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
