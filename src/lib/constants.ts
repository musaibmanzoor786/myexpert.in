
import { 
    Wrench, Zap, Hammer, PaintRoller, ChefHat, Hand, Camera, Droplets,
    Bath, ShowerHead, Thermometer, PlusCircle,
    DoorOpen, Home, Building, Square,
    Utensils, CakeSlice, Heart, Sparkles,
    HeartHandshake, Waves, Armchair, Box, BedDouble,
    CookingPot, Construction, Plug, Wind, Lightbulb, CircuitBoard, BatteryCharging,
    Leaf, Clock, Mic, Airplay, User, Palette, Paintbrush, HardHat, Shield,
    PartyPopper, Drumstick
} from "lucide-react";
import { WhiskIcon } from '@/components/icons/whisk-icon';
import placeholderImages from './placeholder-images.json';
import type { Service } from './types';

export const timeSlotLabels: Record<string, string> = {
    instant: 'Instant (within 2 hours)',
    morning: 'Morning (8:00 AM – 12:00 PM)',
    afternoon: 'Afternoon (12:00 PM – 5:00 PM)',
    evening: 'Evening (5:00 PM – 9:00 PM)',
};

export const servicesList: Service[] = [
    { 
        name: 'Plumber', 
        icon: Wrench, 
        imageUrl: '/assets/icons/plumber.png',
        tagline: 'Leaks, pipes & more',
        problems: [
            { title: 'Pipe Leakage', icon: Droplets },
            { title: 'Tap Repair', icon: Bath },
            { title: 'Blocked Drain', icon: Waves },
            { title: 'Bathroom Fitting', icon: ShowerHead },
            { title: 'Water Tank Issue', icon: Thermometer },
            { title: 'New Installation', icon: Wrench },
            { title: 'Other Issue', icon: PlusCircle },
        ]
    },
    { 
        name: 'Electrician', 
        icon: Zap, 
        imageUrl: '/assets/icons/electrician.png',
        tagline: 'Wiring & safety',
        problems: [
            { title: 'Switch / Socket', icon: Plug },
            { title: 'Fan Repair', icon: Wind },
            { title: 'Light Fitting', icon: Lightbulb },
            { title: 'Wiring Issue', icon: CircuitBoard },
            { title: 'Inverter', icon: BatteryCharging },
            { title: 'Other Issue', icon: PlusCircle },
        ]
    },
    { 
        name: 'Carpenter', 
        icon: Hammer, 
        imageUrl: '/assets/icons/carpenter.png',
        tagline: 'Furniture & repairs',
        problems: [
            { title: 'Furniture Repair', icon: Armchair },
            { title: 'New Furniture', icon: Box },
            { title: 'Door / Window', icon: DoorOpen },
            { title: 'Cupboard / Bed', icon: BedDouble },
            { title: 'Kitchen Work', icon: CookingPot },
            { title: 'Polishing', icon: Sparkles },
            { title: 'Small Fix', icon: Construction },
            { title: 'Other Work', icon: PlusCircle },
        ]
    },
    { 
        name: 'Painter', 
        icon: PaintRoller, 
        imageUrl: '/assets/icons/painter.png',
        tagline: 'Home & office painting',
        problemQuestion: 'What do you need painted?',
        problems: [
            { title: 'Full House', icon: Home },
            { title: 'Single Room', icon: Square },
            { title: 'Wall Design', icon: Palette },
            { title: 'Touch-up', icon: Paintbrush },
            { title: 'Exterior', icon: Building },
            { title: 'Waterproofing', icon: Shield },
            { title: 'New House', icon: HardHat },
            { title: 'Other', icon: PlusCircle },
        ]
    },
    { 
        name: 'Cook', 
        icon: WhiskIcon,
        imageUrl: '/assets/icons/cook.png',
        tagline: 'Home cooking',
        problemQuestion: 'What are you looking for?',
        problems: [
            { title: 'Daily Cook', icon: Utensils },
            { title: 'Party Cooking', icon: CakeSlice },
            { title: 'Wedding Cook', icon: ChefHat },
            { title: 'Veg Food', icon: Leaf },
            { title: 'Non-Veg', icon: Drumstick },
            { title: 'Kashmiri Food', icon: CookingPot },
            { title: 'Short Term', icon: Clock },
            { title: 'Other', icon: PlusCircle },
        ]
    },
    { 
        name: 'Mehendi Artist', 
        icon: Hand, 
        imageUrl: '/assets/icons/mehendi.png',
        tagline: 'Bridal & events',
        problemQuestion: 'Choose the occasion',
        problems: [
            { 
                title: 'Bridal Mehendi', 
                icon: Heart,
            },
            { 
                title: 'Engagement', 
                icon: HeartHandshake,
            },
            { 
                title: 'Festival', 
                icon: Sparkles,
            },
            { 
                title: 'Simple Mehendi', 
                icon: Hand,
            },
            { 
                title: 'Full Hand', 
                icon: Hand,
            },
            { 
                title: 'Kids Mehendi', 
                icon: PartyPopper,
            },
            { 
                title: 'Home Function', 
                icon: Home,
            },
            { 
                title: 'Other', 
                icon: PlusCircle,
            },
        ]
    },
    { 
        name: 'Photographer', 
        icon: Camera, 
        imageUrl: '/assets/icons/photographer.png',
        tagline: 'Events & portraits',
        problemQuestion: "What's the event?",
        problems: [
            { title: 'Wedding Shoot', icon: Camera },
            { title: 'Pre-Wedding', icon: Heart },
            { title: 'Birthday', icon: CakeSlice },
            { title: 'Event', icon: Mic },
            { title: 'Product', icon: Box },
            { title: 'Portrait', icon: User },
            { title: 'Drone', icon: Airplay },
            { title: 'Other', icon: PlusCircle },
        ]
    },
];

export const languagesList = [
  { id: 'english', label: 'English' },
  { id: 'hindi', label: 'Hindi' },
  { id: 'kashmiri', label: 'Kashmiri' },
  { id: 'urdu', label: 'Urdu' },
  { id: 'punjabi', label: 'Punjabi' },
  { id: 'bengali', label: 'Bengali' },
  { id: 'marathi', label: 'Marathi' },
  { id: 'telugu', label: 'Telugu' },
  { id: 'tamil', label: 'Tamil' },
];
