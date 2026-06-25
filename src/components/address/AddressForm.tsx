
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ChevronLeft, User, Phone, Home, Briefcase, MapPin, Milestone } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/auth-context';
import { addUserAddress, updateUserAddress } from '@/services/user-service';
import { useToast } from '@/hooks/use-toast';
import type { UserAddress } from '@/lib/types';
import { useLoadingStore } from '@/lib/loading-store';
import { useLocationStore } from '@/lib/location-store';

interface AddressFormProps {
  location: { lat: number; lng: number; fullAddress: string; area: string } | null;
  editingAddress: UserAddress | null;
  onBack: () => void;
  onSave: () => void;
}

export function AddressForm({ location, editingAddress, onBack, onSave }: AddressFormProps) {
  const { user, userProfile } = useAuth();
  const { toast } = useToast();
  const { setIsLoading } = useLoadingStore();
  const { setLocation: setLocationInStore } = useLocationStore();
  
  const [formData, setFormData] = useState({
    name: editingAddress?.name || userProfile?.fullName || '',
    phone: editingAddress?.phone || userProfile?.phone || '',
    houseNo: editingAddress?.houseNo || '',
    street: editingAddress?.street || '',
    landmark: editingAddress?.landmark || '',
    type: (editingAddress?.type || 'home') as UserAddress['type'],
  });

  // Sync form state with profile data if it arrives after component mount
  useEffect(() => {
    if (!editingAddress && userProfile) {
      setFormData(prev => ({
        ...prev,
        name: prev.name || userProfile.fullName || '',
        phone: prev.phone || userProfile.phone || '',
      }));
    }
  }, [userProfile, editingAddress]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!formData.name || !formData.phone || !formData.houseNo || !formData.street) {
      toast({ description: 'Please fill all mandatory fields' });
      return;
    }

    setIsLoading(true);
    try {
      const payload = {
        ...formData,
        lat: location?.lat || editingAddress?.lat || 0,
        lng: location?.lng || editingAddress?.lng || 0,
        fullAddress: location?.fullAddress || editingAddress?.fullAddress || '',
        area: location?.area || editingAddress?.area || '',
      };

      if (editingAddress) {
        await updateUserAddress(user.uid, editingAddress.id, payload);
        toast({ description: 'Address updated successfully' });
      } else {
        await addUserAddress(user.uid, payload);
        toast({ description: 'Location saved successfully' });
      }

      // Update store
      setLocationInStore({
          lat: payload.lat,
          lng: payload.lng,
          area: payload.area || payload.fullAddress?.split(',')[0],
          address: payload.fullAddress
      });

      onSave();
    } catch (error) {
    console.error(error);
      // Handled globally
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen w-full mx-auto bg-background">
      <header className="p-4 flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onBack} className="rounded-full">
          <ChevronLeft className="h-6 w-6" />
        </Button>
        <h1 className="text-xl font-bold">{editingAddress ? 'Edit Address' : 'Complete Address'}</h1>
      </header>

      <form onSubmit={handleSubmit} className="flex-1 p-6 space-y-6 overflow-y-auto pb-32">
        <div className="space-y-5">
          
          {/* CONTACT DETAILS: Editable inputs pre-filled from profile */}
          <div className="space-y-3">
            <Label className="text-sm font-bold text-muted-foreground ml-1 uppercase tracking-wider">Contact Details</Label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input 
                placeholder="Receiver's Name" 
                className="pl-12 h-14 rounded-2xl border-2 bg-secondary/30 text-lg focus-visible:ring-primary"
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
              />
            </div>
            <div className="relative">
              <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input 
                placeholder="Receiver's Phone" 
                type="tel"
                className="pl-12 h-14 rounded-2xl border-2 bg-secondary/30 text-lg focus-visible:ring-primary"
                value={formData.phone}
                onChange={e => setFormData({...formData, phone: e.target.value.replace(/\D/g, '').slice(0, 10)})}
              />
            </div>
          </div>

          <div className="space-y-2 pt-2">
            <Label className="text-sm font-bold text-muted-foreground ml-1 uppercase tracking-wider">Address Details</Label>
            <div className="relative">
              <Home className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input 
                placeholder="House / Flat No." 
                className="pl-12 h-14 rounded-2xl border-2 bg-secondary/30 text-lg focus-visible:ring-primary"
                value={formData.houseNo}
                onChange={e => setFormData({...formData, houseNo: e.target.value})}
              />
            </div>
            <div className="relative">
              <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input 
                placeholder="Street or Mohalla" 
                className="pl-12 h-14 rounded-2xl border-2 bg-secondary/30 text-lg focus-visible:ring-primary"
                value={formData.street}
                onChange={e => setFormData({...formData, street: e.target.value})}
              />
            </div>
            <div className="relative">
              <Milestone className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input 
                placeholder="Landmark (Optional)" 
                className="pl-12 h-14 rounded-2xl border-2 bg-secondary/30 text-lg focus-visible:ring-primary"
                value={formData.landmark}
                onChange={e => setFormData({...formData, landmark: e.target.value})}
              />
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <Label className="text-sm font-bold text-muted-foreground ml-1 uppercase tracking-wider">Save As</Label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { id: 'home', icon: Home, label: 'Home' },
                { id: 'work', icon: Briefcase, label: 'Work' },
                { id: 'other', icon: MapPin, label: 'Other' },
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setFormData({...formData, type: item.id as any})}
                  className={cn(
                    "flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border-2 transition-all font-bold",
                    formData.type === item.id 
                      ? "bg-primary/10 border-primary text-primary" 
                      : "bg-secondary/20 border-transparent text-muted-foreground"
                  )}
                >
                  <item.icon className="h-6 w-6" />
                  <span className="text-xs">{item.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </form>

      <div className="fixed bottom-0 left-0 right-0 p-6 bg-background border-t">
        <Button 
          onClick={handleSubmit} 
          className="w-full h-14 rounded-2xl text-lg font-bold shadow-xl"
        >
          {editingAddress ? 'Update Address' : 'Save Address'}
        </Button>
      </div>
    </div>
  );
}
