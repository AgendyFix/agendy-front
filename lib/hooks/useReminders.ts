// ============================================
// USE REMINDERS HOOKS - AgendyFix
// ============================================

import { useState, useCallback } from "react";
import { remindersApi } from "@/lib/api/reminders";
import type { Reminder } from "@/lib/types/models";
import type {
  CreateReminderRequest,
  UpdateReminderRequest,
  ReminderListParams,
  ReminderHistoryParams,
  ReminderChildrenResponse,
} from "@/lib/types/api";

/**
 * Hook for scheduled reminders (pending)
 */
export const useScheduledReminders = () => {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrevious, setHasPrevious] = useState(false);

  const fetchReminders = useCallback(async (params: Omit<ReminderListParams, 'status'> & { page?: number } = {}) => {
    try {
      setIsLoading(true);
      const { page = 1, ...restParams } = params;
      
      const offset = (page - 1) * 10;
      const response = await remindersApi.getScheduled({
        ...restParams,
        limit: 10,
        offset,
      });

      setReminders(response.results);
      setTotalCount(response.count);
      setCurrentPage(page);
      setHasNext(!!response.next);
      setHasPrevious(!!response.previous);
    } catch (error) {
      console.error("[ScheduledReminders] Failed to fetch:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createReminder = useCallback(async (data: CreateReminderRequest) => {
    try {
      setIsLoading(true);
      const newReminder = await remindersApi.create(data);
      await fetchReminders({ page: 1 });
      return newReminder;
    } catch (error) {
      console.error("[ScheduledReminders] Failed to create:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [fetchReminders]);

  const updateReminder = useCallback(async (id: string, data: UpdateReminderRequest) => {
    try {
      setIsLoading(true);
      const updated = await remindersApi.update(id, data);
      setReminders(prev => prev.map(r => r.id === id ? updated : r));
      return updated;
    } catch (error) {
      console.error("[ScheduledReminders] Failed to update:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const cancelReminder = useCallback(async (id: string) => {
    try {
      setIsLoading(true);
      await remindersApi.cancel(id);
      setReminders(prev => prev.filter(r => r.id !== id));
      setTotalCount(prev => prev - 1);
    } catch (error) {
      console.error("[ScheduledReminders] Failed to cancel:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const sendNow = useCallback(async (id: string) => {
    try {
      setIsLoading(true);
      await remindersApi.sendNow(id);
      setReminders(prev => prev.filter(r => r.id !== id));
      setTotalCount(prev => prev - 1);
    } catch (error) {
      console.error("[ScheduledReminders] Failed to send now:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    reminders,
    isLoading,
    totalCount,
    currentPage,
    hasNext,
    hasPrevious,
    fetchReminders,
    createReminder,
    updateReminder,
    cancelReminder,
    sendNow,
  };
};

/**
 * Hook for reminder history (sent/failed for entire company)
 */
export const useReminderHistory = () => {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrevious, setHasPrevious] = useState(false);

  const fetchHistory = useCallback(async (params: ReminderHistoryParams & { page?: number } = {}) => {
    try {
      setIsLoading(true);
      const { page = 1, ...restParams } = params;
      
      const offset = (page - 1) * 10;
      const response = await remindersApi.getHistory({
        ...restParams,
        limit: 10,
        offset,
      });

      setReminders(response.results);
      setTotalCount(response.count);
      setCurrentPage(page);
      setHasNext(!!response.next);
      setHasPrevious(!!response.previous);
    } catch (error) {
      console.error("[ReminderHistory] Failed to fetch:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    reminders,
    isLoading,
    totalCount,
    currentPage,
    hasNext,
    hasPrevious,
    fetchHistory,
  };
};

/**
 * Hook for my reminders (user's own reminders)
 */
export const useMyReminders = () => {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrevious, setHasPrevious] = useState(false);

  const fetchMyReminders = useCallback(async (params: ReminderHistoryParams & { page?: number } = {}) => {
    try {
      setIsLoading(true);
      const { page = 1, ...restParams } = params;
      
      const offset = (page - 1) * 10;
      const response = await remindersApi.getMyReminders({
        ...restParams,
        limit: 10,
        offset,
      });

      setReminders(response.results);
      setTotalCount(response.count);
      setCurrentPage(page);
      setHasNext(!!response.next);
      setHasPrevious(!!response.previous);
    } catch (error) {
      console.error("[MyReminders] Failed to fetch:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    reminders,
    isLoading,
    totalCount,
    currentPage,
    hasNext,
    hasPrevious,
    fetchMyReminders,
  };
};

/**
 * Hook for single reminder details
 */
export const useReminder = (id: string) => {
  const [reminder, setReminder] = useState<Reminder | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchReminder = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await remindersApi.getById(id);
      setReminder(data);
    } catch (error) {
      console.error("[Reminder] Failed to fetch:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  const updateReminder = useCallback(async (data: UpdateReminderRequest) => {
    try {
      setIsLoading(true);
      const updated = await remindersApi.update(id, data);
      setReminder(updated);
      return updated;
    } catch (error) {
      console.error("[Reminder] Failed to update:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  return {
    reminder,
    isLoading,
    fetchReminder,
    updateReminder,
  };
};

/**
 * Hook for bulk reminder children with pagination
 * Supports both bulk reminders and recurrence masters
 */
export const useBulkReminderChildren = (bulkId: string) => {
  const [executions, setExecutions] = useState<Reminder[]>([]);
  const [masterInfo, setMasterInfo] = useState<ReminderChildrenResponse['master_info'] | null>(null);
  const [bulkInfo, setBulkInfo] = useState<ReminderChildrenResponse['bulk_reminder'] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrevious, setHasPrevious] = useState(false);
  const LIMIT = 20;

  const fetchChildren = useCallback(async (page: number = 1) => {
    try {
      setIsLoading(true);
      const offset = (page - 1) * LIMIT;
      
      const response = await remindersApi.getChildren(bulkId, {
        limit: LIMIT,
        offset,
      });
      
      // Los results vienen con campos parciales, los convertimos a any para evitar errores de tipo
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const results: any[] = response.results.map(child => ({
        ...child,
        id: child.id.toString(),
      }));
      
      setExecutions(results);
      setMasterInfo(response.master_info || null);
      setBulkInfo(response.bulk_reminder || null);
      setTotalCount(response.count);
      setCurrentPage(page);
      setHasNext(!!response.next);
      setHasPrevious(!!response.previous);
    } catch (error) {
      console.error("[BulkReminderChildren] Failed to fetch:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [bulkId]);

  return {
    executions,
    masterInfo,
    bulkInfo,
    totalCount,
    currentPage,
    hasNext,
    hasPrevious,
    isLoading,
    fetchChildren,
  };
};