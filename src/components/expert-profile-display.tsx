'use client';

import { useAuth } from '@/context/auth-context';
import { useRouter } from 'next/navigation';
import type { Expert } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { 
  ChevronLeft, 
  ChevronRight, 
  Briefcase, 
  MapPin, 
  Share2, 
  Info, 
  FileText, 
  Shield, 
  Headset, 
  Trash2, 
  LogOut,
  User,
  ShieldCheck,
  Star,
  ClipboardList
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

interface ExpertProfileDisplayProps {
  expert: Expert;
  completedJobs: number;
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
    <div className="flex items-center justify-between p-3.5 bg-background border-b last:border-0 hover:bg-secondary/20 transition-colors cursor-pointer group active:scale-[0.98]">
      <div className="flex items-center gap-3.5">
        <div className={`p-2 rounded-lg ${isDestructive ? 'bg-destructive/5 text-destructive' : 'bg-secondary/50 text-muted-foreground group-hover:text-primary'} transition-colors`}>
          <Icon className="w-4.5 h-4.5" />
        </div>
        <div className="flex items-center gap-2">
          <span className={`font-bold text-[13.5px] ${isDestructive ? 'text-destructive' : 'text-foreground'}`}>{label}</span>
          {badge && (
            <span className="flex items-center gap-1 bg-yellow-100 text-yellow-700 text-[10px] font-black px-2 py-0.5 rounded-full border border-yellow-200">
              {badge}
            </span>
          )}
        </div>
      </div>
      <ChevronRight className="w-4 h-4 text-muted-foreground/40" />
    </div>
  );

  if (href) return <Link href={href}>{content}</Link>;
  return <div onClick={onClick}>{content}</div>;
};

export function ExpertProfileDisplay({ expert, completedJobs }: ExpertProfileDisplayProps) {
  const { logout, setActiveTab, user } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    logout();
  };

  const handleJobsClick = () => {
    setActiveTab('history');
    router.push('/');
  };

  const handleSupportClick = () => {
    const message = encodeURIComponent(`Hello, I need help. My UID is: ${user?.uid || 'Unknown'}`);
    window.open(`https://wa.me/9103669564?text=${message}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-[#F8F9FB]">
      <div className="w-full max-w-4xl mx-auto">
      {/* Native-Style Compact Header */}
      <div className="bg-[#1A3C34] text-white px-5 pt-14 pb-14 rounded-b-[2.5rem] shadow-lg">
        <div className="flex items-center gap-3 mb-6">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => window.history.length > 2 ? router.back() : router.push('/')}
            className="text-white hover:bg-white/10 rounded-full -ml-2 h-9 w-9"
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-lg font-black tracking-tight">Expert Profile</h1>
        </div>

        <div className="flex items-center gap-5">
          <div className="relative">
            <Avatar className="h-16 w-16 border-[3px] border-white/10 shadow-xl">
              {expert.profilePictureUrl ? (
                <AvatarImage src={expert.profilePictureUrl} alt={expert.name} className="object-cover" />
              ) : (
                <AvatarFallback className="bg-white/20 text-white">
                  <User className="w-8 h-8" />
                </AvatarFallback>
              )}
            </Avatar>
            {expert.isVerified && (
                <div className="absolute -bottom-1 -right-1 bg-[#00B894] text-white rounded-full p-1 border-2 border-[#1A3C34]">
                    <ShieldCheck className="h-3 w-3" />
                </div>
            )}
          </div>
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
                <h2 className="text-xl font-black tracking-tight leading-none">{expert.name}</h2>
                <div className="flex items-center bg-yellow-400 text-yellow-950 px-1.5 py-0.5 rounded text-[9px] font-black">
                    <Star className="w-2.5 h-2.5 fill-current mr-0.5" />
                    {expert.rating || 'New'}
                </div>
            </div>
            <p className="text-white/60 font-bold text-[12px]">{expert.phone}</p>
            <Link href="/edit-expert-profile" className="inline-flex items-center text-[#00B894] text-[12px] font-black mt-2 group uppercase tracking-wider">
              Edit profile 
              <ChevronRight className="w-3 h-3 ml-0.5 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>
        </div>
      </div>

      {/* High-Density Menu Sections */}
      <div className="px-2 -mt-6 space-y-4 pb-24">
        {/* 2-Column Row for jobs and support */}
        <div className="grid grid-cols-2 gap-2">
          {/* Card 1: Address */}
          <Link 
            href="/select-location"
            className="flex flex-col items-center justify-center p-3 bg-white rounded-2xl border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] transition-all hover:border-primary/20 active:scale-95 cursor-pointer text-center"
          >
            <div className="p-2 bg-slate-50 text-slate-500 rounded-xl mb-1">
              <MapPin className="w-5 h-5 text-[#1A3C34]" />
            </div>
            <span className="text-xs font-black text-slate-800">
              Address
            </span>
          </Link>

          {/* Card 2: Help & Support */}
          <div 
            onClick={handleSupportClick}
            className="flex flex-col items-center justify-center p-3 bg-white rounded-2xl border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] transition-all hover:border-primary/20 active:scale-95 cursor-pointer text-center"
          >
            <div className="p-2 bg-slate-50 text-slate-500 rounded-xl mb-1">
              <Headset className="w-5 h-5 text-[#1A3C34]" />
            </div>
            <span className="text-xs font-black text-slate-800">
              Help & Support
            </span>
          </div>
        </div>

        {/* Combined menu block */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] overflow-hidden">
          <div onClick={() => {
              if (navigator.share) {
                navigator.share({
                  title: 'Check out this app!',
                  text: 'Download this app to get expert services.',
                  url: window.location.origin,
                }).catch(console.error);
              }
            }}
            className="flex items-center justify-between px-5 py-3 hover:bg-gray-50 transition-colors cursor-pointer border-b border-gray-100 group active:bg-gray-100/50"
          >
            <div className="flex items-center gap-4">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                    <Share2 className="w-4 h-4" />
                </div>
                <span className="font-semibold text-[14px] text-gray-700">Share with friends</span>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-300" />
          </div>

          <ProfileMenuItem icon={ClipboardList} label="My jobs" onClick={handleJobsClick} />
          <ProfileMenuItem icon={Info} label="About MyExpert" href="/about" />
          <ProfileMenuItem icon={FileText} label="Terms & conditions" href="/terms" />
          <ProfileMenuItem icon={Shield} label="Privacy policy" href="/privacy" />
          
          <ProfileMenuItem icon={Trash2} label="Request account deletion" isDestructive onClick={() => {}} />
          
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
                  You will need to log in again to receive new job requests from customers.
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
