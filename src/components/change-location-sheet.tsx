'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/auth-context';
import { 
    getUserAddresses,
    updateUserLocationAndAddress,
    updateExpertLocationAndAddress 
} from '@/services/user-service';
import { 
    Loader2, 
    MapPin, 
    Target, 
    Search, 
    Home, 
    Briefcase, 
    Map as MapIcon, 
    ChevronRight,
    X,
    Navigation,
    Locate
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useLocationStore } from '@/lib/location-store';
import type { UserAddress } from '@/lib/types';
import { cn } from '@/lib/utils';
import { useMapsLibrary } from '@vis.gl/react-google-maps';

interface ChangeLocationSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const AddressTypeIcon = ({ type }: { type: UserAddress['type'] }) => {
  switch (type) {
    case 'home': return <Home className="h-4 w-4 text-muted-foreground/60" />;
    case 'work': return <Briefcase className="h-4 w-4 text-muted-foreground/60" />;
    default: return <MapIcon className="h-4 w-4 text-muted-foreground/60" />;
  }
};

export function ChangeLocationSheet({ open, onOpenChange }: ChangeLocationSheetProps) {
  const { toast } = useToast();
  const { user, userProfile } = useAuth();
  const { setLocation: setLocationInStore } = useLocationStore();
  
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<google.maps.places.AutocompleteSuggestion[]>([]);
  const [savedAddresses, setSavedAddresses] = useState<UserAddress[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  
  const router = useRouter();

  // Load Google Maps Libraries
  const placesLib = useMapsLibrary('places');
  const coreLib = useMapsLibrary('core');
  
  const geocoder = useRef<google.maps.Geocoder | null>(null);

  useEffect(() => {
    if (coreLib && !geocoder.current) {
        geocoder.current = new google.maps.Geocoder();
    }
  }, [coreLib]);

  // Load saved addresses when sheet opens
  useEffect(() => {
    if (open && user) {
      getUserAddresses(user.uid).then(setSavedAddresses);
    }
  }, [open, user]);

  // Search Logic (Google Places)
  useEffect(() => {
    if (!placesLib || searchQuery.length < 3) {
      setSuggestions([]);
      return;
    }

    const fetchPlaces = async () => {
      setIsSearching(true);
      try {
        const response = await placesLib.AutocompleteSuggestion.fetchAutocompleteSuggestions({ 
            input: searchQuery,
            includedRegionCodes: ['in'],
        });
        setSuggestions(response.suggestions || []);
        setIsSearching(false);
      } catch (err) {
        console.error("Places API error:", err);
        setIsSearching(false);
      }
    };

    const timer = setTimeout(fetchPlaces, 400);
    return () => clearTimeout(timer);
  }, [searchQuery, placesLib]);

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast({ variant: 'warning', description: "GPS not supported on this browser" });
      return;
    }
    
    setIsLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        if (!geocoder.current) {
            toast({ variant: 'destructive', description: "Maps library not loaded yet" });
            setIsLoading(false);
            return;
        }

        try {
            const lat = pos.coords.latitude;
            const lng = pos.coords.longitude;
            
            geocoder.current.geocode({ location: { lat, lng } }, async (results, status) => {
                if (status === 'OK' && results?.[0]) {
                    const address = results[0].formatted_address;
                    // Extract area (sublocality or locality)
                    const areaComponent = results[0].address_components.find(c => 
                        c.types.includes('sublocality') || c.types.includes('locality')
                    );
                    const area = areaComponent?.long_name || address?.split(',')[0];

                    const updateData = { lat, lng, address };

                    if (userProfile?.role === 'expert') {
                        await updateExpertLocationAndAddress(user!.uid, updateData);
                    } else {
                        await updateUserLocationAndAddress(user!.uid, updateData);
                    }

                    setLocationInStore({
                        lat,
                        lng,
                        area,
                        address
                    });

                    toast({ title: "Location Updated", description: "Your current location has been set." });
                    onOpenChange(false);
                } else {
                    toast({ variant: 'destructive', description: "Could not find address for this location" });
                }
                setIsLoading(false);
            });
        } catch (err) {
            console.error(err);
            toast({ variant: 'destructive', description: "Failed to detect address" });
            setIsLoading(false);
        }
      },
      () => {
        toast({ variant: 'warning', description: "Location access denied" });
        setIsLoading(false);
      },
      { timeout: 5000 }
    );
  };

  const handleSelectAddress = (addr: UserAddress) => {
    setLocationInStore({
        lat: addr.lat,
        lng: addr.lng,
        area: addr.area || addr.fullAddress?.split(',')[0],
        address: addr.fullAddress
    });
    onOpenChange(false);
    toast({ description: `Switched to ${addr.type}` });
  };

  const handleSelectSuggestion = async (placeId: string) => {
    console.log("Suggestion clicked, placeId:", placeId);
    if (!geocoder.current) {
        console.error("Geocoder not initialized");
        return;
    }
    
    setIsLoading(true);
    console.log("Geocoding placeId:", placeId);
    try {
        geocoder.current.geocode({ placeId: placeId }, async (results, status) => {
            console.log("Geocoding status:", status, "results:", results);
            if (status === 'OK' && results?.[0]) {
                const result = results[0];
                const lat = result.geometry.location.lat();
                const lng = result.geometry.location.lng();
                const address = result.formatted_address;
                
                const areaComponent = result.address_components.find(c => 
                    c.types.includes('sublocality') || c.types.includes('locality')
                );
                const area = areaComponent?.long_name || address?.split(',')[0];

                const updateData = { lat, lng, address };
                console.log("Updating user location:", updateData);                
                if (userProfile?.role === 'expert') {
                    await updateExpertLocationAndAddress(user!.uid, updateData);
                } else {
                    await updateUserLocationAndAddress(user!.uid, updateData);
                }

                setLocationInStore({ lat, lng, area, address });
                onOpenChange(false);
            } else {
                console.error("Geocoding failed status:", status);
            }
            setIsLoading(false);
        });
    } catch (err) {
        console.error("Geocoding error:", err);
        setIsLoading(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[85dvh] sm:h-[80vh] sm:max-w-md sm:mx-auto rounded-t-[2.5rem] sm:rounded-2xl sm:bottom-4 p-0 flex flex-col bg-[#F8F9FB] border-none shadow-2xl [&>button]:hidden overflow-visible">
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 z-50">
            <button 
                onClick={() => onOpenChange(false)}
                className="p-3 flex items-center justify-center active:scale-90 transition-all text-white/80 hover:text-white"
            >
                <X className="h-8 w-8" strokeWidth={2.5} />
            </button>
        </div>

        <SheetHeader className="px-6 pt-8 pb-4 bg-white border-b shrink-0 rounded-t-[2.5rem]">
          <SheetTitle className="text-xl font-black tracking-tight text-center">Select Location</SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6 pb-32">
          {/* Search Bar */}
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-primary z-10" strokeWidth={2.5} />
            <Input 
              className="w-full h-14 pl-12 pr-10 rounded-2xl border-2 border-transparent bg-white shadow-sm flex items-center text-foreground font-bold transition-all focus-visible:ring-primary/20 focus-visible:border-primary/20 placeholder:text-muted-foreground/50 text-base"
              placeholder="Search area, street name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {isSearching && (
                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                </div>
            )}
          </div>

          {/* Search Suggestions */}
          {suggestions.length > 0 && (
              <div className="bg-white rounded-3xl border border-border/40 overflow-hidden shadow-sm animate-in slide-in-from-top-2 duration-300">
                  {suggestions.map((s, i) => {
                      const prediction = s.placePrediction;
                      if (!prediction) return null;
                      return (
                      <button 
                        key={i}
                        onClick={() => handleSelectSuggestion(prediction.placeId)}
                        className="w-full p-4 flex items-start gap-4 border-b last:border-0 hover:bg-secondary/20 transition-colors text-left group"
                      >
                          <div className="bg-primary/5 p-2.5 rounded-xl">
                              <MapPin className="h-5 w-5 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                              <p className="font-bold text-sm text-foreground truncate">{prediction.text?.text || (prediction as any).description || 'Location'}</p>
                          </div>
                          <ChevronRight className="h-4 w-4 text-muted-foreground self-center" />
                      </button>
                  )})}
              </div>
          )}

          {/* Primary Actions */}
          <div className="bg-white rounded-3xl border border-border/40 overflow-hidden shadow-sm">
            <button 
                onClick={handleUseCurrentLocation}
                disabled={isLoading}
                className="w-full h-16 px-5 flex items-center gap-4 hover:bg-secondary/20 transition-colors border-b last:border-0 group"
            >
                <div className="bg-blue-500/10 p-2.5 rounded-xl group-hover:bg-blue-500/20 transition-colors">
                    {isLoading ? <Loader2 className="h-5 w-5 text-blue-600 animate-spin" /> : <Locate className="h-5 w-5 text-blue-600" />}
                </div>
                <div className="text-left">
                    <span className="font-black text-blue-600 text-sm block">Use current location</span>
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Detect using GPS</span>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground ml-auto" />
            </button>

            <button 
                onClick={() => {
                    onOpenChange(false);
                    router.push('/select-location?mode=map');
                }}
                className="w-full h-16 px-5 flex items-center gap-4 hover:bg-secondary/20 transition-colors group"
            >
                <div className="bg-primary/5 p-2.5 rounded-xl group-hover:bg-primary/10 transition-colors">
                    <MapPin className="h-5 w-5 text-primary" />
                </div>
                <div className="text-left">
                    <span className="font-black text-primary text-sm block">Locate on Map</span>
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Pinpoint accurately</span>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground ml-auto" />
            </button>
          </div>

          {/* Saved Addresses */}
          {savedAddresses.length > 0 && (
              <div className="space-y-4">
                  <h3 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] px-1">Saved Addresses</h3>
                  <div className="space-y-3">
                      {savedAddresses.map((addr) => (
                          <button
                            key={addr.id}
                            onClick={() => handleSelectAddress(addr)}
                            className="w-full bg-white p-4 rounded-[1.5rem] border border-border/40 flex items-center gap-4 text-left hover:border-primary/30 transition-all shadow-sm active:scale-[0.98]"
                          >
                              <div className="bg-secondary/50 p-3 rounded-xl">
                                  <AddressTypeIcon type={addr.type} />
                              </div>
                              <div className="flex-1 min-w-0">
                                  <p className="font-black text-sm text-foreground capitalize">{addr.type}</p>
                                  <p className="text-xs text-muted-foreground truncate mt-0.5">{addr.fullAddress}</p>
                              </div>
                              <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                          </button>
                      ))}
                  </div>
              </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}