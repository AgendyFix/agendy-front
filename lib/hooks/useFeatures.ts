// ============================================
// USE FEATURES HOOK
// ============================================

import { useFeatureStore } from "../stores/featureStore";

export const useFeatures = () => {
  const { features, isLoading, error, fetchFeatures, isFeatureEnabled, getFeatureConfig, clearError } = useFeatureStore();

  return {
    features,
    isLoading,
    error,
    fetchFeatures,
    isFeatureEnabled,
    getFeatureConfig,
    clearError,
  };
};