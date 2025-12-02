// ============================================
// METABASE API - AgendyFix
// ============================================

import apiClient from "./client";

interface MetabaseDashboardResponse {
  iframe_url: string;
  expires_in: number;
  current_company: {
    id: string;
    name: string;
  };
  dashboard_id: string;
  filters: {
    company: string[];
    fecha: string;
  };
}

export const metabaseApi = {
  /**
   * Get Metabase dashboard iframe URL
   */
  getDashboard: async (params?: { 
    dashboard_id?: string; 
    date_filter?: string;
  }): Promise<MetabaseDashboardResponse> => {
    const response = await apiClient.get<MetabaseDashboardResponse>("/metabase/dashboard/", { 
      params: {
        dashboard_id: params?.dashboard_id || "2",
        date_filter: params?.date_filter || "thisyear",
      }
    });
    return response.data;
  },
};

export default metabaseApi;