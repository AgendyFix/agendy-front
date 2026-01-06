// ============================================
// NOTIFICATIONS HOOK - AgendyFix
// Combines WebSocket + REST API + Store
// ============================================

"use client";

import { useEffect, useCallback, useRef } from "react";
import { useWebSocket } from "./useWebSocket";
import { useNotificationStore } from "../stores/notificationStore";
import { useAuthStore } from "../stores/authStore";
import {
  getNotifications,
  getUnreadCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from "../api/notifications";
import type { WSMessage } from "../types/models";
import { toast } from "sonner";
import { Bell } from "lucide-react";

export const useNotifications = () => {
  const {
    notifications,
    unreadCount,
    isLoading,
    setNotifications,
    addNotification,
    markAsRead,
    markAllAsRead,
    setUnreadCount,
    setLoading,
    clearNotifications,
  } = useNotificationStore();

  const { isAuthenticated, currentCompany } = useAuthStore();

  // Fetch initial notifications
  const fetchNotifications = useCallback(async () => {
    if (!isAuthenticated || !currentCompany) return;

    try {
      setLoading(true);
      const [notificationsData, unreadData] = await Promise.all([
        getNotifications(1, 50),
        getUnreadCount(),
      ]);

      setNotifications(notificationsData.results);
      setUnreadCount(unreadData.unread_count);
    } catch (error) {
      console.error("[Notifications] Failed to fetch:", error);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, currentCompany, setNotifications, setUnreadCount, setLoading]);

  // Audio ref for notification sound
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Initialize audio
  useEffect(() => {
    if (typeof window !== "undefined") {
      audioRef.current = new Audio("/notification.mp3");
      audioRef.current.volume = 0.5;
    }
  }, []);

  // Play notification sound
  const playNotificationSound = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch((error) => {
        console.log("[Notifications] Could not play sound:", error);
      });
    }
  }, []);

  // Handle WebSocket messages
  const handleWebSocketMessage = useCallback(
    (message: WSMessage) => {
      if (message.type === "connection_established") {
        console.log("[Notifications]", message.message);
      } else if (message.type === "notification") {
        // Add notification to store
        addNotification(message.data);

        // Play sound
        playNotificationSound();

        // Show toast notification
        toast(message.data.title, {
          description: message.data.description,
          duration: 5000,
          dismissible: true, // Habilita el botón X para cerrar
          action: message.data.metadata?.appointment_id
            ? {
                label: "Ver cita",
                onClick: () => {
                  window.location.href = `/appointments/${message.data.metadata.appointment_id}`;
                },
              }
            : undefined,
        });

        // Request browser notification permission if not granted
        if (typeof window !== "undefined" && "Notification" in window) {
          if (Notification.permission === "granted") {
            new Notification(message.data.title, {
              body: message.data.description,
              icon: "/logo.png",
              badge: "/logo.png",
              tag: `notification-${message.data.id}`,
            });
          } else if (Notification.permission !== "denied") {
            Notification.requestPermission();
          }
        }
      }
    },
    [addNotification, playNotificationSound]
  );

  // WebSocket connection
  const { isConnected, reconnectAttempts } = useWebSocket({
    onMessage: handleWebSocketMessage,
    onConnect: () => {
      console.log("[Notifications] WebSocket connected");
    },
    onDisconnect: () => {
      console.log("[Notifications] WebSocket disconnected");
    },
    enabled: isAuthenticated && !!currentCompany,
  });

  // Mark notification as read
  const handleMarkAsRead = useCallback(
    async (id: number) => {
      try {
        await markNotificationAsRead(id);
        markAsRead(id);
      } catch (error) {
        console.error("[Notifications] Failed to mark as read:", error);
        throw error;
      }
    },
    [markAsRead]
  );

  // Mark all as read
  const handleMarkAllAsRead = useCallback(async () => {
    try {
      await markAllNotificationsAsRead();
      markAllAsRead();
      toast.success("Todas las notificaciones marcadas como leídas");
    } catch (error) {
      console.error("[Notifications] Failed to mark all as read:", error);
      toast.error("Error al marcar notificaciones como leídas");
      throw error;
    }
  }, [markAllAsRead]);

  // Fetch notifications on mount and when company changes
  useEffect(() => {
    if (isAuthenticated && currentCompany) {
      fetchNotifications();
    } else {
      clearNotifications();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, currentCompany]);

  return {
    notifications,
    unreadCount,
    isLoading,
    isConnected,
    reconnectAttempts,
    fetchNotifications,
    markAsRead: handleMarkAsRead,
    markAllAsRead: handleMarkAllAsRead,
  };
};
