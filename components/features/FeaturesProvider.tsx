"use client";

// ============================================
// FEATURES PROVIDER - Load feature flags on mount
// ============================================

import { useEffect } from "react";
import { useFeatures } from "@/lib/hooks/useFeatures";
import { useAuth } from "@/lib/hooks/useAuth";

export function FeaturesProvider({ children }: { children: React.ReactNode }) {
  const { fetchFeatures } = useFeatures();
  const { isAuthenticated, currentCompany } = useAuth();

  useEffect(() => {
    // Only fetch features if user is authenticated and has a company
    if (isAuthenticated && currentCompany) {
      fetchFeatures().catch((error) => {
        console.error("Error loading feature flags:", error);
      });
    }
  }, [isAuthenticated, currentCompany, fetchFeatures]);

  return <>{children}</>;
}