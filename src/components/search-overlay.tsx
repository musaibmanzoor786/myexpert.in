
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, X, ChevronRight, ArrowLeft, History, Zap } from 'lucide-react';
import { getCachedServices } from '@/services/service-cache';
import type { Service } from '@/lib/types';
import { cn, safeStore } from '@/lib/utils';

interface SearchOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

interface SearchResult extends Service {
  matchText?: string;
  problemTitle?: string;
}

const RECENT_SEARCHES_KEY = 'myexpert_recent_searches';

export function SearchOverlay({ isOpen, onClose }: SearchOverlayProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredServices, setFilteredServices] = useState<SearchResult[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [imageError, setImageError] = useState<Record<string, boolean>>({});
  const router = useRouter();

  useEffect(() => {
    setServices(getCachedServices());
  }, [isOpen]);

  // Load recent searches
  useEffect(() => {
    if (isOpen) {
      const saved = localStorage.getItem(RECENT_SEARCHES_KEY);
      if (saved) {
        try {
          setRecentSearches(JSON.parse(saved));
        } catch (e) {
          console.error("Failed to parse recent searches", e);
          localStorage.removeItem(RECENT_SEARCHES_KEY);
        }
      }
    }
  }, [isOpen]);

  // Handle Search Logic - 100% LOCAL (Free & Instant)
  useEffect(() => {
    if (searchTerm.trim() === '' || services.length === 0) {
      setFilteredServices([]);
      return;
    }

    const lowercasedTerm = searchTerm.toLowerCase();
    const results: SearchResult[] = [];

    for (const service of services) {
      if (service.name === 'All') continue;

      // 1. Check name
      if (service.name.toLowerCase().includes(lowercasedTerm)) {
        results.push({ ...service, matchText: service.name });
        continue;
      }

      // 2. Check problems
      if (service.problems) {
        const matchedProblem = service.problems.find(p => p.title.toLowerCase().includes(lowercasedTerm));
        if (matchedProblem) {
          results.push({ ...service, matchText: service.name, problemTitle: matchedProblem.title });
          continue;
        }
      }
      
      // 3. Check tagline
      if (service.tagline && service.tagline.toLowerCase().includes(lowercasedTerm)) {
        results.push({ ...service }); 
        continue;
      }
    }
    setFilteredServices(results.slice(0, 10));
  }, [searchTerm]);

  const clearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem(RECENT_SEARCHES_KEY);
  };

  const saveSearch = (term: string) => {
    const updated = [term, ...recentSearches.filter(t => t !== term)].slice(0, 5);
    setRecentSearches(updated);
    safeStore(RECENT_SEARCHES_KEY, updated);
  };

  const handleServiceClick = (result: SearchResult) => {
    const title = typeof result.problemTitle === 'string' ? result.problemTitle : undefined;
    const name = typeof result.name === 'string' ? result.name : '';
    saveSearch(title || name);
    onClose();
    if (title) {
        router.push(`/search?service=${encodeURIComponent(name)}&problem=${encodeURIComponent(title)}`);
    } else {
        router.push(`/book/${name.toLowerCase()}`);
    }
  };

  const popularProblems = [
    { title: 'Tap Leaking', service: 'Plumber' },
    { title: 'Power Outage', service: 'Electrician' },
    { title: 'AC Not Cooling', service: 'Electrician' },
    { title: 'Door Fix', service: 'Carpenter' },
    { title: 'Wall Painting', service: 'Painter' },
  ];

 return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="p-0 m-0 border-0 w-screen h-screen max-w-none rounded-none bg-background flex flex-col gap-0 overflow-hidden shadow-none">
        <DialogHeader className="sr-only">
          <DialogTitle>Search Services</DialogTitle>
        </DialogHeader>

        {/* --- NATIVE STYLE HEADER --- */}
        <header className="px-4 pt-12 pb-3 bg-background flex items-center gap-3">
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-10 w-10 rounded-full shrink-0 active:scale-90 transition-transform" 
            onClick={onClose}
          >
            <ArrowLeft className="w-6 h-6" />
          </Button>
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary" />
            <Input
              placeholder="What are you looking for?"
              className="pl-10 pr-10 h-12 text-sm bg-gray-100 border-0 rounded-2xl focus-visible:ring-0 transition-all font-medium"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              autoFocus
            />
            {searchTerm && (
              <button 
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full bg-gray-200" 
                onClick={() => setSearchTerm('')}
              >
                <X className="w-3 h-3 text-gray-600" />
              </button>
            )}
          </div>
        </header>

        {/* --- SCROLLABLE CONTENT --- */}
        <div className="flex-1 overflow-y-auto no-scrollbar">
          {searchTerm.trim() !== '' ? (
            <div className="p-4">
              <h2 className="text-[11px] font-black uppercase text-gray-400 mb-3 px-2">Matching Results</h2>
              <div className="space-y-2">
                {filteredServices.map((service, i) => (
                  <div 
                    key={i} 
                    onClick={() => handleServiceClick(service)}
                    className="flex items-center gap-4 p-4 rounded-2xl bg-gray-50 active:bg-gray-100 transition-all cursor-pointer"
                  >
                    <div className="w-10 h-10 flex items-center justify-center bg-white rounded-xl shadow-sm shrink-0">
                      {service.imageUrl && !imageError[service.name] ? (
                        <Image src={service.imageUrl} alt={service.name} width={40} height={40} className="w-full h-full object-cover rounded-xl" onError={() => setImageError(prev => ({ ...prev, [service.name]: true }))} />
                      ) : (
                        <service.icon className="w-5 h-5 text-primary" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm">{service.problemTitle || service.name}</p>
                      <p className="text-[10px] text-gray-500 font-bold uppercase">{service.problemTitle ? `Category: ${service.name}` : service.tagline}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-8 p-5">
              {recentSearches.length > 0 && (
                <section>
                  <div className="flex justify-between items-center mb-3">
                    <h2 className="text-[11px] font-black uppercase text-gray-400">Recent</h2>
                    <Button variant="ghost" size="sm" className="h-6 text-[10px] font-bold text-red-500 uppercase px-2" onClick={clearRecentSearches}>Clear</Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {recentSearches.map((term, i) => (
                      <button key={i} onClick={() => setSearchTerm(term)} className="px-4 py-2 bg-gray-100 rounded-xl text-xs font-bold text-gray-700">
                        {term}
                      </button>
                    ))}
                  </div>
                </section>
              )}
              <section>
                <h2 className="text-[11px] font-black uppercase text-gray-400 mb-3">Common Fixes</h2>
                <div className="flex flex-wrap gap-2">
                  {popularProblems.map((prob, i) => (
                    <button key={i} onClick={() => { saveSearch(prob.title); onClose(); router.push(`/search?service=${encodeURIComponent(prob.service)}&problem=${encodeURIComponent(prob.title)}`); }} className="px-4 py-2.5 bg-primary/5 border border-primary/10 rounded-full text-xs font-bold text-primary active:scale-95 transition-transform">
                      {prob.title}
                    </button>
                  ))}
                </div>
              </section>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}