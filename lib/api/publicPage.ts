// ============================================
// PUBLIC PAGE API - AgendyFix
// Datos de la página pública de la academia (panel)
// ============================================

import apiClient from "./client";
import type { PublicPageSettings, PublicPageUpdate } from "../types/models";

export const publicPageApi = {
  get: async (): Promise<PublicPageSettings> => {
    const response = await apiClient.get<PublicPageSettings>("/me/company/public-page/");
    return response.data;
  },

  update: async (data: Partial<PublicPageUpdate>): Promise<PublicPageSettings> => {
    const response = await apiClient.patch<PublicPageSettings>("/me/company/public-page/", data);
    return response.data;
  },
};
