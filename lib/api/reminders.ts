// ============================================
// REMINDERS API - AgendyFix
// ============================================

import apiClient from "./client";
import type { Reminder, ReminderChild } from "@/lib/types/models";
import type {
  PaginatedResponse,
  CreateReminderRequest,
  UpdateReminderRequest,
  ReminderListParams,
  ReminderHistoryParams,
  ReminderChildrenResponse,
  SendNowResponse,
  CancelReminderResponse,
} from "@/lib/types/api";

/**
 * Get paginated list of all reminders
 */
export const getReminders = async (
  params: ReminderListParams = {}
): Promise<PaginatedResponse<Reminder>> => {
  const response = await apiClient.get<PaginatedResponse<Reminder>>(
    "/reminders/",
    { params }
  );
  return response.data;
};

/**
 * Get paginated list of scheduled reminders (pending)
 */
export const getScheduledReminders = async (
  params: Omit<ReminderListParams, 'status'> = {}
): Promise<PaginatedResponse<Reminder>> => {
  const response = await apiClient.get<PaginatedResponse<Reminder>>(
    "/reminders/scheduled/",
    { params }
  );
  return response.data;
};

/**
 * Get paginated list of my reminders (user's reminder history)
 */
export const getMyReminders = async (
  params: ReminderHistoryParams = {}
): Promise<PaginatedResponse<Reminder>> => {
  const response = await apiClient.get<PaginatedResponse<Reminder>>(
    "/reminders/my-reminders/",
    { params }
  );
  return response.data;
};

/**
 * Get paginated list of reminder history (sent/failed for entire company)
 */
export const getReminderHistory = async (
  params: ReminderHistoryParams = {}
): Promise<PaginatedResponse<Reminder>> => {
  const response = await apiClient.get<PaginatedResponse<Reminder>>(
    "/reminders/history/",
    { params }
  );
  return response.data;
};

/**
 * Get reminder by ID
 */
export const getReminderById = async (
  id: string
): Promise<Reminder> => {
  const response = await apiClient.get<Reminder>(
    `/reminders/${id}/`
  );
  return response.data;
};

/**
 * Create new reminder
 */
export const createReminder = async (
  data: CreateReminderRequest
): Promise<Reminder> => {
  const response = await apiClient.post<Reminder>(
    "/reminders/",
    data
  );
  return response.data;
};

/**
 * Update reminder (only pending reminders)
 */
export const updateReminder = async (
  id: string,
  data: UpdateReminderRequest
): Promise<Reminder> => {
  const response = await apiClient.patch<Reminder>(
    `/reminders/${id}/`,
    data
  );
  return response.data;
};

/**
 * Cancel reminder (soft delete)
 */
export const cancelReminder = async (
  id: string
): Promise<CancelReminderResponse> => {
  const response = await apiClient.post<CancelReminderResponse>(
    `/reminders/${id}/cancel/`
  );
  return response.data;
};

/**
 * Delete reminder (alternative to cancel)
 */
export const deleteReminder = async (id: string): Promise<void> => {
  await apiClient.delete(`/reminders/${id}/`);
};

/**
 * Send reminder immediately
 */
export const sendReminderNow = async (
  id: string
): Promise<SendNowResponse> => {
  const response = await apiClient.post<SendNowResponse>(
    `/reminders/${id}/send-now/`
  );
  return response.data;
};

/**
 * Get children of bulk reminder
 */
export const getReminderChildren = async (
  id: string,
  params?: { limit?: number; offset?: number }
): Promise<ReminderChildrenResponse> => {
  const response = await apiClient.get<ReminderChildrenResponse>(
    `/reminders/${id}/children/`,
    { params }
  );
  return response.data;
};

export const remindersApi = {
  getAll: getReminders,
  getScheduled: getScheduledReminders,
  getMyReminders: getMyReminders,
  getHistory: getReminderHistory,
  getById: getReminderById,
  create: createReminder,
  update: updateReminder,
  cancel: cancelReminder,
  delete: deleteReminder,
  sendNow: sendReminderNow,
  getChildren: getReminderChildren,
};