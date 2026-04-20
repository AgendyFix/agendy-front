// ============================================
// CLIENT CONTACTS API - AgendyFix
// ============================================

import apiClient from "./client";
import type { PaginatedResponse } from "../types/api";
import type { ClientContact, ContactRelationship } from "../types/models";

export interface ClientContactListParams {
  client?: string;                     // El más usado — contactos de un alumno específico
  relationship?: ContactRelationship;
  receive_notifications?: boolean;
  is_active?: boolean;
  search?: string;
  limit?: number;
  offset?: number;
}

export interface CreateClientContactRequest {
  client: string;                      // UUID del alumno
  phone: string;
  name?: string;
  relationship?: ContactRelationship;  // default: "self"
  receive_notifications?: boolean;     // default: true
}

export interface UpdateClientContactRequest {
  phone?: string;
  name?: string;
  relationship?: ContactRelationship;
  receive_notifications?: boolean;
}

export const clientContactsApi = {
  /**
   * Lista contactos. Filtrar por ?client=uuid para los de un alumno específico.
   */
  getAll: async (params?: ClientContactListParams): Promise<PaginatedResponse<ClientContact>> => {
    const response = await apiClient.get<PaginatedResponse<ClientContact>>("/client-contacts/", { params });
    return response.data;
  },

  /**
   * Detalle de un contacto.
   */
  getById: async (id: string): Promise<ClientContact> => {
    const response = await apiClient.get<ClientContact>(`/client-contacts/${id}/`);
    return response.data;
  },

  /**
   * Crea un contacto para un alumno existente. Solo admin.
   */
  create: async (data: CreateClientContactRequest): Promise<ClientContact> => {
    const response = await apiClient.post<ClientContact>("/client-contacts/", data);
    return response.data;
  },

  /**
   * Edita un contacto. Solo los campos enviados se actualizan. Solo admin.
   */
  update: async (id: string, data: UpdateClientContactRequest): Promise<ClientContact> => {
    const response = await apiClient.patch<ClientContact>(`/client-contacts/${id}/`, data);
    return response.data;
  },

  /**
   * Soft-delete del contacto. Solo admin.
   */
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/client-contacts/${id}/`);
  },
};

export default clientContactsApi;
