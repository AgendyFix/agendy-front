// ============================================
// EMPLOYEES / INSTRUCTORS API
// ============================================

import apiClient from "./client";
import type { PaginatedResponse } from "../types/api";
import type { CreateEmployeeRequest, UpdateEmployeeRequest } from "../types/api";
import type { Employee } from "../types/models";

export interface EmployeeListParams {
  search?: string;
  role?: "admin" | "instructor";
  is_active?: boolean;
  limit?: number;
  offset?: number;
}

export const employeesApi = {
  /**
   * GET /api/v1/employees/
   */
  getAll: async (params?: EmployeeListParams): Promise<PaginatedResponse<Employee>> => {
    const response = await apiClient.get<PaginatedResponse<Employee>>("/employees/", { params });
    return response.data;
  },

  /**
   * GET /api/v1/employees/{id}/
   */
  getById: async (id: string): Promise<Employee> => {
    const response = await apiClient.get<Employee>(`/employees/${id}/`);
    return response.data;
  },

  /**
   * POST /api/v1/employees/
   * Crear instructor. Solo admins. Se requiere email o phone.
   */
  create: async (data: CreateEmployeeRequest): Promise<Employee> => {
    const response = await apiClient.post<Employee>("/employees/", data);
    return response.data;
  },

  /**
   * PATCH /api/v1/employees/{id}/
   * Editar phone y/o specialty. Solo admins.
   */
  update: async (id: string, data: UpdateEmployeeRequest): Promise<Employee> => {
    const response = await apiClient.patch<Employee>(`/employees/${id}/`, data);
    return response.data;
  },

  /**
   * @deprecated Usar update() con { specialty }
   */
  updateSpecialty: async (id: string, specialty: string): Promise<Employee> => {
    const response = await apiClient.patch<Employee>(`/employees/${id}/`, { specialty });
    return response.data;
  },

  /**
   * DELETE /api/v1/employees/{id}/
   * Marca el employee como is_active: false. Solo admins.
   */
  deactivate: async (id: string): Promise<void> => {
    await apiClient.delete(`/employees/${id}/`);
  },
};

export default employeesApi;
