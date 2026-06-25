'use client';

import { useAuth } from '@/context/auth-context';
import { useRouter } from 'next/navigation';
import type { Customer } from '@/lib/types';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar, 
  MapPin, 
  Info, 
  FileText, 
  Shield, 
  Headset, 
  Trash2, 
  LogOut,
  User
} from 'lucide-react';
import Link from 'next/link';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface CustomerProfileProps {
  customer: Customer;
  bookingsCount: number;
}

const ProfileMenuItem = ({ 
  icon: Icon, 
  label, 
  onClick, 
  href,
  badge,
  isDestructive = false
}: { 
  icon: React.ElementType; 
  label: string; 
  onClick?: () => void;
  href?: string;
  badge?: string;
  isDestructive?: boolean;
}) => {
  const content = (
    <div className="flex items-center justify-between px-5 py-3 hover:bg-gray-50 transition-colors cursor-pointer border-b border-gray-100 last:border-b-0 group active:bg-gray-100/50">
      <div className="flex items-center gap-4">
        <div className={`p-2 rounded-xl ${isDestructive ? 'bg-red-50 text-red-500' : 'bg-gray-50 text-gray-400 group-hover:text-[#1A3C34]'} transition-colors`}>
          <Icon className="w-4 h-4" />
        </div>
        <div className="flex items-center gap-2">
          <span className={`font-semibold text-[14px] ${isDestructive ? 'text-red-500' : 'text-gray-700'}`}>{label}</span>
          {badge && (
            <span className="flex items-center gap-1 bg-yellow-50 text-yellow-600 text-[10px] font-black px-2 py-0.5 rounded-full border border-yellow-100">
              {badge}
            </span>
          )}
        </div>
      </div>
      <ChevronRight className="w-4 h-4 text-gray-300" />
    </div>
  );

  if (href) return <Link href={href}>{content}</Link>;
  return <div onClick={onClick}>{content}</div>;
};

export function CustomerProfile({ customer }: CustomerProfileProps) {
  const { logout, setActiveTab } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    logout();
  };

  const handleBookingsClick = () => {
    setActiveTab('history');
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-[#F8F9FB]">
      <div className="w-full">
      {/* Native-Style Compact Header */}
      <div className="bg-[#1A3C34] text-white px-5 pt-10 pb-10 shadow-lg">
        <div className="flex items-center gap-3 mb-6">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => window.history.length > 2 ? router.back() : router.push('/')}
            className="text-white hover:bg-white/10 rounded-full -ml-2 h-9 w-9"
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-lg font-black tracking-tight">Profile</h1>
        </div>

        <div className="flex items-center gap-5">
          <div className="relative">
            <Avatar className="h-16 w-16 border-[3px] border-white/10 shadow-xl">
              <AvatarFallback className="bg-white/20 text-white">
                <User className="w-8 h-8" />
              </AvatarFallback>
            </Avatar>
          </div>
          <div className="space-y-0.5">
            <h2 className="text-xl font-black tracking-tight leading-none">{customer.fullName}</h2>
            <p className="text-white/60 font-bold text-[12px]">{customer.mobileNumber}</p>
            <Link href="/edit-customer-profile" className="inline-flex items-center text-white text-[10px] font-bold mt-2 px-3 py-1 border border-white/40 rounded-full hover:bg-white/15 transition-all uppercase tracking-wider backdrop-blur-sm shadow-sm">
              Edit profile
            </Link>
          </div>
        </div>
      </div>

      {/* High-Density Menu Sections */}
      <div className="space-y-0 pb-24">
        {/* Core Actions Group */}
        <div>
          <ProfileMenuItem icon={Calendar} label="Your bookings" onClick={handleBookingsClick} />
          <ProfileMenuItem icon={MapPin} label="Address book" href="/select-location" />
        </div>

        {/* Informational Group */}
        <div className="mt-4">
          <ProfileMenuItem icon={Info} label="About us" href="/about" />
          <ProfileMenuItem icon={FileText} label="Terms & conditions" href="/terms" />
          <ProfileMenuItem icon={Shield} label="Privacy policy" href="/privacy" />
          <ProfileMenuItem icon={Headset} label="Help & support" onClick={() => window.open('https://wa.me/9103669564', '_blank')} />
        </div>

        {/* Critical Actions Group */}
        <div className="mt-4">
          <ProfileMenuItem icon={Trash2} label="Request account deletion" onClick={() => {}} />
          
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <div className="w-full">
                <ProfileMenuItem icon={LogOut} label="Log out" isDestructive />
              </div>
            </AlertDialogTrigger>
            <AlertDialogContent className="rounded-2xl">
              <AlertDialogHeader>
                <AlertDialogTitle className="font-black">Log out?</AlertDialogTitle>
                <AlertDialogDescription className="font-medium">
                  You will need to log in again to access your account and booking history.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter className="flex-row gap-2">
                <AlertDialogCancel className="rounded-xl flex-1 mt-0">Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleLogout} className="bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-xl flex-1">
                  Log Out
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>

        {/* System Info */}
        <div className="text-center py-4">
          <p className="text-[9px] font-black text-muted-foreground/30 uppercase tracking-[0.3em]">
            App Version: 1.4.1 (0533)
          </p>
        </div>
      </div>
     </div>
    </div>
  );
}