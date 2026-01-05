// ============================================
// NOTIFICATIONS API - AgendyFix
// ============================================

import apiClient from "./client";
import type { Notification, NotificationDetail } from "@/lib/types/models";
import type { PaginatedResponse } from "@/lib/types/api";

/**
 * Get paginated list of notifications
 */
export const getNotifications = async (
  page = 1,
  pageSize = 20
): Promise<PaginatedResponse<Notification>> => {
  const response = await apiClient.get<PaginatedResponse<Notification>>(
    "/notifications/",
    {
      params: {
        page,
        page_size: pageSize,
      },
    }
  );
  return response.data;
};

/**
 * Get notification detail by ID
 */
export const getNotificationById = async (
  id: number
): Promise<NotificationDetail> => {
  const response = await apiClient.get<NotificationDetail>(
    `/notifications/${id}/`
  );
  return response.data;
};

/**
 * Mark notification as read
 */
export const markNotificationAsRead = async (
  id: number
): Promise<Notification> => {
  const response = await apiClient.patch<Notification>(
    `/notifications/${id}/`,
    { is_read: true }
  );
  return response.data;
};

/**
 * Get count of unread notifications
 */
export const getUnreadCount = async (): Promise<{ unread_count: number }> => {
  const response = await apiClient.get<{ unread_count: number }>(
    "/notifications/unread-count/"
  );
  return response.data;
};

/**
 * Mark all notifications as read
 */
export const markAllNotificationsAsRead = async (): Promise<{
  message: string;
  updated_count: number;
}> => {
  const response = await apiClient.post<{
    message: string;
    updated_count: number;
  }>("/notifications/mark-all-read/");
  return response.data;
};
