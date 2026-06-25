'use client';

import 'leaflet/dist/leaflet.css';
import { useState, useEffect, useRef } from 'react';
import type { Map as LeafletMap } from 'leaflet';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/auth-context';
import { updateUserLocationAndAddress, updateExpertLocationAndAddress } from '@/services/user-service';
import { Loader2, MapPin } from 'lucide-react';
import { Skeleton } from './ui/skeleton';

interface LocationPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  location: { lat: number; lng: number };
}

export function LocationPreviewModal({ isOpen, onClose, onConfirm, location }: LocationPreviewModalProps) {
  const { user, userProfile } = useAuth();
  const { toast } = useToast();
  const [address, setAddress] = useState<string | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);
  const [isLoadingAddress, setIsLoadingAddress] = useState(true);
  const mapRef = useRef<LeafletMap | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    let L: typeof import('leaflet') | undefined;

    const init = async () => {
      if (!location || !mapContainerRef.current) return;
      
      // Dynamically import Leaflet
      L = (await import('leaflet'));

      if (!isMounted || mapRef.current) return;

      const map = L.map(mapContainerRef.current).setView([location.lat, location.lng], 15);
      mapRef.current = map;

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(map);

      const customIcon = new L.Icon({
        iconUrl: '/marker-icon.png',
        iconRetinaUrl: '/marker-icon-2x.png',
        shadowUrl: '/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41]
      });

      L.marker([location.lat, location.lng], { icon: customIcon }).addTo(map);

      L.circle([location.lat, location.lng], {
        color: '#2563eb',
        fillColor: '#3b82f6',
        fillOpacity: 0.2,
        radius: 1000
      }).addTo(map);
    };

    init();
    
    return () => {
      isMounted = false;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [isOpen, location]);

  useEffect(() => {
    if (!isOpen || !location) return;

    const fetchAddress = async () => {
      setIsLoadingAddress(true);
      try {
        const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${location.lat}&lon=${location.lng}`
        );

        if (!response.ok) throw new Error('Failed to fetch address from Nominatim');
        
        const data = await response.json();
        
        if (data.display_name) {
          const parts = data.display_name?.split(', ');
          const shortAddress = parts.slice(0, 3).join(', ');
          setAddress(shortAddress);
        } else {
            const addressParts = data.address;
            const sublocality = addressParts.suburb || addressParts.village || addressParts.town;
            const locality = addressParts.city || addressParts.county;
            const parts = [sublocality, locality].filter(Boolean);
            const uniqueParts = [...new Set(parts)];
            const locationString = uniqueParts.join(', ');

            if (locationString) {
                setAddress(locationString);
            } else {
                setAddress('Address not found');
            }
        }
      } catch (error) {
        console.error(error);
        setAddress('Failed to fetch address');
      } finally {
        setIsLoadingAddress(false);
      }
    };

    fetchAddress();
  }, [isOpen, location]);


  const handleConfirm = async () => {
    if (!user || !location || !address) return;
    setIsConfirming(true);
    try {
      if (userProfile?.role === 'expert') {
        await updateExpertLocationAndAddress(user.uid, {
          lat: location.lat,
          lng: location.lng,
          address: address,
        });
      } else {
        await updateUserLocationAndAddress(user.uid, {
          lat: location.lat,
          lng: location.lng,
          address: address,
        });
      }
      
      toast({ title: 'Location Updated!', description: `Your location is now set to ${address}.` });
      onConfirm();
    } catch (error) {
      console.error(error);
      toast({ variant: 'destructive', title: 'Error', description: 'Could not update your location. Please try again.' });
    } finally {
      setIsConfirming(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] p-0 gap-0">
        <DialogHeader className="p-6 pb-2 text-left">
          <DialogTitle>Confirm Your Location</DialogTitle>
        </DialogHeader>
        <div id="map" ref={mapContainerRef} className="w-full h-[250px] bg-muted" />
        <div className="p-6 space-y-4">
          <div className="flex items-start gap-3 p-4 bg-secondary rounded-xl">
            <MapPin className="w-5 h-5 text-primary shrink-0 mt-1"/>
            {isLoadingAddress ? (
                <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                </div>
            ) : (
                <p className="font-semibold text-foreground">{address}</p>
            )}
          </div>
        </div>
        <DialogFooter className="p-4 border-t grid grid-cols-2 gap-2">
          <Button variant="outline" onClick={onClose} disabled={isConfirming}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={isConfirming || isLoadingAddress}>
            {isConfirming ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Confirm Location'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
