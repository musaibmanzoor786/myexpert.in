'use client';

import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, MapPin, Loader2, Search, X, Target } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Map, useMap, useMapsLibrary, ControlPosition } from '@vis.gl/react-google-maps';

interface MapPickerProps {
  initialCoords?: { lat: number; lng: number };
  onBack: () => void;
  onConfirm: (loc: { lat: number; lng: number; fullAddress: string; area: string }) => void;
}

export default function MapPicker({ initialCoords, onBack, onConfirm }: MapPickerProps) {
  const map = useMap();
  const placesLib = useMapsLibrary('places');
  const coreLib = useMapsLibrary('core');
  
  const [centerInfo, setCenterInfo] = useState<{ area: string; fullAddress: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [isDetecting, setIsDetecting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<google.maps.places.AutocompleteSuggestion[]>([]);
  const { toast } = useToast();

  const geocoder = useRef<google.maps.Geocoder | null>(null);

  useEffect(() => {
    if (coreLib && !geocoder.current) {
        geocoder.current = new google.maps.Geocoder();
    }
  }, [coreLib]);

  // Initial detection attempt
  useEffect(() => {
    if (map && !initialCoords) {
        detectCurrentPosition(true);
    }
  }, [map]);

  const detectCurrentPosition = (isInitial = false) => {
    if (!navigator.geolocation) {
        if (!isInitial) toast({ description: "GPS not supported" });
        return;
    }

    setIsDetecting(true);
    navigator.geolocation.getCurrentPosition(
        (pos) => {
            const { latitude, longitude } = pos.coords;
            if (map) {
                map.panTo({ lat: latitude, lng: longitude });
                map.setZoom(17);
            }
            setIsDetecting(false);
        },
        (err) => {
            console.warn("GPS detection failed", err);
            setIsDetecting(false);
            if (!isInitial) toast({ variant: 'warning', description: "Could not find your position" });
        },
        { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const reverseGeocode = async (lat: number, lng: number) => {
    if (!geocoder.current) return;
    
    setLoading(true);
    try {
        geocoder.current.geocode({ location: { lat, lng } }, (results, status) => {
            if (status === 'OK' && results?.[0]) {
                const result = results[0];
                const address = result.formatted_address;
                const areaComponent = result.address_components.find(c => 
                    c.types.includes('sublocality') || c.types.includes('locality')
                );
                const districtComponent = result.address_components.find(c => 
                    c.types.includes('administrative_area_level_2')
                );
                
                const area = areaComponent?.long_name || address?.split(',')[0];
                const district = districtComponent?.long_name || '';

                setCenterInfo({
                    area: district ? `${area}, ${district}` : area,
                    fullAddress: address
                });
            }
            setLoading(false);
        });
    } catch (error) {
      console.error("Reverse geocoding error:", error);
      setLoading(false);
    }
  };

  const handleSearch = async (val: string) => {
    setSearchQuery(val);
    if (!placesLib || val.length < 3) {
      setSuggestions([]);
      return;
    }

    try {
        const response = await placesLib.AutocompleteSuggestion.fetchAutocompleteSuggestions({ 
            input: val, 
            includedRegionCodes: ['in'] 
        });
        setSuggestions(response.suggestions || []);
    } catch (error) {
      console.error("Autocomplete error:", error);
    }
  };

  const selectSuggestion = (placeId: string) => {
    if (!geocoder.current || !map) return;
    
    geocoder.current.geocode({ placeId: placeId }, (results, status) => {
        if (status === 'OK' && results?.[0]) {
            const loc = results[0].geometry.location;
            map.panTo(loc);
            map.setZoom(17);
        }
        setSearchQuery('');
        setSuggestions([]);
    });
  };

  const handleIdle = () => {
    if (map) {
        const center = map.getCenter();
        if (center) {
            reverseGeocode(center.lat(), center.lng());
        }
    }
  };

  const startCoords = initialCoords || { lat: 34.0837, lng: 74.7973 };

  return (
    <div className="relative h-screen w-full font-sans bg-background animate-in fade-in duration-500 overflow-hidden">
      {/* Search & Back Header Overlay */}
      <div className="absolute top-4 left-4 right-4 z-[1000] flex items-center gap-2">
        <Button 
            variant="secondary" 
            size="icon" 
            onClick={onBack} 
            className="rounded-2xl shadow-xl h-12 w-12 shrink-0 bg-background/90 backdrop-blur-md border border-white/20 active:scale-90 transition-transform"
        >
          <ChevronLeft className="h-6 w-6 text-foreground" strokeWidth={2.5} />
        </Button>
        <div className="relative flex-1">
          <div className="bg-background/90 backdrop-blur-md shadow-xl rounded-2xl flex items-center px-4 h-12 border border-white/20">
            <Search className="h-5 w-5 text-muted-foreground mr-2 shrink-0" />
            <Input 
              placeholder="Search area or street..." 
              className="border-0 bg-transparent focus-visible:ring-0 px-0 h-full text-base font-bold placeholder:font-medium"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
            />
            {searchQuery && (
              <button onClick={() => {setSearchQuery(''); setSuggestions([]);}} className="p-1.5 bg-muted rounded-full ml-1">
                <X className="h-3 w-3 text-muted-foreground" />
              </button>
            )}
          </div>
          {suggestions.length > 0 && (
            <div className="absolute top-full mt-2 left-0 right-0 bg-background/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 overflow-hidden max-h-64 overflow-y-auto animate-in slide-in-from-top-2">
              {suggestions.map((s, i) => {
                const prediction = s.placePrediction;
                if (!prediction) return null;
                return (
                <div 
                  key={i} 
                  className="p-4 hover:bg-secondary cursor-pointer border-b border-border/40 last:border-0 flex items-start gap-3 active:bg-secondary/80 transition-colors"
                  onClick={() => selectSuggestion(prediction.placeId)}
                >
                  <div className="bg-primary/10 p-2 rounded-lg">
                    <MapPin className="h-4 w-4 text-primary" />
                  </div>
                  <div className="min-w-0 py-0.5">
                    <p className="font-black text-sm truncate text-foreground">{prediction.text?.text || (prediction as any).description || 'Location'}</p>
                  </div>
                </div>
              )})}
            </div>
          )}
        </div>
      </div>

      {/* Map Implementation */}
      <Map
        defaultCenter={startCoords}
        defaultZoom={17}
        mapId="DEMO_MAP_ID"
        onIdle={handleIdle}
        disableDefaultUI={true}
        className="h-full w-full grayscale-[20%] contrast-[1.1]"
        internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
      />

      {/* Fixed Center Pin Overlay */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[85%] z-[999] pointer-events-none mb-10 flex flex-col items-center">
        <div className="relative animate-in slide-in-from-bottom-4 duration-700">
           {/* Dynamic Badge */}
           <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-foreground text-background px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.1em] shadow-2xl whitespace-nowrap border border-white/10 flex items-center gap-2">
              {loading ? (
                <>
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <Target className="w-3 h-3 text-[#00B894]" strokeWidth={3} />
                  Pin Location
                </>
              )}
           </div>
           
           {/* The Pin */}
           <div className="relative group">
              <div className="absolute inset-0 bg-[#00B894]/20 rounded-full blur-xl scale-[2.5] opacity-50" />
              <div className="w-12 h-12 bg-[#00B894] rounded-full flex items-center justify-center border-[3px] border-white shadow-2xl">
                 <div className="w-2.5 h-2.5 bg-white rounded-full" />
              </div>
              <div className="absolute top-full left-1/2 -translate-x-1/2 w-1 h-6 bg-gradient-to-b from-[#00B894] to-transparent" />
           </div>
        </div>
      </div>

      {/* "Locate Me" Button Overlay */}
      <button 
        onClick={() => detectCurrentPosition()}
        disabled={isDetecting}
        className="absolute bottom-40 right-4 z-[1000] w-12 h-12 bg-white rounded-2xl shadow-xl flex items-center justify-center border border-border/40 active:scale-90 transition-transform disabled:opacity-50"
      >
        {isDetecting ? (
            <Loader2 className="h-5 w-5 text-primary animate-spin" />
        ) : (
            <Target className="h-6 w-6 text-primary" strokeWidth={2.5} />
        )}
      </button>

      {/* Bottom Confirmation Card */}
      <div className="absolute bottom-4 left-4 right-4 z-[1000]">
        <div className="bg-background/95 backdrop-blur-xl rounded-3xl p-4 shadow-2xl border border-white/20 animate-in slide-in-from-bottom duration-500">
          <div className="flex items-start gap-4 mb-4">
            <div className="bg-primary/10 p-2.5 rounded-2xl shrink-0">
              <MapPin className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0 py-0.5">
              {loading ? (
                <div className="space-y-2">
                  <div className="h-4 bg-muted/40 animate-pulse rounded-full w-3/4" />
                  <div className="h-2.5 bg-muted/40 animate-pulse rounded-full w-full" />
                </div>
              ) : (
                <>
                  <h3 className="text-lg font-black truncate capitalize text-foreground tracking-tight">{centerInfo?.area || 'Move Map'}</h3>
                  <p className="text-xs text-muted-foreground leading-snug line-clamp-2 mt-0.5 font-medium">
                    {centerInfo?.fullAddress || 'Locating current area...'}
                  </p>
                </>
              )}
            </div>
          </div>
          
          <Button 
            className="w-full h-14 rounded-2xl text-md font-black uppercase tracking-widest shadow-xl shadow-primary/20 active:scale-95 transition-all group"
            disabled={loading || !centerInfo}
            onClick={() => {
              if (map && centerInfo) {
                const c = map.getCenter();
                if (c) {
                    onConfirm({
                        lat: c.lat(),
                        lng: c.lng(),
                        fullAddress: centerInfo.fullAddress,
                        area: centerInfo.area
                    });
                }
              }
            }}
          >
            Confirm Location
            <ChevronRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" strokeWidth={3} />
          </Button>
        </div>
      </div>
    </div>
  );
}