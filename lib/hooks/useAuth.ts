// ============================================
// useAuth HOOK - Custom hook for authentication
// ============================================

import { useAuthStore } from "../stores/authStore";

export const useAuth = () => {
  const {
    user,
    currentCompany,
    isAuthenticated,
    isLoading,
    error,
    login,
    logout,
    fetchProfile,
    updateProfile,
    switchCompany,
    setError,
    clearError,
  } = useAuthStore();

  return {
    user,
    currentCompany,
    isAuthenticated,
    isLoading,
    error,
    login,
    logout,
    fetchProfile,
    updateProfile,
    switchCompany,
    setError,
    clearError,
  };
};