// ============================================
// CLASS GROUPS API - Academy Module
// ============================================

import apiClient from "./client";
import type { PaginatedResponse } from "@/lib/types/api";
import type {
  CreateClassGroupRequest,
  UpdateClassGroupRequest,
  ClassGroupListParams,
} from "@/lib/types/api";
import type { ClassGroup } from "@/lib/types/models";

export const classGroupsApi = {
  /**
   * GET /api/v1/class-groups/
   * Lista todos los grupos activos de la company.
   */
  getAll: async (params?: ClassGroupListParams): Promise<PaginatedResponse<ClassGroup>> => {
    const response = await apiClient.get("/class-groups/", { params });
    return response.data;
  },

  /**
   * GET /api/v1/class-groups/{id}/
   * Detalle completo de un grupo.
   */
  getById: async (id: string): Promise<ClassGroup> => {
    const response = await apiClient.get(`/class-groups/${id}/`);
    return response.data;
  },

  /**
   * POST /api/v1/class-groups/
   * Crea un nuevo grupo con sus horarios.
   */
  create: async (data: CreateClassGroupRequest): Promise<ClassGroup> => {
    const response = await apiClient.post("/class-groups/", data);
    return response.data;
  },

  /**
   * PATCH /api/v1/class-groups/{id}/
   * Actualiza campos del grupo (incluye reemplazo de schedules).
   */
  update: async (id: string, data: UpdateClassGroupRequest): Promise<ClassGroup> => {
    const response = await apiClient.patch(`/class-groups/${id}/`, data);
    return response.data;
  },

  /**
   * DELETE /api/v1/class-groups/{id}/
   * Soft-delete del grupo.
   */
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/class-groups/${id}/`);
  },
};
