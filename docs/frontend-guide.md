# 🎨 GUÍA COMPLETA - Prompt para Frontend Next.js (AgendyFix)

## 📋 PROMPT MAESTRO PARA FRONTEND

Usa este prompt para el proyecto frontend:

---

```markdown
Actúa como un desarrollador frontend senior experto en:

- Next.js 14+ (App Router)
- React + TypeScript
- TailwindCSS + shadcn/ui
- API REST integration con Axios/Fetch
- Autenticación JWT
- State management (Zustand/Redux)
- Formularios con React Hook Form + Zod

Contexto del proyecto:
- Frontend para "AgendyFix" - Panel administrativo multi-tenant
- Backend API REST ya implementado en Django (43 endpoints)
- Sistema de autenticación JWT
- Multi-tenancy: usuario puede tener múltiples companies y cambiar entre ellas
- Roles: Admin (CRUD completo) y Operator (CRUD limitado)

El backend tiene estos módulos:
1. Authentication - Login, refresh token, user profile
2. Companies - Ver/editar company info, cambiar company activa
3. Services - CRUD de servicios (nombre, precio, duración)
4. Clients - CRUD de clientes
5. Teams - CRUD de equipos de trabajo
6. Employees - Solo lectura + editar teams
7. Appointments - CRUD de citas + Notes anidados + Calendar view

Mi objetivo:
- Ir módulo por módulo (authentication, dashboard, services, clients, teams, appointments)
- Crear componentes reutilizables y limpios
- Usar shadcn/ui para UI components
- Implementar autenticación con JWT y refresh
- Manejar current_company con context/state
- Crear calendario de citas interactivo
- Formularios con validaciones
- Manejo de errores consistente

Forma de trabajar (muy importante):
1. SOLO trabajamos **un módulo a la vez**. No toques otros hasta que yo lo pida.
2. Para cada módulo:
   - Revisa la estructura de endpoints que te pase
   - Crea componentes, hooks, y services necesarios
   - Implementa UI según el diseño (o propón uno limpio)
   - Maneja estados de loading/error
   - Valida permisos por rol cuando aplique
3. Para cada cambio, responde SIEMPRE con:
   A) Un breve resumen de lo que implementaste
   B) Código propuesto COMPLETO para cada archivo (sin "...")
   C) Estructura de archivos/carpetas si creaste nuevos
   D) Instrucciones de cómo probar en navegador
4. No cambies la arquitectura sin que te lo pida
5. Si ves un bug o mejora crítica, resuélvelo y explícalo
6. Responde siempre en español. Nombres de componentes/funciones en inglés (convención)

Cuando te pida trabajar en un módulo, asumo que te voy a pegar:
- Endpoints del backend (URLs, métodos, payloads, respuestas)
- Diseño o wireframes si los tengo
- Requisitos específicos del módulo

Y tú me devolverás:
- Código completo de componentes
- Hooks personalizados si necesario
- Services/API calls
- Tipos TypeScript
- Ejemplos de uso
```

---

## 📊 CONTEXTO DE LA API (Para el Frontend)

```markdown
# API Reference - AgendyFix Backend

## Base URL
```
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'
```

## Authentication

### Login
```
POST /auth/token/
Body: { username: string, password: string }
Response: { access: string, refresh: string }
```

### Refresh Token
```
POST /auth/token/refresh/
Body: { refresh: string }
Response: { access: string }
```

### Verify Token
```
POST /auth/token/verify/
Body: { token: string }
Response: {}
```

## User Profile

### Get Profile
```
GET /me/
Headers: { Authorization: "Bearer {token}" }
Response: {
  id, username, email, first_name, last_name,
  companies: [{ id, name, is_active }],
  employee_profiles: [{ id, full_name, company, role, teams_names }],
  current_company: { id, name, is_active }
}
```

### Update Profile
```
PATCH /me/
Body: { first_name?, last_name?, email? }
Response: User object completo
```

### Get Current Company
```
GET /me/company/
Response: Company object completo
```

### Switch Company
```
POST /me/company/
Body: { company_id: string }
Response: { detail: string, company: {...} }
```

## Services

```
GET    /services/                        # List
POST   /services/                        # Create (Admin/Operator)
GET    /services/{id}/                   # Detail
PATCH  /services/{id}/                   # Update (Admin/Operator)
DELETE /services/{id}/                   # Soft-delete (Admin/Operator)

