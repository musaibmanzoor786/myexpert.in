import Image from 'next/image';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Zap } from 'lucide-react';

export function UnserviceableArea() {
    return (
        <div className="flex flex-col items-center justify-center pt-8 pb-16 px-6 text-center animate-in fade-in duration-500 min-h-[60vh] w-full">
            <h2 className="text-xl font-black text-[#5C1A1A] mb-3 tracking-tight">Oops! It's not you, it's us 😅</h2>
            <p className="text-[14px] font-bold text-[#5C1A1A] mb-1 leading-tight">We haven't reached your area just yet.</p>
            <p className="text-[14px] font-bold text-[#5C1A1A] mb-3 leading-tight">But don't worry—we're working on getting there soon!</p>
            
            <p className="text-[14px] font-black text-[#5C1A1A] mb-4 mx-auto leading-snug">
                Try a nearby address, or tap below to let us know we should hurry up 🚀
            </p>

            <div className="relative w-56 h-56 mb-4 mx-auto -mt-2 flex items-center justify-center bg-gray-100 rounded-full">
                <Zap className="w-20 h-20 text-orange-500" />
            </div>

            <Button 
                variant="default"
                className="w-full rounded-[14px] h-[52px] font-bold shadow-md bg-[#007F8F] hover:bg-[#006677] text-white active:scale-95 transition-all text-[15px] mb-4"
                onClick={() => window.open('https://wa.me/919103669564?text=Hi, I would like to request MyExpert services in my area.', '_blank')}
            >
                Request MyExpert in your area
            </Button>
            
            <div className="w-full space-y-3">
                <Link href="/about" className="block outline-none active:scale-[0.98] transition-transform">
                    <Card className="p-[18px] flex items-center justify-between bg-white hover:bg-white/90 transition-colors border-none rounded-[16px] shadow-sm">
                        <div className="flex items-center gap-4">
                            <div className="w-[38px] h-[38px] rounded-[12px] bg-[#EEF2FC] flex items-center justify-center shrink-0 shadow-sm">
                                <span className="text-[#3B82F6] text-lg font-black text-center relative top-[-1px] left-[-0.5px]">ⓘ</span>
                            </div>
                            <span className="font-bold text-[15px] text-foreground tracking-tight">Need help with your previous orders?</span>
                        </div>
                        <span className="text-muted-foreground opacity-50 font-medium text-lg">›</span>
                    </Card>
                </Link>
                <Link href="/about" className="block outline-none active:scale-[0.98] transition-transform">
                    <Card className="p-[18px] flex items-center justify-between bg-white hover:bg-white/90 transition-colors border-none rounded-[16px] shadow-sm">
                        <div className="flex items-center gap-4">
                            <div className="w-[38px] h-[38px] rounded-[12px] bg-[#EEF2FC] flex items-center justify-center shrink-0 shadow-sm">
                                <span className="text-[#3B82F6] text-lg font-black text-center relative top-[-1px] left-[-0.5px]">ⓘ</span>
                            </div>
                            <span className="font-bold text-[15px] text-foreground tracking-tight">About us</span>
                        </div>
                        <span className="text-muted-foreground opacity-50 font-medium text-lg">›</span>
                    </Card>
                </Link>
                <button onClick={() => window.open('https://instagram.com/myexpert.in', '_blank')} className="block w-full text-left outline-none active:scale-[0.98] transition-transform">
                    <Card className="p-[18px] flex items-center justify-between bg-white hover:bg-white/90 transition-colors border-none rounded-[16px] shadow-sm">
                        <div className="flex items-center gap-4">
                            <div className="w-[38px] h-[38px] rounded-[12px] bg-gradient-to-tr from-[#FFDF00] via-[#F21F6D] to-[#8C3AAA] flex items-center justify-center shrink-0 shadow-sm">
                                <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" className="w-[18px] h-[18px]">
                                    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                                    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                                    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                                </svg>
                            </div>
                            <span className="font-bold text-[15px] text-foreground tracking-tight">Follow us on Instagram for updates</span>
                        </div>
                        <span className="text-muted-foreground opacity-50 font-medium text-lg">›</span>
                    </Card>
                </button>
            </div>
            
            <div className="mt-8 mb-4">
                <p className="text-center font-bold text-[#f59e0b] text-[13px] tracking-wide">We're Live In</p>
                <p className="text-center text-[#9CA3AF] text-[11px] font-medium leading-tight mt-1 max-w-[280px]">
                    kashmir some areas 
                </p>
            </div>
        </div>
    );
}
