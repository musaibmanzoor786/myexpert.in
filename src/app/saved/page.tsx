'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/auth-context';
import { getExperts } from '@/services/expert-service';
import type { Expert } from '@/lib/types';
import { ExpertCard } from '@/components/expert-card';
import { Loader2, Heart } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

function SavedExpertsContent() {
  const { user, userProfile, loading: authLoading } = useAuth();
  const savedExpertIds: string[] = (userProfile as any)?.savedExperts || [];
  const [savedExperts, setSavedExperts] = useState<Expert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSavedExperts() {
      // Don't fetch until auth is complete
      if (authLoading) {
        return;
      }
      
      setLoading(true);
      // savedExpertIds can be null initially, or an empty array
      if (user && savedExpertIds && savedExpertIds.length > 0) {
        const { experts: allExperts } = await getExperts();
        const filteredExperts = allExperts.filter((expert: Expert) => savedExpertIds.includes(expert.id));
        setSavedExperts(filteredExperts);
      } else {
        setSavedExperts([]);
      }
      setLoading(false);
    }

    fetchSavedExperts();
  }, [user, authLoading, savedExpertIds]);

  if (loading || authLoading) {
    return (
      <div className="flex justify-center items-center h-[calc(100vh-300px)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (savedExperts.length > 0) {
     return (
        <>
           <p className="text-muted-foreground mb-6">
            Here are the experts and services you've saved for later.
          </p>
          <div className="grid grid-cols-1 gap-6">
            {savedExperts.map(expert => (
              <ExpertCard key={expert.id} expert={expert} />
            ))}
          </div>
        </>
      );
  }
  
  return (
    <Card className="mt-8 border-dashed">
        <CardContent className="p-8 text-center flex flex-col items-center">
            <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center mb-6">
                <Heart className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="font-bold text-lg">No saved experts yet</h3>
            <p className="text-muted-foreground mt-1 max-w-sm">
                You can save experts you're interested in for later. Tap the bookmark icon on an expert's card to save them.
            </p>
        </CardContent>
    </Card>
  );
}

export default function SavedPage() {
  return (
    <div>
      <h1 className="text-xl md:text-2xl font-bold mb-4">Saved Experts</h1>
      <SavedExpertsContent />
    </div>
  );
}
