
'use client';

export function CityIllustration() {
  return (
    <svg width="280" height="280" viewBox="0 0 280 280" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="280" height="280" rx="40" fill="transparent" />
      {/* Background Subtle Shape */}
      <path d="M40 140L140 40L240 140L140 240L40 140Z" fill="#F0FDF9" />
      
      {/* Buildings Group (Simplified Isometric) */}
      <g opacity="0.8">
        {/* Building 1 */}
        <rect x="80" y="100" width="40" height="60" fill="#E5E7EB" />
        <path d="M80 100L100 85L120 100H80Z" fill="#D1D5DB" />
        <rect x="85" y="115" width="8" height="8" rx="1" fill="#FFFFFF" />
        <rect x="107" y="115" width="8" height="8" rx="1" fill="#FFFFFF" />
        <rect x="85" y="135" width="8" height="8" rx="1" fill="#FFFFFF" />
        <rect x="107" y="135" width="8" height="8" rx="1" fill="#FFFFFF" />

        {/* Building 2 - Accent Building */}
        <rect x="140" y="70" width="50" height="100" fill="#F3F4F6" />
        <path d="M140 70L165 50L190 70H140Z" fill="#00B894" fillOpacity="0.2" />
        <rect x="150" y="85" width="10" height="10" rx="1" fill="#00B894" fillOpacity="0.1" />
        <rect x="170" y="85" width="10" height="10" rx="1" fill="#00B894" fillOpacity="0.1" />
        <rect x="150" y="110" width="10" height="10" rx="1" fill="#FFFFFF" />
        <rect x="170" y="110" width="10" height="10" rx="1" fill="#FFFFFF" />
        <rect x="150" y="135" width="10" height="10" rx="1" fill="#FFFFFF" />
        <rect x="170" y="135" width="10" height="10" rx="1" fill="#FFFFFF" />

        {/* Building 3 */}
        <rect x="110" y="160" width="60" height="40" fill="#D1D5DB" />
        <rect x="120" y="170" width="40" height="20" fill="#FFFFFF" opacity="0.5" />
      </g>

      {/* Roads */}
      <path d="M40 200L240 200" stroke="#FFFFFF" strokeWidth="8" strokeLinecap="round" />
      <path d="M140 40L140 240" stroke="#FFFFFF" strokeWidth="8" strokeLinecap="round" />

      {/* Accent Trees */}
      <circle cx="200" cy="180" r="12" fill="#00B894" />
      <circle cx="215" cy="195" r="8" fill="#00B894" fillOpacity="0.6" />
      <circle cx="70" cy="180" r="10" fill="#00B894" />
      
      {/* Highlight Elements */}
      <rect x="160" y="210" width="20" height="4" rx="2" fill="#00B894" />
      <rect x="100" y="210" width="30" height="4" rx="2" fill="#00B894" fillOpacity="0.3" />
    </svg>
  );
}
