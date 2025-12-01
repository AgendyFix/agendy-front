// ============================================
// API RESPONSE TYPES - AgendyFix
// ============================================

import type { 
  User, 
  Company, 
  Service, 
  Client, 
  Team, 
  Employee, 
  Appointment,
  Note 
} from "./models";

// Authentication
export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  access: string;
  refresh: string;
}

export interface RefreshTokenRequest {
  refresh: string;
}

export interface RefreshTokenResponse {
  access: string;
}

export interface VerifyTokenRequest {
  token: string;
}

// User Profile
export interface UpdateProfileRequest {
  first_name?: string;
  last_name?: string;
  email?: string;
}

export interface SwitchCompanyRequest {
  company_id: string;
}

export interface SwitchCompanyResponse {
  detail: string;
  company: Company;
}

// Services
export interface CreateServiceRequest {
  name: string;
  description?: string;
  price: string;
  duration_minutes: number;
  buffer_minutes?: number;
  is_active?: boolean;
  is_bookable_online?: boolean;
}

export interface UpdateServiceRequest extends Partial<CreateServiceRequest> {}

export interface ServiceListParams {
  search?: string;
  ordering?: string;
  is_bookable_online?: boolean;
}

// Clients
export interface CreateClientRequest {
  name: string;
  last_name: string;
  email?: string;
  phone?: string;
}

export interface UpdateClientRequest extends Partial<CreateClientRequest> {}

// Teams
export interface CreateTeamRequest {
  name: string;
  description?: string;
}

export interface UpdateTeamRequest extends Partial<CreateTeamRequest> {}

// Employees
export interface UpdateEmployeeRequest {
  teams?: string[]; // Array of team IDs
}

// Appointments
export interface CreateAppointmentRequest {
  client: string; // UUID
  service?: string; // UUID (optional)
  custom_service_description?: string;
  start_at: string; // ISO datetime
  end_at?: string; // ISO datetime (auto-calculated if null)
  title?: string;
  description?: string;
  team?: string; // UUID
  assigned_to?: string; // Employee UUID
  location?: string;
  estimated_price?: string;
  client_notes?: string;
  status?: "pending" | "confirmed" | "in_progress" | "completed" | "cancelled" | "rejected";
}

export interface UpdateAppointmentRequest extends Partial<CreateAppointmentRequest> {}

export interface UpdateAppointmentStatusRequest {
  status: "pending" | "confirmed" | "in_progress" | "completed" | "cancelled" | "rejected";
}

export interface AppointmentCalendarParams {
  month?: string; // Format: "2024-01"
  start_date?: string; // Format: "2024-01-01"
  end_date?: string; // Format: "2024-03-31"
}

// Notes
export interface CreateNoteRequest {
  title?: string;
  description?: string;
  media?: File;
  is_internal: boolean;
}

export interface UpdateNoteRequest extends Partial<CreateNoteRequest> {}

// Generic List Response
export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

// API Error Response
export interface APIError {
  detail?: string;
  [key: string]: any;
}