Query params: ?search=text&ordering=name&is_bookable_online=true

Response fields:
{
  id, name, description, price, 
  duration_minutes, buffer_minutes, total_duration,
  is_active, is_bookable_online,
  company: { id, name },
  created_at, updated_at
}
```

## Clients

```
GET    /clients/                         # List
POST   /clients/                         # Create
GET    /clients/{id}/                    # Detail  
PATCH  /clients/{id}/                    # Update
DELETE /clients/{id}/                    # Soft-delete

Response:
{
  id, name, last_name, full_name, email, phone,
  company: {...},
  total_appointments: number,
  is_active, created_at, updated_at
}
```

## Teams

```
GET    /teams/                           # List
POST   /teams/                           # Create (Admin only)
GET    /teams/{id}/                      # Detail
PATCH  /teams/{id}/                      # Update (Admin only)
DELETE /teams/{id}/                      # Soft-delete (Admin only)

Response:
{
  id, name, description,
  company: {...},
  employee_count: number,
  employees_list: [{ id, full_name, role, email }],
  is_active
}
```

## Employees

```
GET    /employees/                       # List
GET    /employees/{id}/                  # Detail
PATCH  /employees/{id}/                  # Update teams only (Admin)

Response:
{
  id, first_name, last_name, full_name, email, username,
  role: "admin" | "operator",
  user: {...},
  company: {...},
  teams: [{ id, name }],
  teams_names: string[],
  is_active
}
```

## Appointments

```
GET    /appointments/                    # List
POST   /appointments/                    # Create
GET    /appointments/{id}/               # Detail
PATCH  /appointments/{id}/               # Update
DELETE /appointments/{id}/               # Soft-delete
PATCH  /appointments/{id}/status/        # Change status only
GET    /appointments/calendar/           # Calendar view

Calendar query params:
?month=2024-01
OR
?start_date=2024-01-01&end_date=2024-03-31

Create body:
{
  client: uuid,                          # Required
  service?: uuid,                        # Optional
  custom_service_description?: string,   # If service null
  start_at: datetime,                    # Required
  end_at?: datetime,                     # Auto-calculated if null
  title?: string,
  description?: string,
  team?: uuid,
  assigned_to?: uuid,  // Employee
  location?: string,
  estimated_price?: decimal,
  client_notes?: string,
  status?: "pending"|"confirmed"|etc.
}

Response:
{
  id, title, description, client_notes,
  start_at, end_at, duration_minutes,
  status, status_display, source, source_display,
  company: {...},
  service: {...},
  service_name, custom_service_description,
  client: {...},
  client_name,
  team: {...},
  assigned_to: {...},
  location, estimated_price,
  client_name_snapshot, client_phone_snapshot, service_name_snapshot,
  confirmation_code,
  notes: Note[],
  notes_count: number,
  is_active, created_at, updated_at
}
```

### Notes (Nested)

```
GET    /appointments/{id}/notes/         # List
POST   /appointments/{id}/notes/         # Create
GET    /appointments/{id}/notes/{note_id}/    # Detail
PATCH  /appointments/{id}/notes/{note_id}/   # Update
DELETE /appointments/{id}/notes/{note_id}/   # Delete

Body:
{
  title?: string,
  description?: string,
  media?: file,
  is_internal: boolean  // true = solo staff, false = cliente puede ver
}

Response:
{
  id, title, description, media,
  author: uuid,
  author_name: string,
  is_internal: boolean,
  created_at, updated_at
}
```

## Status Transitions

```
Valid transitions:
pending → confirmed, rejected, cancelled
confirmed → in_progress, cancelled
in_progress → completed, cancelled
completed → (none)
cancelled → (none)
```
```

---

## 🏗️ ARQUITECTURA FRONTEND RECOMENDADA

### Estructura del Proyecto Next.js:

