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
  specialty?: string;       // Especialidad editable (ej: "Salsa y Bachata")
  company: string;          // UUID en lista
  company_name: string;
  teams_count: number;
  is_active: boolean;
  created_at: string;
  // Solo vienen en el detail
  first_name?: string;
  last_name?: string;
  username?: string;
  updated_at?: string;
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

export interface ClientBasic {
  id: string;
  name: string;
  last_name: string;
  full_name: string;
  email?: string;
  phone?: string;
}

export interface ClientGroup {
  id: string; // UUID
  name: string;
  description?: string;
  member_count: number;
  company: CompanyBasic;
  company_name?: string;
  created_by: EmployeeBasic | null;
  created_by_name?: string;
  clients_list?: ClientBasic[]; // Campo correcto del API
  metadata?: Record<string, any>;
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
  advance_payment?: string | null; // NUEVO: Anticipo pagado
  balance_due?: string | null; // NUEVO: Saldo pendiente (calculado)
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

// ============================================
// NOTIFICATIONS
// ============================================

export type NotificationType =
  | "appointment_created"
  | "appointment_updated"
  | "appointment_cancelled"
  | "appointment_confirmed";

export interface NotificationMetadata {
  appointment_id?: string;
  appointment_title?: string;
  client_name?: string;
  service_name?: string;
  start_at?: string;
  status?: AppointmentStatus;
  [key: string]: any; // Para futuros campos adicionales
}

export interface Notification {
  id: number;
  notification_type: NotificationType;
  notification_type_display: string;
  title: string;
  description: string;
  metadata: NotificationMetadata;
  is_read: boolean;
  company: string; // UUID en lista
  company_name: string;
  user: number;
  user_name: string;
  created_at: string;
  updated_at: string;
}

export interface NotificationDetail extends Omit<Notification, 'company' | 'user'> {
  company: {
    id: string;
    name: string;
  };
  user: {
    id: number;
    username: string;
    email: string;
    first_name: string;
    last_name: string;
    full_name: string;
    is_active: boolean;
    date_joined: string;
  };
  status: string;
  datetime_notification: string | null;
}

// WebSocket message types
export interface WSConnectionMessage {
  type: "connection_established";
  message: string;
}

export interface WSNotificationMessage {
  type: "notification";
  data: Notification;
}

export type WSMessage = WSConnectionMessage | WSNotificationMessage;

// ============================================
// REMINDERS
// ============================================

export type ReminderChannel = 'whatsapp' | 'email' | 'sms';
export type ReminderType = 'appointment' | 'custom' | 'promotional' | 'follow_up';
export type ReminderStatus = 'pending' | 'sent' | 'failed' | 'cancelled';
export type ReminderRecurrence = 'once' | 'daily' | 'weekly' | 'monthly';
export type ReminderWeekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export interface ReminderClientDetail {
  id: string;
  name: string;
  last_name: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  is_active: boolean;
  company: CompanyBasic;
  total_appointments: number;
  created_at: string;
  updated_at: string;
}

export interface ReminderClientGroup {
  id: string;
  name: string;
  member_count: number;
}

export interface ReminderAppointment {
  id: string;
  title: string;
  start_at: string;
}

export interface BulkStats {
  total_clients: number;
  sent: number;
  failed: number;
  skipped: number;
}

export interface ReminderMetadata {
  bulk_stats?: BulkStats;
  bulk_reminder_id?: string;
  client_group_id?: string;
  client_group_name?: string;
  auto_created?: boolean;
  hours_before?: number;
  [key: string]: any;
}

export interface Reminder {
  // Identificación
  id: number | string;
  company: string | CompanyBasic; // UUID en lista, objeto en detalle
  company_name?: string;
  
  // Configuración
  channel: ReminderChannel;
  channel_display: string;
  reminder_type: ReminderType;
  reminder_type_display: string;
  
  // Destinatario (XOR: client O client_group)
  client: string | ReminderClientDetail | null; // UUID en lista, objeto en detalle
  client_name?: string | null;
  client_group: string | ClientGroup | null; // UUID en lista, objeto en detalle
  client_group_name?: string | null;
  
  // Contacto
  phone_number?: string;
  email?: string;
  
  // Relación opcional
  appointment: ReminderAppointment | null;
  
  // Contenido (template O message)
  template: string | WhatsAppTemplate | null; // UUID en lista, objeto en detalle
  template_name: string | null; // Nombre del template
  template_variables: Record<string, string> | null; // Variables del template
  uses_template: boolean; // Indica si usa template
  message: string; // Mensaje personalizado o vacío si usa template
  final_message: string | null; // Mensaje renderizado (solo en detail)
  
  // Programación
  scheduled_at: string;
  sent_at: string | null;
  
  // Recurrencia
  recurrence: ReminderRecurrence;
  recurrence_display: string;
  recurrence_weekday: ReminderWeekday | null;
  recurrence_weekday_display: string | null;
  recurrence_time: string | null;
  recurrence_end_date: string | null;
  recurrence_description: string;
  is_recurrence_master: boolean;
  last_occurrence_date: string | null;
  
  // Estado
  status: ReminderStatus;
  status_display: string;
  
  // Propiedades computadas
  is_bulk: boolean;
  is_recurring: boolean;
  target_count: number;
  
  // Metadata
  metadata?: ReminderMetadata;
  
