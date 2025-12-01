// ============================================
// EMPLOYEES API - AgendyFix
// Solo lectura + editar teams (Admin only)
// ============================================

import apiClient from "./client";
import type {
  UpdateEmployeeRequest,
  PaginatedResponse,
} from "../types/api";
import type { Employee } from "../types/models";

export const employeesApi = {
  /**
   * Get all employees with optional filters and pagination
   */
  getAll: async (params?: { search?: string; page?: number; limit?: number; offset?: number }): Promise<PaginatedResponse<Employee>> => {
    const response = await apiClient.get<PaginatedResponse<Employee>>("/employees/", { params });
    return response.data;
  },

  /**
   * Get single employee by ID
   */
  getById: async (id: string): Promise<Employee> => {
    const response = await apiClient.get<Employee>(`/employees/${id}/`);
    return response.data;
  },

  /**
   * Update employee teams only (Admin only)
   */
  updateTeams: async (id: string, data: UpdateEmployeeRequest): Promise<Employee> => {
    const response = await apiClient.patch<Employee>(`/employees/${id}/`, data);
    return response.data;
  },
};

export default employeesApi;