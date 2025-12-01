// ============================================
// CLIENTS API - AgendyFix
// ============================================

import apiClient from "./client";
import type {
  CreateClientRequest,
  UpdateClientRequest,
  PaginatedResponse,
} from "../types/api";
import type { Client } from "../types/models";

export const clientsApi = {
  /**
   * Get all clients with optional filters and pagination
   */
  getAll: async (params?: { search?: string; page?: number; limit?: number; offset?: number }): Promise<PaginatedResponse<Client>> => {
    const response = await apiClient.get<PaginatedResponse<Client>>("/clients/", { params });
    return response.data;
  },

  /**
   * Get single client by ID
   */
  getById: async (id: string): Promise<Client> => {
    const response = await apiClient.get<Client>(`/clients/${id}/`);
    return response.data;
  },

  /**
   * Create new client
   */
  create: async (data: CreateClientRequest): Promise<Client> => {
    const response = await apiClient.post<Client>("/clients/", data);
    return response.data;
  },

  /**
   * Update existing client
   */
  update: async (id: string, data: UpdateClientRequest): Promise<Client> => {
    const response = await apiClient.patch<Client>(`/clients/${id}/`, data);
    return response.data;
  },

  /**
   * Delete client (soft delete)
   */
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/clients/${id}/`);
  },
};

export default clientsApi;