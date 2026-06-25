import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function safeStringify(obj: any, replacer?: any, space?: string | number) {
  const seen = new WeakSet();
  const circularReplacer = (key: any, value: any) => {
    // Check if it's a React element
    if (value && typeof value === 'object' && (value.$$typeof || value._owner)) {
      return "[ReactElement]";
    }
    
    // Improved HTMLElement detection
    if (value && typeof value === 'object' && (value.nodeType === 1 || value.tagName)) {
      return "[HTMLElement]";
    }
    
    if (typeof value === "object" && value !== null) {
      if (seen.has(value)) {
        return "[Circular]";
      }
      seen.add(value);
    }
    return replacer ? replacer(key, value) : value;
  };
  return JSON.stringify(obj, circularReplacer, space);
}

export function safeStore(key: string, data: any) {
  try {
    const serializedData = safeStringify(data);
    localStorage.setItem(key, serializedData);
  } catch (error) {
    console.error(`Error saving to localStorage [${key}]:`, error);
  }
}

export function getDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  if (!lat1 || !lon1 || !lat2 || !lon2) {
    return Infinity;
  }
  const R = 6371; // Radius of the Earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c; // Distance in km
  return distance;
}

export function formatDistance(km: number): string {
  if (km === Infinity) return "Unknown";
  if (km < 1) {
    return `${Math.round(km * 1000)} m`;
  }
  if (km > 100) {
    return `${Math.round(km)} km`;
  }
  return `${km.toFixed(1)} km`;
}
