'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useBookings } from '@/hooks/use-bookings';
import { Inbox } from 'lucide-react';
import { BookingCardCustomer } from './booking-card-customer';
import type { Booking } from '@/lib/types';
import { Timestamp } from 'firebase/firestore';
import { useState } from 'react';
import { Button } from './ui/button';
import { Skeleton } from './ui/skeleton';
import { Card, CardContent } from './ui/card';
import { cn } from '@/lib/utils';

// Helper to safely convert Firestore Timestamps
const getDate = (value: any): Date | null => {
  if (!value) return null;
  if (value instanceof Timestamp) return value.toDate();
  if (typeof value?.toDate === 'function') return value.toDate(); 
  return null;
};

const BookingSkeleton = () => (
    <Card className="overflow-hidden shadow-sm border-border/40">
        <CardContent className="p-4 flex items-center gap-3">
            <Skeleton className="w-10 h-10 rounded-lg shrink-0" />
            <div className="flex-1 space-y-2">
                <div className="flex justify-between items-center">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-12 rounded-full" />
                </div>
                <div className="flex gap-2">
                    <Skeleton className="h-3 w-16" />
                    <Skeleton className="h-3 w-12" />
                </div>
            </div>
        </CardContent>
    </Card>
);

export function CustomerBookings({ defaultTab }: { defaultTab?: string }) {
  const { bookings, loading } = useBookings('customer');
  const [visibleCompleted, setVisibleCompleted] = useState(3);
  const [visibleArchived, setVisibleArchived] = useState(3);
  const [completedFilter, setCompletedFilter] = useState<'today' | 'this_month' | 'total'>('total');

  const isToday = (date: Date) => {
    const today = new Date();
    return date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear();
  };

  const isThisMonth = (date: Date) => {
    const today = new Date();
    return date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear();
  };

  const filterAndSortBookings = (list: Booking[], ascending = false) => {
      return list.sort((a,b) => {
           const timeA = getDate(a.scheduledDate)?.getTime() || getDate(a.createdAt)?.getTime() || 0;
           const timeB = getDate(b.scheduledDate)?.getTime() || getDate(b.createdAt)?.getTime() || 0;
           if (ascending) return timeA - timeB;
           return timeB - timeA; // Descending by date
      });
  }
  
  const activeBookings = filterAndSortBookings(bookings.filter(b => ['accepted', 'in_progress', 'upcoming', 'marked_complete'].includes(b.status)), true);
  const pendingBookings = filterAndSortBookings(bookings.filter(b => b.status === 'pending'));
  const completedBookings = filterAndSortBookings(bookings.filter(b => b.status === 'completed'));
  const archivedBookings = filterAndSortBookings(bookings.filter(b => ['cancelled', 'rejected', 'expired'].includes(b.status)));

  const filteredCompletedBookings = completedBookings.filter(b => {
    const bDate = getDate(b.completedAt) || getDate(b.scheduledDate) || getDate(b.createdAt);
    if (!bDate) return completedFilter === 'total';
    if (completedFilter === 'today') return isToday(bDate);
    if (completedFilter === 'this_month') return isThisMonth(bDate);
    return true;
  });

  const getEmptyMessage = () => {
    if (completedFilter === 'today') return 'No bookings completed today';
    if (completedFilter === 'this_month') return 'No bookings completed this month';
    return 'No completed bookings';
  };

  const getEmptySubMessage = () => {
    if (completedFilter === 'today') return "You don't have any bookings completed today.";
    if (completedFilter === 'this_month') return "You don't have any bookings completed this month.";
    return 'Past bookings that have been completed will appear here.';
  };

  const renderBookingList = (list: Booking[], emptyMessage: string, emptySubMessage: string) => {
    if (loading) {
        return <div className="space-y-4">{[1, 2, 3].map(i => <BookingSkeleton key={i} />)}</div>;
    }

    if (list.length === 0) {
      return (
        <Card className="mt-6 border-dashed bg-secondary/10">
            <CardContent className="p-10 text-center flex flex-col items-center">
                <div className="w-16 h-16 bg-background rounded-full flex items-center justify-center mb-6 shadow-sm border border-border/40">
                    <Inbox className="w-8 h-8 text-muted-foreground/30" />
                </div>
                <h3 className="font-bold text-lg text-foreground">{emptyMessage}</h3>
                <p className="text-sm text-muted-foreground mt-1 max-w-sm">
                    {emptySubMessage}
                </p>
            </CardContent>
        </Card>
      );
    }
    return <div className="space-y-4 animate-in fade-in duration-500">{list.map(booking => <BookingCardCustomer key={booking.id} booking={booking} />)}</div>;
  }
  
  const TABS = [
      { value: 'pending', label: 'Pending', data: pendingBookings, empty: 'No pending requests', emptySub: 'When you book an expert, your request will be here until they respond.' },
      { value: 'active', label: 'Active', data: activeBookings, empty: 'No active bookings', emptySub: 'Once an expert accepts your request, it will appear here.' },
      { value: 'completed', label: 'Completed', data: completedBookings, empty: 'No completed jobs', emptySub: 'Past bookings that have been completed will appear here.' },
      { value: 'archived', label: 'Archived', data: archivedBookings, empty: 'No archived bookings', emptySub: 'Declined or cancelled bookings from the past will be shown here.' },
  ];

  const validTabs = TABS.map(tab => tab.value);
  const initialTab = defaultTab && validTabs.includes(defaultTab) ? defaultTab : 'pending';

  return (
    <Tabs defaultValue={initialTab} className="w-full">
        <div className="border-b -mx-4 px-4 sticky top-0 z-10 bg-background overflow-x-auto no-scrollbar">
            <TabsList className="flex min-w-max bg-transparent p-0 h-14 md:h-16 justify-start gap-1 md:gap-4 lg:gap-8">
                {TABS.map(tab => (
                    <TabsTrigger 
                        key={tab.value} 
                        value={tab.value}
                        className="relative flex-1 min-w-[100px] md:min-w-[140px] whitespace-nowrap rounded-none bg-transparent shadow-none px-4 md:px-8 data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-4 data-[state=active]:border-primary data-[state=active]:text-primary font-bold text-[14px] md:text-[16px] lg:text-[18px] transition-all uppercase tracking-tight"
                    >
                        {tab.label}
                        {!loading && tab.data.length > 0 && (
                            <span className="ml-1 inline-flex items-center justify-center px-1.5 py-0.5 text-[9px] font-black leading-none text-primary bg-primary/10 rounded-full">
                                {tab.data.length > 4 ? '4+' : tab.data.length}
                            </span>
                        )}
                        {!loading && tab.value === 'pending' && tab.data.length > 0 && (
                            <span className="absolute top-2 right-1.5 flex h-1.5 w-1.5">
                                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-orange-500"></span>
                            </span>
                        )}
                    </TabsTrigger>
                ))}
            </TabsList>
        </div>
        
        <TabsContent value="pending" className="mt-6">
            {renderBookingList(pendingBookings, 'No pending requests', 'When you book an expert, your request will be here until they respond.')}
        </TabsContent>
        <TabsContent value="active" className="mt-6">
            {renderBookingList(activeBookings, 'No active bookings', 'Once an expert accepts your request, it will appear here.')}
        </TabsContent>
        <TabsContent value="completed" className="mt-6">
            <div className="flex gap-2 mb-5 overflow-x-auto no-scrollbar py-1">
              {(['total', 'today', 'this_month'] as const).map((filter) => {
                const isActive = completedFilter === filter;
                const label = filter === 'total' ? 'Total' : filter === 'today' ? 'Today' : 'This Month';
                return (
                  <button
                    key={filter}
                    onClick={() => {
                      setCompletedFilter(filter);
                      setVisibleCompleted(3);
                    }}
                    className={cn(
                      "px-4 py-1.5 rounded-full text-xs font-bold transition-all border shrink-0 cursor-pointer",
                      isActive 
                        ? "bg-primary text-primary-foreground border-primary shadow-sm" 
                        : "bg-secondary/40 text-muted-foreground border-transparent hover:bg-secondary/60"
                    )}
                  >
                    {label}
                  </button>
                );
              })}
            </div>

            {loading ? (
                <div className="space-y-4">{[1, 2, 3].map(i => <BookingSkeleton key={i} />)}</div>
            ) : filteredCompletedBookings.length === 0 ? (
                renderBookingList([], getEmptyMessage(), getEmptySubMessage())
            ) : (
                <div className="space-y-4 animate-in fade-in duration-500">
                    {filteredCompletedBookings.slice(0, visibleCompleted).map(booking => <BookingCardCustomer key={booking.id} booking={booking} />)}
                    {visibleCompleted < filteredCompletedBookings.length &&
                        <Button variant="outline" className="w-full h-12 rounded-xl font-bold" onClick={() => setVisibleCompleted(prev => prev + 3)}>
                            Show more
                        </Button>
                    }
                </div>
            )}
        </TabsContent>
        <TabsContent value="archived" className="mt-6">
            {loading ? (
                <div className="space-y-4">{[1, 2, 3].map(i => <BookingSkeleton key={i} />)}</div>
            ) : archivedBookings.length === 0 ? (
                renderBookingList([], 'No archived bookings', 'Declined or cancelled bookings from the past will be shown here.')
            ) : (
                <div className="space-y-4 animate-in fade-in duration-500">
                    {archivedBookings.slice(0, visibleArchived).map(booking => <BookingCardCustomer key={booking.id} booking={booking} />)}
                    {visibleArchived < archivedBookings.length &&
                        <Button variant="outline" className="w-full h-12 rounded-xl font-bold" onClick={() => setVisibleArchived(prev => prev + 3)}>
                            Show more
                        </Button>
                    }
                </div>
            )}
        </TabsContent>
    </Tabs>
  );
}
