'use client';

import { AuthProvider } from '@/context/auth-context';
import { Toaster } from '@/components/ui/toaster';
import { FirebaseErrorListener } from '@/components/FirebaseErrorListener';
import { AppLayout } from '@/components/layout/app-layout';
import { useEffect, useState } from 'react';
import { APIProvider } from '@vis.gl/react-google-maps';
import { BookingNotificationManager } from '@/components/notifications/booking-notification-manager';
import { MapPin, ArrowRight } from 'lucide-react';

export function Providers({ children }: { children: React.ReactNode }) {
    const [mounted, setMounted] = useState(false);
    const API_KEY = (typeof process !== 'undefined' ? process.env?.GOOGLE_MAPS_PLATFORM_KEY : '') || '';
    const hasValidKey = Boolean(API_KEY) && API_KEY !== 'YOUR_API_KEY';

    // Self-healing logic for ChunkLoadErrors
    useEffect(() => {
        setMounted(true);

        // Register Progressive Web App Service Worker
        if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
            const registerSW = () => {
                navigator.serviceWorker.register('/sw.js')
                    .then((registration) => {
                        console.log('[Service Worker] Registered successfully with scope:', registration.scope);
                    })
                    .catch((error) => {
                        console.error('[Service Worker] Registration failed:', error);
                    });
            };

            if (document.readyState === 'complete') {
                registerSW();
            } else {
                window.addEventListener('load', registerSW);
            }
        }

        const handleError = (e: ErrorEvent) => {
            if (e.message && (e.message.includes('ChunkLoadError') || e.message.includes('Loading chunk'))) {
                console.warn('ChunkLoadError detected. Attempting to refresh the page...');
                window.location.reload();
            }
        };

        window.addEventListener('error', handleError);

        // Mute specific Firebase offline connection warnings that Next.js intercepts as errors
        const originalConsoleError = console.error;
        console.error = (...args: any[]) => {
            const isFirestoreOfflineError = args.some(arg => 
                typeof arg === 'string' && arg.includes('Could not reach Cloud Firestore backend')
            );
            if (isFirestoreOfflineError) {
                return;
            }
            originalConsoleError.apply(console, args);
        };

        return () => {
            window.removeEventListener('error', handleError);
            console.error = originalConsoleError;
        };
    }, []);

    if (mounted && !hasValidKey) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-slate-50 p-6 font-sans">
                <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 border border-slate-200">
                    <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mb-6">
                        <MapPin className="w-8 h-8 text-blue-600" />
                    </div>
                    <h2 className="text-2xl font-black text-slate-900 mb-4 tracking-tight">Google Maps API Key Required</h2>
                    <div className="space-y-6 text-slate-600">
                        <div className="space-y-3">
                            <p className="text-sm font-bold flex items-center gap-2 text-slate-900">
                                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-slate-900 text-white text-[10px]">1</span>
                                Get an API Key
                            </p>
                            <a 
                                href="https://console.cloud.google.com/google/maps-apis/start?utm_campaign=gmp-code-assist-ais" 
                                target="_blank" 
                                rel="noopener"
                                className="inline-flex items-center text-blue-600 text-sm font-black hover:underline"
                            >
                                Cloud Console <ArrowRight className="ml-1 w-3 h-3" />
                            </a>
                        </div>
                        
                        <div className="space-y-3">
                            <p className="text-sm font-bold flex items-center gap-2 text-slate-900">
                                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-slate-900 text-white text-[10px]">2</span>
                                Add to AI Studio Secrets
                            </p>
                            <ul className="text-xs space-y-2 font-medium list-disc ml-5 leading-relaxed">
                                <li>Open <strong>Settings</strong> (⚙️ gear icon, top-right)</li>
                                <li>Select <strong>Secrets</strong></li>
                                <li>Type <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-900">GOOGLE_MAPS_PLATFORM_KEY</code>, press Enter</li>
                                <li>Paste your API key, press Enter</li>
                            </ul>
                        </div>
                        
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest pt-4">
                            The app rebuilds automatically after adding the secret.
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <APIProvider apiKey={API_KEY} version="weekly">
            <AuthProvider>
                {mounted && <BookingNotificationManager />}
                <AppLayout>
                    {children}
                </AppLayout>
                {mounted && <Toaster />}
                {mounted && <FirebaseErrorListener />}
            </AuthProvider>
        </APIProvider>
    );
}
