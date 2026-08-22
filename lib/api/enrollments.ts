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

/** Periodo objetivo de cobro de una inscripción (GET billing-status). */
export interface BillingStatus {
  /** liquidar = hay deuda abierta · nuevo = mes actual · adelanto = mes siguiente */
  mode: "liquidar" | "nuevo" | "adelanto";
  /** Fecha de vencimiento del periodo objetivo (YYYY-MM-DD) */
  period: string;
  /** "julio 2026" */
  period_label: string;
  /** Saldo cobrable del periodo objetivo */
  balance: number;
  monthly_fee: number;
  open_payment_id: string | null;
  /** true si existe un pago abierto con due_date de un mes anterior al actual
   *  (independiente del target pedido en esta llamada). */
  has_older_debt: boolean;
}

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

  /**
   * GET /api/v1/enrollments/{id}/billing-status/
   * A qué periodo se aplicaría un cobro y con qué saldo.
   * @param target 'oldest' (default, deuda más antigua) | 'current' (mes
   *   actual, ignorando deuda vieja — alumno que regresa tras ausentarse).
   *   Se omite el query param cuando no se pasa o es 'oldest'.
   */
  getBillingStatus: async (id: string, target?: "oldest" | "current"): Promise<BillingStatus> => {
    const response = await apiClient.get(`/enrollments/${id}/billing-status/`, {
      params: target && target !== "oldest" ? { target } : undefined,
    });
    return response.data;
  },
};
