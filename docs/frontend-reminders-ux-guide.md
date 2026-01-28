# Guía Completa: Módulo de Reminders para Frontend

## 📋 Índice
1. [Contexto y Arquitectura](#contexto-y-arquitectura)
2. [Módulo 1: Configurar Reminders](#módulo-1-configurar-reminders-scheduled)
3. [Módulo 2: Historial de Envíos](#módulo-2-historial-de-envíos-sent-history)
4. [API Reference Completa](#api-reference-completa)
5. [Modelos de Datos](#modelos-de-datos)
6. [Validaciones y Reglas de Negocio](#validaciones-y-reglas-de-negocio)
7. [Casos de Uso Completos](#casos-de-uso-completos)
8. [Manejo de Errores](#manejo-de-errores)

---

## Contexto y Arquitectura

### Objetivo
El frontend necesita **2 módulos separados**:
1. **"Configurar Reminders"** - Crear/editar reminders programados (individuales, grupales, recurrentes)
2. **"Historial de Envíos"** - Ver resultados de reminders enviados (éxito, fallas, estadísticas)

### Arquitectura Backend
- **Una sola tabla:** `Reminder` (no dos tablas separadas)
- **Endpoints especializados:** `/scheduled/`, `/history/`, `/children/`
- **Filtros inteligentes:** Separan la UX sin duplicar datos

### Base URL
```
https://api.agendyfix.com/api/v1/reminders/
```

### Autenticación
Todos los endpoints requieren JWT:
```
Authorization: Bearer {access_token}
```

---

## Módulo 1: Configurar Reminders (Scheduled)

### 🎯 Objetivo
Pantalla para **crear y gestionar** reminders programados.

### 📡 Endpoint Principal

#### Listar Reminders Programados
```
GET /api/v1/reminders/scheduled/
```

**Filtros automáticos aplicados:**
- `status=pending` - Solo pendientes
- `is_recurrence_master=true OR recurrence=once` - Masters o únicos
- Ordenado por `scheduled_at` ASC (próximos primero)

**Response:**
```json
{
  "count": 15,
  "next": "https://api.agendyfix.com/api/v1/reminders/scheduled/?page=2",
  "previous": null,
  "results": [
    {
      "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "channel": "whatsapp",
      "channel_display": "WhatsApp",
      "reminder_type": "custom",
      "reminder_type_display": "Personalizado",
      "status": "pending",
      "status_display": "Pendiente",
      "client": {
        "id": "uuid-cliente",
        "name": "Juan",
        "last_name": "Pérez",
        "phone": "+529991234567"
      },
      "client_group": null,
      "message": "Hola {client_name}, recordatorio individual",
      "scheduled_at": "2026-01-25T10:00:00-06:00",
      "recurrence": "once",
      "recurrence_display": "Una vez",
      "recurrence_description": "Una vez el 25/01/2026 a las 10:00",
      "is_bulk": false,
      "is_recurring": false,
      "target_count": 1,
      "created_at": "2026-01-20T15:00:00-06:00"
    },
    {
      "id": "b2c3d4e5-f6a7-8901-bcde-f12345678901",
      "channel": "whatsapp",
      "reminder_type": "promotional",
      "status": "pending",
      "client": null,
      "client_group": {
        "id": "uuid-group",
        "name": "Clientes VIP",
        "member_count": 25
      },
      "message": "¡Promoción especial! 20% de descuento",
      "scheduled_at": "2026-01-26T09:00:00-06:00",
      "recurrence": "weekly",
      "recurrence_weekday": 0,
      "recurrence_weekday_display": "Lunes",
      "recurrence_time": "09:00:00",
      "recurrence_end_date": "2026-03-31",
      "recurrence_description": "Cada Lunes a las 09:00 hasta el 31/03/2026",
      "is_bulk": true,
      "is_recurring": true,
      "is_recurrence_master": true,
      "target_count": 25,
      "created_at": "2026-01-20T16:00:00-06:00"
    }
  ]
}
```

### 🔨 Acciones Disponibles

#### 1. Crear Reminder Individual (Una vez)
```
POST /api/v1/reminders/
```

**Request Body:**
```json
{
  "channel": "whatsapp",
  "reminder_type": "custom",
  "client": "uuid-cliente",
  "phone_number": "+529991234567",
  "message": "Hola {client_name}, te recordamos tu cita mañana",
  "scheduled_at": "2026-01-25T15:00:00-06:00"
}
```

**Campos:**
- `channel` (required): `"whatsapp"` | `"email"` | `"sms"`
- `reminder_type` (required): `"appointment"` | `"custom"` | `"promotional"` | `"follow_up"`
- `client` (required si no hay `client_group`): UUID del cliente
- `phone_number` (required para whatsapp/sms): Teléfono con formato `+52XXXXXXXXXX`
- `email` (required para email): Email del cliente
- `message` (required): Mensaje a enviar (soporta variables: `{client_name}`, `{appointment_date}`, `{service_name}`)
- `scheduled_at` (required): Fecha/hora de envío en formato ISO 8601 con timezone

**Response (201 Created):**
```json
{
  "id": "uuid-nuevo",
  "channel": "whatsapp",
  "reminder_type": "custom",
  "status": "pending",
  "client": {
    "id": "uuid-cliente",
    "name": "Juan",
    "last_name": "Pérez"
  },
  "phone_number": "+529991234567",
  "message": "Hola {client_name}, te recordamos tu cita mañana",
  "scheduled_at": "2026-01-25T15:00:00-06:00",
  "recurrence": "once",
  "is_bulk": false,
  "is_recurring": false,
  "created_at": "2026-01-20T10:30:00-06:00"
}
```

#### 2. Crear Reminder Grupal (Masivo)
```
POST /api/v1/reminders/
```

**Request Body:**
```json
{
  "channel": "whatsapp",
  "reminder_type": "promotional",
  "client_group": "uuid-grupo",
  "message": "¡Promoción especial! 20% de descuento este fin de semana",
  "scheduled_at": "2026-01-22T10:00:00-06:00"
}
```

**Notas:**
- **NO** se requiere `phone_number` ni `email` - se obtienen automáticamente de cada cliente del grupo
- El sistema creará un reminder individual por cada cliente al momento del envío
- Puedes ver los resultados individuales en `/api/v1/reminders/{id}/children/`

#### 3. Crear Reminder Recurrente Semanal
```
POST /api/v1/reminders/
```

**Request Body:**
```json
{
  "channel": "whatsapp",
  "reminder_type": "custom",
  "client_group": "uuid-grupo",
  "message": "¡Hola! Te recordamos que tenemos disponibilidad esta semana",
  "scheduled_at": "2026-01-27T17:00:00-06:00",
  "recurrence": "weekly",
  "recurrence_weekday": 0,
  "recurrence_time": "17:00:00",
  "recurrence_end_date": "2026-03-31"
}
```

**Campos de Recurrencia:**
- `recurrence` (required): `"once"` | `"daily"` | `"weekly"` | `"monthly"`
- `recurrence_weekday` (required para weekly): `0` (Lunes) a `6` (Domingo)
- `recurrence_time` (required para recurrentes): Hora de envío `"HH:MM:SS"`
- `recurrence_end_date` (optional): Fecha de fin `"YYYY-MM-DD"`
- `scheduled_at`: Primera ocurrencia (fecha/hora completa)

**Días de la semana:**
```javascript
const WEEKDAYS = {
  0: 'Lunes',
  1: 'Martes',
  2: 'Miércoles',
  3: 'Jueves',
  4: 'Viernes',
  5: 'Sábado',
  6: 'Domingo'
};
```

#### 4. Crear Reminder Recurrente Diario
```json
{
  "channel": "email",
  "reminder_type": "custom",
  "client": "uuid-cliente",
  "email": "cliente@example.com",
  "message": "Reporte diario de actividades",
  "scheduled_at": "2026-01-21T08:00:00-06:00",
  "recurrence": "daily",
  "recurrence_time": "08:00:00",
  "recurrence_end_date": "2026-02-20"
}
```

#### 5. Crear Reminder Recurrente Mensual
```json
{
  "channel": "sms",
  "reminder_type": "custom",
  "client_group": "uuid-grupo",
  "message": "Recordatorio: Tu pago mensual vence el día 5",
  "scheduled_at": "2026-02-05T09:00:00-06:00",
  "recurrence": "monthly",
  "recurrence_time": "09:00:00",
  "recurrence_end_date": "2026-12-05"
}
```

#### 6. Ver Detalle de Reminder
```
GET /api/v1/reminders/{uuid}/
```

**Response:**
```json
{
  "id": "uuid",
  "company": {
    "id": "uuid-company",
    "name": "Mi Empresa"
  },
  "channel": "whatsapp",
  "channel_display": "WhatsApp",
  "reminder_type": "custom",
  "reminder_type_display": "Personalizado",
  "status": "pending",
  "status_display": "Pendiente",
  "client": {
    "id": "uuid-cliente",
    "name": "Juan",
    "last_name": "Pérez",
    "phone": "+529991234567",
    "email": "juan@example.com"
  },
  "client_group": null,
  "phone_number": "+529991234567",
  "email": null,
  "appointment": null,
  "message": "Hola {client_name}, recordatorio",
  "scheduled_at": "2026-01-25T10:00:00-06:00",
  "sent_at": null,
  "recurrence": "once",
  "recurrence_display": "Una vez",
  "recurrence_weekday": null,
  "recurrence_time": null,
  "recurrence_end_date": null,
  "recurrence_description": "Una vez el 25/01/2026 a las 10:00",
  "is_recurrence_master": false,
  "last_occurrence_date": null,
  "is_bulk": false,
  "is_recurring": false,
  "target_count": 1,
  "metadata": {},
  "response_data": null,
  "error_message": null,
  "created_by": {
    "id": "uuid-employee",
    "full_name": "Admin User"
  },
  "is_active": true,
  "created_at": "2026-01-20T10:30:00-06:00",
  "updated_at": "2026-01-20T10:30:00-06:00"
}
```

#### 7. Editar Reminder Pendiente
```
PATCH /api/v1/reminders/{uuid}/
```

**Request Body (todos los campos son opcionales):**
```json
{
  "message": "Mensaje actualizado",
  "scheduled_at": "2026-01-26T15:00:00-06:00"
}
```

**Nota:** Solo se pueden editar reminders con `status=pending`

#### 8. Cancelar Reminder
```
POST /api/v1/reminders/{uuid}/cancel/
```

**Response:**
```json
{
  "detail": "Reminder cancelled successfully",
  "reminder_id": "uuid"
}
```

**Alternativa (DELETE):**
```
DELETE /api/v1/reminders/{uuid}/
```
Marca como `cancelled` (soft delete)

#### 9. Enviar Reminder Inmediatamente
```
POST /api/v1/reminders/{uuid}/send-now/
```

**Response:**
```json
{
  "detail": "Reminder queued for immediate sending",
  "reminder_id": "uuid"
}
```

### 🎨 UI Sugerida

```
┌─────────────────────────────────────────────────────────────┐
│ Reminders Programados                          [+ Nuevo]    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ 📅 25 Ene 2026, 10:00 AM                                   │
│ 📱 WhatsApp → Juan Pérez (+529991234567)                   │
│ 💬 "Hola {client_name}, recordatorio individual"           │
│ 🔁 Una vez                              [Editar] [Enviar] [❌] │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ 📅 26 Ene 2026, 09:00 AM                                   │
│ 📱 WhatsApp → Grupo: Clientes VIP (25 miembros)           │
│ 💬 "¡Promoción especial! 20% de descuento"                 │
│ 🔁 Cada Lunes a las 09:00 hasta 31/03/2026                │
│                                         [Editar] [❌]       │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ 📅 21 Ene 2026, 08:00 AM                                   │
│ 📧 Email → cliente@example.com                             │
│ 💬 "Reporte diario de actividades"                         │
│ 🔁 Diario a las 08:00 hasta 20/02/2026                    │
│                                         [Editar] [❌]       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 📝 Formulario de Creación

**Campos del formulario:**

1. **Tipo de Reminder**
   - Radio buttons: Individual | Grupal

2. **Canal** (required)
   - Select: WhatsApp | Email | SMS

3. **Destinatario** (required)
   - Si Individual: Autocomplete de clientes
   - Si Grupal: Autocomplete de grupos

4. **Tipo** (required)
   - Select: Cita | Personalizado | Promocional | Seguimiento

5. **Mensaje** (required)
   - Textarea con contador de caracteres
   - Hint: "Puedes usar {client_name}, {appointment_date}, {service_name}"

6. **Programación** (required)
   - Fecha y hora (DateTimePicker)

7. **Recurrencia** (optional)
   - Select: Una vez | Diario | Semanal | Mensual
   - Si Semanal: Select día de la semana
   - Si Recurrente: TimePicker para hora
   - Si Recurrente: DatePicker para fecha de fin

**Validaciones en Frontend:**
- Si canal es WhatsApp/SMS y es individual: verificar que cliente tenga teléfono
- Si canal es Email y es individual: verificar que cliente tenga email
- `scheduled_at` debe ser futuro
- Si recurrente: `recurrence_end_date` debe ser posterior a `scheduled_at`
- Si semanal: `recurrence_weekday` es obligatorio

---

## Módulo 2: Historial de Envíos (Sent History)

### 🎯 Objetivo
Pantalla para **ver resultados** de reminders enviados (éxito, fallas, estadísticas).

### 📡 Endpoint Principal

#### Listar Historial de Envíos
```
GET /api/v1/reminders/history/
```

**Filtros automáticos aplicados:**
- `status__in=sent,failed` - Solo enviados o fallidos
- `exclude_bulk_children=true` - Excluye individuales creados desde bulk
- Ordenado por `sent_at` DESC (más recientes primero)

**Query Parameters opcionales:**
```
GET /api/v1/reminders/history/?channel=whatsapp
GET /api/v1/reminders/history/?status=failed
GET /api/v1/reminders/history/?date_from=2026-01-01&date_to=2026-01-31
GET /api/v1/reminders/history/?client=uuid-cliente
GET /api/v1/reminders/history/?client_group=uuid-grupo
GET /api/v1/reminders/history/?exclude_bulk_children=false
```

**Response:**
```json
{
  "count": 50,
  "next": "https://api.agendyfix.com/api/v1/reminders/history/?page=2",
  "previous": null,
  "results": [
    {
      "id": "uuid-1",
      "channel": "whatsapp",
      "reminder_type": "custom",
      "status": "sent",
      "status_display": "Enviado",
      "client": {
        "id": "uuid",
        "name": "Juan",
        "last_name": "Pérez"
      },
      "client_group": null,
      "message": "Recordatorio individual",
      "scheduled_at": "2026-01-20T10:00:00-06:00",
      "sent_at": "2026-01-20T10:00:15-06:00",
      "recurrence": "once",
      "is_bulk": false,
      "response_data": {
        "message_id": "wamid.xxx",
        "status": "delivered"
      },
      "error_message": null
    },
    {
      "id": "uuid-2",
      "channel": "whatsapp",
      "reminder_type": "promotional",
      "status": "sent",
      "client": null,
      "client_group": {
        "id": "uuid-group",
        "name": "Clientes VIP",
        "member_count": 25
      },
      "message": "Mensaje masivo",
      "scheduled_at": "2026-01-20T09:00:00-06:00",
      "sent_at": "2026-01-20T09:00:30-06:00",
      "recurrence": "once",
      "is_bulk": true,
      "metadata": {
        "bulk_stats": {
          "total_clients": 25,
          "sent": 23,
          "failed": 1,
          "skipped": 1
        }
      }
    },
    {
      "id": "uuid-3",
      "channel": "whatsapp",
      "reminder_type": "custom",
      "status": "failed",
      "status_display": "Fallido",
      "client": {
        "id": "uuid",
        "name": "Ana",
        "last_name": "García"
      },
      "message": "Recordatorio de cita",
      "scheduled_at": "2026-01-19T20:00:00-06:00",
      "sent_at": null,
      "error_message": "404 Client Error: Not Found for url: https://n8n.agendyfix.com/webhook/reminders"
    }
  ]
}
```

### 🔍 Ver Detalles de Bulk Reminder

```
GET /api/v1/reminders/{uuid-bulk}/children/
```

**Response:**
```json
{
  "count": 25,
  "bulk_reminder": {
    "id": "uuid-bulk",
    "client_group": "Clientes VIP",
    "message": "Mensaje masivo",
    "sent_at": "2026-01-20T09:00:30-06:00",
    "stats": {
      "total_clients": 25,
      "sent": 23,
      "failed": 1,
      "skipped": 1
    }
  },
  "results": [
    {
      "id": "uuid-child-1",
      "client": {
        "id": "uuid",
        "name": "Juan",
        "last_name": "Pérez",
        "phone": "+529991234567"
      },
      "status": "sent",
      "status_display": "Enviado",
      "sent_at": "2026-01-20T09:00:32-06:00",
      "response_data": {
        "message_id": "wamid.xxx"
      },
      "error_message": null
    },
    {
      "id": "uuid-child-2",
      "client": {
        "id": "uuid",
        "name": "María",
        "last_name": "López",
        "phone": null
      },
      "status": "failed",
      "status_display": "Fallido",
      "sent_at": null,
      "error_message": "No phone number"
    }
  ]
}
```

### 🎨 UI Sugerida

```
┌─────────────────────────────────────────────────────────────┐
│ Historial de Envíos                                        │
│ Filtros: [WhatsApp ▼] [Todos ▼] [Ene 2026 ▼]             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ ✅ 20 Ene 2026, 10:00 AM                                   │
│ 📱 WhatsApp → Juan Pérez                                   │
│ 💬 "Recordatorio individual"                               │
│ ✓ Enviado exitosamente                                    │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ ✅ 20 Ene 2026, 09:00 AM                                   │
│ 📱 WhatsApp → Grupo: Clientes VIP                         │
│ 💬 "Mensaje masivo"                                        │
│ 📊 23 enviados | 1 fallido | 1 omitido                    │
│                                    [Ver detalles]          │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ ❌ 19 Ene 2026, 08:00 PM                                   │
│ 📱 WhatsApp → Ana García                                   │
│ 💬 "Recordatorio de cita"                                  │
│ ⚠️ Error: n8n webhook timeout                             │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 📊 Modal de Detalles de Bulk

```
┌─────────────────────────────────────────────────────────────┐
│ Detalles de Envío Masivo                            [✕]    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ Grupo: Clientes VIP                                        │
│ Mensaje: "Mensaje masivo"                                  │
│ Enviado: 20 Ene 2026, 09:00 AM                            │
│                                                             │
│ Estadísticas:                                              │
│ ✅ 23 enviados exitosamente                                │
│ ❌ 1 fallido                                                │
│ ⏭️ 1 omitido (sin contacto)                                │
│                                                             │
│ Detalles por cliente:                                      │
│ ┌─────────────────────────────────────────────────────┐   │
│ │ ✅ Juan Pérez (+529991234567)                       │   │
│ │ ✅ María López (+529991234568)                      │   │
│ │ ❌ Ana García (sin teléfono)                        │   │
│ │ ...                                                 │   │
│ └─────────────────────────────────────────────────────┘   │
│                                                             │
│                                          [Cerrar]           │
└─────────────────────────────────────────────────────────────┘
```

---

## API Reference Completa

### Endpoints Disponibles

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `GET` | `/api/v1/reminders/` | Listar todos los reminders |
| `POST` | `/api/v1/reminders/` | Crear reminder |
| `GET` | `/api/v1/reminders/{id}/` | Ver detalle |
| `PATCH` | `/api/v1/reminders/{id}/` | Actualizar reminder |
| `DELETE` | `/api/v1/reminders/{id}/` | Cancelar reminder |
| `GET` | `/api/v1/reminders/scheduled/` | Listar programados |
| `GET` | `/api/v1/reminders/history/` | Listar historial |
| `GET` | `/api/v1/reminders/{id}/children/` | Ver detalles bulk |
| `POST` | `/api/v1/reminders/{id}/send-now/` | Enviar inmediatamente |
| `POST` | `/api/v1/reminders/{id}/cancel/` | Cancelar reminder |

### Query Parameters Disponibles

**Para `/api/v1/reminders/`:**
- `status`: `pending` | `sent` | `failed` | `cancelled`
- `channel`: `whatsapp` | `email` | `sms`
- `reminder_type`: `appointment` | `custom` | `promotional` | `follow_up`
- `client`: UUID del cliente
- `client_group`: UUID del grupo
- `appointment`: UUID del appointment
- `ordering`: `-scheduled_at` | `created_at` | `-sent_at`

**Para `/api/v1/reminders/history/`:**
- `channel`: Filtrar por canal
- `status`: `sent` | `failed`
- `date_from`: Fecha inicio (YYYY-MM-DD)
- `date_to`: Fecha fin (YYYY-MM-DD)
- `client`: UUID del cliente
- `client_group`: UUID del grupo
- `exclude_bulk_children`: `true` | `false` (default: `true`)

---

## Modelos de Datos

### Reminder Object

```typescript
interface Reminder {
  // Identificación
  id: string;  // UUID
  company: {
    id: string;
    name: string;
  };
  
  // Configuración
  channel: 'whatsapp' | 'email' | 'sms';
  channel_display: string;
  reminder_type: 'appointment' | 'custom' | 'promotional' | 'follow_up';
  reminder_type_display: string;
  
  // Destinatario (XOR: client O client_group)
  client: {
    id: string;
    name: string;
    last_name: string;
    phone?: string;
    email?: string;
  } | null;
  client_group: {
    id: string;
    name: string;
    member_count: number;
  } | null;
  
  // Contacto
  phone_number?: string;
  email?: string;
  
  // Relación opcional
  appointment: {
    id: string;
    title: string;
    start_at: string;
  } | null;
  
  // Contenido
  message: string;
  
  // Programación
  scheduled_at: string;  // ISO 8601
  sent_at: string | null;  // ISO 8601
  
  // Recurrencia
  recurrence: 'once' | 'daily' | 'weekly' | 'monthly';
  recurrence_display: string;
  recurrence_weekday: 0 | 1 | 2 | 3 | 4 | 5 | 6 | null;
  recurrence_weekday_display: string | null;
  recurrence_time: string | null;  // HH:MM:SS
  recurrence_end_date: string | null;  // YYYY-MM-DD
  recurrence_description: string;
  is_recurrence_master: boolean;
  last_occurrence_date: string | null;
  
  // Estado
  status: 'pending' | 'sent' | 'failed' | 'cancelled';
  status_display: string;
  
  // Propiedades computadas
  is_bulk: boolean;
  is_recurring: boolean;
  target_count: number;
  
  // Metadata
  metadata: {
    bulk_stats?: {
      total_clients: number;
      sent: number;
      failed: number;
      skipped: number;
    };
    bulk_reminder_id?: string;
    client_group_id?: string;
    client_group_name?: string;
    auto_created?: boolean;
    hours_before?: number;
  };
  
  // Resultado
  response_data: any | null;
  error_message: string | null;
  
  // Auditoría
  created_by: {
    id: string;
    full_name: string;
  } | null;
  is_active: boolean;
  created_at: string;  // ISO 8601
  updated_at: string;  // ISO 8601
}
```

### Client Group Object

```typescript
interface ClientGroup {
  id: string;  // UUID
  name: string;
  description: string;
  member_count: number;
  clients: Array<{
    id: string;
    name: string;
    last_name: string;
    phone: string | null;
    email: string | null;
  }>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}
```

---

## Validaciones y Reglas de Negocio

### 1. Client vs Client Group (XOR)
```javascript
// ❌ INCORRECTO
{
  "client": "uuid-1",
  "client_group": "uuid-2"  // Error: no ambos
}

// ✅ CORRECTO
{
  "client": "uuid-1"  // Solo uno
}

// ✅ CORRECTO
{
  "client_group": "uuid-2"  // Solo uno
}
```

### 2. Contacto según Canal

```javascript
// WhatsApp/SMS requiere teléfono
{
  "channel": "whatsapp",
  "client": "uuid",
  "phone_number": "+529991234567"  // Requerido
}

// Email requiere email
{
  "channel": "email",
  "client": "uuid",
  "email": "cliente@example.com"  // Requerido
}

// Con grupo, se obtiene automáticamente
{
  "channel": "whatsapp",
  "client_group": "uuid"  // No requiere phone_number
}
```

### 3. Recurrencia

```javascript
// Recurrencia semanal
{
  "recurrence": "weekly",
  "recurrence_weekday": 0,  // Requerido (0-6)
  "recurrence_time": "17:00:00",  // Requerido
  "recurrence_end_date": "2026-03-31"  // Opcional
}

// Recurrencia diaria
{
  "recurrence": "daily",
  "recurrence_time": "08:00:00",  // Requerido
  "recurrence_end_date": "2026-02-20"  // Opcional
}

// Una vez (default)
{
  "recurrence": "once"  // No requiere otros campos
}
```

### 4. Fechas

```javascript
// scheduled_at debe ser futuro
{
  "scheduled_at": "2026-01-25T15:00:00-06:00"  // ✅ Futuro
}

{
  "scheduled_at": "2026-01-19T15:00:00-06:00"  // ❌ Pasado
}

// recurrence_end_date debe ser posterior a scheduled_at
{
  "scheduled_at": "2026-01-20T17:00:00-06:00",
  "recurrence_end_date": "2026-03-31"  // ✅ Posterior
}

{
  "scheduled_at": "2026-01-20T17:00:00-06:00",
  "recurrence_end_date": "2026-01-15"  // ❌ Anterior
}
```

### 5. Tenant Isolation

- Solo puedes crear reminders para clientes/grupos de tu company actual
- Solo puedes ver/editar reminders de tu company
- El backend filtra automáticamente por `current_company`

### 6. Permisos por Rol

- **Admin:** CRUD completo de reminders
- **Operator:** Solo puede ver reminders de appointments asignados a él
- **Tenant Owner:** CRUD completo de reminders

---

## Casos de Uso Completos

### Caso 1: Promoción Semanal a Grupo VIP

**Paso 1: Crear grupo VIP**
```javascript
POST /api/v1/client-groups/
{
  "name": "Clientes VIP",
  "description": "Clientes premium con beneficios especiales",
  "client_ids": [
    "uuid-1",
    "uuid-2",
    "uuid-3"
  ]
}
```

**Paso 2: Crear reminder recurrente semanal**
```javascript
POST /api/v1/reminders/
{
  "channel": "whatsapp",
  "reminder_type": "promotional",
  "client_group": "{group_id_from_step_1}",
  "message": "¡Hola! Esta semana tenemos promociones exclusivas para ti 🎉",
  "scheduled_at": "2026-01-27T10:00:00-06:00",
  "recurrence": "weekly",
  "recurrence_weekday": 0,
  "recurrence_time": "10:00:00",
  "recurrence_end_date": "2026-06-30"
}
```

### Caso 2: Recordatorio de Pago Mensual

```javascript
POST /api/v1/reminders/
{
  "channel": "email",
  "reminder_type": "custom",
  "client": "uuid-cliente",
  "email": "cliente@example.com",
  "message": "Hola {client_name}, te recordamos que tu pago mensual vence el día 5",
  "scheduled_at": "2026-02-05T09:00:00-06:00",
  "recurrence": "monthly",
  "recurrence_time": "09:00:00",
  "recurrence_end_date": "2026-12-05"
}
```

### Caso 3: Campaña Masiva Única

```javascript
POST /api/v1/reminders/
{
  "channel": "sms",
  "reminder_type": "promotional",
  "client_group": "uuid-grupo",
  "message": "¡Gran venta de fin de temporada! 50% de descuento. Solo hoy.",
  "scheduled_at": "2026-01-25T14:00:00-06:00"
}
```

### Caso 4: Recordatorio de Cita (Automático)

```javascript
// Este reminder se crea automáticamente vía signal cuando se crea un appointment
// Pero también se puede crear manualmente:

POST /api/v1/reminders/
{
  "channel": "whatsapp",
  "reminder_type": "appointment",
  "client": "uuid-cliente",
  "phone_number": "+529991234567",
  "appointment": "uuid-appointment",
  "message": "Hola {client_name}, te recordamos tu cita mañana {appointment_date} para {service_name}",
  "scheduled_at": "2026-01-24T15:00:00-06:00"
}
```

---

## Manejo de Errores

### Errores Comunes

#### 400 Bad Request: Client y Client Group simultáneos
```json
{
  "non_field_errors": [
    "Debe especificar client o client_group (no ambos)"
  ]
}
```

#### 400 Bad Request: Falta contacto para canal
```json
{
  "phone_number": [
    "El canal whatsapp requiere un número de teléfono."
  ]
}
```

#### 400 Bad Request: Recurrencia semanal sin día
```json
{
  "recurrence_weekday": [
    "La recurrencia semanal requiere especificar el día de la semana."
  ]
}
```

#### 400 Bad Request: Fecha en el pasado
```json
{
  "scheduled_at": [
    "La fecha de envío debe ser en el futuro."
  ]
}
```

#### 400 Bad Request: Fecha de fin anterior a inicio
```json
{
  "recurrence_end_date": [
    "La fecha de fin debe ser posterior a la fecha de inicio."
  ]
}
```

#### 403 Forbidden: Cliente de otra company
```json
{
  "detail": "El cliente no pertenece a tu company."
}
```

#### 404 Not Found: Reminder no encontrado
```json
{
  "detail": "No encontrado."
}
```

### Manejo de Errores en Frontend

```javascript
try {
  const response = await fetch('/api/v1/reminders/', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(reminderData)
  });
  
  if (!response.ok) {
    const error = await response.json();
    
    // Mostrar errores de validación
    if (response.status === 400) {
      Object.keys(error).forEach(field => {
        showFieldError(field, error[field][0]);
      });
    }
    
    // Mostrar error de permisos
    if (response.status === 403) {
      showAlert('No tienes permisos para realizar esta acción');
    }
    
    return;
  }
  
  const reminder = await response.json();
  showSuccess('Reminder creado exitosamente');
  
} catch (error) {
  showAlert('Error de conexión. Intenta nuevamente.');
}
```

---

## Notas Técnicas

### Procesamiento de Reminders

#### Reminders Individuales
1. Se crean con `status=pending`
2. Celery Beat los detecta cada minuto
3. Celery Worker los envía a n8n
4. Status cambia a `sent` o `failed`

#### Reminders Grupales (Bulk)
1. Se crea reminder master con `client_group`
2. Al momento de `scheduled_at`, Celery:
   - Obtiene clientes activos del grupo
   - Crea reminder individual por cada cliente
   - Envía cada uno a n8n
   - Actualiza master con estadísticas

#### Reminders Recurrentes
1. Se crea reminder master con `is_recurrence_master=true`
2. Tarea Celery diaria genera instancias futuras
3. Cada instancia es un reminder individual con `recurrence=once`
4. Las instancias se crean con anticipación (ej: 1 día antes)

### Integración con n8n

**Payload enviado a n8n:**
```json
{
  "phone": "+529991234567",
  "message": "Hola Juan Pérez, recordatorio",
  "reminder_id": "uuid",
  "company_id": "uuid-company",
  "reminder_type": "custom",
  "metadata": {}
}
```

**Headers:**
```
Content-Type: application/json
X-Webhook-Secret: {N8N_WEBHOOK_SECRET}
```

**Response esperada de n8n:**
```json
{
  "success": true,
  "message_id": "wamid.xxx",
  "status": "sent"
}
```

---

## Checklist de Implementación Frontend

### Módulo 1: Configurar Reminders
- [ ] Pantalla de listado de reminders programados
- [ ] Formulario de creación (individual/grupal/recurrente)
- [ ] Validaciones en tiempo real
- [ ] Edición de reminders pendientes
- [ ] Cancelación de reminders
- [ ] Envío inmediato (send-now)
- [ ] Filtros y búsqueda
- [ ] Paginación

### Módulo 2: Historial de Envíos
- [ ] Pantalla de historial
- [ ] Filtros por fecha/canal/status
- [ ] Modal de detalles de bulk
- [ ] Indicadores visuales (éxito/fallo)
- [ ] Estadísticas generales
- [ ] Exportación de datos (opcional)

### Componentes Reutilizables
- [ ] ReminderCard (para listados)
- [ ] ReminderForm (crear/editar)
- [ ] RecurrenceSelector (configurar recurrencia)
- [ ] ClientGroupSelector (autocomplete)
- [ ] ChannelSelector (WhatsApp/Email/SMS)
- [ ] StatusBadge (pending/sent/failed)

### Utilidades
- [ ] API client para reminders
- [ ] Validadores de formulario
- [ ] Formateadores de fecha/hora
- [ ] Helpers para recurrencia
- [ ] Manejo de errores centralizado

---

**Última actualización:** 2026-01-20  
**Versión:** 2.0 (Completa para implementación frontend)