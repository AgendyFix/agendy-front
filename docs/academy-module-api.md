# Academy Module — API Reference

Módulo para gestión de academias (baile, yoga, idiomas, etc.).  
Cubre grupos/clases, inscripciones de alumnos y control de pagos mensuales.

---

## Feature Flags

Antes de usar los endpoints, activa los módulos desde Django Admin en  
`/admin/companies/companyfeature/` para la company correspondiente.

| Slug | Módulo | Default |
|---|---|---|
| `class_management` | Grupos y clases | `false` |
| `enrollments` | Inscripciones de alumnos | `false` |
| `payment_tracking` | Control de pagos | `false` |

Consulta el estado actual:
```
GET /api/v1/features/me/
Authorization: Bearer {token}
```

---

## Autenticación

Todos los endpoints requieren JWT.

```
Authorization: Bearer {access_token}
```

Obtener token:
```
POST /api/v1/auth/token/
{
  "username": "admin@academia.com",
  "password": "password"
}
```

---

## 1. Class Groups — Grupos / Clases

### Modelo

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | UUID | Identificador único |
| `name` | string | Nombre del grupo (ej: "Salsa Intermedio") |
| `level` | string | `all` / `beginner` / `intermediate` / `advanced` |
| `level_display` | string | Nombre legible del nivel en español |
| `monthly_fee` | integer | Mensualidad del grupo en pesos (ej: 350) |
| `instructor_id` | UUID | ID del Employee instructor (nullable) |
| `instructor_name` | string | Nombre del instructor (nullable) |
| `schedules` | array | Horarios del grupo (ver abajo) |
| `schedule_display` | string | Horarios en texto (ej: "Lunes 07:00 PM - 08:30 PM / Miércoles 07:00 PM - 08:30 PM") |
| `active_enrollment_count` | integer | Número de alumnos activos |
| `metadata` | object | Datos extra libres |
| `is_active` | boolean | Soft delete |
| `created_at` | datetime | Fecha de creación |

#### Schedule (horario)

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | integer | ID del horario |
| `day_of_week` | integer | 0=Lunes, 1=Martes, 2=Miércoles, 3=Jueves, 4=Viernes, 5=Sábado, 6=Domingo |
| `day_of_week_display` | string | Nombre del día en español |
| `start_time` | time | Hora de inicio (HH:MM:SS) |
| `end_time` | time | Hora de fin (HH:MM:SS) |

---

### Endpoints

#### `GET /api/v1/class-groups/`
Lista todos los grupos activos de la company.

**Query params:**
- `?level=beginner|intermediate|advanced|all`
- `?search=salsa`
- `?ordering=name|-monthly_fee|created_at`

**Respuesta `200`:**
```json
{
  "count": 2,
  "results": [
    {
      "id": "4c64d0a6-7f34-4a97-b493-7f4601ffc2ba",
      "name": "Salsa Intermedio - Lunes y Miércoles",
      "level": "intermediate",
      "level_display": "Intermedio",
      "monthly_fee": 350,
      "instructor_name": "Carlos López",
      "schedules": [
        {
          "id": 1,
          "day_of_week": 0,
          "day_of_week_display": "Lunes",
          "start_time": "19:00:00",
          "end_time": "20:30:00"
        },
        {
          "id": 2,
          "day_of_week": 2,
          "day_of_week_display": "Miércoles",
          "start_time": "19:00:00",
          "end_time": "20:30:00"
        }
      ],
      "schedule_display": "Lunes 07:00 PM - 08:30 PM / Miércoles 07:00 PM - 08:30 PM",
      "active_enrollment_count": 8,
      "company": "a2fc6b83-a147-42ad-8f39-5707a4ef6104",
      "company_name": "Salselegance",
      "is_active": true,
      "created_at": "2026-04-02T22:19:13.861535-06:00"
    }
  ]
}
```

---

#### `POST /api/v1/class-groups/`
Crea un nuevo grupo con sus horarios.

**Permisos:** Admin / Operator

**Body:**
```json
{
  "name": "Salsa Intermedio - Lunes y Miércoles",
  "level": "intermediate",
  "monthly_fee": 350,
  "instructor": "2300e135-d2c4-44a4-b630-d25c5265b0bd",
  "schedules": [
    { "day_of_week": 0, "start_time": "19:00", "end_time": "20:30" },
    { "day_of_week": 2, "start_time": "19:00", "end_time": "20:30" }
  ]
}
```

> `instructor` es opcional.  
> `schedules` es opcional (se puede agregar después con PATCH).  
> `level` default: `all`.

**Respuesta `201`:** Objeto completo del grupo creado.

---

#### `GET /api/v1/class-groups/{id}/`
Detalle completo de un grupo.

**Respuesta `200`:** Objeto completo con `schedules` y `active_enrollment_count`.

---

#### `PATCH /api/v1/class-groups/{id}/`
Actualiza campos del grupo. Solo se actualizan los campos enviados.

