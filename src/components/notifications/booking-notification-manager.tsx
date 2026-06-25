'use client';

import { useAuth } from '@/context/auth-context';
import { useBookings } from '@/hooks/use-bookings';
import { useEffect, useRef, useState } from 'react';
import { soundSystem } from '@/lib/sound-system';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, XCircle, BellRing, MapPin, X, Check, ArrowRight, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { setDoc, doc, collection, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Booking } from '@/lib/types';

export function BookingNotificationManager() {
    const { user, userProfile } = useAuth();
    const viewMode = userProfile?.role === 'expert' ? 'expert' : 'customer';
    const { bookings } = useBookings(viewMode);
    
    const prevBookingsRef = useRef<Booking[]>([]);
    const [activePopup, setActivePopup] = useState<{ 
        type: 'request' | 'accepted' | 'rejected' | 'review' | 'review-submitted' | 'booking-requested', 
        booking?: Booking,
        review?: { rating: number, comment: string, customerName: string, expertName?: string }
    } | null>(null);

    useEffect(() => {
        const handleReviewSubmitted = (e: Event) => {
            const customEvent = e as CustomEvent;
            const { rating, comment, expertName } = customEvent.detail || {};
            soundSystem.playSuccessSound();
            soundSystem.vibrate([100, 50, 100]);
            setActivePopup({
                type: 'review-submitted',
                review: {
                    rating,
                    comment,
                    customerName: userProfile?.fullName || 'You',
                    expertName
                }
            });
        };

        const handleBookingRequested = (e: Event) => {
            const customEvent = e as CustomEvent;
            const { expertName, service } = customEvent.detail || {};
            soundSystem.playSuccessSound();
            soundSystem.vibrate([100, 50]);
            setActivePopup({
                type: 'booking-requested',
                booking: {
                    id: 'temp',
                    expertId: 'temp',
                    expertName,
                    service,
                    userId: user?.uid || '',
                    userName: userProfile?.fullName || 'You',
                    status: 'pending',
                    createdAt: new Date(),
                    updatedAt: new Date()
                } as any
            });
        };

        window.addEventListener('customer-review-submitted', handleReviewSubmitted);
        window.addEventListener('customer-booking-requested', handleBookingRequested);

        return () => {
            window.removeEventListener('customer-review-submitted', handleReviewSubmitted);
            window.removeEventListener('customer-booking-requested', handleBookingRequested);
        };
    }, [userProfile?.fullName, user?.uid]);

    useEffect(() => {
        if (!db || viewMode !== 'expert' || !user?.uid) return;

        const reviewsRef = collection(db, 'experts', user.uid, 'reviews');
        const lastNotifiedReviewId = localStorage.getItem(`last_notified_review_${user.uid}`);

        const unsubscribe = onSnapshot(reviewsRef, (snapshot) => {
            let newestReview: any = null;
            let newestTime = 0;

            snapshot.docs.forEach((doc) => {
                const data = doc.data();
                const createdAt = data.createdAt?.toDate?.()?.getTime() || 0;
                if (createdAt > newestTime) {
                    newestTime = createdAt;
                    newestReview = { id: doc.id, ...data };
                }
            });

            if (newestReview) {
                if (newestReview.id !== lastNotifiedReviewId) {
                    const reviewAgeMs = Date.now() - newestTime;
                    const isRecent = reviewAgeMs < 24 * 60 * 60 * 1000; // 24 hours

                    if (isRecent) {
                        soundSystem.playSuccessSound();
                        soundSystem.vibrate([100, 50, 100]);
                        setActivePopup({
                            type: 'review',
                            review: {
                                rating: newestReview.rating,
                                comment: newestReview.comment || '',
                                customerName: newestReview.customerName || 'A customer'
                            }
                        });
                    }
                    localStorage.setItem(`last_notified_review_${user.uid}`, newestReview.id);
                }
            }
        });

        return () => unsubscribe();
    }, [user?.uid, viewMode]);

    useEffect(() => {
        if (!bookings.length) {
            prevBookingsRef.current = bookings;
            return;
        }

        const prevBookings = prevBookingsRef.current;
        const prevMap = new Map(prevBookings.map(b => [b.id, b]));

        if (prevBookings.length > 0) {
            for (const current of bookings) {
                const prev = prevMap.get(current.id);

                // EXPERT: New pending request
                if (viewMode === 'expert' && current.status === 'pending') {
                    if (!prev || prev.status !== 'pending') {
                        soundSystem.playRequestSound();
                        soundSystem.vibrate([200, 100, 200]);
                        setActivePopup({ type: 'request', booking: current });
                    }
                }

                // CUSTOMER: Request accepted or rejected
                if (viewMode === 'customer' && prev && prev.status === 'pending') {
                    if (current.status === 'accepted') {
                        soundSystem.playSuccessSound();
                        soundSystem.vibrate([100, 50, 100]);
                        setActivePopup({ type: 'accepted', booking: current });
                    } else if (current.status === 'rejected') {
                        soundSystem.playRejectSound();
                        soundSystem.vibrate([300]);
                        setActivePopup({ type: 'rejected', booking: current });
                    }
                }
            }
        }

        prevBookingsRef.current = bookings;
    }, [bookings, viewMode]);

    const handleAccept = async (booking: Booking) => {
        if (!db) return;
        try {
            await setDoc(doc(db, 'bookings', booking.id), { status: 'accepted' }, { merge: true });
            setActivePopup(null);
        } catch (e) {
            console.error("Failed to accept", e);
        }
    };

    const handleReject = async (booking: Booking) => {
        if (!db) return;
        try {
            await setDoc(doc(db, 'bookings', booking.id), { status: 'rejected' }, { merge: true });
            setActivePopup(null);
        } catch (e) {
            console.error("Failed to reject", e);
        }
    };

    if (!activePopup) return null;

    const isExpertRequest = activePopup.type === 'request';

    return (
        <AnimatePresence>
            {activePopup && (
                isExpertRequest ? (
                    /* EXPERT POPUP: Single, Clean Bottom-Sheet slide-up popup */
                    <div className="fixed inset-x-0 bottom-0 z-[60] flex flex-col justify-end bg-black/40 backdrop-blur-sm h-full font-sans">
                        <motion.div 
                            initial={{ y: "100%" }}
                            animate={{ y: 0 }}
                            exit={{ y: "100%" }}
                            transition={{ type: "spring", damping: 25, stiffness: 220 }}
                            className="bg-white dark:bg-neutral-900 border-t border-slate-200/80 shadow-[0_-8px_40px_rgba(0,0,0,0.15)] rounded-t-[2.5rem] p-6 pb-24 md:pb-10 w-full max-w-lg mx-auto relative overflow-hidden"
                        >
                            {/* Accent indicator bar */}
                            <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-6" />

                            <div className="flex items-center gap-3.5 mb-5">
                                <div className="w-12 h-12 rounded-3xl bg-primary/10 flex items-center justify-center shrink-0">
                                    <BellRing className="w-6 h-6 text-primary animate-pulse" />
                                </div>
                                <div>
                                    <h3 className="font-extrabold text-lg text-slate-900 dark:text-neutral-100">
                                        Incoming Job Request!
                                    </h3>
                                    <p className="text-[10px] text-primary font-black uppercase tracking-widest leading-none mt-1">
                                        Instant Booking Nearby
                                    </p>
                                </div>
                            </div>

                            <div className="bg-slate-50 dark:bg-neutral-800/50 p-4 rounded-2xl border border-slate-100 dark:border-neutral-800 space-y-3 mb-6">
                                <div className="flex justify-between items-start gap-4">
                                    <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">Customer</span>
                                    <span className="text-slate-800 dark:text-neutral-100 text-sm font-black text-right truncate">
                                        {activePopup.booking.userName}
                                    </span>
                                </div>
                                <div className="flex justify-between items-start gap-4">
                                    <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">Service Needed</span>
                                    <span className="text-primary text-sm font-black text-right">
                                        {activePopup.booking.service}
                                    </span>
                                </div>
                                <div className="flex justify-between items-start gap-4">
                                    <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">Location Area</span>
                                    <div className="flex items-center gap-1 text-slate-800 dark:text-neutral-200 font-bold text-sm">
                                        <MapPin className="w-4 h-4 text-orange-500" />
                                        <span>{activePopup.booking.userArea || 'Kashmir, Srinagar'}</span>
                                    </div>
                                </div>
                            </div>

                            <p className="text-xs text-slate-400 text-center font-bold px-4 mb-6 leading-relaxed">
                                Please respond promptly. You are the closest matched certified professional!
                            </p>

                            <div className="flex gap-4">
                                <Button 
                                    variant="outline" 
                                    className="flex-1 rounded-2xl h-12 font-black uppercase tracking-widest text-xs border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-neutral-800 dark:text-neutral-400 active:scale-95 transition-all" 
                                    onClick={() => handleReject(activePopup.booking)}
                                >
                                    Decline
                                </Button>
                                <Button 
                                    className="flex-1 rounded-2xl h-12 font-black uppercase tracking-widest text-xs bg-primary hover:bg-primary/95 text-primary-foreground shadow-lg shadow-primary/20 active:scale-95 transition-all" 
                                    onClick={() => handleAccept(activePopup.booking)}
                                >
                                    Accept Request
                                </Button>
                            </div>
                        </motion.div>
                    </div>
                ) : (
                    /* CUSTOMER POPUPS: Traditional floating top dialogs for status changes */
                    <motion.div 
                        initial={{ opacity: 0, y: -50, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -20, scale: 0.95 }}
                        className="fixed top-4 left-0 right-0 z-50 flex justify-center px-4 font-sans"
                    >
                        <div className="bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xl border border-slate-200/55 dark:border-neutral-800/55 shadow-2xl rounded-3xl p-5 w-full max-w-sm relative overflow-hidden">
                            <button 
                                onClick={() => setActivePopup(null)}
                                className="absolute top-4 right-4 text-slate-400 hover:text-slate-900 dark:hover:text-neutral-105 active:scale-90 transition-transform"
                            >
                                <X className="w-5 h-5" />
                            </button>

                            {activePopup.type === 'accepted' && (
                                <div className="text-center pt-2 pb-1">
                                    <motion.div 
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        transition={{ type: "spring", bounce: 0.5 }}
                                        className="w-14 h-14 rounded-full bg-green-100 dark:bg-green-950/40 flex items-center justify-center mx-auto mb-4"
                                    >
                                        <CheckCircle2 className="w-7 h-7 text-green-600" />
                                    </motion.div>
                                    <h3 className="text-lg font-black text-slate-900 dark:text-neutral-100 mb-1">
                                        Booking Confirmed! 🎉
                                    </h3>
                                    <p className="text-xs text-slate-500 font-bold mb-4">
                                        {activePopup.booking?.expertName} is assigned and on their way.
                                    </p>
                                    <Button 
                                        className="w-full rounded-2xl bg-green-600 hover:bg-green-700 text-white h-11 font-black uppercase tracking-widest text-xs active:scale-95 transition-all" 
                                        onClick={() => setActivePopup(null)}
                                    >
                                        Awesome
                                    </Button>
                                </div>
                            )}

                            {activePopup.type === 'rejected' && (
                                <div className="text-center pt-2 pb-1">
                                    <motion.div 
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        transition={{ type: "spring", bounce: 0.5 }}
                                        className="w-14 h-14 rounded-full bg-red-100 dark:bg-red-950/40 flex items-center justify-center mx-auto mb-4"
                                    >
                                        <XCircle className="w-7 h-7 text-red-600" />
                                    </motion.div>
                                    <h3 className="text-lg font-black text-slate-900 dark:text-neutral-100 mb-1">
                                        Expert is Busy
                                    </h3>
                                    <p className="text-xs text-slate-500 font-bold mb-4">
                                        {activePopup.booking?.expertName} is currently occupied with another task.
                                    </p>
                                    <Button 
                                        variant="outline" 
                                        className="w-full rounded-2xl h-11 text-red-600 border-red-200 hover:bg-red-50 font-black uppercase tracking-widest text-xs active:scale-95 transition-all" 
                                        onClick={() => setActivePopup(null)}
                                    >
                                        Try Another Expert
                                    </Button>
                                </div>
                            )}

                            {activePopup.type === 'review' && (
                                <div className="text-center pt-2 pb-1">
                                    <motion.div 
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        transition={{ type: "spring", bounce: 0.5 }}
                                        className="w-14 h-14 rounded-full bg-amber-100 dark:bg-amber-950/40 flex items-center justify-center mx-auto mb-4"
                                    >
                                        <Star className="w-7 h-7 text-amber-500 fill-amber-500" />
                                    </motion.div>
                                    <h3 className="text-lg font-black text-slate-900 dark:text-neutral-100 mb-1">
                                        New Review Received! ⭐
                                    </h3>
                                    <p className="text-xs text-slate-500 font-bold mb-2">
                                        <span className="text-primary font-extrabold">{activePopup.review?.customerName}</span> left you a {activePopup.review?.rating}-star review!
                                    </p>
                                    {activePopup.review?.comment && (
                                        <p className="text-xs italic text-slate-600 dark:text-neutral-300 bg-slate-50 dark:bg-neutral-800/50 p-2.5 rounded-xl border border-slate-100 dark:border-neutral-800 mb-4">
                                            "{activePopup.review?.comment}"
                                        </p>
                                    )}
                                    <Button 
                                        className="w-full rounded-2xl bg-amber-500 hover:bg-amber-600 text-white h-11 font-black uppercase tracking-widest text-xs active:scale-95 transition-all" 
                                        onClick={() => setActivePopup(null)}
                                    >
                                        Awesome
                                    </Button>
                                </div>
                            )}

                            {activePopup.type === 'review-submitted' && (
                                <div className="text-center pt-2 pb-1">
                                    <motion.div 
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        transition={{ type: "spring", bounce: 0.5 }}
                                        className="w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-950/40 flex items-center justify-center mx-auto mb-4"
                                    >
                                        <CheckCircle2 className="w-7 h-7 text-emerald-600" />
                                    </motion.div>
                                    <h3 className="text-lg font-black text-slate-900 dark:text-neutral-100 mb-1">
                                        Review Submitted! ⭐
                                    </h3>
                                    <p className="text-xs text-slate-500 font-bold mb-2">
                                        Thank you for rating <span className="text-primary font-extrabold">{activePopup.review?.expertName}</span> {activePopup.review?.rating} stars!
                                    </p>
                                    {activePopup.review?.comment && (
                                        <p className="text-xs italic text-slate-600 dark:text-neutral-300 bg-slate-50 dark:bg-neutral-800/50 p-2.5 rounded-xl border border-slate-100 dark:border-neutral-800 mb-4">
                                            "{activePopup.review?.comment}"
                                        </p>
                                    )}
                                    <Button 
                                        className="w-full rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white h-11 font-black uppercase tracking-widest text-xs active:scale-95 transition-all" 
                                        onClick={() => setActivePopup(null)}
                                    >
                                        Awesome
                                    </Button>
                                </div>
                            )}

                            {activePopup.type === 'booking-requested' && (
                                <div className="text-center pt-2 pb-1">
                                    <motion.div 
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        transition={{ type: "spring", bounce: 0.5 }}
                                        className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4"
                                    >
                                        <BellRing className="w-7 h-7 text-primary animate-pulse" />
                                    </motion.div>
                                    <h3 className="text-lg font-black text-slate-900 dark:text-neutral-100 mb-1">
                                        Request Sent! 🚀
                                    </h3>
                                    <p className="text-xs text-slate-500 font-bold mb-4">
                                        <span className="text-primary font-extrabold">{activePopup.booking?.expertName}</span> has been notified instantly.
                                    </p>
                                    <Button 
                                        className="w-full rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground h-11 font-black uppercase tracking-widest text-xs active:scale-95 transition-all" 
                                        onClick={() => setActivePopup(null)}
                                    >
                                        Awesome
                                    </Button>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )
            )}
        </AnimatePresence>
    );
}
