'use client';

import { useAuth } from '@/context/auth-context';
import { HomePage } from '@/components/customer-home';
import { SearchView } from '@/components/search-view';
import { HistoryView } from '@/components/history-view';
import { ProfileView } from '@/components/profile-view';
import { cn } from '@/lib/utils';
import { useEffect, Suspense } from 'react';

export default function Page() {
  const { activeTab, setActiveTab } = useAuth();

  useEffect(() => {
    setActiveTab('home');
  }, [setActiveTab]);

  return (
    <div className="relative w-full h-full">
      <div className={cn("w-full", activeTab === 'home' ? "block" : "hidden")}>
        <HomePage />
      </div>

      <div className={cn("w-full", activeTab === 'search' ? "block" : "hidden")}>
        <Suspense fallback={<div className="p-5 text-center text-slate-500">Loading...</div>}>
          <SearchView />
        </Suspense>
      </div>
      
      <div className={cn("w-full", activeTab === 'history' ? "block" : "hidden")}>
        <Suspense fallback={<div className="p-5 text-center text-slate-500">Loading...</div>}>
          <HistoryView />
        </Suspense>
      </div>
      
      <div className={cn("w-full", activeTab === 'profile' ? "block" : "hidden")}>
        <ProfileView />
      </div>
    </div>
  );
}