**Permisos:** Admin / Operator

**Cambiar precio:**
```json
{ "monthly_fee": 400 }
```

**Reemplazar horarios completos** (enviar los días que deben quedar):
```json
{
  "schedules": [
    { "day_of_week": 1, "start_time": "19:00", "end_time": "20:30" },
    { "day_of_week": 3, "start_time": "19:00", "end_time": "20:30" }
  ]
}
```

> Si no se envía `schedules`, los horarios existentes no se tocan.

**Respuesta `200`:** Objeto completo actualizado.

---

#### `DELETE /api/v1/class-groups/{id}/`
Soft-delete. Marca el grupo como `is_active: false`.

**Permisos:** Admin / Operator  
**Respuesta `204`**

---

## 2. Enrollments — Inscripciones

### Modelo

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | UUID | Identificador único |
| `client` | object | Datos del alumno |
| `class_group` | object | Datos del grupo |
| `status` | string | `active` / `paused` / `dropped` |
| `status_display` | string | Nombre legible en español |
| `billing_day` | integer | Día del mes que vence el pago (derivado de `start_date`) |
| `monthly_fee` | integer | Mensualidad (heredada del grupo) |
| `start_date` | date | Fecha de inscripción (YYYY-MM-DD) |
| `notes` | string | Notas internas del admin |
| `is_active` | boolean | Soft delete |
| `created_at` | datetime | Fecha de creación |

> `billing_day` y `monthly_fee` son de solo lectura — se calculan automáticamente.

---

### Endpoints

#### `GET /api/v1/enrollments/`
Lista inscripciones activas de la company.

**Query params:**
- `?class_group={uuid}` — alumnos de un grupo específico
- `?client={uuid}` — grupos en los que está un alumno
- `?status=active|paused|dropped`
- `?search=nombre|teléfono`

**Respuesta `200`:**
```json
{
  "count": 1,
  "results": [
    {
      "id": "9c337774-2610-4b4f-a4b2-0b462a9e0032",
      "client": "98a9c480-1152-4585-8ddd-97a7620907bf",
      "client_name": "Juan Pérez",
      "client_phone": "5512345678",
      "class_group": "4c64d0a6-7f34-4a97-b493-7f4601ffc2ba",
      "class_group_name": "Salsa Intermedio - Lunes y Miércoles",
      "status": "active",
      "status_display": "Activo",
      "billing_day": 1,
      "monthly_fee": 350,
      "start_date": "2026-04-01",
      "is_active": true,
      "created_at": "2026-04-03T10:26:15-06:00"
    }
  ]
}
```

---

#### `POST /api/v1/enrollments/`
Inscribe un alumno en un grupo.

**Permisos:** Admin / Operator

**Body mínimo:**
```json
{
  "client": "98a9c480-1152-4585-8ddd-97a7620907bf",
  "class_group": "4c64d0a6-7f34-4a97-b493-7f4601ffc2ba",
  "start_date": "2026-04-01"
}
```

**Body completo:**
```json
{
  "client": "98a9c480-1152-4585-8ddd-97a7620907bf",
  "class_group": "4c64d0a6-7f34-4a97-b493-7f4601ffc2ba",
  "start_date": "2026-04-01",
  "notes": "Viene referida por otra alumna"
}
```

> `status` default: `active`.  
> No se puede inscribir al mismo alumno dos veces en el mismo grupo.

**Respuesta `201`:** Objeto completo de la inscripción.

---

#### `GET /api/v1/enrollments/{id}/`
Detalle completo de una inscripción.

---

#### `PATCH /api/v1/enrollments/{id}/`
Actualiza la inscripción.

**Permisos:** Admin / Operator

**Pausar alumno:**
```json
{ "status": "paused" }
```

**Dar de baja:**
```json
{ "status": "dropped" }
```

**Cambiar fecha de inicio** (cambia el `billing_day` automáticamente):
```json
{ "start_date": "2026-04-15" }
```

**Respuesta `200`:** Objeto completo actualizado.

---

#### `DELETE /api/v1/enrollments/{id}/`
Soft-delete. Marca `is_active: false` y `status: dropped`.

**Permisos:** Admin / Operator  
**Respuesta `204`**

---

## 3. Payments — Pagos

### Modelo

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | UUID | Identificador único |
| `enrollment` | object | Datos de la inscripción (alumno + grupo) |
| `amount` | integer | Monto pagado (tomado del `monthly_fee` del grupo) |
| `status` | string | `paid` / `overdue` / `waived` |
| `status_display` | string | Nombre legible en español |
| `due_date` | date | Fecha de vencimiento calculada automáticamente |
| `payment_date` | date | Fecha exacta en que pagó el alumno |
| `payment_method` | string | `cash` / `card` / `transfer` / `other` |
| `payment_method_display` | string | Nombre legible en español |
| `created_at` | datetime | Fecha de registro |

