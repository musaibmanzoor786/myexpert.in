'use client';

import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';

export function ExpertProfileSkeleton() {
  return (
    <div className="space-y-6">
      {/* Hero Section Skeleton */}
      <div className="relative pt-14 pb-6 px-4 bg-gradient-to-b from-primary/10 via-primary/5 to-background text-center">
        <Skeleton className="w-28 h-28 mx-auto mb-4 rounded-[2.5rem]" />
        <Skeleton className="h-8 w-48 mx-auto mb-2" />
        <Skeleton className="h-4 w-32 mx-auto mb-4" />
        
        <div className="flex items-center justify-center gap-2 mt-4">
          <Skeleton className="h-5 w-12 rounded-lg" />
          <Skeleton className="h-5 w-16 rounded-lg" />
          <Skeleton className="h-5 w-20 rounded-lg" />
        </div>
      </div>
      
      {/* Quick Info Row Skeleton */}
      <div className="px-4">
        <div className="flex items-center gap-3 p-3 bg-secondary/40 rounded-2xl border border-border/50">
          <Skeleton className="w-8 h-8 rounded-xl" />
          <div className="flex-1 space-y-1">
            <Skeleton className="h-2 w-16" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
      </div>

      <div className="px-4 space-y-6">
        {/* About Section Skeleton */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <Skeleton className="w-4 h-4 rounded-full" />
            <Skeleton className="h-4 w-20" />
          </div>
          <Card className="rounded-[2rem] border-none bg-card shadow-sm">
            <CardContent className="p-5 space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-4 w-4/6" />
            </CardContent>
          </Card>
        </section>

        {/* Services Section Skeleton */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <Skeleton className="w-4 h-4 rounded-full" />
            <Skeleton className="h-4 w-24" />
          </div>
          <div className="flex flex-wrap gap-2">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-8 w-20 rounded-xl" />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
