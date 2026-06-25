
'use client';

import { AppNotification } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Bell, CalendarCheck, Tag, ChevronRight, Trash2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useRouter } from 'next/navigation';
import { markNotificationAsRead, deleteNotification } from '@/services/notification-service';

interface NotificationItemProps {
  notification: AppNotification;
}

export function NotificationItem({ notification }: NotificationItemProps) {
  const router = useRouter();

  const getIcon = () => {
    switch (notification.type) {
      case 'booking':
        return <CalendarCheck className="w-5 h-5 text-blue-500" />;
      case 'promo':
        return <Tag className="w-5 h-5 text-orange-500" />;
      default:
        return <Bell className="w-5 h-5 text-primary" />;
    }
  };

  const handlePress = () => {
    // Mark as read immediately
    markNotificationAsRead(notification.userId, notification.id);

    // If it's a booking notification, navigate to history
    if (notification.relatedEntityId && notification.relatedEntityType === 'Booking') {
      router.push('/history');
    }
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Delete this notification?')) {
      await deleteNotification(notification.userId, notification.id);
    }
  };

  const timeAgo = formatDistanceToNow(notification.timestamp.toDate(), { addSuffix: true });

  return (
    <div
      onClick={handlePress}
      onContextMenu={(e) => {
        e.preventDefault();
        handleDelete(e);
      }}
      className={cn(
        "flex items-start gap-4 p-4 transition-colors cursor-pointer border-b last:border-0 group",
        notification.isRead ? "bg-background opacity-70" : "bg-primary/5"
      )}
    >
      <div className={cn(
        "w-10 h-10 rounded-full flex items-center justify-center shrink-0",
        notification.isRead ? "bg-secondary" : "bg-white shadow-sm border border-primary/10"
      )}>
        {getIcon()}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-start gap-2">
          <h4 className={cn(
            "text-sm font-bold leading-tight line-clamp-1",
            notification.isRead ? "text-muted-foreground" : "text-foreground"
          )}>
            {notification.title}
          </h4>
          {!notification.isRead && (
            <span className="w-2 h-2 rounded-full bg-red-500 shrink-0 mt-1.5" />
          )}
        </div>
        <p className={cn(
          "text-xs mt-1 leading-normal",
          notification.isRead ? "text-muted-foreground/80" : "text-foreground/80"
        )}>
          {notification.message}
        </p>
        <span className="text-[10px] text-muted-foreground mt-2 block font-medium uppercase tracking-wider">
          {timeAgo}
        </span>
      </div>

      <div className="flex items-center gap-2 mt-1">
        <button 
          onClick={handleDelete}
          className="opacity-0 group-hover:opacity-100 p-2 text-muted-foreground hover:text-red-500 transition-opacity"
          aria-label="Delete notification"
        >
          <Trash2 className="w-4 h-4" />
        </button>
        <ChevronRight className="w-4 h-4 text-muted-foreground/40" />
      </div>
    </div>
  );
}
