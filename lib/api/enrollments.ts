// ============================================
// ENROLLMENTS API - Academy Module
// ============================================

import apiClient from "./client";
import type { PaginatedResponse } from "@/lib/types/api";
import type {
  CreateEnrollmentRequest,
  UpdateEnrollmentRequest,
  EnrollmentListParams,
} from "@/lib/types/api";
import type { Enrollment } from "@/lib/types/models";

export const enrollmentsApi = {
  /**
   * GET /api/v1/enrollments/
   * Lista inscripciones activas de la company.
   */
  getAll: async (params?: EnrollmentListParams): Promise<PaginatedResponse<Enrollment>> => {
    const response = await apiClient.get("/enrollments/", { params });
    return response.data;
  },

  /**
   * GET /api/v1/enrollments/{id}/
   * Detalle completo de una inscripción.
   */
  getById: async (id: string): Promise<Enrollment> => {
    const response = await apiClient.get(`/enrollments/${id}/`);
    return response.data;
  },

  /**
   * POST /api/v1/enrollments/
   * Inscribe un alumno en un grupo.
   */
  create: async (data: CreateEnrollmentRequest): Promise<Enrollment> => {
    const response = await apiClient.post("/enrollments/", data);
    return response.data;
  },

  /**
   * PATCH /api/v1/enrollments/{id}/
   * Actualiza estado, fecha de inicio o notas.
   */
  update: async (id: string, data: UpdateEnrollmentRequest): Promise<Enrollment> => {
    const response = await apiClient.patch(`/enrollments/${id}/`, data);
    return response.data;
  },

  /**
   * DELETE /api/v1/enrollments/{id}/
   * Soft-delete: marca is_active=false y status=dropped.
   */
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/enrollments/${id}/`);
  },
};
