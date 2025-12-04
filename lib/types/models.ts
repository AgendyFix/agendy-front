// ============================================
// MODELS - AgendyFix Frontend Types
// ============================================

export interface User {
  id: string;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  companies: CompanyBasic[];
  employee_profiles: EmployeeProfile[];
  current_company: CompanyBasic | null;
}

export interface CompanyBasic {
  id: string;
  name: string;
  is_active: boolean;
}

export interface Company extends CompanyBasic {
  description?: string;
  address?: string;
  phone?: string;
  email?: string;
  created_at: string;
  updated_at: string;
}

export interface EmployeeProfile {
  id: string;
  full_name: string;
  company: string;
  role: "admin" | "operator";
  teams_names: string[];
}

export interface Employee {
  id: string;
  full_name: string;
  email: string;
  role: "admin" | "operator";
  company: string; // UUID
  company_name: string;
  teams_count: number;
  is_active: boolean;
  created_at: string;
  // Estos campos solo vienen en el detail
  first_name?: string;
  last_name?: string;
  username?: string;
  teams?: TeamBasic[];
  teams_names?: string[];
}

export interface Service {
  id: string;
  name: string;
  description?: string;
  price: string;
  duration_minutes: number;
  buffer_minutes: number;
  total_duration: number;
  is_active: boolean;
  is_bookable_online: boolean;
  company: string; // UUID
  company_name: string;
  created_at: string;
  updated_at?: string;
}

export interface Client {
  id: string;
  name: string;
  last_name: string;
  full_name: string;
  email?: string;
  phone?: string;
  company: CompanyBasic;
  total_appointments: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface TeamBasic {
  id: string;
  name: string;
}

export interface Team extends TeamBasic {
  description?: string;
  company: CompanyBasic;
  employee_count: number;
  employees_list: EmployeeBasic[];
  is_active: boolean;
}

export interface EmployeeBasic {
  id: string;
  full_name: string;
  role: "admin" | "operator";
  email: string;
}

export type AppointmentStatus =
  | "pending"
  | "confirmed"
  | "in_progress"
  | "completed"
  | "cancelled"
  | "rejected";

export type AppointmentSource = "manual" | "online" | "phone";

export interface Appointment {
  id: string;
  title?: string | null;
  description?: string;
  client_notes?: string;
  start_at: string;
  end_at: string;
  duration_minutes?: number;
  status: AppointmentStatus;
  status_display: string;
  source: AppointmentSource;
  source_display?: string;
  company?: string; // UUID
  service?: string | Service | null; // UUID en lista, objeto en detalle
  service_name: string;
  custom_service_description?: string;
  client: string | Client; // UUID en lista, objeto en detalle
  client_name: string;
  team?: TeamBasic | null;
  assigned_to?: EmployeeBasic | null; // Solo en detalle
  assigned_to_name?: string | null; // En lista
  location?: string;
  estimated_price?: string | null;
  client_name_snapshot?: string;
  client_phone_snapshot?: string;
  service_name_snapshot?: string;
  confirmation_code?: string;
  notes?: Note[];
  notes_count?: number;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
}

export interface Note {
  id: string;
  title?: string;
  description?: string;
  media?: string;
  author: string;
  author_name: string;
  is_internal: boolean;
  created_at: string;
  updated_at: string;
}

// Calendar types
export interface CalendarAppointment {
  id: string;
  title: string;
  start: Date;
  end: Date;
  client_name: string;
  service_name: string;
  status: AppointmentStatus;
}