// ============================================
// NOVEDADES API - AgendyFix
// Changelog de producto para admins ("Novedades")
// ============================================

import apiClient from "./client";

/**
 * Una entrada de novedad/changelog publicada por el equipo de producto.
 */
export interface ProductUpdate {
  id: number;
  title: string;
  body: string;
  version: string | null;
  published_at: string;
}

export interface NovedadesResponse {
  unseen: number;
  results: ProductUpdate[];
}

export const novedadesApi = {
  /**
   * Lista las novedades publicadas y cuántas no ha visto el usuario actual.
   */
  list: async (): Promise<NovedadesResponse> => {
    const response = await apiClient.get<NovedadesResponse>("/novedades/");
    return response.data;
  },

  /**
   * Marca todas las novedades como vistas (limpia el badge).
   */
  markSeen: async (): Promise<void> => {
    await apiClient.post("/novedades/mark-seen/");
  },
};

export default novedadesApi;
