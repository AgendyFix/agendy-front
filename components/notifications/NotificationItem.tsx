// ============================================
// NOTIFICATION ITEM - AgendyFix
// Individual notification item
// ============================================

"use client";

import { useState } from "react";
import { useNotificationStore } from "@/lib/stores/notificationStore";
import { markNotificationAsRead, deleteNotification } from "@/lib/api/notifications";
import type { Notification } from "@/lib/types/models";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { Calendar, CheckCircle, XCircle, AlertCircle, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

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
  const { markAsRead, removeNotification } = useNotificationStore();
  const router = useRouter();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

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

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      await deleteNotification(notification.id);
      removeNotification(notification.id);
      toast.success("Notificación eliminada");
      setShowDeleteDialog(false);
    } catch (error) {
      console.error("[Notifications] Failed to delete:", error);
      toast.error("Error al eliminar la notificación");
    } finally {
      setIsDeleting(false);
    }
  };

  const timeAgo = formatDistanceToNow(new Date(notification.created_at), {
    addSuffix: true,
    locale: es,
  });

  return (
    <>
      <div
        className={cn(
          "relative w-full transition-colors group",
          !notification.is_read && "bg-blue-50 dark:bg-blue-950/20"
        )}
      >
        <button
          onClick={handleClick}
          className={cn(
            "w-full px-4 py-3 text-left transition-colors hover:bg-accent",
            !notification.is_read && "bg-blue-50 dark:bg-blue-950/20"
          )}
        >
          <div className="flex gap-3 pr-8">
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

        {/* Delete Button */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-2 top-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50 hover:text-red-600 z-10"
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            setShowDeleteDialog(true);
          }}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar notificación?</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro de que deseas eliminar esta notificación? Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? "Eliminando..." : "Eliminar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
