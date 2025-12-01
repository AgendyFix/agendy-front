// ============================================
// AUTH API SERVICE - AgendyFix
// ============================================

import apiClient from "./client";
import type {
  LoginRequest,
  LoginResponse,
  RefreshTokenRequest,
  RefreshTokenResponse,
  VerifyTokenRequest,
  UpdateProfileRequest,
  SwitchCompanyRequest,
  SwitchCompanyResponse,
} from "../types/api";
import type { User, Company } from "../types/models";

// Authentication endpoints
export const authApi = {
  /**
   * Login with username and password
   */
  login: async (data: LoginRequest): Promise<LoginResponse> => {
    const response = await apiClient.post<LoginResponse>("/auth/token/", data);
    return response.data;
  },

  /**
   * Refresh access token
   */
  refreshToken: async (data: RefreshTokenRequest): Promise<RefreshTokenResponse> => {
    const response = await apiClient.post<RefreshTokenResponse>("/auth/token/refresh/", data);
    return response.data;
  },

  /**
   * Verify token validity
   */
  verifyToken: async (data: VerifyTokenRequest): Promise<void> => {
    await apiClient.post("/auth/token/verify/", data);
  },

  /**
   * Get current user profile
   */
  getProfile: async (): Promise<User> => {
    const response = await apiClient.get<User>("/me/");
    return response.data;
  },

  /**
   * Update current user profile
   */
  updateProfile: async (data: UpdateProfileRequest): Promise<User> => {
    const response = await apiClient.patch<User>("/me/", data);
    return response.data;
  },

  /**
   * Get current company details
   */
  getCurrentCompany: async (): Promise<Company> => {
    const response = await apiClient.get<Company>("/me/company/");
    return response.data;
  },

  /**
   * Switch active company
   */
  switchCompany: async (data: SwitchCompanyRequest): Promise<SwitchCompanyResponse> => {
    const response = await apiClient.post<SwitchCompanyResponse>("/me/company/", data);
    return response.data;
  },
};

export default authApi;