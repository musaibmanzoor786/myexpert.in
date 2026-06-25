'use client';

import { useAuth } from '@/context/auth-context';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { ArrowLeft, Copy, Check, MessageCircle, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export default function InvitePage() {
  const { user, userProfile, loading } = useAuth();
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [origin, setOrigin] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setOrigin(window.location.origin);
    }
  }, []);

  // Redirect if not logged in or if they are not an expert (just in case)
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  const referralCode = user?.uid || '';
  const inviteUrl = `${origin}/signup?ref=${referralCode}`;
  
  const shareText = `Join me on MyExpert! Kashmir's local home expert booking app. Find and book trusted local experts easily. Sign up using my link: ${inviteUrl}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const handleWhatsAppShare = () => {
    const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;
    window.open(whatsappUrl, '_blank');
  };

  if (loading || !user) {
    return (
      <div className="flex justify-center items-center h-screen bg-[#F8F9FB]">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#F8F9FB] pb-12">
      {/* Header */}
      <div className="bg-[#1A3C34] text-white px-5 pt-12 pb-8 rounded-b-[2rem] shadow-md">
        <div className="max-w-md mx-auto flex items-center gap-3">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => router.push('/')}
            className="text-white hover:bg-white/10 rounded-full h-9 w-9 -ml-2"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-lg font-black tracking-tight">Invite Options</h1>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-md mx-auto px-4 mt-6">
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 bg-[#1A3C34]/10 rounded-full flex items-center justify-center text-[#1A3C34] mb-4">
            <Users className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-black text-[#1A3C34] tracking-tight mb-2">
            Grow our MyExpert Community
          </h2>
          <p className="text-sm text-gray-500 font-medium px-4">
            Help friends find trusted local home experts, and support our community's skilled experts in finding more work.
          </p>
        </div>

        <Card className="border-none shadow-sm rounded-2xl overflow-hidden bg-white mb-6">
          <CardContent className="p-6">
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-2">
                  Your Unique Invite Link
                </label>
                <div className="flex items-center gap-2 bg-gray-50 border border-gray-100 rounded-xl p-3 pr-2 select-all">
                  <span className="text-xs font-medium text-gray-600 truncate flex-1">
                    {inviteUrl}
                  </span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleCopy}
                    className="h-8 w-8 p-0 hover:bg-gray-100 rounded-lg shrink-0 text-gray-500"
                  >
                    {copied ? (
                      <Check className="w-4 h-4 text-[#00B894]" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                </div>
                {copied && (
                  <span className="text-[11px] font-bold text-[#00B894] mt-1.5 block">
                    Link copied to clipboard!
                  </span>
                )}
              </div>

              <div className="pt-2">
                <Button 
                  onClick={handleWhatsAppShare}
                  className="w-full h-12 bg-[#25D366] hover:bg-[#20ba59] text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all active:scale-[0.98] border-none"
                >
                  <MessageCircle className="w-5 h-5 fill-current" />
                  Share via WhatsApp
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Clean and Minimal Guidelines */}
        <div className="bg-white/60 rounded-2xl p-4 border border-gray-100">
          <h3 className="text-xs font-black text-gray-400 uppercase tracking-wider mb-2.5">
            How it works
          </h3>
          <ul className="space-y-2.5">
            <li className="flex items-start gap-2.5 text-xs text-gray-600 font-medium">
              <span className="w-5 h-5 bg-[#1A3C34]/10 text-[#1A3C34] rounded-full flex items-center justify-center text-[10px] font-black shrink-0 mt-0.5">
                1
              </span>
              <span>Share your unique invite link with friends, family, or local experts.</span>
            </li>
            <li className="flex items-start gap-2.5 text-xs text-gray-600 font-medium">
              <span className="w-5 h-5 bg-[#1A3C34]/10 text-[#1A3C34] rounded-full flex items-center justify-center text-[10px] font-black shrink-0 mt-0.5">
                2
              </span>
              <span>They can sign up using your link to register as a customer or expert.</span>
            </li>
            <li className="flex items-start gap-2.5 text-xs text-gray-600 font-medium">
              <span className="w-5 h-5 bg-[#1A3C34]/10 text-[#1A3C34] rounded-full flex items-center justify-center text-[10px] font-black shrink-0 mt-0.5">
                3
              </span>
              <span>Our platform grows and becomes stronger with trusted local community members.</span>
            </li>
          </ul>
        </div>
      </div>
    </main>
  );
}
