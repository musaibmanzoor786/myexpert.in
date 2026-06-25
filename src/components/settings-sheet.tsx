'use client';

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  LogOut,
  Trash2,
  Info,
  Shield,
  FileText,
  CircleDollarSign,
} from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface SettingsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const SettingsItem = ({
  href,
  icon: Icon,
  label,
  onClick,
  isDestructive = false,
}: {
  href?: string;
  icon: React.ElementType;
  label: string;
  onClick?: () => void;
  isDestructive?: boolean;
}) => {
  const content = (
    <div
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-4 rounded-xl p-4 text-left font-semibold transition-colors",
        isDestructive
          ? "text-destructive hover:bg-destructive/10"
          : "text-foreground hover:bg-secondary",
      )}
    >
      <Icon className="h-5 w-5" />
      <span>{label}</span>
    </div>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }
  return <button className="w-full">{content}</button>;
};

export function SettingsSheet({ open, onOpenChange }: SettingsSheetProps) {
  const { logout, user } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  const handleLogout = () => {
    onOpenChange(false);
    logout();
  };
  
  const handleRouteChange = (path: string) => {
    onOpenChange(false);
    router.push(path);
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-2xl p-0">
        <SheetHeader className="p-6 pb-2 border-b">
          <SheetTitle className="text-center text-lg">Settings</SheetTitle>
        </SheetHeader>
        <div className="p-4 space-y-4">
          <div>
            <h3 className="mb-2 px-4 text-sm font-semibold text-muted-foreground">
              Account
            </h3>
            <div className="space-y-1">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <SettingsItem icon={LogOut} label="Logout" />
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure you want to log out?</AlertDialogTitle>
                    <AlertDialogDescription>
                      You can always log back in.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleLogout}
                    >
                      Log Out
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
              <AlertDialog>
                  <AlertDialogTrigger asChild>
                     <SettingsItem icon={Trash2} label="Delete Account" isDestructive />
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                      <AlertDialogHeader>
                          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                              This action cannot be undone. This will permanently delete your account and remove your data.
                          </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              onClick={() => {
                                  const message = `Hi, I would like to request the deletion of my account. My User ID is: ${user?.uid || 'Unknown'}`;
                                  window.open(`https://wa.me/919103669564?text=${encodeURIComponent(message)}`, '_blank');
                                  onOpenChange(false);
                              }}
                          >
                              Request via WhatsApp
                          </AlertDialogAction>
                      </AlertDialogFooter>
                  </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
          <div>
            <h3 className="mb-2 px-4 text-sm font-semibold text-muted-foreground">
              Legal & Policies
            </h3>
            <div className="space-y-1">
              <SettingsItem icon={Info} label="About MyExpert" onClick={() => handleRouteChange('/about')} />
              <SettingsItem icon={Shield} label="Privacy Policy" onClick={() => handleRouteChange('/privacy')} />
              <SettingsItem icon={FileText} label="Terms & Conditions" onClick={() => handleRouteChange('/terms')} />
              <SettingsItem icon={CircleDollarSign} label="Refund Policy" onClick={() => handleRouteChange('/refund-policy')} />
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
