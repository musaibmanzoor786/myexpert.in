
import type { Timestamp } from 'firebase/firestore';

export interface ServiceProblem {
    title: string;
    icon: React.ElementType;
    isEmergency?: boolean;
    style?: {
        card: string;
        iconWrapper: string;
        icon: string;
    };
}

export type Service = {
    name: string;
    icon: React.ElementType;
    imageUrl?: string;
    tagline?: string;
    bgColor?: string;
    iconColor?: string;
    problems?: ServiceProblem[];
    problemQuestion?: string;
};

export interface DemoPhoto {
  url: string;
}

export type BookingType = 'instant' | 'same_day' | 'scheduled';

export interface Review {
  id: string;
  expertId: string;
  customerId: string;
  customerName: string;
  rating: number;
  comment: string;
  bookingId: string;
  createdAt: Timestamp;
}

export type ExpertStatus = 'online' | 'offline' | 'busy';

export interface Expert {
  id:string;
  name: string;
  role?: 'expert';
  email?: string;
  phone?: string;
  profilePictureUrl?: string;
  title: string;
  serviceType: string;
  location: string; 
  area?: string;
  summary: string;
  bio?: string;
  experience?: number;
  languages?: string[];
  workingHours?: string;
  availabilityDays?: string[];
  contact: {
    messaging: boolean;
    call: boolean;
    whatsapp?: string;
    phone?: string;
  };
  services: {name: string}[];
  demoPhotos?: DemoPhoto[];
  isActive?: boolean;
  status?: ExpertStatus;
  online?: boolean;                // Deprecated, use status
  acceptingBookings?: boolean;       // Deprecated, use status
  workingNow?: boolean;              // Deprecated, use status
  isOnline?: boolean;
  isVerified?: boolean;
  currentLocation?: { lat: number; lng: number };
  lastLocationUpdatedAt?: Timestamp;
  distanceKm?: number;
  rating?: number;
  reviewCount?: number;
}

export interface UserAddress {
  id: string;
  name: string;
  phone: string;
  houseNo: string;
  street: string;
  landmark: string;
  type: 'home' | 'work' | 'other';
  lat: number;
  lng: number;
  fullAddress: string;
  area: string;
  createdAt?: Timestamp;
}

export interface UserProfile {
  uid: string;
  email: string | null;
  fullName: string;
  role: 'customer' | 'expert' | null;
  profileComplete?: boolean;
  phone?: string;
  isActive?: boolean;
  location?: string; 
  latitude?: number;
  longitude?: number;
  locationUpdatedAt?: Timestamp;
  serviceType?: string;
  rating?: number;
  reviewCount?: number;
  isVerified?: boolean;
  locationData?: {
    lat: number;
    lng: number;
    area: string;
    fullAddress: string;
    pincode?: string;
  };
}

export interface Customer {
  uid: string;
  fullName: string;
  mobileNumber: string;
  location: string; 
  area?: string; 
  address?: string; 
}

export type BookingStatus = 'pending' | 'accepted' | 'in_progress' | 'marked_complete' | 'completed' | 'cancelled' | 'rejected' | 'expired' | 'upcoming';
export type TimeSlot = 'morning' | 'afternoon' | 'evening' | 'instant';

export interface Booking {
  id: string;
  expertId: string;
  userId: string;
  participantIds: string[];
  status: BookingStatus;
  verificationCode: string; 
  timeSlot?: TimeSlot;
  problemDescription?: string;
  isReviewed?: boolean;

  // Timestamps
  createdAt: Timestamp;
  acceptedAt: Timestamp | null;
  startedAt: Timestamp | null;
  markedCompleteAt: Timestamp | null;
  completedAt: Timestamp | null;
  scheduledDate: Timestamp; 

  // Expiry
  expiresAt: Timestamp | null;
  expiryType: 'today' | 'future';


  // Deprecated fields to be removed later, kept for UI compatibility for now
  expertName: string;
  expertPhotoUrl?: string;
  expertPhone?: string;
  userName: string; 
  userPhone?: string; 
  userArea?: string; 
  userAddress?: string; 
  service: string;
  bookingType?: BookingType;
  responseDeadline?: Timestamp;
  userLocation?: { lat: number; lng: number };
  expertLocation?: { lat: number; lng: number };
  distanceKm?: number;
}

export type NotificationType = 'booking' | 'system' | 'promo';

export interface AppNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  timestamp: Timestamp;
  isRead: boolean;
  type: NotificationType;
  relatedEntityId?: string;
  relatedEntityType?: 'Booking' | 'Promotion' | 'System';
}
