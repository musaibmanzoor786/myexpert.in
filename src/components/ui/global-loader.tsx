
'use client';

import { useLoadingStore } from '@/lib/loading-store';
import { Loader2 } from 'lucide-react';

/**
 * A global, high-fidelity loading overlay that blocks interaction.
 * Transitions are intentionally smooth (700ms) to provide a premium feel.
 */
export function GlobalLoader() {
    const { isLoading } = useLoadingStore();

    if (!isLoading) return null;

    return (
        <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-black/60 backdrop-blur-md animate-in fade-in duration-700">
            <div className="flex flex-col items-center gap-6 animate-in zoom-in-95 duration-700">
                <div className="relative">
                    {/* Subtle ambient glow behind the spinner */}
                    <div className="absolute inset-0 bg-white/20 blur-2xl rounded-full scale-150" />
                    <Loader2 className="h-14 w-14 animate-spin text-white relative z-10" strokeWidth={2.5} />
                </div>
                
                <div className="text-center space-y-2 relative z-10">
                    <p className="text-white font-black text-xl tracking-tight">
                        Please wait...
                    </p>
                    {/* Rhythmic loading dots indicator */}
                    <div className="flex justify-center gap-1.5">
                        <div className="w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce [animation-delay:-0.3s]" />
                        <div className="w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce [animation-delay:-0.15s]" />
                        <div className="w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce" />
                    </div>
                </div>
            </div>
        </div>
    );
}
