'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Sun, Cloudy, Moon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { TimeSlot } from '@/lib/types';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface BookingDetailsStepProps {
  onNext: (data: { description: string, location: string, address: string, date: Date, timeSlot: TimeSlot }) => void;
  initialData?: { location?: string, address?: string };
}

const timeSlots: { id: TimeSlot; label: string; icon: React.ElementType, time: string }[] = [
  { id: 'morning', label: 'Morning', icon: Sun, time: '8am - 12pm' },
  { id: 'afternoon', label: 'Afternoon', icon: Cloudy, time: '12pm - 5pm' },
  { id: 'evening', label: 'Evening', icon: Moon, time: '5pm - 9pm' },
];

export function BookingDetailsStep({ onNext, initialData }: BookingDetailsStepProps) {
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState(initialData?.location || '');
  const [address, setAddress] = useState(initialData?.address || '');
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const { toast } = useToast();

  const handleContinue = () => {
    if (!location.trim()) {
        toast({ variant: 'destructive', title: 'Area Required', description: 'Please enter your area or town.' });
        return;
    }
    if (!address.trim()) {
        toast({ variant: 'destructive', title: 'Address Required', description: 'Please provide your full address.' });
        return;
    }
    if (!date) {
        toast({ variant: 'destructive', title: 'Date Required', description: 'Please select a date.' });
        return;
    }
    if (!selectedSlot) {
        toast({ variant: 'destructive', title: 'Time Slot Required', description: 'Please select a time slot.' });
        return;
    }
    onNext({ description, location, address, date, timeSlot: selectedSlot });
  };

  return (
    <div className="space-y-6 pb-4">
        <div className="space-y-2">
            <h2 className="text-2xl font-bold">Tell us more (optional)</h2>
            <Textarea
                placeholder="Describe your issue in a few words..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="text-base"
            />
        </div>

        <Card>
            <CardHeader>
                <CardTitle className="text-xl">Select location</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                 <div>
                    <Label htmlFor="area-input">Area / Town</Label>
                    <Input
                        id="area-input"
                        placeholder="e.g. Ichgam, Budgam"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        className="mt-1 text-base"
                    />
                </div>
                 <div>
                    <Label htmlFor="address-input">Full Address</Label>
                    <Input
                        id="address-input"
                        placeholder="House number, landmark, etc."
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        className="mt-1 text-base"
                    />
                </div>
            </CardContent>
        </Card>
        
        <Card>
            <CardHeader>
                <CardTitle className="text-xl">Choose date</CardTitle>
            </CardHeader>
            <CardContent>
                <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    className="p-0 [&_td]:w-full"
                    disabled={(d) => d < new Date(new Date().toDateString())}
                />
            </CardContent>
        </Card>
        
        <Card>
            <CardHeader>
                <CardTitle className="text-xl">Preferred time</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-3">
                 {timeSlots.map((slot) => (
                     <Card 
                        key={slot.id}
                        onClick={() => setSelectedSlot(slot.id)}
                        className={cn(
                            "p-4 flex items-center gap-4 cursor-pointer transition-all border-2",
                            selectedSlot === slot.id ? "border-primary bg-primary/5" : "hover:bg-secondary"
                        )}
                    >
                        <div className={cn(
                            "p-2.5 rounded-full",
                            selectedSlot === slot.id ? "bg-primary text-primary-foreground" : "bg-secondary text-primary"
                        )}>
                            <slot.icon className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="font-semibold">{slot.label}</p>
                            <p className="text-sm text-muted-foreground">{slot.time}</p>
                        </div>
                    </Card>
                ))}
            </CardContent>
        </Card>

        <Button
            size="lg"
            className="w-full"
            onClick={handleContinue}
            disabled={!date || !selectedSlot || !location || !address}
        >
            Find Experts Near You
        </Button>
    </div>
  );
}
