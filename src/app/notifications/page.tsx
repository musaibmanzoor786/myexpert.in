
'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/context/auth-context';
import { subscribeToNotifications, markAllNotificationsAsRead } from '@/services/notification-service';
import type { AppNotification } from '@/lib/types';
import { NotificationItem } from '@/components/notifications/notification-item';
import { Button } from '@/components/ui/button';
import { ChevronLeft, CheckCheck, BellOff, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { ScrollArea } from '@/components/ui/scroll-area';
import { isToday, isYesterday, format } from 'date-fns';

export default function NotificationsPage() {
  const { user, loading: authLoading } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (!user) return;

    const unsubscribe = subscribeToNotifications(user.uid, (data) => {
      setNotifications(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const groupedNotifications = useMemo(() => {
    const groups: Record<string, AppNotification[]> = {
      Today: [],
      Yesterday: [],
      Earlier: [],
    };

    notifications.forEach((n) => {
      const date = n.timestamp.toDate();
      if (isToday(date)) groups.Today.push(n);
      else if (isYesterday(date)) groups.Yesterday.push(n);
      else groups.Earlier.push(n);
    });

    return groups;
  }, [notifications]);

  const handleMarkAllRead = async () => {
    if (!user) return;
    await markAllNotificationsAsRead(user.uid);
  };

  if (authLoading || loading) {
    return (
      <div className="flex justify-center items-center h-[calc(100vh-200px)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full h-10 w-10"
            onClick={() => window.history.length > 2 ? router.back() : router.push('/')}
          >
            <ChevronLeft className="h-6 w-6" />
          </Button>
          <h1 className="text-xl font-bold">Notifications</h1>
        </div>
        {notifications.some(n => !n.isRead) && (
          <Button
            variant="ghost"
            size="sm"
            className="text-primary font-bold hover:bg-primary/5 h-9"
            onClick={handleMarkAllRead}
          >
            <CheckCheck className="w-4 h-4 mr-2" />
            Mark all as read
          </Button>
        )}
      </div>

      <ScrollArea className="flex-1 -mx-4 px-4">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
            <div className="w-24 h-24 bg-secondary rounded-full flex items-center justify-center border-4 border-white shadow-inner">
              <BellOff className="w-10 h-10 text-muted-foreground/40" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-foreground">No notifications yet</h3>
              <p className="text-sm text-muted-foreground mt-1 max-w-[240px] mx-auto">
                You're all caught up! New updates will appear here.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-8 pb-10">
            {Object.entries(groupedNotifications).map(([title, items]) => {
              if (items.length === 0) return null;
              return (
                <div key={title} className="space-y-2">
                  <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest px-2">
                    {title}
                  </h3>
                  <div className="bg-card rounded-2xl border overflow-hidden shadow-sm">
                    {items.map((item) => (
                      <NotificationItem key={item.id} notification={item} />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