> `amount` y `due_date` se calculan automáticamente al crear.  
> `status` siempre es `paid` al crear.

---

### Endpoints

#### `GET /api/v1/payments/`
Lista pagos de la company.

**Query params:**
- `?status=paid|overdue|waived`
- `?enrollment={uuid}`
- `?payment_method=cash|card|transfer|other`
- `?search=nombre|teléfono`
- `?ordering=payment_date|-payment_date|amount`

**Respuesta `200`:**
```json
{
  "count": 1,
  "results": [
    {
      "id": "uuid",
      "enrollment": "uuid",
      "client_name": "Juan Pérez",
      "client_phone": "5512345678",
      "class_group_name": "Salsa Intermedio - Lunes y Miércoles",
      "amount": 350,
      "status": "paid",
      "status_display": "Pagado",
      "due_date": "2026-04-01",
      "payment_date": "2026-04-01",
      "payment_method": "cash",
      "payment_method_display": "Efectivo"
    }
  ]
}
```

---

#### `POST /api/v1/payments/`
Registra un pago realizado.

**Permisos:** Admin / Operator

**Pago en efectivo (default), fecha de hoy:**
```json
{
  "enrollment": "9c337774-2610-4b4f-a4b2-0b462a9e0032"
}
```

**Pago con tarjeta, fecha específica:**
```json
{
  "enrollment": "9c337774-2610-4b4f-a4b2-0b462a9e0032",
  "payment_method": "card",
  "payment_date": "2026-04-01"
}
```

> Siempre se registra como `status: paid`.  
> Si no se envía `payment_date`, se usa la fecha de hoy.  
> Si no se envía `payment_method`, default es `cash`.

**Respuesta `201`:** Objeto completo del pago.

---

#### `GET /api/v1/payments/{id}/`
Detalle completo de un pago.

---

#### `PATCH /api/v1/payments/{id}/`
Corregir método de pago.

**Permisos:** Admin / Operator

```json
{ "payment_method": "transfer" }
```

**Respuesta `200`:** Objeto completo actualizado.

---

#### `GET /api/v1/payments/summary/`
Resumen de pagos por mes.

**Query params:**
- `?year=2026` (default: año actual)
- `?month=4` (default: mes actual)

**Respuesta `200`:**
```json
{
  "period": "2026-04",
  "counts": {
    "total": 12,
    "paid": 10,
    "waived": 2
  },
  "amounts": {
    "collected": 3500,
    "waived": 700
  }
}
```

---

#### `GET /api/v1/payments/overdue/`
Lista alumnos con pagos vencidos.

**Respuesta `200`:** Array de pagos con `status: overdue`.

---

## Referencia rápida

| Método | Endpoint | Descripción |
|---|---|---|
| GET | `/api/v1/class-groups/` | Lista grupos |
| POST | `/api/v1/class-groups/` | Crear grupo |
| GET | `/api/v1/class-groups/{id}/` | Detalle grupo |
| PATCH | `/api/v1/class-groups/{id}/` | Editar grupo |
| DELETE | `/api/v1/class-groups/{id}/` | Eliminar grupo |
| GET | `/api/v1/enrollments/` | Lista inscripciones |
| POST | `/api/v1/enrollments/` | Inscribir alumno |
| GET | `/api/v1/enrollments/{id}/` | Detalle inscripción |
| PATCH | `/api/v1/enrollments/{id}/` | Editar inscripción |
| DELETE | `/api/v1/enrollments/{id}/` | Dar de baja alumno |
| GET | `/api/v1/payments/` | Lista pagos |
| POST | `/api/v1/payments/` | Registrar pago |
| GET | `/api/v1/payments/{id}/` | Detalle pago |
| PATCH | `/api/v1/payments/{id}/` | Corregir pago |
| GET | `/api/v1/payments/summary/` | Resumen del mes |
| GET | `/api/v1/payments/overdue/` | Pagos vencidos |

---

## Valores de referencia

### Niveles (`level`)
| Valor | Display |
|---|---|
| `all` | Todos los niveles |
| `beginner` | Principiante |
| `intermediate` | Intermedio |
| `advanced` | Avanzado |

### Días de la semana (`day_of_week`)
| Valor | Día |
|---|---|
| `0` | Lunes |
| `1` | Martes |
| `2` | Miércoles |
| `3` | Jueves |
| `4` | Viernes |
| `5` | Sábado |
| `6` | Domingo |

### Estado de inscripción (`status`)
| Valor | Display |
|---|---|
| `active` | Activo |
| `paused` | Pausado |
| `dropped` | Baja |

### Estado de pago (`status`)
| Valor | Display |
|---|---|
| `paid` | Pagado |
| `overdue` | Vencido |
| `waived` | Condonado |

### Método de pago (`payment_method`)
| Valor | Display |
|---|---|
| `cash` | Efectivo |
| `card` | Tarjeta |
| `transfer` | Transferencia |
| `other` | Otro |
