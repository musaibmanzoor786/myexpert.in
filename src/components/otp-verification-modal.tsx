
'use client';

import { useState, useRef, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { setDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Booking } from '@/lib/types';
import { Loader2, ShieldCheck, Lock, Smartphone, RefreshCw, X, HelpCircle } from 'lucide-react';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { motion, AnimatePresence } from 'framer-motion';

interface OtpVerificationModalProps {
  booking: Booking;
  isOpen: boolean;
  onClose: () => void;
  onVerified: () => void;
}

export function OtpVerificationModal({ booking, isOpen, onClose, onVerified }: OtpVerificationModalProps) {
  const [verificationCode, setVerificationCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [shouldShake, setShouldShake] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Focus hidden input on launch to support immediate typing
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 150);
    }
  }, [isOpen]);

  const handleVerify = async (codeToVerify = verificationCode) => {
    if (codeToVerify.length !== 6) {
      toast({
        variant: 'destructive',
        title: 'Invalid Code',
        description: 'Please enter the 6-digit code from the customer.',
      });
      setShouldShake(true);
      setTimeout(() => setShouldShake(false), 500);
      return;
    }

    if (codeToVerify !== booking.verificationCode) {
      toast({
        variant: 'destructive',
        title: 'Incorrect Code',
        description: 'That code is incorrect. Please ask the customer for the correct code.',
      });
      setShouldShake(true);
      setTimeout(() => setShouldShake(false), 500);
      return;
    }

    setIsVerifying(true);
    
    if (!db) {
        toast({ variant: 'destructive', title: 'Error', description: 'Database not configured.' });
        setIsVerifying(false);
        return;
    }

    const bookingRef = doc(db, 'bookings', booking.id);
    const updateData = {
        status: 'in_progress',
        startedAt: serverTimestamp(),
    };
    
    setDoc(bookingRef, updateData, { merge: true })
        .then(() => {
            toast({
            title: '🎉 Job Successfully Started!',
            description: `The job for ${booking.userName} is now live & in progress.`,
            });
            
            onVerified();
            onClose();
        })
        .catch((serverError) => {
            const permissionError = new FirestorePermissionError({
                path: bookingRef.path,
                operation: 'update',
                requestResourceData: updateData,
            });
            errorEmitter.emit('permission-error', permissionError);
        })
        .finally(() => {
            setIsVerifying(false);
        });
  };

  const handleHiddenInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 6);
    setVerificationCode(val);
    if (val.length === 6) {
      handleVerify(val);
    }
  };

  const handleKeypadPress = (key: string) => {
    if (isVerifying) return;

    let nextVal = verificationCode;
    if (key === 'delete') {
      nextVal = verificationCode.slice(0, -1);
    } else if (key === 'clear') {
      nextVal = '';
    } else {
      if (verificationCode.length < 6) {
        nextVal = verificationCode + key;
      }
    }

    setVerificationCode(nextVal);
    
    // Focus the hidden input to keep hardware sync
    inputRef.current?.focus();

    if (nextVal.length === 6) {
      handleVerify(nextVal);
    }
  };

  // Custom blink component for the caret
  const BlinkingCaret = () => (
    <motion.div
      animate={{ opacity: [1, 0, 1] }}
      transition={{ duration: 0.8, repeat: Infinity, ease: "easeInOut" }}
      className="w-0.5 h-6 bg-primary rounded-full"
    />
  );

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !isVerifying && !open && onClose()}>
      <DialogContent className="sm:max-w-[440px] p-0 overflow-hidden bg-slate-50 border-none rounded-3xl shadow-2xl flex flex-col items-stretch max-h-[92vh]">
        {/* Upper Brand Header */}
        <div className="relative pt-8 pb-6 px-6 bg-gradient-to-b from-primary/10 via-primary/5 to-transparent flex flex-col items-center border-b border-white/40">
          <button 
            onClick={onClose} 
            disabled={isVerifying}
            className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-200/50 active:scale-95 transition-all text-muted-foreground/60 hover:text-muted-foreground cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Animated Glow Logo Ring */}
          <div className="relative mb-3 flex items-center justify-center">
            <motion.div 
              animate={{ rotate: 360 }}
              transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
              className="absolute w-16 h-16 rounded-full border-2 border-dashed border-primary/20"
            />
            <motion.div 
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              className="absolute w-14 h-14 bg-primary/10 rounded-full"
            />
            <div className="relative w-12 h-12 rounded-full bg-white shadow-md flex items-center justify-center border border-primary/10">
              <ShieldCheck className="w-6 h-6 text-primary" />
            </div>
          </div>

          <DialogTitle className="font-extrabold text-xl text-slate-800 tracking-tight text-center">
            Start Verification
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500 font-medium text-center mt-1 max-w-[280px]">
            Please enter the 6-digit confirmation code provided by the customer.
          </DialogDescription>
        </div>

        <div className="px-6 pb-6 space-y-5">
          {/* Booking Summary Box */}
          <div className="bg-white border border-slate-200/60 p-3 rounded-2xl flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center font-black text-slate-700 text-xs text-center uppercase shrink-0 border border-slate-200/40">
              {booking.userName.substring(0, 2).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0 text-left">
              <p className="text-[9px] font-extrabold tracking-widest text-[#93c5fd] hover:text-[#3b82f6] uppercase">Customer</p>
              <h3 className="text-xs font-black text-slate-800 truncate">{booking.userName}</h3>
              <p className="text-[10px] text-slate-500 font-bold truncate mt-0.5">{booking.service}</p>
            </div>
            
            {/* Soft code helper badge for local/interactive quick testing */}
            <div className="px-2 py-1 bg-amber-50 border border-amber-200 rounded-lg text-right shrink-0">
              <p className="text-[7px] text-amber-500 font-black tracking-widest uppercase">Test Key</p>
              <p className="text-[11px] font-mono font-black text-amber-600 tracking-wider">
                {booking.verificationCode}
              </p>
            </div>
          </div>

          {/* Input OTP Grid */}
          <motion.div 
            animate={shouldShake ? { x: [-10, 10, -8, 8, -5, 5, 0] } : {}}
            transition={{ duration: 0.4 }}
            className="flex justify-between gap-1.5 focus-within:ring-0 active:ring-0 relative"
            onClick={() => inputRef.current?.focus()}
          >
            {/* Hidden HTML Input for Mobile Keyboard & Standard Key Listening */}
            <input
              ref={inputRef}
              type="text"
              pattern="\d*"
              inputMode="numeric"
              value={verificationCode}
              onChange={handleHiddenInputChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-default pointer-events-none select-none z-[-1]"
              disabled={isVerifying}
              maxLength={6}
            />

            {Array.from({ length: 6 }).map((_, index) => {
              const char = verificationCode[index] || '';
              const isFocused = index === verificationCode.length;
              const isCompleted = index < verificationCode.length;

              return (
                <div
                  key={index}
                  className={`w-12 h-14 rounded-2xl flex items-center justify-center relative font-mono text-xl font-bold bg-white transition-all duration-150 border cursor-pointer select-none
                    ${isFocused 
                      ? 'border-primary ring-2 ring-primary/20 scale-105 shadow-md shadow-primary/5' 
                      : isCompleted
                        ? 'border-slate-300 text-slate-800 font-extrabold shadow-sm'
                        : 'border-slate-200 text-slate-400'
                    }`}
                >
                  {char}
                  {isFocused && <BlinkingCaret />}
                </div>
              );
            })}
          </motion.div>

          {/* Tactile Virtual Keypad */}
          <div className="grid grid-cols-3 gap-2 bg-slate-100/55 p-2 rounded-2xl border border-slate-200/40">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
              <button
                key={num}
                type="button"
                onClick={() => handleKeypadPress(num)}
                disabled={isVerifying}
                className="h-12 bg-white active:bg-slate-100 hover:bg-slate-50 border border-slate-200/50 rounded-xl font-extrabold text-sm text-slate-700 shadow-sm active:scale-95 hover:scale-[1.02] flex items-center justify-center transition-all cursor-pointer select-none"
              >
                {num}
              </button>
            ))}
            <button
              type="button"
              onClick={() => handleKeypadPress('clear')}
              disabled={isVerifying || !verificationCode}
              className="h-12 border border-slate-200/50 rounded-xl text-[10px] font-extrabold tracking-wider text-slate-400 active:scale-95 hover:scale-[1.02] flex items-center justify-center transition-all uppercase cursor-pointer select-none disabled:opacity-40"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={() => handleKeypadPress('0')}
              disabled={isVerifying}
              className="h-12 bg-white active:bg-slate-100 hover:bg-slate-50 border border-slate-200/50 rounded-xl font-extrabold text-sm text-slate-700 shadow-sm active:scale-95 hover:scale-[1.02] flex items-center justify-center transition-all cursor-pointer select-none"
            >
              0
            </button>
            <button
              type="button"
              onClick={() => handleKeypadPress('delete')}
              disabled={isVerifying || !verificationCode}
              className="h-12 border border-slate-200/50 rounded-xl font-extrabold text-slate-500 active:scale-95 hover:scale-[1.02] flex items-center justify-center transition-all cursor-pointer select-none disabled:opacity-40"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9.75L14.25 12m0 0l2.25 2.25M14.25 12l2.25-2.25M14.25 12L12 14.25M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
          </div>

          {/* Call to Actions */}
          <div className="flex gap-2.5 pt-1">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isVerifying}
              className="flex-1 h-11 rounded-xl text-xs font-black uppercase text-slate-500 border-slate-200 hover:bg-slate-100 shrink-0 cursor-pointer"
            >
              Close
            </Button>
            <Button
              onClick={() => handleVerify()}
              disabled={isVerifying || verificationCode.length !== 6}
              className={`flex-[2] h-11 rounded-xl text-xs font-black uppercase tracking-wider relative overflow-hidden shrink-0 shadow-lg cursor-pointer transition-all duration-300
                ${verificationCode.length === 6 
                  ? 'bg-primary text-white shadow-primary/25 hover:shadow-primary/35 hover:-translate-y-0.5' 
                  : 'bg-slate-300 text-slate-400 shadow-none'
                }`}
            >
              {isVerifying ? (
                <div className="flex items-center justify-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin text-white" />
                  <span>Verifying...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2">
                  <Lock className="w-3.5 h-3.5" />
                  <span>Verify & Start</span>
                </div>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