```
frontend/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   │   └── page.tsx              # Login page
│   │   └── layout.tsx                # Auth layout (sin sidebar)
│   │
│   ├── (dashboard)/
│   │   ├── layout.tsx                # Dashboard layout (con sidebar)
│   │   ├── page.tsx                  # Dashboard home
│   │   │
│   │   ├── services/
│   │   │   ├── page.tsx              # Lista de services
│   │   │   ├── [id]/
│   │   │   │   └── page.tsx          # Detalle/editar service
│   │   │   └── new/
│   │   │       └── page.tsx          # Crear service
│   │   │
│   │   ├── clients/
│   │   │   ├── page.tsx              # Lista de clients
│   │   │   ├── [id]/
│   │   │   │   └── page.tsx          # Detalle client + appointments
│   │   │   └── new/
│   │   │       └── page.tsx          # Crear client
│   │   │
│   │   ├── teams/
│   │   │   └── ...
│   │   │
│   │   ├── employees/
│   │   │   └── ...
│   │   │
│   │   ├── appointments/
│   │   │   ├── page.tsx              # Lista/Calendario
│   │   │   ├── [id]/
│   │   │   │   └── page.tsx          # Detalle con notes
│   │   │   └── new/
│   │   │       └── page.tsx          # Crear appointment
│   │   │
│   │   └── settings/
│   │       ├── profile/
│   │       │   └── page.tsx          # Editar perfil
│   │       └── company/
│   │           └── page.tsx          # Editar company
│   │
│   ├── api/                           # API routes (opcional)
│   ├── globals.css
│   └── layout.tsx
│
├── components/
│   ├── ui/                             # shadcn/ui components
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   ├── dialog.tsx
│   │   ├── table.tsx
│   │   ├── calendar.tsx
│   │   └── ...
│   │
│   ├── layout/
│   │   ├── Sidebar.tsx                # Sidebar con navegación
│   │   ├── Header.tsx                 # Header con company selector
│   │   ├── CompanySelector.tsx        # Dropdown para switch company
│   │   └── UserMenu.tsx               # Menu de usuario
│   │
│   ├── services/
│   │   ├── ServiceList.tsx            # Lista de services
│   │   ├── ServiceCard.tsx            # Card de service
│   │   ├── ServiceForm.tsx            # Formulario crear/editar
│   │   └── ServiceFilters.tsx         # Filtros y búsqueda
│   │
│   ├── clients/
│   │   └── ...
│   │
│   ├── appointments/
│   │   ├── AppointmentCalendar.tsx    # Calendario principal
│   │   ├── AppointmentList.tsx        # Lista de citas
│   │   ├── AppointmentForm.tsx        # Formulario cita
│   │   ├── AppointmentDetail.tsx      # Detalle con notas
│   │   ├── NotesList.tsx              # Lista de notas
│   │   └── NoteForm.tsx               # Agregar nota
│   │
│   └── shared/
│       ├── LoadingSpinner.tsx
│       ├── ErrorMessage.tsx
│       ├── EmptyState.tsx
│       └── ConfirmDialog.tsx
│
├── lib/
│   ├── api/
│   │   ├── client.ts                  # Axios instance configurado
│   │   ├── auth.ts                    # Auth endpoints
│   │   ├── services.ts                # Services endpoints
│   │   ├── clients.ts                 # Clients endpoints
│   │   ├── teams.ts                   # Teams endpoints
│   │   ├── employees.ts               # Employees endpoints
│   │   └── appointments.ts            # Appointments endpoints
│   │
│   ├── hooks/
│   │   ├── useAuth.ts                 # Hook de autenticación
│   │   ├── useCompany.ts              # Hook de company actual
│   │   ├── useServices.ts             # Hook de services
│   │   ├── useClients.ts              # Hook de clients
│   │   └── useAppointments.ts         # Hook de appointments
│   │
│   ├── stores/
│   │   ├── authStore.ts               # Zustand store para auth
│   │   └── companyStore.ts            # Zustand store para company
│   │
│   ├── types/
│   │   ├── api.ts                     # Tipos de responses del API
│   │   ├── models.ts                  # Modelos (User, Company, Service, etc.)
│   │   └── forms.ts                   # Tipos de formularios
│   │
│   └── utils/
│       ├── formatters.ts              # Formatear fechas, precios, etc
│       ├── validators.ts              # Validaciones custom
│       └── constants.ts               # Constantes (status, roles, etc)
│
├── middleware.ts                       # Protección de rutas
├── .env.local
└── tsconfig.json
```

