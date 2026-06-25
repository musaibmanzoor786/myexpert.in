import { cn } from '@/lib/utils';

export const AppLogo = ({ className }: { className?: string }) => (
    <svg
        viewBox="0 0 120 40"
        xmlns="http://www.w3.org/2000/svg"
        className={cn("h-auto", className)}
    >                
        {/* Modern Branded Typography */}
        <text
            x="0"
            y="30"
            fontFamily="Inter, sans-serif"
            fontSize="26"
            fontWeight="900"
            letterSpacing="-0.04em"
            fill="currentColor"
        >
            MyExpert
        </text>
    </svg>
);
