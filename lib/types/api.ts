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

// Client Groups
export interface CreateClientGroupRequest {
  name: string;
  description?: string;
  client_ids?: string[]; // Array of client UUIDs
}

export interface UpdateClientGroupRequest extends Partial<CreateClientGroupRequest> {}

export interface UpdateClientGroupMembersRequest {
  action: 'add' | 'remove';
  client_ids: string[];
}

export interface ClientGroupListParams {
  search?: string;
  ordering?: string;
  is_active?: boolean;
  limit?: number;
  offset?: number;
}

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
  advance_payment?: string; // Decimal field for advance payment
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

// ============================================
// REMINDERS
// ============================================

export interface CreateReminderRequest {
  channel: 'whatsapp' | 'email' | 'sms';
  reminder_type: 'appointment' | 'custom' | 'promotional' | 'follow_up';
  client?: string; // UUID (XOR con client_group)
  client_group?: string; // UUID (XOR con client)
  phone_number?: string; // Required para whatsapp/sms si es individual
  email?: string; // Required para email si es individual
  appointment?: string; // UUID opcional
  
  // Template OR message (XOR)
  template?: string; // UUID del template
  template_variables?: Record<string, string>; // Variables del template {"1": "valor1", "2": "valor2"}
  message?: string; // Mensaje personalizado (solo si no usa template)
  
  scheduled_at: string; // ISO 8601
  recurrence?: 'once' | 'daily' | 'weekly' | 'monthly';
  recurrence_weekday?: 0 | 1 | 2 | 3 | 4 | 5 | 6; // Required para weekly
  recurrence_time?: string; // HH:MM:SS - Required para recurrentes
  recurrence_end_date?: string; // YYYY-MM-DD - Opcional
}

export interface UpdateReminderRequest {
  message?: string;
  scheduled_at?: string;
  recurrence_end_date?: string;
}

export interface ReminderListParams {
  status?: 'pending' | 'sent' | 'failed' | 'cancelled';
  channel?: 'whatsapp' | 'email' | 'sms';
  reminder_type?: 'appointment' | 'custom' | 'promotional' | 'follow_up';
  client?: string;
  client_group?: string;
  appointment?: string;
  ordering?: string;
  limit?: number;
  offset?: number;
}

export interface ReminderHistoryParams {
  channel?: 'whatsapp' | 'email' | 'sms';
  status?: 'sent' | 'failed';
  date_from?: string; // YYYY-MM-DD
  date_to?: string; // YYYY-MM-DD
  client?: string;
  client_group?: string;
  exclude_bulk_children?: boolean;
  limit?: number;
  offset?: number;
}

// Master info for recurrence masters
export interface MasterInfo {
  id: string;
  type: 'recurrence_master' | 'bulk_reminder';
  recurrence: string;
  recurrence_display: string;
  recurrence_description: string;
  client_group: string | null;
  client: string | null;
  message: string;
  scheduled_at: string;
  last_occurrence_date: string | null;
  recurrence_end_date: string | null;
  total_instances: number;
}

// Bulk reminder info (legacy, for bulk reminders)
export interface BulkReminderInfo {
  id: string;
  client_group: string;
  message: string;
  sent_at: string | null;
  stats: {
    total_clients: number;
    sent: number;
    failed: number;
    skipped: number;
  };
}

export interface ReminderChildrenResponse {
  count: number;
  next: string | null;
  previous: string | null;
  master_info?: MasterInfo; // New: for recurrence masters
  bulk_reminder?: BulkReminderInfo; // Legacy: for bulk reminders
  results: Array<{
    id: number;
    channel: string;
    channel_display: string;
    reminder_type: string;
    reminder_type_display: string;
    status: string;
    status_display: string;
    client: string | null;
    client_name: string | null;
    client_group: string | null;
    is_bulk: boolean;
    is_recurring: boolean;
    phone_number: string;
    email: string;
    scheduled_at: string;
    sent_at: string | null;
    recurrence: string;
    recurrence_display: string;
    recurrence_description: string;
    company: string;
    company_name: string;
    is_active: boolean;
    created_at: string;
  }>;
}

export interface SendNowResponse {
  detail: string;
  reminder_id: string;
}

export interface CancelReminderResponse {
  detail: string;
  reminder_id: string;
}

// ============================================
// WHATSAPP TEMPLATES
// ============================================

export interface TemplateListParams {
  category?: string;
  status?: 'pending' | 'approved' | 'rejected';
  search?: string;
  limit?: number;
  offset?: number;
}

export interface TemplatePreviewRequest {
  variables: Record<string, string>; // {"1": "valor1", "2": "valor2"}
}

export interface TemplatePreviewResponse {
  template_id: string;
  template_name: string;
  template_display_name: string;
  variables: Record<string, string>;
  rendered_message: string;
}

// ============================================
// ACADEMY MODULE
// ============================================

export interface CreateScheduleInput {
  day_of_week: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  start_time: string; // "HH:MM"
  end_time: string;   // "HH:MM"
}

export interface CreateClassGroupRequest {
  name: string;
  level?: 'all' | 'beginner' | 'intermediate' | 'advanced';
  monthly_fee: number;
  instructor?: string; // UUID (optional)
  schedules?: CreateScheduleInput[];
}

export interface UpdateClassGroupRequest extends Partial<CreateClassGroupRequest> {}

export interface ClassGroupListParams {
  level?: 'all' | 'beginner' | 'intermediate' | 'advanced';
  instructor?: string; // UUID del empleado instructor
  search?: string;
  ordering?: string;
  limit?: number;
  offset?: number;
}

export interface CreateEnrollmentRequest {
  client: string;      // UUID
  class_group: string; // UUID
  start_date: string;  // YYYY-MM-DD
  notes?: string;
}

export interface UpdateEnrollmentRequest {
  status?: 'active' | 'paused' | 'dropped';
  start_date?: string;
  notes?: string;
  custom_billing_day?: number | null;  // null = revertir al día de start_date
}

export interface EnrollmentListParams {
  class_group?: string;
  client?: string;
  status?: 'active' | 'paused' | 'dropped';
  search?: string;
  limit?: number;
  offset?: number;
}

export interface CreatePaymentRequest {
  enrollment: string;           // UUID
  payment_method?: 'cash' | 'card' | 'transfer' | 'other';
  payment_date?: string;        // YYYY-MM-DD (default: hoy)
}

export interface UpdatePaymentRequest {
  payment_method?: 'cash' | 'card' | 'transfer' | 'other';
  payment_date?: string; // YYYY-MM-DD
}

export interface PaymentListParams {
  status?: 'paid' | 'overdue' | 'waived';
  enrollment?: string;
  enrollment__client?: string;  // Todos los pagos de un cliente
  payment_method?: 'cash' | 'card' | 'transfer' | 'other';
  payment_date__month?: number; // Filtrar por mes (1-12)
  payment_date__year?: number;  // Filtrar por año
  search?: string;
  ordering?: string;
  limit?: number;
  offset?: number;
}

export interface PaymentSummaryParams {
  year?: number;
  month?: number;
}