---

## 🔑 VARIABLES DE ENTORNO

**Archivo:** `.env.local`

```bash
# API Backend
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1

# App Config
NEXT_PUBLIC_APP_NAME=AgendyFix
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## 📝 EJEMPLO: Context de API para el Prompt

Cuando empieces un módulo, dale este contexto:

```markdown
Módulo: Authentication

Endpoints disponibles:
1. POST /auth/token/
   Body: { username: string, password: string }
   Response: { access: string, refresh: string }

2. POST /auth/token/refresh/
   Body: { refresh: string }
   Response: { access: string }

3. GET /me/
   Headers: { Authorization: "Bearer {token}" }
   Response: {
     id, username, email, first_name, last_name,
     companies: [{ id, name, is_active }],
     employee_profiles: [...],
     current_company: { id, name, is_active }
   }

4. PATCH /me/
   Body: { first_name?, last_name?, email? }
   Response: User completo

5. POST /me/company/
   Body: { company_id: string }
   Response: { detail: string, company: {...} }

Requisitos:
- Login form con username/password
- Guardar tokens en localStorage
- Interceptor para refresh automático cuando token expira
- Redirigir a dashboard después de login exitoso
- Hook useAuth para manejar estado de autenticación
- Company selector en header para switch entre companies
- Logout que limpia tokens y redirige a login

Implementa:
1. Login page
2. Auth service (API calls)
3. Auth store (Zustand)
4. useAuth hook
5. Middleware para proteger rutas
6. Company selector component
```

---

## 🎯 ESTRATEGIA MÓDULO POR MÓDULO

### Orden Recomendado:

#### **1. Authentication (1-2 días)**
- Login/Logout
- Token management
- Protected routes
- Company selector
- User profile

#### **2. Dashboard (1 día)**
- Layout principal
- Sidebar navigation
- Header con company selector
- Stats básicos (total services, clients, appointments)

#### **3. Services (1-2 días)**
- Lista con búsqueda/filtros
- Crear/editar con duration fields
- Ver detalle
- Eliminar (con confirmación)

#### **4. Clients (1-2 días)**
- Lista de clientes
- Crear/editar
- Ver appointments del cliente
- Búsqueda rápida

#### **5. Appointments (3-4 días)**
- Calendar view (mes/semana/día)
- Crear cita (select client, service, datetime)
- Ver/editar appointment
- Notes inline
- Cambiar status
- Filtros por fecha/status

#### **6. Teams & Employees (1-2 días)**
- Lista de teams
- Asignar employees a teams
- Ver employees por team

---

## 🛡️ EVITAR ERRORES - Best Practices

## ⚠️ ERRORES COMUNES A EVITAR

### 1. **No hardcodear company_id**
```typescript
// ❌ MAL
const services = await api.get(`/services/?company=${companyId}`)

// ✅ BIEN - Backend filtra automáticamente por current_company
const services = await api.get('/services/')
```

### 2. **Manejar soft-delete**
```typescript
// Los recursos eliminados retornan 404
try {
  const client = await api.get(`/clients/${id}/`)
} catch (error) {
  if (error.response?.status === 404) {
    // Cliente fue eliminado, mostrar mensaje amigable
    toast.error('Cliente no encontrado o fue eliminado')
  }
}
```

### 3. **Refresh de datos después de switch company**
```typescript
const switchCompany = async (companyId: string) => {
  await api.post('/me/company/', { company_id: companyId })
  
  // IMPORTANTE: Recargar todos los datos
  await Promise.all([
    fetchServices(),
    fetchClients(),
    fetchAppointments()
  ])
  
  // O simplemente reload
  window.location.reload()
}
```

---
