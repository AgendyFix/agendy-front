// ============================================
// TEAMS API - AgendyFix
// ============================================

import apiClient from "./client";
import type {
  CreateTeamRequest,
  UpdateTeamRequest,
  PaginatedResponse,
} from "../types/api";
import type { Team } from "../types/models";

export const teamsApi = {
  /**
   * Get all teams with optional filters and pagination
   */
  getAll: async (params?: { search?: string; page?: number; limit?: number; offset?: number }): Promise<PaginatedResponse<Team>> => {
    const response = await apiClient.get<PaginatedResponse<Team>>("/teams/", { params });
    return response.data;
  },

  /**
   * Get single team by ID
   */
  getById: async (id: string): Promise<Team> => {
    const response = await apiClient.get<Team>(`/teams/${id}/`);
    return response.data;
  },

  /**
   * Create new team (Admin only)
   */
  create: async (data: CreateTeamRequest): Promise<Team> => {
    const response = await apiClient.post<Team>("/teams/", data);
    return response.data;
  },

  /**
   * Update existing team (Admin only)
   */
  update: async (id: string, data: UpdateTeamRequest): Promise<Team> => {
    const response = await apiClient.patch<Team>(`/teams/${id}/`, data);
    return response.data;
  },

  /**
   * Delete team (soft delete) (Admin only)
   */
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/teams/${id}/`);
  },
};

export default teamsApi;