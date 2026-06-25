
'use client';

import { useState, useEffect } from 'react';
import { Timestamp } from 'firebase/firestore';
import { cn } from '@/lib/utils';
import { Timer } from 'lucide-react';

interface LiveTimerProps {
    startTime: Timestamp;
    className?: string;
}

export function LiveTimer({ startTime, className }: LiveTimerProps) {
    const [elapsed, setElapsed] = useState<number>(0);

    useEffect(() => {
        const startMillis = startTime.toMillis();

        const interval = setInterval(() => {
            const now = Date.now();
            setElapsed(now - startMillis);
        }, 1000);

        return () => clearInterval(interval);
    }, [startTime]);

    if (elapsed < 0) return null;

    const totalSeconds = Math.floor(elapsed / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    return (
        <div className={cn("flex items-center justify-center gap-2 font-bold text-3xl text-green-600 transition-colors", className)}>
            <Timer className="w-7 h-7" />
            <span className="font-mono tabular-nums">
                {hours.toString().padStart(2, '0')}:
                {minutes.toString().padStart(2, '0')}:
                {seconds.toString().padStart(2, '0')}
            </span>
        </div>
    );
}
