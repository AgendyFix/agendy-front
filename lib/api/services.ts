// ============================================
// SERVICES API - AgendyFix
// ============================================

import apiClient from "./client";
import type {
  CreateServiceRequest,
  UpdateServiceRequest,
  ServiceListParams,
  PaginatedResponse,
} from "../types/api";
import type { Service } from "../types/models";

export const servicesApi = {
  /**
   * Get all services with optional filters and pagination
   */
  getAll: async (params?: ServiceListParams & { page?: number }): Promise<PaginatedResponse<Service>> => {
    const response = await apiClient.get<PaginatedResponse<Service>>("/services/", { params });
    return response.data;
  },

  /**
   * Get single service by ID
   */
  getById: async (id: string): Promise<Service> => {
    const response = await apiClient.get<Service>(`/services/${id}/`);
    return response.data;
  },

  /**
   * Create new service
   */
  create: async (data: CreateServiceRequest): Promise<Service> => {
    const response = await apiClient.post<Service>("/services/", data);
    return response.data;
  },

  /**
   * Update existing service
   */
  update: async (id: string, data: UpdateServiceRequest): Promise<Service> => {
    const response = await apiClient.patch<Service>(`/services/${id}/`, data);
    return response.data;
  },

  /**
   * Delete service (soft delete)
   */
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/services/${id}/`);
  },
};

export default servicesApi;