'use client';

import { useState, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/auth-context';
import { createOrUpdateExpertProfile } from '@/services/user-service';
import { servicesList } from '@/lib/constants';
import type { Expert } from '@/lib/types';
import { useLoadingStore } from '@/lib/loading-store';

const formSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters."),
  mobileNumber: z.string().regex(/^\d{10}$/, "Must be a valid 10-digit mobile number."),
  serviceType: z.string({ required_error: "Please select a service type." }),
  experience: z.string({ required_error: "Please select your experience level." }),
  bio: z.string()
    .max(300, "Bio cannot exceed 300 characters.")
    .refine(value => value.length === 0 || value.length >= 5, {
        message: "Bio must be at least 5 characters if provided, or left empty.",
    }).optional(),
});

type FormValues = z.infer<typeof formSchema>;

const InputWithFloatingLabel = ({ label, field, disabled, type = "text", isTextarea = false }: { label: string, field: any, disabled?: boolean, type?: string, isTextarea?: boolean }) => (
  <div className="relative group mt-6">
    <label className="absolute -top-2 left-3 bg-white px-1.5 text-[11px] font-bold text-muted-foreground uppercase tracking-tight z-10">
      {label}
    </label>
    <FormControl>
      {isTextarea ? (
          <Textarea 
              {...field} 
              className="min-h-[100px] pt-4 rounded-2xl bg-white border border-border/60 text-base font-semibold focus-visible:ring-primary/20 transition-all shadow-none resize-none" 
          />
      ) : (
          <Input 
              {...field} 
              type={type}
              disabled={disabled}
              className="h-14 rounded-2xl bg-white border border-border/60 text-base font-semibold focus-visible:ring-primary/20 transition-all shadow-none" 
          />
      )}
    </FormControl>
  </div>
);

export function ExpertProfileSetupForm({ expertData }: { expertData: Expert | null }) {
  const { setIsLoading } = useLoadingStore();
  const { user, userProfile } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const isPhoneVerified = useMemo(() => {
    return !!userProfile?.phone;
  }, [userProfile?.phone]);

  const cleanPhone = (phone?: string) => {
    if (!phone) return "";
    return phone.replace('+91', '').replace(/\D/g, '').slice(-10);
  };

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fullName: expertData?.name || userProfile?.fullName || "",
      mobileNumber: cleanPhone(expertData?.phone || userProfile?.phone || user?.phoneNumber || undefined),
      serviceType: expertData?.serviceType || "",
      experience: expertData?.experience?.toString() || "",
      bio: expertData?.bio || "",
    },
    mode: 'onChange',
  });

  async function onSubmit(values: FormValues) {
    if (!user) return;
    setIsLoading(true);
    try {
      const bioToSave = (values.bio && values.bio.trim().length > 0)
        ? values.bio
        : `Hi, I’m ${values.fullName} 👋 A trusted MyExpert professional delivering reliable service with care and quality ⭐`;

      const dataToSave = {
        fullName: values.fullName,
        mobileNumber: `+91${values.mobileNumber}`,
        serviceType: values.serviceType,
        bio: bioToSave,
        experience: parseInt(values.experience, 10),
      };
      
      await createOrUpdateExpertProfile(user.uid, '', dataToSave);
      
      toast({ description: "Profile updated successfully" });
      router.push('/');
    } catch (error) {
    console.error(error);
      // Error handled by emitter
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

                <div className="text-center px-4">
                    <p className="text-[11px] font-bold text-muted-foreground bg-primary/5 p-3 rounded-xl border border-primary/5">
                        Note: Your profile details will be reviewed and updated by the MyExpert team to ensure quality.
                    </p>
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
                        <div className="relative group mt-6">
                            <label className="absolute -top-2 left-3 bg-white px-1.5 text-[11px] font-bold text-muted-foreground uppercase tracking-tight z-10 flex items-center justify-between w-[95%]">
                              <span>Mobile Number</span>
                              <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Verified & Linked</span>
                            </label>
                            <Input 
                                {...field}
                                disabled={true}
                                className="h-14 rounded-2xl bg-gray-50 border border-border/60 text-base font-semibold focus-visible:ring-primary/20 transition-all shadow-none" 
                            />
                        </div>
                        <FormMessage className="text-[10px] ml-2" />
                      </FormItem>
                    )} />

                    <FormField control={form.control} name="serviceType" render={({ field }) => (
                        <FormItem className="mt-6">
                            <div className="relative">
                                <label className="absolute -top-2 left-3 bg-white px-1.5 text-[11px] font-bold text-muted-foreground uppercase tracking-tight z-10">
                                    My Profession
                                </label>
                                <Select onValueChange={field.onChange} value={field.value}>
                                    <FormControl>
                                        <SelectTrigger className="h-14 rounded-2xl bg-white border border-border/60 text-base font-semibold focus:ring-primary/20 transition-all shadow-none">
                                            <SelectValue placeholder="What do you do?" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {servicesList.filter(s => s.name !== 'All').map(service => (
                                            <SelectItem key={service.name} value={service.name}>{service.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <FormMessage className="text-[10px] ml-2" />
                        </FormItem>
                    )} />

                    <FormField control={form.control} name="experience" render={({ field }) => (
                        <FormItem className="mt-6">
                            <div className="relative">
                                <label className="absolute -top-2 left-3 bg-white px-1.5 text-[11px] font-bold text-muted-foreground uppercase tracking-tight z-10">
                                    Years of Experience
                                </label>
                                <Select onValueChange={field.onChange} value={field.value}>
                                    <FormControl>
                                        <SelectTrigger className="h-14 rounded-2xl bg-white border border-border/60 text-base font-semibold focus:ring-primary/20 transition-all shadow-none">
                                            <SelectValue placeholder="How many years?" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="1">1+ year</SelectItem>
                                        <SelectItem value="3">3+ years</SelectItem>
                                        <SelectItem value="5">5+ years</SelectItem>
                                        <SelectItem value="10">10+ years</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <FormMessage className="text-[10px] ml-2" />
                        </FormItem>
                    )} />

                    <FormField control={form.control} name="bio" render={({ field }) => (
                      <FormItem>
                        <InputWithFloatingLabel label="Short Bio (Location optional)" field={field} isTextarea />
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
