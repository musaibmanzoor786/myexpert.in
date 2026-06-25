'use client';

import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';

export function ExpertCardSkeleton() {
  return (
    <Card className="w-full overflow-hidden border-border/40 bg-card shadow-sm">
      <CardContent className="p-4">
        <div className="flex gap-4">
          {/* Profile Photo Skeleton */}
          <div className="relative shrink-0">
            <Skeleton className="w-16 h-16 rounded-2xl" />
          </div>

          {/* Info Section Skeleton */}
          <div className="flex-1 min-w-0 py-0.5">
            <div className="flex justify-between items-start gap-2">
              <Skeleton className="h-5 w-1/2" />
              <Skeleton className="h-4 w-12 rounded-md" />
            </div>
            
            <div className="flex items-center gap-2 mt-2">
              <Skeleton className="h-3 w-10" />
              <Skeleton className="h-3 w-3 rounded-full" />
              <Skeleton className="h-3 w-20" />
            </div>

            <div className="flex items-center gap-1 mt-3">
              <Skeleton className="h-3 w-3 rounded-full" />
              <Skeleton className="h-3 w-32" />
            </div>
          </div>
        </div>
        
        {/* Quick Action Bar Skeleton */}
        <div className="mt-4 pt-4 border-t border-border/40 flex items-center gap-2">
          <Skeleton className="flex-1 h-10 rounded-xl" />
          <Skeleton className="flex-1 h-10 rounded-xl" />
        </div>
      </CardContent>
    </Card>
  );
}
