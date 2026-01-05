// ============================================
// NOTIFICATION PANEL - AgendyFix
// Dropdown panel showing notification list
// ============================================

"use client";

import { useNotificationStore } from "@/lib/stores/notificationStore";
import { NotificationItem } from "./NotificationItem";
import { Button } from "@/components/ui/button";
import { CheckCheck, Loader2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { markAllNotificationsAsRead } from "@/lib/api/notifications";
import { toast } from "sonner";

export const NotificationPanel = () => {
  const {
    notifications,
    unreadCount,
    isLoading,
    markAllAsRead,
  } = useNotificationStore();

  const handleMarkAllAsRead = async () => {
    try {
      await markAllNotificationsAsRead();
      markAllAsRead();
      toast("Todas las notificaciones marcadas como leídas", {
        duration: 2000,
      });
    } catch (error) {
      console.error("[Notifications] Failed to mark all as read:", error);
      toast("Error al marcar notificaciones como leídas", {
        duration: 3000,
      });
    }
  };

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b px-4 py-3">
        <div>
          <h3 className="font-semibold">Notificaciones</h3>
          {unreadCount > 0 && (
            <p className="text-xs text-muted-foreground">
              {unreadCount} sin leer
            </p>
          )}
        </div>
        {unreadCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleMarkAllAsRead}
            className="h-8 text-xs"
          >
            <CheckCheck className="mr-1 h-3 w-3" />
            Marcar todas
          </Button>
        )}
      </div>

      {/* Content */}
      <ScrollArea className="h-[400px]">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <p className="text-sm text-muted-foreground">
              No tienes notificaciones
            </p>
          </div>
        ) : (
          <div className="divide-y">
            {notifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
              />
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
};
