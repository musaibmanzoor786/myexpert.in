'use client';

import { MapPin, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';

interface ConfirmLocationSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  onChangeLocation: () => void;
  currentHub: string;
}

export function ConfirmLocationSheet({
  open,
  onOpenChange,
  onConfirm,
  onChangeLocation,
  currentHub,
}: ConfirmLocationSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="sm:max-w-md sm:mx-auto rounded-t-[2.5rem] sm:rounded-2xl p-0 flex flex-col bg-[#F8F9FB] border-none shadow-2xl overflow-visible [&>button]:hidden">
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 z-50">
          <button 
            onClick={() => onOpenChange(false)}
            className="p-3 flex items-center justify-center active:scale-90 transition-all text-white/80 hover:text-white"
          >
            <X className="h-8 w-8" strokeWidth={2.5} />
          </button>
        </div>

        <SheetHeader className="px-6 pt-8 pb-4 bg-white border-b shrink-0 rounded-t-[2.5rem]">
          <SheetTitle className="text-xl font-black tracking-tight text-center">Confirm Location</SheetTitle>
        </SheetHeader>

        <div className="px-6 py-6 space-y-6 pb-10">
          <div className="text-center space-y-2">
            <p className="text-sm text-gray-500 font-bold">
              Confirm current location for nearby jobs
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-100 flex items-center gap-4 shadow-sm">
            <div className="bg-[#1A3C34]/10 p-3 rounded-xl shrink-0">
              <MapPin className="h-6 w-6 text-[#1A3C34]" strokeWidth={2.5} />
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Current Hub / Area</span>
              <span className="font-bold text-base text-gray-800 truncate block mt-0.5">
                {currentHub}
              </span>
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <Button
              onClick={() => {
                onOpenChange(false);
                onConfirm();
              }}
              className="w-full h-12 bg-[#22C55E] hover:bg-[#1ebd53] text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all active:scale-[0.98] border-none"
            >
              <Check className="w-5 h-5" />
              Yes, I am here
            </Button>

            <Button
              variant="outline"
              onClick={() => {
                onOpenChange(false);
                onChangeLocation();
              }}
              className="w-full h-12 bg-white hover:bg-gray-50 text-gray-700 border-gray-200 font-bold text-sm rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all active:scale-[0.98]"
            >
              Change Location
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
