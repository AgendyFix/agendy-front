// ============================================
// EMPLOYEES / INSTRUCTORS API
// ============================================

import apiClient from "./client";
import type { PaginatedResponse } from "../types/api";
import type { Employee } from "../types/models";

export interface EmployeeListParams {
  search?: string;
  role?: "admin" | "operator";
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
   * PATCH /api/v1/employees/{id}/
   * Solo permite editar specialty (Admin only).
   */
  updateSpecialty: async (id: string, specialty: string): Promise<Employee> => {
    const response = await apiClient.patch<Employee>(`/employees/${id}/`, { specialty });
    return response.data;
  },
};

export default employeesApi;