  // Resultado
  response_data: any | null;
  error_message: string | null;
  
  // Auditoría
  created_by: Employee | null; // Objeto completo en detalle
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface RecipientInfo {
  id: string; // UUID del cliente
  name: string;
  phone: string;
  email: string;
  has_contact?: boolean; // Solo para pending
  status: 'pending' | 'sent' | 'failed';
  sent_at?: string | null; // Solo para sent
  error_message?: string | null; // Solo para failed
}

export interface RecipientsData {
  status: 'pending' | 'sent' | 'failed' | 'mixed';
  total: number;
  list: RecipientInfo[];
}

export interface ReminderChild {
  id: number;
  channel: ReminderChannel;
  channel_display: string;
  reminder_type: ReminderType;
  reminder_type_display: string;
  status: string;
  status_display: string;
  client: string; // UUID
  client_name: string;
  client_group: string | null;
  client_group_name?: string | null;
  is_bulk: boolean;
  is_recurring: boolean;
  phone_number: string;
  email: string;
  scheduled_at: string;
  sent_at: string | null;
  recurrence: ReminderRecurrence;
  recurrence_display: string;
  recurrence_description: string;
  company: string; // UUID
  company_name: string;
  is_active: boolean;
  created_at: string;
  error_message?: string | null;
  response_data?: any | null;
  recipients?: RecipientsData; // Información de destinatarios
}

// ============================================
// FEATURE FLAGS
// ============================================

export interface FeatureDashboardConfig {
  id: string;
  name: string;
  description: string;
}

export interface FeatureMetabaseConfig {
  dashboards: Record<string, FeatureDashboardConfig>;
  active_dashboard: string;
}

export interface FeatureConfig {
  dashboards?: Record<string, FeatureDashboardConfig>;
  active_dashboard?: string;
  [key: string]: any;
}

export interface Feature {
  slug: string;
  name: string;
  description: string;
  is_enabled: boolean;
  config: FeatureConfig;
}

export interface FeaturesResponse {
  features: Feature[];
}

// ============================================
// WHATSAPP TEMPLATES
// ============================================

export type TemplateCategoryType = 'appointment' | 'promotion' | 'reminder' | 'follow_up' | 'other';
export type TemplateStatus = 'pending' | 'approved' | 'rejected';

export interface TemplateVariableMetadata {
  name: string;
  description: string;
  example: string;
}

export interface WhatsAppTemplate {
  id: string;
  name: string;
  display_name: string;
  description: string;
  body: string;
  category: TemplateCategoryType;
  category_display: string;
  status: TemplateStatus;
  status_display: string;
  is_approved: boolean;
  variable_count: number;
  variable_names: string[];
  variables_metadata: Record<string, TemplateVariableMetadata>;
  companies_count?: number;
  metadata?: Record<string, unknown>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface TemplateCategoryOption {
  value: string;
  label: string;
  count: number;
}

// ============================================
// ACADEMY MODULE
// ============================================

export type ClassGroupLevel = 'all' | 'beginner' | 'intermediate' | 'advanced';

export interface ClassSchedule {
  id: number;
  day_of_week: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  day_of_week_display: string;
  start_time: string; // HH:MM:SS
  end_time: string;   // HH:MM:SS
}

export interface ClassGroup {
  id: string;
  name: string;
  level: ClassGroupLevel;
  level_display: string;
  monthly_fee: number;
  instructor_id: string | null;
  instructor_name: string | null;
  schedules: ClassSchedule[];
  schedule_display: string;
  active_enrollment_count: number;
  company: string;
  company_name: string;
  metadata: Record<string, unknown>;
  is_active: boolean;
  created_at: string;
}

export type EnrollmentStatus = 'active' | 'paused' | 'dropped';

export interface Enrollment {
  id: string;
  client: string;           // UUID en lista
  client_name: string;
  client_phone: string;
  class_group: string;      // UUID en lista
  class_group_name: string;
  status: EnrollmentStatus;
  status_display: string;
  billing_day: number;          // Día del mes efectivo (solo lectura, calculado)
  custom_billing_day: number | null; // null = usa start_date.day
  monthly_fee: number;          // Solo lectura, hereda del grupo
  start_date: string;           // YYYY-MM-DD
  notes?: string;
  is_active: boolean;
  created_at: string;
}

export type PaymentStatus = 'paid' | 'overdue' | 'waived';
export type PaymentMethod = 'cash' | 'card' | 'transfer' | 'other';

export interface Payment {
  id: string;
  enrollment: string;       // UUID
  client_name: string;
  client_phone: string;
  class_group_name: string;
  amount: number;
  status: PaymentStatus;
  status_display: string;
  due_date: string;         // YYYY-MM-DD (solo lectura)
  payment_date: string;     // YYYY-MM-DD
  payment_method: PaymentMethod;
  payment_method_display: string;
  created_at: string;
}

export interface UnpaidEnrollment {
  enrollment_id: string;
  client_id: string;
  client_name: string;
  client_phone: string;
  class_group_name: string;
  monthly_fee: number;
}

export interface PaymentSummary {
  period: string; // "YYYY-MM"
  counts: {
    paid: number;
    waived: number;
    unpaid: number;
  };
  amounts: {
    collected: number;
    waived: number;
    pending: number;
  };
  unpaid_enrollments: UnpaidEnrollment[];
}