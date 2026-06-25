
'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { 
    Dialog, 
    DialogContent, 
    DialogHeader, 
    DialogTitle 
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { auth, db } from '@/lib/firebase';
import { RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult, signInWithEmailAndPassword } from 'firebase/auth';
import { 
    Loader2, 
    ChevronLeft, 
    Shield
} from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { createUserProfile } from '@/services/user-service';
import { useLoadingStore } from '@/lib/loading-store';

type AuthStep = 'welcome' | 'otp';

const ProfileIllustration = () => (
  <div className="relative w-full max-w-[200px] aspect-square mx-auto mb-8">
    <div className="absolute inset-0 bg-primary/5 rounded-full blur-2xl" />
    <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className="relative z-10 w-full h-full">
      <circle cx="100" cy="100" r="85" fill="currentColor" fillOpacity="0.02" className="text-primary" />
      <path d="M30 100C30 50 60 30 100 30C140 30 170 50 170 100C170 150 140 170 100 170C60 170 30 150 30 100Z" fill="currentColor" fillOpacity="0.04" className="text-primary" />
      <rect x="72" y="35" width="56" height="110" rx="10" fill="#1A1A1A" />
      <rect x="76" y="40" width="48" height="100" rx="6" fill="#FFFFFF" />
      <rect x="82" y="55" width="36" height="45" rx="3" fill="currentColor" fillOpacity="0.08" className="text-primary" />
      <rect x="82" y="108" width="36" height="8" rx="4" fill="currentColor" fillOpacity="0.15" className="text-primary" />
      <circle cx="130" cy="120" r="32" fill="white" className="shadow-xl" />
      <circle cx="130" cy="120" r="28" fill="currentColor" className="text-primary" />
      <path d="M130 108C125.5 108 122 111.5 122 116C122 120.5 125.5 124 130 124C134.5 124 138 120.5 138 116C138 111.5 134.5 108 130 108Z" fill="white" />
      <path d="M130 126C123 126 118 129.5 118 133V135H142V133C142 129.5 137 126 130 126Z" fill="white" />
    </svg>
  </div>
);

