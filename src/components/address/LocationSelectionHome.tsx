'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
    MapPin, 
    Search, 
    Plus, 
    ChevronLeft, 
    Home, 
    Briefcase, 
    Map as MapIcon, 
    ChevronRight,
    Target,
    X,
    Loader2
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import type { UserAddress } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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

interface LocationSelectionHomeProps {
  savedAddresses: UserAddress[];
  onUseCurrentLocation: () => void;
  onSearch: () => void;
  onAddManual: () => void;
  onSelectAddress: (addr: UserAddress) => void;
  onEditAddress: (addr: UserAddress) => void;
  onDeleteAddress: (id: string) => void;
  onSelectPlace?: (lat: number, lng: number, displayName: string) => void;
  onChooseOnMap?: () => void;
}


const AddressTypeIcon = ({ type }: { type: UserAddress['type'] }) => {
  switch (type) {
    case 'home': return <Home className="h-5 w-5 text-[#00B894]" />;
    case 'work': return <Briefcase className="h-5 w-5 text-[#00B894]" />;
    default: return <MapPin className="h-5 w-5 text-[#00B894]" />;
  }
};

export function LocationSelectionHome({
  savedAddresses,
  onUseCurrentLocation,
  onAddManual,
  onSelectAddress,
  onEditAddress,
  onDeleteAddress,
  onSelectPlace,
  onChooseOnMap
}: LocationSelectionHomeProps) {
  const router = useRouter();
  const { userProfile } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [placeSuggestions, setPlaceSuggestions] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    const fetchPlaces = async () => {
      if (searchQuery.length < 3) {
        setPlaceSuggestions([]);
        return;
      }

      setIsSearching(true);
      try {
        const res = await fetch(`/api/geocode?q=${encodeURIComponent(searchQuery)}`);
        if (res.ok) {
          const data = await res.json();
          setPlaceSuggestions(data);
        }
      } catch (err) {
        console.error("Geocoding error:", err);
      } finally {
        setIsSearching(false);
      }
    };

    const timer = setTimeout(fetchPlaces, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  return (
    <div className="flex flex-col min-h-screen bg-white w-full max-w-4xl lg:max-w-7xl mx-auto animate-in fade-in duration-500">
      {/* Header */}
      <header className="px-2 py-4 flex items-center bg-white sticky top-0 z-20">
        <Button variant="ghost" size="icon" onClick={() => window.history.length > 2 ? router.back() : router.push('/')} className="rounded-full h-12 w-12">
          <ChevronLeft className="h-7 w-7 text-[#1A1A1A]" strokeWidth={2.5} />
        </Button>
        <h1 className="text-xl font-black text-[#1A1A1A] ml-1 tracking-tight">Search your location</h1>
      </header>

      <div className="flex-1 p-4 space-y-6">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[#00B894] z-10" strokeWidth={2.5} />
          <Input 
            className="w-full h-14 pl-12 pr-10 rounded-2xl border-none bg-[#F3F4F6] flex items-center text-foreground font-bold transition-all focus-visible:ring-2 focus-visible:ring-[#00B894]/20 placeholder:text-[#888888] text-base"
            placeholder="Search city, area, locality"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <div className="absolute right-4 top-1/2 -translate-y-1/2">
            {isSearching && <Loader2 className="h-4 w-4 animate-spin text-[#00B894]" />}
            {!isSearching && searchQuery && (
                <button onClick={() => setSearchQuery('')} className="p-1 bg-muted rounded-full">
                    <X className="h-3 w-3" />
                </button>
            )}
          </div>
        </div>

        {/* Quick Options Card */}
        <div className="bg-white rounded-3xl overflow-hidden border border-[#F3F4F6] shadow-sm">
            <button 
              onClick={onChooseOnMap}
              className="w-full h-16 px-5 flex items-center justify-between hover:bg-secondary/20 transition-colors border-b border-[#F3F4F6] group"
            >
              <div className="flex items-center gap-4">
                  <div className="bg-[#00B894]/5 p-2 rounded-xl">
                    <MapIcon className="h-5 w-5 text-[#00B894]" strokeWidth={2.5} />
                  </div>
                  <span className="font-bold text-[#1A1A1A] text-base">Choose on map</span>
              </div>
              <ChevronRight className="h-5 w-5 text-[#888888]" />
            </button>

            <button 
              onClick={onUseCurrentLocation}
              className="w-full h-16 px-5 flex items-center justify-between hover:bg-secondary/20 transition-colors group"
            >
              <div className="flex items-center gap-4">
                  <div className="bg-[#00B894]/5 p-2 rounded-xl">
                    <Target className="h-5 w-5 text-[#00B894]" strokeWidth={2.5} />
                  </div>
                  <span className="font-bold text-[#1A1A1A] text-base">Use current location</span>
              </div>
              <ChevronRight className="h-5 w-5 text-[#888888]" />
            </button>
        </div>

        {searchQuery.length === 0 ? (
          /* Saved Addresses Section */
          <div className="space-y-4 pt-2 w-full">
            <h2 className="text-[11px] font-black text-[#888888] uppercase tracking-[0.15em] px-4">SAVED ADDRESSES</h2>
            
            {savedAddresses.length > 0 ? (
              <div className="space-y-0">
                {savedAddresses.map((addr) => {
                  const isSelected = userProfile?.locationData?.lat === addr.lat && userProfile?.locationData?.lng === addr.lng;
                  return (
                    <Card 
                      key={addr.id} 
                      className="rounded-none shadow-none border-b border-t-0 border-l-0 border-r-0 border-[#F3F4F6] overflow-hidden bg-white active:scale-[0.98] transition-all cursor-pointer w-full"
                      onClick={() => onSelectAddress(addr)}
                    >
                      <CardContent className="p-6">
                        <div className="flex items-start gap-4">
                          <div className="bg-[#F0FDF9] p-3 rounded-2xl shrink-0 mt-0.5">
                            <AddressTypeIcon type={addr.type} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-black text-[#1A1A1A] text-lg capitalize leading-none">{addr.name || addr.type}</p>
                              {isSelected && (
                                <Badge className="bg-[#00B894]/10 text-[#00B894] hover:bg-[#00B894]/10 border-none text-[9px] font-black px-2 py-0.5 rounded-full">
                                  CURRENTLY SELECTED
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-[#888888] font-medium leading-relaxed line-clamp-2">
                              {addr.fullAddress}
                            </p>
                            <div className="pt-4 flex items-center gap-4">
                                <button 
                                    onClick={(e) => { e.stopPropagation(); onEditAddress(addr); }} 
                                    className="text-[11px] font-black text-[#00B894] uppercase tracking-widest hover:opacity-70 transition-opacity"
                                >
                                    EDIT
                                </button>
                                
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); }} 
                                        className="text-[11px] font-black text-red-500 uppercase tracking-widest hover:opacity-70 transition-opacity"
                                    >
                                        REMOVE
                                    </button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent className="rounded-2xl">
                                    <AlertDialogHeader>
                                      <AlertDialogTitle className="font-black">Delete address?</AlertDialogTitle>
                                      <AlertDialogDescription className="font-medium">
                                        This will permanently remove this address from your account.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter className="flex-row gap-2">
                                      <AlertDialogCancel className="rounded-xl flex-1 mt-0">Cancel</AlertDialogCancel>
                                      <AlertDialogAction 
                                        onClick={() => onDeleteAddress(addr.id)}
                                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-xl flex-1"
                                      >
                                        Delete
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <div className="py-12 text-center space-y-3 opacity-40">
                <MapPin className="w-12 h-12 mx-auto text-[#888888]" />
                <p className="font-bold text-[#1A1A1A]">No saved addresses yet</p>
              </div>
            )}
          </div>
        ) : (
          /* Search Results */
          <div className="space-y-2 animate-in slide-in-from-top-2 duration-300">
            <h2 className="text-[11px] font-black text-[#888888] uppercase tracking-[0.15em] px-1 mb-4">SEARCH RESULTS</h2>
            {placeSuggestions.length > 0 && (
              <div className="bg-white rounded-3xl overflow-hidden border border-[#F3F4F6]">
                {placeSuggestions.map((place, i) => (
                  <button 
                    key={i}
                    onClick={() => onSelectPlace?.(parseFloat(place.lat), parseFloat(place.lon), place.display_name)}
                    className="w-full p-5 flex items-start gap-4 hover:bg-[#F3F4F6]/50 transition-colors border-b border-[#F3F4F6] last:border-0 text-left"
                  >
                    <div className="bg-[#F0FDF9] p-3 rounded-2xl shrink-0">
                      <MapPin className="h-5 w-5 text-[#00B894]" />
                    </div>
                    <div className="flex-1 min-w-0 py-0.5">
                      <p className="font-bold text-[#1A1A1A] text-base leading-tight truncate">
                        {place.display_name?.split(',')[0]}
                      </p>
                      <p className="text-sm text-[#888888] font-medium mt-1 truncate">
                        {place.display_name?.split(',').slice(1).join(',').trim()}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
