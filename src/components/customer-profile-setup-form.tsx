'use client';

import { useState, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/auth-context';
import { createCustomerProfile } from '@/services/user-service';
import { User as UserIcon, Camera, Pencil } from 'lucide-react';
import type { Customer } from '@/lib/types';
import { useLoadingStore } from '@/lib/loading-store';

const formSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters."),
  mobileNumber: z.string().regex(/^\d{10}$/, "Must be a valid 10-digit mobile number."),
});

type FormValues = z.infer<typeof formSchema>;

const InputWithFloatingLabel = ({ label, field, disabled, type = "text" }: { label: string, field: any, disabled?: boolean, type?: string }) => (
  <div className="relative group mt-6">
    <label className="absolute -top-2 left-3 bg-white px-1.5 text-[11px] font-bold text-muted-foreground uppercase tracking-tight z-10">
      {label}
    </label>
    <FormControl>
      <Input 
        {...field} 
        type={type}
        disabled={disabled}
        className="h-14 rounded-2xl bg-white border border-border/60 text-base font-semibold focus-visible:ring-primary/20 transition-all shadow-none" 
      />
    </FormControl>
  </div>
);

export function CustomerProfileSetupForm({ customerData }: { customerData: Customer | null }) {
  const { setIsLoading } = useLoadingStore();
  const { user, userProfile } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const isPhoneVerified = useMemo(() => {
    return !!userProfile?.phone && !user?.email;
  }, [userProfile?.phone, user?.email]);

  const cleanPhone = (phone?: string) => {
    if (!phone) return "";
    return phone.replace('+91', '').replace(/\D/g, '').slice(-10);
  };

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fullName: customerData?.fullName || userProfile?.fullName || "",
      mobileNumber: cleanPhone(customerData?.mobileNumber || userProfile?.phone || user?.phoneNumber || ""),
    },
    mode: 'onChange',
  });

  async function onSubmit(values: FormValues) {
    if (!user) return;
    setIsLoading(true);
    try {
      const finalData = {
        ...values,
        location: userProfile?.location || "", // Preserve existing location set via map
        mobileNumber: isPhoneVerified ? (userProfile?.phone || `+91${values.mobileNumber}`) : `+91${values.mobileNumber}`
      };
      
      await createCustomerProfile(user.uid, '', finalData);
      toast({ description: "Profile updated successfully" });
      
      router.push('/');
    } catch (error) {
    console.error(error);
      // Error handles by emitter
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="w-full max-w-4xl mx-auto">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            {/* Animated Content Wrapper */}
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
                {/* Profile Image Section */}
                <div className="flex justify-center py-4">
                    <div className="relative">
                        <div className="w-32 h-32 rounded-full border-[3px] border-foreground/10 flex items-center justify-center bg-secondary/30 overflow-hidden shadow-sm">
                            <span className="text-4xl font-black text-primary/60">
                                {form.watch('fullName') ? form.watch('fullName').charAt(0).toUpperCase() : 'U'}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="space-y-2">
                    <FormField control={form.control} name="fullName" render={({ field }) => (
                      <FormItem>
                        <InputWithFloatingLabel label="Full Name" field={field} />
                        <FormMessage className="text-[10px] ml-2" />
                      </FormItem>
                    )} />

                    <FormField control={form.control} name="mobileNumber" render={({ field }) => (
                      <FormItem>
                        <InputWithFloatingLabel 
                            label="Mobile" 
                            field={field} 
                            disabled={isPhoneVerified}
                            type="tel"
                        />
                        {isPhoneVerified && <p className="text-[9px] text-muted-foreground mt-1 ml-3 italic">Verified & linked to account</p>}
                        <FormMessage className="text-[10px] ml-2" />
                      </FormItem>
                    )} />
                </div>
            </div>
            
            {/* Stable Bottom Bar - Outside animation div */}
            <div className="fixed bottom-0 left-0 right-0 max-w-4xl mx-auto w-full p-6 bg-white/80 backdrop-blur-sm border-none z-50">
                <Button 
                    type="submit" 
                    className="w-full h-14 rounded-2xl text-base font-bold bg-[#00B894] hover:bg-[#00A383] shadow-xl shadow-[#00B894]/20" 
                    size="lg"
                >
                    Update profile
                </Button>
            </div>
          </form>
        </Form>
    </div>
  );
}
