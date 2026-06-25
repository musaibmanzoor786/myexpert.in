
import { cn } from '@/lib/utils';

export const WhiskIcon = ({ className }: { className?: string }) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={cn(className)}
    >
        <path d="M12 5V2" />
        <path d="M12 5C15.866 5 19 8.13401 19 12C19 15.866 15.866 19 12 19C8.13401 19 5 15.866 5 12C5 8.13401 8.13401 5 12 5Z" />
        <path d="M12 5C14.7614 5 17 7.23858 17 10C17 12.7614 14.7614 15 12 15C9.23858 15 7 12.7614 7 10C7 7.23858 9.23858 5 12 5Z" />
        <path d="M12 19V22" />
    </svg>
);