export default function LoginPage() {
  const [step, setStep] = useState(1);
  const [mobileNumber, setMobileNumber] = useState('');
  const [otpArray, setOtpArray] = useState(['', '', '', '', '', '']);
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const recaptchaVerifierRef = useRef<RecaptchaVerifier | null>(null);
  const [countdown, setCountdown] = useState(0);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const { setIsLoading } = useLoadingStore();
  const [isLocallyLoading, setIsLocallyLoading] = useState(false);
  
  // Admin unlock state
  const [clickCount, setClickCount] = useState(0);
  const [showSecretInput, setShowSecretInput] = useState(false);
  const [secretInput, setSecretInput] = useState('');
  const [isSecretValidated, setIsSecretValidated] = useState(false);
  const [adminEmail, setAdminEmail] = useState('suhaibmanzoormugloo13@gmail.com');
  const [adminPassword, setAdminPassword] = useState('Musaib@$001234isbillionear');
  
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();
  
  const handleAdminSignIn = async (email, password) => {
    if (!auth) return;
    setIsLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push('/admin');
    } catch (error: any) {
        toast({ variant: "destructive", title: "Auth Failed", description: "Invalid credentials." });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user) router.push('/');
  }, [user, router]);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  useEffect(() => {
    if (typeof window !== 'undefined' && auth && !recaptchaVerifierRef.current) {
        try {
            recaptchaVerifierRef.current = new RecaptchaVerifier(auth, 'send-otp-button', { size: 'invisible' });
        } catch (e) {
            console.error("Recaptcha config error", e);
        }
    }
    return () => {
        if (recaptchaVerifierRef.current) {
            recaptchaVerifierRef.current.clear();
            recaptchaVerifierRef.current = null;
        }
    };
  }, []);

  const initiatePhoneLogin = async () => {
    if (mobileNumber.length !== 10) {
        toast({ variant: 'destructive', title: 'Invalid Number', description: 'Please enter a 10-digit mobile number.' });
        return;
    }
    if (!auth) return;
    setIsLocallyLoading(true);
    try {
        if (!recaptchaVerifierRef.current) {
             recaptchaVerifierRef.current = new RecaptchaVerifier(auth, 'send-otp-button', { size: 'normal' });
        }
        const appVerifier = recaptchaVerifierRef.current;
        const confirmation = await signInWithPhoneNumber(auth, `+91${mobileNumber}`, appVerifier);
        setConfirmationResult(confirmation);
        setStep(2);
        setCountdown(29);
        toast({ title: 'OTP Sent', description: `Code sent to +91 ${mobileNumber}` });
    } catch (error: any) {
        toast({ variant: 'destructive', title: 'Could not send OTP', description: error.message });
    } finally {
        setIsLocallyLoading(false);
    }
  };

  const handleOtpSubmit = async () => {
    const otp = otpArray.join('');
    if (otp.length !== 6) return;
    setIsLoading(true);
    try {
        await confirmationResult?.confirm(otp);
        await createUserProfile(auth.currentUser!.uid, null, '', `+91${mobileNumber}`);
        router.push('/');
    } catch (error: any) {
        toast({ variant: 'destructive', title: 'Verification Failed', description: 'Incorrect OTP.' });
    } finally {
        setIsLoading(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otpArray];
    newOtp[index] = value.slice(-1);
    setOtpArray(newOtp);
    if (value && index < 5) inputRefs.current[index + 1]?.focus();
  };

  return (
    <div className="min-h-[100dvh] bg-background flex flex-col items-center justify-center p-6">
      {/* Admin access trigger */}
      <Button 
        variant="ghost"
        size="icon"
        className="hidden md:inline-flex absolute bottom-4 right-4 z-50 text-muted-foreground/30 hover:text-primary transition-colors"
        onClick={() => {
            if (clickCount + 1 >= 5) {
                setShowSecretInput(true);
                setClickCount(0);
            } else {
                setClickCount(prev => prev + 1);
            }
        }}
      >
        <Shield className="w-5 h-5" />
      </Button>
      
      <Dialog open={showSecretInput} onOpenChange={(open) => {
          setShowSecretInput(open);
          if (!open) {
              setClickCount(0);
              setIsSecretValidated(false);
              setSecretInput('');
          }
      }}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>{isSecretValidated ? 'Admin Access' : 'Enter Secret Code'}</DialogTitle>
            </DialogHeader>
            {!isSecretValidated ? (
                <>
                    <Input 
                        type="number" 
                        placeholder="Enter secret code" 
                        value={secretInput}
                        onChange={(e) => setSecretInput(e.target.value)}
                    />
                    <Button onClick={() => {
                        if (secretInput === '687242') {
                            setIsSecretValidated(true);
                            setSecretInput('');
                        } else {
                            toast({
                                variant: 'destructive',
                                title: 'Invalid Code',
                                description: 'Please try again.',
                            });
                        }
                    }}>Submit</Button>
                </>
            ) : (
                <div className="flex flex-col gap-2">
                    <Input placeholder="Email" value={adminEmail} onChange={(e) => setAdminEmail(e.target.value)} />
                    <Input type="password" placeholder="Password" value={adminPassword} onChange={(e) => setAdminPassword(e.target.value)} />
                    <Button onClick={() => handleAdminSignIn(adminEmail, adminPassword)}>Login as Admin</Button>
                </div>
            )}
        </DialogContent>
      </Dialog>
      
      <div className="w-full max-w-md relative z-10 pb-12">
        <Button variant="ghost" size="icon" onClick={() => step === 2 ? setStep(1) : router.back()} className="mb-6 -ml-4">
            <ChevronLeft className="w-6 h-6" />
        </Button>
        <ProfileIllustration />
        
        {step === 1 ? (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold">Welcome to MyExpert</h2>
              <p className="text-muted-foreground mt-2">Enter your mobile number to get started</p>
            </div>
            <div className="flex h-14 rounded-xl border border-input items-center overflow-hidden shadow-sm bg-muted/30">
              <div className="flex items-center gap-2 px-4 h-full border-r border-input">
                <span className="text-xl">🇮🇳</span>
                <span className="font-bold">+91</span>
              </div>
              <Input type="tel" placeholder="Enter mobile number" className="h-full border-0 bg-transparent px-4" value={mobileNumber} onChange={(e) => setMobileNumber(e.target.value.replace(/\D/g, '').slice(0, 10))} />
            </div>
            <Button id="send-otp-button" className="w-full h-14 rounded-xl font-bold bg-teal-600 hover:bg-teal-700" onClick={initiatePhoneLogin} disabled={isLocallyLoading || mobileNumber.length !== 10}>
                {isLocallyLoading ? <Loader2 className="animate-spin" /> : 'Send OTP'}
            </Button>
            <p className="text-xs text-center text-muted-foreground">
                By continuing, you agree to our 
                <Link href="/terms" className="text-primary hover:underline"> Terms</Link> and 
                <Link href="/privacy" className="text-primary hover:underline"> Privacy Policy</Link>.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-2xl font-bold">Enter the 6-digit code sent to</h2>
                <p className="font-bold mt-2">+91 {mobileNumber.replace(/(\d{5})(\d{5})/, '$1-$2')}</p>
              </div>
              <div className="flex justify-between gap-2">
                {otpArray.map((digit, i) => (
                    <Input 
                        key={i} 
                        ref={(el) => inputRefs.current[i] = el} 
                        type="tel" 
                        maxLength={1} 
                        value={digit} 
                        onChange={(e) => handleOtpChange(i, e.target.value)} 
                        onKeyDown={(e) => {
                            if (e.key === 'Backspace' && !digit && i > 0) {
                                inputRefs.current[i - 1]?.focus();
                            }
                        }}
                        className="w-12 h-14 text-center text-xl font-bold rounded-xl" 
                    />
                ))}
            </div>
            <Button className="w-full h-14 rounded-xl font-bold bg-teal-600 hover:bg-teal-700" onClick={handleOtpSubmit} disabled={otpArray.includes('')}>Verify & Login</Button>
            <p className="text-sm text-center text-muted-foreground">
                {countdown > 0 ? `Resend in ${countdown}s` : <button onClick={initiatePhoneLogin} className="text-primary font-bold">Resend Code</button>}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

