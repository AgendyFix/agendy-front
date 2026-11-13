// ============================================
// TUITION TABLES API - Paquetes (precio por número de grupos)
// ============================================

import apiClient from "./client";
import type { TuitionTable, TuitionTier } from "@/lib/types/models";

export interface SaveTuitionTableRequest {
  name?: string;
  tiers?: TuitionTier[];
}

export const tuitionTablesApi = {
  /** GET /api/v1/tuition-tables/ — paquetes de mi academia (sin paginar). */
  getAll: async (): Promise<TuitionTable[]> => {
    const response = await apiClient.get("/tuition-tables/");
    return response.data;
  },

  getById: async (id: string): Promise<TuitionTable> => {
    const response = await apiClient.get(`/tuition-tables/${id}/`);
    return response.data;
  },

  /** POST /api/v1/tuition-tables/ (solo admin) */
  create: async (data: Required<SaveTuitionTableRequest>): Promise<TuitionTable> => {
    const response = await apiClient.post("/tuition-tables/", data);
    return response.data;
  },

  /** PATCH — con alumnos, los escalones nuevos aplican desde el 1.º del mes siguiente. */
  update: async (id: string, data: SaveTuitionTableRequest): Promise<TuitionTable> => {
    const response = await apiClient.patch(`/tuition-tables/${id}/`, data);
    return response.data;
  },

  /** DELETE — solo sin grupos ligados. */
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/tuition-tables/${id}/`);
  },
};
