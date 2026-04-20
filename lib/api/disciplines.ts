// ============================================
// DISCIPLINES API - AgendyFix
// ============================================

import apiClient from "./client";
import type { PaginatedResponse } from "../types/api";
import type { Discipline } from "../types/models";

export interface DisciplineListParams {
  search?: string;
  ordering?: string;
  is_active?: boolean;
  limit?: number;
  offset?: number;
}

export interface CreateDisciplineRequest {
  name: string;
  description?: string;
  metadata?: Record<string, unknown>;
}

export interface UpdateDisciplineRequest extends Partial<CreateDisciplineRequest> {}

export const disciplinesApi = {
  /**
   * Lista todas las disciplinas del catálogo de la academia actual.
   * Uso: ?ordering=name para tenerlas en orden alfabético.
   */
  getAll: async (params?: DisciplineListParams): Promise<PaginatedResponse<Discipline>> => {
    const response = await apiClient.get<PaginatedResponse<Discipline>>("/disciplines/", { params });
    return response.data;
  },

  /**
   * Detalle de una disciplina.
   */
  getById: async (id: string): Promise<Discipline> => {
    const response = await apiClient.get<Discipline>(`/disciplines/${id}/`);
    return response.data;
  },

  /**
   * Crea una disciplina en el catálogo. Solo admin.
   */
  create: async (data: CreateDisciplineRequest): Promise<Discipline> => {
    const response = await apiClient.post<Discipline>("/disciplines/", data);
    return response.data;
  },

  /**
   * Edita una disciplina. Solo admin.
   */
  update: async (id: string, data: UpdateDisciplineRequest): Promise<Discipline> => {
    const response = await apiClient.patch<Discipline>(`/disciplines/${id}/`, data);
    return response.data;
  },

  /**
   * Soft-delete de una disciplina. Solo admin.
   */
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/disciplines/${id}/`);
  },
};

export default disciplinesApi;
