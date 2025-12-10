// ============================================
// useAppointments HOOK - Custom hook for appointments
// ============================================

import { useState } from "react";
import { appointmentsApi } from "../api/appointments";
import type { Appointment, Note } from "../types/models";
import type {
  CreateAppointmentRequest,
  UpdateAppointmentRequest,
  UpdateAppointmentStatusRequest,
  AppointmentCalendarParams,
  CreateNoteRequest,
  UpdateNoteRequest
} from "../types/api";

export const useAppointments = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrevious, setHasPrevious] = useState(false);

  const fetchAppointments = async (params?: {
    search?: string;
    page?: number;
    status?: string;
    client?: string;
    source?: string;
  }) => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Convertir page a offset/limit
      const limit = 10;
      const page = params?.page || 1;
      const offset = (page - 1) * limit;
      
      const { page: _, ...restParams } = params || {};
      
      const apiParams = {
        ...restParams,
        limit,
        offset,
      };
      
      const response = await appointmentsApi.getAll(apiParams);
      setAppointments(response.results);
      setTotalCount(response.count);
      setHasNext(!!response.next);
      setHasPrevious(!!response.previous);
      setCurrentPage(page);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar citas");
      setAppointments([]);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCalendar = async (params: AppointmentCalendarParams): Promise<Appointment[]> => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await appointmentsApi.getCalendar(params);
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar calendario");
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  const createAppointment = async (data: CreateAppointmentRequest): Promise<Appointment> => {
    try {
      setIsLoading(true);
      setError(null);
      const newAppointment = await appointmentsApi.create(data);
      // Refetch para actualizar lista
      await fetchAppointments({ page: 1 });
      return newAppointment;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al crear cita");
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const updateAppointment = async (id: string, data: UpdateAppointmentRequest): Promise<Appointment> => {
    try {
      setIsLoading(true);
      setError(null);
      const updated = await appointmentsApi.update(id, data);
      setAppointments((prev) => prev.map((a) => (a.id === id ? updated : a)));
      return updated;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al actualizar cita");
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const updateAppointmentStatus = async (id: string, status: UpdateAppointmentStatusRequest["status"]): Promise<Appointment> => {
    try {
      setIsLoading(true);
      setError(null);
      const updated = await appointmentsApi.updateStatus(id, { status });
      setAppointments((prev) => prev.map((a) => (a.id === id ? updated : a)));
      return updated;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al actualizar status");
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const deleteAppointment = async (id: string): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);
      await appointmentsApi.delete(id);
      await fetchAppointments({ page: currentPage });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al eliminar cita");
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // ============================================
  // NOTES
  // ============================================

  const addNote = async (appointmentId: string, data: CreateNoteRequest): Promise<Note> => {
    try {
      setIsLoading(true);
      setError(null);
      const note = await appointmentsApi.createNote(appointmentId, data);
      return note;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al agregar nota");
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const updateNote = async (appointmentId: string, noteId: string, data: UpdateNoteRequest): Promise<Note> => {
    try {
      setIsLoading(true);
      setError(null);
      const note = await appointmentsApi.updateNote(appointmentId, noteId, data);
      return note;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al actualizar nota");
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const deleteNote = async (appointmentId: string, noteId: string): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);
      await appointmentsApi.deleteNote(appointmentId, noteId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al eliminar nota");
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    appointments,
    isLoading,
    error,
    totalCount,
    currentPage,
    hasNext,
    hasPrevious,
    fetchAppointments,
    fetchCalendar,
    createAppointment,
    updateAppointment,
    updateAppointmentStatus,
    deleteAppointment,
    addNote,
    updateNote,
    deleteNote,
  };
};