// ============================================
// CLIENTS API - AgendyFix
// ============================================

import apiClient from "./client";
import type {
  CreateClientRequest,
  UpdateClientRequest,
  ClientListParams,
  PaginatedResponse,
} from "../types/api";
import type { Client } from "../types/models";

export const clientsApi = {
  /**
   * Lista alumnos con filtros y paginación.
   * Búsqueda en nombre, apellido, email, teléfono y nombre de contacto.
   */
  getAll: async (params?: ClientListParams & { page?: number; limit?: number; offset?: number }): Promise<PaginatedResponse<Client>> => {
    const { page, limit = 10, ...rest } = params ?? {};
    const offset = page ? (page - 1) * limit : (rest.offset ?? 0);
    const response = await apiClient.get<PaginatedResponse<Client>>("/clients/", {
      params: { ...rest, limit, offset },
    });
    return response.data;
  },

  /**
   * Detalle de un alumno incluyendo sus contactos activos.
   */
  getById: async (id: string): Promise<Client> => {
    const response = await apiClient.get<Client>(`/clients/${id}/`);
    return response.data;
  },

  /**
   * Crea un alumno. Opcionalmente crea sus contactos en el mismo request.
   * Solo admin.
   */
  create: async (data: CreateClientRequest): Promise<Client> => {
    const response = await apiClient.post<Client>("/clients/", data);
    return response.data;
  },

  /**
   * Edita datos del alumno. Los contactos NO se editan aquí.
   * Solo admin.
   */
  update: async (id: string, data: UpdateClientRequest): Promise<Client> => {
    const response = await apiClient.patch<Client>(`/clients/${id}/`, data);
    return response.data;
  },

  /**
   * Desactiva el alumno (soft-delete). Solo admin.
   */
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/clients/${id}/`);
  },

  /**
   * Pausa TODAS las inscripciones activas del alumno (1 clic). Solo admin.
   * Mientras esté pausado no genera cobros ni notificaciones.
   */
  pause: async (id: string): Promise<{ affected: number; client: Client }> => {
    const response = await apiClient.post<{ affected: number; client: Client }>(
      `/clients/${id}/pause/`,
    );
    return response.data;
  },

  /**
   * Reactiva TODAS las inscripciones pausadas del alumno. Solo admin.
   * Retoma cobros desde el mes actual (nunca retroactivo).
   */
  reactivate: async (id: string): Promise<{ affected: number; client: Client }> => {
    const response = await apiClient.post<{ affected: number; client: Client }>(
      `/clients/${id}/reactivate/`,
    );
    return response.data;
  },
};

export default clientsApi;
