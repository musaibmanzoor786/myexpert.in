'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Star, Loader2, MessageCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { addReview } from '@/services/review-service';
import { useToast } from '@/hooks/use-toast';
import type { Booking } from '@/lib/types';

interface ReviewModalProps {
  booking: Booking;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function ReviewModal({ booking, isOpen, onClose, onSuccess }: ReviewModalProps) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await addReview(
        booking.expertId,
        booking.userId,
        booking.userName,
        booking.id,
        rating,
        comment
      );
      onSuccess();
      onClose();
      window.dispatchEvent(new CustomEvent('customer-review-submitted', {
        detail: {
          rating,
          comment,
          expertName: booking.expertName
        }
      }));
    } catch (error) {
    console.error(error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to submit review. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md rounded-[2rem] p-0 overflow-hidden border-none shadow-2xl">
        <div className="bg-gradient-to-b from-primary/10 to-background px-6 pt-7 pb-5">
            <DialogHeader>
              <DialogTitle className="text-xl font-black tracking-tight text-center">Rate Your Experience</DialogTitle>
              <DialogDescription className="text-center font-bold text-muted-foreground/80 mt-1 text-xs">
                How was your service with <span className="text-primary">{booking.expertName}</span>?
              </DialogDescription>
            </DialogHeader>
            
            <div className="flex flex-col items-center gap-6 py-6">
              <div className="flex flex-col items-center gap-2.5">
                  <div className="flex gap-1.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        className="transition-transform active:scale-90 duration-200"
                      >
                        <Star
                          className={cn(
                            "w-9 h-9 transition-all duration-300",
                            star <= rating 
                                ? "fill-yellow-400 text-yellow-400 filter drop-shadow-[0_0_6px_rgba(250,204,21,0.3)] scale-105" 
                                : "text-muted-foreground/20"
                          )}
                        />
                      </button>
                    ))}
                  </div>
                  <p className="text-[9px] font-black text-primary uppercase tracking-[0.15em] animate-in fade-in duration-500">
                    {rating === 5 ? 'Excellent!' : rating >= 4 ? 'Very Good' : rating >= 3 ? 'Good' : 'Needs Improvement'}
                  </p>
              </div>

              <div className="w-full space-y-2">
                <div className="flex items-center gap-2 px-1">
                    <MessageCircle className="w-3 h-3 text-muted-foreground/60" />
                    <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Share more details</span>
                </div>
                <Textarea
                  placeholder="What did you like or how can they improve? (Optional)"
                  className="resize-none min-h-[100px] rounded-2xl bg-white border-2 border-transparent focus-visible:border-primary/20 shadow-inner p-4 text-sm font-medium leading-relaxed transition-all"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                />
              </div>
            </div>
        </div>

        <DialogFooter className="p-5 pt-0 bg-background flex flex-row gap-2.5">
          <Button variant="ghost" onClick={onClose} className="rounded-xl flex-1 h-12 font-black uppercase tracking-widest text-[10px] text-muted-foreground/60 hover:bg-secondary/50">
            Skip
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={isSubmitting} 
            className="rounded-xl flex-1 h-12 font-black uppercase tracking-widest text-[10px] shadow-lg shadow-primary/20"
          >
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Submit Review'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
