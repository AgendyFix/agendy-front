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

/**
 * Resumen de uso de una disciplina: cuántos registros la referencian
 * y cuáles son (para mostrar en el diálogo de borrado/fusión).
 */
export interface DisciplineUsage {
  discipline: { id: string; name: string };
  counts: {
    employees: number;
    class_groups: number;
    enrollments: number;
    total: number;
  };
  employees: { id: string; name: string }[];
  class_groups: { id: string; name: string }[];
  enrollments: { id: string; client_id: string; client_name: string }[];
}

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
   * Si la disciplina está en uso (instructores, grupos o inscripciones),
   * el backend responde 409 con el detalle de uso (mismo shape que getUsage).
   */
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/disciplines/${id}/`);
  },

  /**
   * Detalle de uso de una disciplina: instructores, grupos e inscripciones
   * que la referencian. Útil antes de eliminar o fusionar.
   */
  getUsage: async (id: string): Promise<DisciplineUsage> => {
    const response = await apiClient.get<DisciplineUsage>(`/disciplines/${id}/usage/`);
    return response.data;
  },

  /**
   * Fusiona esta disciplina (source) en otra (target): reasigna
   * instructores/grupos/inscripciones a target y desactiva source.
   */
  merge: async (sourceId: string, targetId: string): Promise<Discipline> => {
    const response = await apiClient.post<Discipline>(`/disciplines/${sourceId}/merge/`, {
      target_id: targetId,
    });
    return response.data;
  },
};

export default disciplinesApi;
