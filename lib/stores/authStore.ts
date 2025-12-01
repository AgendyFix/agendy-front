// ============================================
// AUTH STORE - Zustand
// ============================================

import { create } from "zustand";
import { authApi } from "../api/auth";
import { setTokens, clearTokens } from "../api/client";
import type { User, CompanyBasic } from "../types/models";
import type { LoginRequest } from "../types/api";

interface AuthState {
  user: User | null;
  currentCompany: CompanyBasic | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  login: (credentials: LoginRequest) => Promise<void>;
  logout: () => void;
  fetchProfile: () => Promise<void>;
  updateProfile: (data: { first_name?: string; last_name?: string; email?: string }) => Promise<void>;
  switchCompany: (companyId: string) => Promise<void>;
  setError: (error: string | null) => void;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  currentCompany: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  login: async (credentials: LoginRequest) => {
    try {
      set({ isLoading: true, error: null });

      // Login and get tokens
      const { access, refresh } = await authApi.login(credentials);
      setTokens(access, refresh);

      // Fetch user profile
      const user = await authApi.getProfile();

      set({
        user,
        currentCompany: user.current_company,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Error al iniciar sesión";
      set({
        error: errorMessage,
        isLoading: false,
        isAuthenticated: false,
      });
      throw error;
    }
  },

  logout: () => {
    clearTokens();
    set({
      user: null,
      currentCompany: null,
      isAuthenticated: false,
      error: null,
    });

    // Redirect to login
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
  },

  fetchProfile: async () => {
    try {
      set({ isLoading: true, error: null });

      const user = await authApi.getProfile();

      set({
        user,
        currentCompany: user.current_company,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Error al cargar el perfil";
      set({
        error: errorMessage,
        isLoading: false,
        isAuthenticated: false,
      });
      throw error;
    }
  },

  updateProfile: async (data) => {
    try {
      set({ isLoading: true, error: null });

      const updatedUser = await authApi.updateProfile(data);

      set({
        user: updatedUser,
        isLoading: false,
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Error al actualizar el perfil";
      set({
        error: errorMessage,
        isLoading: false,
      });
      throw error;
    }
  },

  switchCompany: async (companyId: string) => {
    try {
      set({ isLoading: true, error: null });

      // Switch company on backend
      await authApi.switchCompany({ company_id: companyId });

      // Fetch updated profile with new current_company
      const updatedUser = await authApi.getProfile();

      // Update state - React will automatically re-render all components
      set({
        user: updatedUser,
        currentCompany: updatedUser.current_company,
        isLoading: false,
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Error al cambiar de company";
      set({
        error: errorMessage,
        isLoading: false,
      });
      throw error;
    }
  },

  setError: (error: string | null) => {
    set({ error });
  },

  clearError: () => {
    set({ error: null });
  },
}));