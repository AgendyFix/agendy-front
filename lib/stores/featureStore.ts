// ============================================
// FEATURE FLAGS STORE - Zustand
// ============================================

import { create } from "zustand";
import { featuresApi } from "../api/features";
import type { Feature } from "../types/models";

interface FeatureState {
  features: Feature[];
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchFeatures: () => Promise<void>;
  isFeatureEnabled: (slug: string) => boolean;
  getFeatureConfig: <T = Record<string, unknown>>(slug: string) => T | null;
  clearError: () => void;
}

export const useFeatureStore = create<FeatureState>((set, get) => ({
  features: [],
  isLoading: false,
  error: null,

  fetchFeatures: async () => {
    try {
      set({ isLoading: true, error: null });

      const response = await featuresApi.getFeatures();

      set({
        features: response.features,
        isLoading: false,
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Error al cargar feature flags";
      set({
        error: errorMessage,
        isLoading: false,
      });
      throw error;
    }
  },

  isFeatureEnabled: (slug: string): boolean => {
    const { features } = get();
    const feature = features.find((f) => f.slug === slug);
    return feature?.is_enabled ?? false;
  },

  getFeatureConfig: <T = Record<string, unknown>>(slug: string): T | null => {
    const { features } = get();
    const feature = features.find((f) => f.slug === slug);
    return feature?.config as T ?? null;
  },

  clearError: () => {
    set({ error: null });
  },
}));