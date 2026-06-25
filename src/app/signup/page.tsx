'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { auth } from '@/lib/firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { createUserProfile } from '@/services/user-service';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { AppLogo } from '@/components/app-logo';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      router.push('/');
    }
  }, [user, router]);


  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
     if (!auth) {
        toast({
            variant: "destructive",
            title: "Error",
            description: "Firebase is not configured. Please check your environment variables.",
        });
        return;
    }
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      // Create user profile document instantly after account creation
      await createUserProfile(userCredential.user.uid, userCredential.user.email, fullName);
      
      toast({
        title: "Account Created",
        description: "Welcome to MyExpert!",
      });

      router.push('/');
    } catch (error: any) {
    console.error(error);
      let description = "Could not create account. Please try again.";
      switch (error.code) {
        case 'auth/email-already-in-use':
          description = "This email address is already in use by another account.";
          break;
        case 'auth/invalid-email':
          description = "The email address is not valid.";
          break;
        case 'auth/weak-password':
          description = "The password is not strong enough. Please use at least 6 characters.";
          break;
        default:
          break;
      }
      toast({
        variant: "destructive",
        title: "Signup Failed",
        description: description,
      });
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="dark:bg-background dark:text-foreground min-h-screen flex items-center justify-center p-6">
        <div className="w-full max-sm: max-w-sm flex flex-col">
            <div className="flex flex-col items-center text-center">
                <AppLogo className="w-32 lg:w-36 mb-4 text-primary" />
                 <h1 className="text-2xl font-bold mt-4">Create an Account</h1>
                <p className="text-muted-foreground mb-8">Sign up to connect with experts.</p>
                
                <form onSubmit={handleSignup} className="w-full space-y-4">
                    <Input
                        id="full-name"
                        placeholder="Full name"
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        disabled={loading}
                        className="w-full"
                    />
                    <Input
                        id="email"
                        type="email"
                        placeholder="Email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={loading}
                        className="w-full"
                    />
                    <Input
                        id="password"
                        type="password"
                        placeholder="Password (min. 6 characters)"
                        required
                        minLength={6}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        disabled={loading}
                        className="w-full"
                    />
                    <div className="flex items-start space-x-3 py-2 text-left">
                      <Checkbox id="terms-signup" checked={agreed} onCheckedChange={(checked) => setAgreed(checked as boolean)} className="mt-0.5" />
                      <Label htmlFor="terms-signup" className="text-xs text-muted-foreground font-normal leading-relaxed">
                          By continuing, you agree to our{' '}
                          <Link href="/terms" className="underline hover:text-primary transition-colors">
                          Terms of Service
                          </Link>{' '}
                          and{' '}
                          <Link href="/privacy" className="underline hover:text-primary transition-colors">
                          Privacy Policy
                          </Link>
                          .
                      </Label>
                    </div>
                    <Button
                        type="submit"
                        className="w-full"
                        disabled={loading || !agreed}
                    >
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Create Account
                    </Button>
                </form>
            </div>
            <div className="w-full text-center text-sm text-muted-foreground mt-8">
                Have an account?{' '}
                <Link href="/login" className="font-semibold text-primary hover:opacity-80">
                    Log in
                </Link>
            </div>
        </div>
    </div>
  );
}
