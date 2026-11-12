// ============================================
// TUITION TABLES API - Tabulador por número de grupos
// ============================================
// Solo lectura: en la fase 1 el tabulador se configura en Django Admin.

import apiClient from "./client";
import type { TuitionTable } from "@/lib/types/models";

export const tuitionTablesApi = {
  /** GET /api/v1/tuition-tables/ — tabuladores activos de mi academia (sin paginar). */
  getAll: async (): Promise<TuitionTable[]> => {
    const response = await apiClient.get("/tuition-tables/");
    return response.data;
  },
};
