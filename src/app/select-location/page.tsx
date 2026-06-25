'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { AddressForm } from '@/components/address/AddressForm';
import { LocationSelectionHome } from '@/components/address/LocationSelectionHome';
import { LocationPermissionScreen } from '@/components/location/permission-screen';
import { LocationFetchingScreen } from '@/components/location/fetching-screen';
import { LocationConfirmedScreen } from '@/components/location/confirmed-screen';
import MapPicker from '@/components/address/MapPicker';
import { useToast } from '@/hooks/use-toast';
import { getUserAddresses, deleteUserAddress, updateUserLocationData } from '@/services/user-service';
import type { UserAddress } from '@/lib/types';
import { useLocationStore } from '@/lib/location-store';

type FlowStep = 'permission' | 'search' | 'fetching' | 'confirmed' | 'form' | 'map';

function SelectLocationContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialMode = searchParams.get('mode');
  
  const { user, userProfile, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const { setLocation: setLocationInStore } = useLocationStore();
  
  const [step, setStep] = useState<FlowStep>('permission');
  const [savedAddresses, setSavedAddresses] = useState<UserAddress[]>([]);
  const [detectedData, setDetectedData] = useState<{ lat: number; lng: number; fullAddress: string; area: string } | null>(null);
  const [editingAddress, setEditingAddress] = useState<UserAddress | null>(null);
  const [pickedLocation, setPickedLocation] = useState<{ lat: number; lng: number; fullAddress: string; area: string } | null>(null);

  useEffect(() => {
    if (!authLoading && user) {
      getUserAddresses(user.uid).then(setSavedAddresses);
      
      // If mode is explicitly map (from ChangeLocationSheet), go to map
      if (initialMode === 'map') {
        setStep('map');
        return;
      }

      const hasLocation = !!userProfile?.locationData || !!userProfile?.location;
      if (hasLocation && step === 'permission') {
          setStep('search');
      }
    }
  }, [user, authLoading, userProfile, step, initialMode]);

  const handleUseCurrentLocation = async () => {
    const fetchIPLocation = async () => {
        try {
            const res = await fetch('https://ipapi.co/json/');
            const data = await res.json();
            if (data.latitude && data.longitude) {
                return {
                    lat: data.latitude,
                    lng: data.longitude,
                    fullAddress: `${data.city}, ${data.region}, ${data.country_name}`,
                    area: data.city
                };
            }
        } catch (e) {
            console.error("IP geolocation failed", e);
        }
        return null;
    };

    if (!navigator.geolocation) {
      toast({ variant: 'warning', description: "GPS not supported, trying approximate location..." });
      const ipLoc = await fetchIPLocation();
      if(ipLoc) {
          await finalizeLocation(ipLoc);
          return;
      }
      setStep('search');
      return;
    }

    setStep('fetching');

    const fetchCoords = (options: PositionOptions): Promise<GeolocationPosition> => {
      return new Promise((resolve, reject) => {
        const timeoutId = setTimeout(() => {
            reject({ code: 3, message: "GPS Timeout" });
        }, options.timeout || 30000);

        navigator.geolocation.getCurrentPosition(
            (pos) => {
                clearTimeout(timeoutId);
                resolve(pos);
            },
            (err) => {
                clearTimeout(timeoutId);
                reject(err);
            },
            options
        );
      });
    };

    try {
      let position;
      try {
        position = await fetchCoords({
          timeout: 20000,
          enableHighAccuracy: true,
          maximumAge: 0
        });
      } catch (e: any) {
        console.warn("High accuracy failed, attempting standard lookup...", e);
        position = await fetchCoords({
          timeout: 15000,
          enableHighAccuracy: false,
          maximumAge: 300000 
        });
      }

      const res = await fetch(`/api/reverse-geocode?lat=${position.coords.latitude}&lng=${position.coords.longitude}`);
      if (!res.ok) throw new Error("Geocoding failed");
      const data = await res.json();
      
      if (data.formattedLocation) {
        const confirmedData = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          fullAddress: data.formattedLocation,
          area: data.area || data.formattedLocation?.split(',')[0] || '',
        };
        await finalizeLocation(confirmedData);
      }
    } catch (error: any) {
      console.error('Location detection failure:', error);
      
      // Fallback to IP detection
      const ipLoc = await fetchIPLocation();
      if(ipLoc) {
          toast({ description: "Located using approximate area." });
          await finalizeLocation(ipLoc);
          return;
      }

      toast({ variant: 'warning', description: "Could not detect location. Please try manual selection." });
      setStep('search');
    }
  };

  const finalizeLocation = async (data: { lat: number; lng: number; area: string; fullAddress: string }) => {
    setDetectedData(data);
    setStep('confirmed');

    if (user) {
      await updateUserLocationData(user.uid, data, userProfile?.role);
    }

    setLocationInStore({
      lat: data.lat,
      lng: data.lng,
      area: data.area,
      address: data.fullAddress
    });

    setTimeout(() => {
      router.replace('/');
    }, 1500);
  };

  const handleSelectAddress = async (addr: UserAddress) => {
    if (userProfile?.locationData?.lat === addr.lat && userProfile?.locationData?.lng === addr.lng) {
        toast({ variant: 'warning', description: "This address is already selected" });
        return;
    }

    const data = {
      lat: addr.lat,
      lng: addr.lng,
      area: addr.area || addr.fullAddress?.split(',')[0] || '',
      fullAddress: addr.fullAddress
    };
    
    if (user) {
      await updateUserLocationData(user.uid, data, userProfile?.role);
    }

    setLocationInStore({
      ...data,
      address: data.fullAddress
    });
    
    toast({ description: "Location updated" });
    router.replace('/');
  };

  const handleSelectPlaceSuggestion = async (lat: number, lng: number, displayName: string) => {
    const confirmedData = {
      lat,
      lng,
      fullAddress: displayName,
      area: displayName?.split(',')[0] || ''
    };
    await finalizeLocation(confirmedData);
  };

  const handleDeleteAddress = async (id: string) => {
    if (!user) return;
    await deleteUserAddress(user.uid, id);
    setSavedAddresses(prev => prev.filter(a => a.id !== id));
  };

  // Helper to handle smarter back navigation
  const handleMapBack = () => {
    if (initialMode === 'map') {
      window.history.length > 2 ? router.back() : router.push('/');
    } else {
      setStep('search');
    }
  };

  const handleFormBack = () => {
    // If they picked a location on the map, back should take them back to the map to re-pin
    if (pickedLocation) {
      setStep('map');
    } else {
      setStep('search');
    }
  };

  if (authLoading) return null;

  return (
    <div className="min-h-screen bg-white">
      {step === 'permission' && (
        <LocationPermissionScreen 
          onUseCurrent={handleUseCurrentLocation}
          onEnterManual={() => setStep('search')}
        />
      )}

      {step === 'search' && (
        <LocationSelectionHome 
            savedAddresses={savedAddresses}
            onUseCurrentLocation={handleUseCurrentLocation}
            onSearch={() => setStep('permission')} 
            onAddManual={() => setStep('map')}
            onSelectAddress={handleSelectAddress}
            onEditAddress={(addr) => { setEditingAddress(addr); setStep('form'); }}
            onDeleteAddress={handleDeleteAddress}
            onSelectPlace={handleSelectPlaceSuggestion}
            onChooseOnMap={() => setStep('map')}
        />
      )}

      {step === 'fetching' && <LocationFetchingScreen />}

      {step === 'confirmed' && detectedData && (
        <LocationConfirmedScreen 
          area={detectedData.area}
          address={detectedData.fullAddress}
        />
      )}

      {step === 'map' && (
        <MapPicker 
          onBack={handleMapBack}
          onConfirm={(loc) => {
            setPickedLocation(loc);
            setStep('form');
          }}
        />
      )}

      {step === 'form' && (
        <AddressForm 
          location={pickedLocation} 
          editingAddress={editingAddress}
          onBack={handleFormBack}
          onSave={() => router.replace('/')}
        />
      )}
    </div>
  );
}

export default function SelectLocationPage() {
  return (
    <Suspense fallback={<LocationFetchingScreen />}>
      <SelectLocationContent />
    </Suspense>
  );
}