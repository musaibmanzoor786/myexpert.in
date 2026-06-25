'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { LogOut, User, Loader2, Bell } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { usePathname } from 'next/navigation';
import { AppLogo } from '../app-logo';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

export function AppHeader() {
  const { user, userProfile, logout, loading } = useAuth();
  const pathname = usePathname();
  const isMobile = useIsMobile();

  // Remove header on all mobile pages
  if (isMobile) {
    return null;
  }

  const hiddenPaths = ['/login', '/signup', '/verify-email'];
  if (hiddenPaths.includes(pathname)) {
    return null;
  }
  
  const getInitials = () => {
    if (userProfile?.fullName) {
      const names = userProfile?.fullName?.trim().split(/\s+/);
      if (names.length > 1 && names[0] && names[names.length - 1]) {
        return (names[0][0] + names[names.length - 1][0]).toUpperCase();
      }
      if (names[0]) {
        return names[0].substring(0, 2).toUpperCase();
      }
    }
    if (user?.email) {
      return user.email.charAt(0).toUpperCase();
    }
    return '?';
  };

  const isGoogleUser = user?.providerData.some(p => p.providerId === 'google.com');
  const isVerified = user?.emailVerified || isGoogleUser;

  const desktopNavItems = [
    { href: '/', label: 'Home' },
    { href: '/history', label: userProfile?.role === 'expert' ? 'Jobs' : 'Bookings' },
  ];

  const renderAuthSection = () => {
    if (loading) {
      return <div className="h-10 w-10 flex items-center justify-center"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>;
    }

    if (user && isVerified) {
      return (
        <div className="flex items-center gap-4">
            <Link href="/notifications">
              <Button variant="ghost" size="icon" className="relative h-10 w-10 rounded-full hover:bg-secondary">
                <Bell className="h-5 w-5" />
                {/* Desktop badge could be added here if needed */}
              </Button>
            </Link>

            <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                    <Avatar className="h-9 w-9">
                        {userProfile?.role === 'expert' && <AvatarImage src={(userProfile as any)?.profilePictureUrl} alt={userProfile?.fullName || ''} />}
                        <AvatarFallback className="font-semibold">
                            {getInitials()}
                        </AvatarFallback>
                    </Avatar>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{userProfile?.fullName || "My Account"}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                    {user.email || userProfile?.phone || ''}
                    </p>
                </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                    <Link href="/profile"><User className="mr-2 h-4 w-4" />Profile</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout}>
                <LogOut className="mr-2 h-4 w-4" />
                Log out
                </DropdownMenuItem>
            </DropdownMenuContent>
            </DropdownMenu>
        </div>
      );
    }

    if (user && !isVerified) {
       return (
            <Button variant="outline" onClick={logout}>
            <LogOut className="mr-2 h-4 w-4" />
            Logout
            </Button>
      );
    }

    return (
      <div className='flex items-center gap-2'>
        <Button variant="ghost" asChild>
          <Link href="/login">Log In</Link>
        </Button>
        <Button asChild>
          <Link href="/signup">Sign Up</Link>
        </Button>
      </div>
    );
  };
  
  return (
    <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b">
      <div className="w-full px-4 md:px-12 lg:px-24 mx-auto">
        <div className="flex h-18 md:h-20 items-center justify-between">
            <div className="flex items-center gap-8">
                <Link href="/" className="flex items-center text-foreground hover:opacity-80 transition-opacity">
                    <AppLogo className="h-8 w-auto" />
                </Link>
                {user && (
                    <nav className="hidden md:flex items-center gap-6 text-base font-medium">
                        {desktopNavItems.map((item) => (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={cn(
                                    'transition-colors hover:text-primary',
                                    (pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))) 
                                        ? 'text-foreground font-semibold' 
                                        : 'text-muted-foreground'
                                )}
                            >
                                {item.label}
                            </Link>
                        ))}
                    </nav>
                )}
            </div>

            <div className="flex items-center">
                {renderAuthSection()}
            </div>
        </div>
      </div>
    </header>
  );
}
