// ============================================
// FEATURES API - Feature Flags
// ============================================

import { apiClient } from "./client";
import type { FeaturesResponse } from "../types/models";

export const featuresApi = {
  /**
   * Get all features for the current company
   */
  getFeatures: async (): Promise<FeaturesResponse> => {
    const response = await apiClient.get<FeaturesResponse>("/features/me/");
    return response.data;
  },
};