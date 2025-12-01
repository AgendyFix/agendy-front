// ============================================
// APPOINTMENTS API - AgendyFix
// ============================================

import apiClient from "./client";
import type {
  CreateAppointmentRequest,
  UpdateAppointmentRequest,
  UpdateAppointmentStatusRequest,
  AppointmentCalendarParams,
  CreateNoteRequest,
  UpdateNoteRequest,
  PaginatedResponse,
} from "../types/api";
import type { Appointment, Note } from "../types/models";

export const appointmentsApi = {
  /**
   * Get all appointments with optional filters and pagination
   */
  getAll: async (params?: { search?: string; page?: number; limit?: number; offset?: number; status?: string }): Promise<PaginatedResponse<Appointment>> => {
    const response = await apiClient.get<PaginatedResponse<Appointment>>("/appointments/", { params });
    return response.data;
  },

  /**
   * Get calendar view of appointments
   */
  getCalendar: async (params: AppointmentCalendarParams) => {
    const response = await apiClient.get("/appointments/calendar/", { params });
    return response.data;
  },

  /**
   * Get single appointment by ID
   */
  getById: async (id: string): Promise<Appointment> => {
    const response = await apiClient.get<Appointment>(`/appointments/${id}/`);
    return response.data;
  },

  /**
   * Create new appointment
   */
  create: async (data: CreateAppointmentRequest): Promise<Appointment> => {
    const response = await apiClient.post<Appointment>("/appointments/", data);
    return response.data;
  },

  /**
   * Update existing appointment
   */
  update: async (id: string, data: UpdateAppointmentRequest): Promise<Appointment> => {
    const response = await apiClient.patch<Appointment>(`/appointments/${id}/`, data);
    return response.data;
  },

  /**
   * Update only status of appointment
   */
  updateStatus: async (id: string, data: UpdateAppointmentStatusRequest): Promise<Appointment> => {
    const response = await apiClient.patch<Appointment>(`/appointments/${id}/status/`, data);
    return response.data;
  },

  /**
   * Delete appointment (soft delete)
   */
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/appointments/${id}/`);
  },

  // ============================================
  // NOTES (Nested in Appointments)
  // ============================================

  /**
   * Get all notes for an appointment
   */
  getNotes: async (appointmentId: string): Promise<Note[]> => {
    const response = await apiClient.get<Note[]>(`/appointments/${appointmentId}/notes/`);
    return response.data;
  },

  /**
   * Create note for appointment
   */
  createNote: async (appointmentId: string, data: CreateNoteRequest): Promise<Note> => {
    // Si no hay archivo, enviar como JSON (preserva saltos de línea)
    if (!data.media) {
      const response = await apiClient.post<Note>(
        `/appointments/${appointmentId}/notes/`,
        {
          title: data.title,
          description: data.description,
          is_internal: data.is_internal,
        }
      );
      return response.data;
    }
    
    // Si hay archivo, usar FormData
    const formData = new FormData();
    if (data.title) formData.append("title", data.title);
    if (data.description) formData.append("description", data.description);
    formData.append("is_internal", String(data.is_internal));
    formData.append("media", data.media);

    const response = await apiClient.post<Note>(
      `/appointments/${appointmentId}/notes/`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );
    return response.data;
  },

  /**
   * Update note
   */
  updateNote: async (appointmentId: string, noteId: string, data: UpdateNoteRequest): Promise<Note> => {
    // Si no hay archivo, enviar como JSON (preserva saltos de línea)
    if (!data.media) {
      const response = await apiClient.patch<Note>(
        `/appointments/${appointmentId}/notes/${noteId}/`,
        {
          title: data.title,
          description: data.description,
          is_internal: data.is_internal,
        }
      );
      return response.data;
    }
    
    // Si hay archivo, usar FormData
    const formData = new FormData();
    if (data.title) formData.append("title", data.title);
    if (data.description) formData.append("description", data.description);
    if (data.is_internal !== undefined) formData.append("is_internal", String(data.is_internal));
    formData.append("media", data.media);

    const response = await apiClient.patch<Note>(
      `/appointments/${appointmentId}/notes/${noteId}/`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );
    return response.data;
  },

  /**
   * Delete note
   */
  deleteNote: async (appointmentId: string, noteId: string): Promise<void> => {
    await apiClient.delete(`/appointments/${appointmentId}/notes/${noteId}/`);
  },
};

export default appointmentsApi;