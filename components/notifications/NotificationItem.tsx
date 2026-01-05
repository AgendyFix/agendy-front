// ============================================
// NOTIFICATION ITEM - AgendyFix
// Individual notification item
// ============================================

"use client";

import { useNotificationStore } from "@/lib/stores/notificationStore";
import { markNotificationAsRead } from "@/lib/api/notifications";
import type { Notification } from "@/lib/types/models";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { Calendar, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

interface NotificationItemProps {
  notification: Notification;
}

const getNotificationIcon = (type: string) => {
  switch (type) {
    case "appointment_created":
      return <Calendar className="h-4 w-4 text-blue-500" />;
    case "appointment_confirmed":
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    case "appointment_cancelled":
      return <XCircle className="h-4 w-4 text-red-500" />;
    case "appointment_updated":
      return <AlertCircle className="h-4 w-4 text-yellow-500" />;
    default:
      return <Calendar className="h-4 w-4 text-gray-500" />;
  }
};

export const NotificationItem = ({ notification }: NotificationItemProps) => {
  const { markAsRead } = useNotificationStore();
  const router = useRouter();

  const handleClick = async () => {
    // Mark as read if unread
    if (!notification.is_read) {
      try {
        await markNotificationAsRead(notification.id);
        markAsRead(notification.id);
      } catch (error) {
        console.error("[Notifications] Failed to mark as read:", error);
      }
    }

    // Navigate to appointment if available
    if (notification.metadata?.appointment_id) {
      router.push(`/appointments/${notification.metadata.appointment_id}`);
    }
  };

  const timeAgo = formatDistanceToNow(new Date(notification.created_at), {
    addSuffix: true,
    locale: es,
  });

  return (
    <button
      onClick={handleClick}
      className={cn(
        "w-full px-4 py-3 text-left transition-colors hover:bg-accent",
        !notification.is_read && "bg-blue-50 dark:bg-blue-950/20"
      )}
    >
      <div className="flex gap-3">
        {/* Icon */}
        <div className="mt-0.5 flex-shrink-0">
          {getNotificationIcon(notification.notification_type)}
        </div>

        {/* Content */}
        <div className="flex-1 space-y-1">
          <div className="flex items-start justify-between gap-2">
            <p
              className={cn(
                "text-sm",
                !notification.is_read && "font-semibold"
              )}
            >
              {notification.title}
            </p>
            {!notification.is_read && (
              <div className="h-2 w-2 flex-shrink-0 rounded-full bg-blue-500" />
            )}
          </div>

          <p className="text-xs text-muted-foreground line-clamp-2">
            {notification.description}
          </p>

          <p className="text-xs text-muted-foreground">{timeAgo}</p>
        </div>
      </div>
    </button>
  );
};
