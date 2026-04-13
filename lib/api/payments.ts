// ============================================
// PAYMENTS API - Academy Module
// ============================================

import apiClient from "./client";
import type { PaginatedResponse } from "@/lib/types/api";
import type {
  CreatePaymentRequest,
  UpdatePaymentRequest,
  PaymentListParams,
  PaymentSummaryParams,
} from "@/lib/types/api";
import type { Payment, PaymentSummary } from "@/lib/types/models";

export const paymentsApi = {
  /**
   * GET /api/v1/payments/
   */
  getAll: async (params?: PaymentListParams): Promise<PaginatedResponse<Payment>> => {
    const response = await apiClient.get("/payments/", { params });
    return response.data;
  },

  /**
   * GET /api/v1/payments/{id}/
   */
  getById: async (id: string): Promise<Payment> => {
    const response = await apiClient.get(`/payments/${id}/`);
    return response.data;
  },

  /**
   * POST /api/v1/payments/
   * Registra un pago (siempre status=paid).
   */
  create: async (data: CreatePaymentRequest): Promise<Payment> => {
    const response = await apiClient.post("/payments/", data);
    return response.data;
  },

  /**
   * PATCH /api/v1/payments/{id}/
   * Corregir método de pago o fecha de pago.
   */
  update: async (id: string, data: UpdatePaymentRequest): Promise<Payment> => {
    const response = await apiClient.patch(`/payments/${id}/`, data);
    return response.data;
  },

  /**
   * DELETE /api/v1/payments/{id}/
   * Revierte el pago. El alumno vuelve a aparecer en unpaid_enrollments.
   */
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/payments/${id}/`);
  },

  /**
   * GET /api/v1/payments/summary/
   */
  getSummary: async (params?: PaymentSummaryParams): Promise<PaymentSummary> => {
    const response = await apiClient.get("/payments/summary/", { params });
    return response.data;
  },
};
