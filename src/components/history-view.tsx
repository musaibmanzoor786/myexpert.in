'use client';

import { useAuth } from '@/context/auth-context';
import { Loader2, ChevronLeft } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Suspense } from 'react';
import { CustomerBookings } from '@/components/customer-bookings';
import { ExpertBookings } from '@/components/expert-bookings';
import { cn } from '@/lib/utils';

const loadingSpinner = (
    <div className="flex justify-center items-center h-[calc(100vh-300px)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
    </div>
);

function BookingsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tab = searchParams.get('tab');
  const { user, userProfile, loading } = useAuth();
  
  const pageTitle = userProfile?.role === 'expert' ? 'My Jobs' : 'My Bookings';

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex justify-center items-center h-[calc(100vh-300px)]">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      );
    }

    if (!user) {
      return (
        <div className="mt-8 text-center text-muted-foreground border-2 border-dashed border-muted-foreground/30 rounded-lg p-8">
          <p>Please log in to see your history.</p>
        </div>
      );
    }
  
    if (userProfile?.role === 'expert') {
      return <ExpertBookings defaultTab={tab || undefined} />;
    }
    
    if (userProfile?.role === 'customer') {
      return <CustomerBookings defaultTab={tab || undefined} />;
    }

    // Fallback for when profile is not fully set up
    return (
       <Card className="mt-8 border-dashed">
            <CardContent className="p-8 text-center">
                <p className="text-muted-foreground">Your profile is not fully set up.</p>
            </CardContent>
        </Card>
    );
  };

  const isExpert = userProfile?.role === 'expert';

  return (
    <div className={cn("w-full max-w-4xl lg:max-w-7xl mx-auto space-y-4 pt-4", isExpert ? "px-2.5" : "px-4")}>
      <div className="relative flex items-center justify-center mb-2">
        <Button 
          variant="ghost" 
          size="icon" 
          className="absolute left-0 h-8 w-8"
          onClick={() => window.history.length > 2 ? router.back() : router.push('/')}
        >
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-lg font-bold text-center">
          {pageTitle}
        </h1>
      </div>
      {renderContent()}
    </div>
  );
}

export function HistoryView() {
  return (
    <Suspense fallback={loadingSpinner}>
      <BookingsPageContent />
    </Suspense>
  );
}
