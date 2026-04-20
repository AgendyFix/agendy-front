# Guía UX del módulo Academia — para frontend

Este documento consolida los endpoints y flujos necesarios para construir el dashboard de academias estilo **REGISTRO ALUMNOS + PAGOS + AGENDA** que el cliente piloto usaba en Word.

> **Audiencia**: equipo frontend.
> **Changelogs detallados por módulo**: ver `docs/changelogs/module-0X-*.md`.

---

## Arquitectura de datos

```
Company
 └── Disciplines[] (catálogo: Guitarra, Salsa, Bachata, ...)
 └── Employees[]
      └── disciplines[] (M2M)
      └── specialty (string, DEPRECADO)
 └── Clients[]  (alumnos)
      └── contacts[] (ClientContact: él mismo, mamá, papá, tutor)
      └── primary_contact_phone (derivado)
 └── ClassGroups[]
      ├── is_individual (bool)
      ├── monthly_fee (opcional si es individual)
      ├── instructor (FK Employee)
      ├── disciplines[] (M2M)
      └── schedules[] (ClassSchedule: día + hora)
 └── Enrollments[]
      ├── client (FK)
      ├── class_group (FK)
      ├── custom_monthly_fee (override del precio del grupo)
      ├── effective_monthly_fee (computed)
      ├── classes_per_week
      ├── signup_fee
      ├── disciplines[] (M2M)
      └── billing_day (derivado de start_date o custom)
 └── Payments[]
      └── enrollment (FK)
      └── amount, status, due_date, payment_date, payment_method
```

---

## Autenticación

Todos los endpoints requieren:
- Header: `Authorization: Bearer <access_token>`
- Company actual del usuario: el backend filtra por `current_company` (auto desde el JWT + estado de sesión)
- Para cambiar de company: `POST /api/v1/me/company/` con `{ company_id: "uuid" }`

---

## Feature flags (opcional — para ocultar/mostrar secciones)

```
GET /api/v1/features/me/
```

Response:
```json
{
  "features": [
    { "feature_slug": "class_management", "is_enabled": true },
    { "feature_slug": "enrollments", "is_enabled": true },
    { "feature_slug": "payment_tracking", "is_enabled": true },
    { "feature_slug": "disciplines_catalog", "is_enabled": true },
    { "feature_slug": "metabase_analytics", "is_enabled": true }
  ]
}
```

---

## 5 vistas principales

---

### 1. Vista "Disciplinas" (catálogo)

**Objetivo**: permitir al admin crear/editar el catálogo de instrumentos/estilos de su academia.

**Endpoints**:
- `GET /api/v1/disciplines/?ordering=name`
- `POST /api/v1/disciplines/` con `{ name, description?, metadata? }` (solo admin)
- `PATCH /api/v1/disciplines/{id}/` (solo admin)
- `DELETE /api/v1/disciplines/{id}/` → soft-delete

**Wireframe**: tabla simple
```
+----------+----------------------+------+-----------+
| Nombre   | Descripción          | Est. | Acciones  |
+----------+----------------------+------+-----------+
| Guitarra |                      | ✓    | ✏️ 🗑️    |
| Piano    |                      | ✓    | ✏️ 🗑️    |
| Bajo     |                      | ✓    | ✏️ 🗑️    |
+----------+----------------------+------+-----------+
   [+ Nueva disciplina]
```

**Quién ve qué**: admin = CRUD completo; instructor = solo lectura.

---

### 2. Vista "Alumnos" (equivalente al REGISTRO ALUMNOS.docx)

**Objetivo**: ver el listado de alumnos con todos los datos clave en una tabla.

**Endpoint principal**: `GET /api/v1/enrollments/?is_active=true&status=active`

Response (cada item):
```json
{
  "id": "uuid",
  "client": "uuid",
  "client_name": "Sofía",
  "client_phone": "5569710243",          // primary_contact_phone
  "class_group": "uuid",
  "class_group_name": "Clase individual - Sofía",
  "status": "active",
  "status_display": "Activo",
  "billing_day": 23,
  "monthly_fee": 1200,                    // alias de effective_monthly_fee
  "effective_monthly_fee": 1200,
  "custom_monthly_fee": null,
  "classes_per_week": 1,
  "signup_fee": null,
  "disciplines": [ { "id": "uuid", "name": "Guitarra" } ],
  "start_date": "2026-02-23",
  "is_active": true,
  "created_at": "..."
}
```

**Filtros útiles**:
- `?status=active|paused|dropped`
- `?class_group=<uuid>`
- `?client=<uuid>`
- `?search=nombre` (en nombre del alumno, teléfono, nombre del grupo)

**Wireframe**:
```
+-------------+-----------------+------+----------+------------+-----------+
| Alumno      | Disciplinas     | Día  | Mensual. | Contacto   | Estado    |
+-------------+-----------------+------+----------+------------+-----------+
| Sofía       | 🎸 Guitarra     | 23   | $1,200   | 5569710243 | Activo    |
| Pablo       | 🎸🥁 B+G+B     | 15   | $3,000   | —          | Activo    |
| Kiara       | 🎸 Guitarra(2)  | 21   | $2,000   | —          | Activo    |
+-------------+-----------------+------+----------+------------+-----------+
   [+ Nuevo alumno]
```

**Acciones**:
- Click en fila → detalle del alumno (modal o página)
- Filtrar por disciplina / instructor / estado
- Botón "+ Nuevo alumno" → wizard de registro

#### Detalle de alumno

Endpoint: `GET /api/v1/clients/{id}/` (nota: usar clients para info del alumno, enrollments para info académica)

Response extendido (Detail):
```json
{
  "id": "uuid",
  "name": "Sofía",
  "last_name": "",
  "full_name": "Sofía",
  "email": null,
  "phone": null,
  "primary_contact_phone": "5569710243",
  "birth_date": "2014-05-12",
  "notes": "",
  "is_active": true,
  "contacts": [
    {
      "id": "uuid",
      "name": "Lorna",
      "phone": "5569710243",
      "relationship": "mother",
      "relationship_display": "Madre",
      "is_primary": true,
      "is_active": true
    }
  ],
  "primary_contact": { ... },
  "total_appointments": 0,
  ...
}
```

**Subtab "Contactos"**:
```
+--------+--------------+--------+-----------+
| Nombre | Teléfono     | Rel.   | Principal |
+--------+--------------+--------+-----------+
| Lorna  | 5569710243   | Madre  | ⭐         |
| Sofía  | —            | Alumna |            |
+--------+--------------+--------+-----------+
   [+ Agregar contacto]
```

Endpoints de contactos:
- `GET /api/v1/client-contacts/?client=<uuid>`
- `POST /api/v1/client-contacts/` (solo admin)
- `PATCH /api/v1/client-contacts/{id}/`
- `DELETE /api/v1/client-contacts/{id}/` → soft-delete

**Regla importante**: si `is_primary=true` al crear/editar, los demás contactos del mismo cliente se desmarcan automáticamente en el backend.

#### Wizard "Nuevo alumno"

Opción A — **individual (música)**:
1. Datos del alumno: `name`, `last_name?`, `birth_date?`, `notes?` → POST a `/clients/`
2. Contactos (obligatorio al menos uno): `POST /client-contacts/` con `is_primary=true` en el primero
3. ClassGroup: crear con `is_individual=true`, `name="Clase individual - {name}"`, `monthly_fee=null`
4. Enrollment: `POST /enrollments/` con `custom_monthly_fee`, `classes_per_week`, `disciplines`, `start_date`
5. Horarios: agregar schedules vía `PATCH /class-groups/{id}/` con el array `schedules`

Opción B — **grupal (salsa)**:
1-2. Iguales
3. ClassGroup: elegir existente (filtrar por `is_individual=false`)
4. Enrollment: `POST /enrollments/` (sin `custom_monthly_fee`, hereda del grupo)

---

### 3. Vista "Pagos mensuales" (equivalente al REGISTRO PAGOS MENSUALES.docx)

**Objetivo**: tabla pivote alumnos × meses con estado de pago.

**Endpoint**: `GET /api/v1/payments/matrix/?year=2026&month_from=1&month_to=12`

Response: ver `module-06-matrix-agenda.md`.

**Wireframe**:
```
+--------------+---------+---------+---------+---------+---------+
| Alumno       | Enero   | Feb     | Mar     | Abril   | Mayo    |
+--------------+---------+---------+---------+---------+---------+
| Sofía        | ✓ 23/01 | ✓ 23/02 | ✓ 01/03 | ⚠ venc. |   —     |
| Pablo        | ✓ 15/01 | ✓ 15/02 | ✓ 15/03 | ⚠ venc. |   —     |
| Adela        |   —     | ✓ 06/03 | 🟡 pend.|   —     |   —     |
+--------------+---------+---------+---------+---------+---------+
```

**Colores por status**:
- 🟢 verde: `paid`
- 🟡 amarillo: `pending`
- 🔴 rojo: `overdue`
- ⚪ gris: `waived`
- vacío: no hay payment (`null`)

**Acción en celda**:
- Click → modal "Registrar pago":
  - `POST /api/v1/payments/` con `{ enrollment, payment_date, payment_method, amount? }`
- Si ya hay payment → mostrar detalle + botón "Editar método" o "Anular"

---

### 4. Vista "Agenda" (equivalente al AGENDA.docx)

**Objetivo**: matriz día × hora con todos los slots de clase.

**Endpoint**: `GET /api/v1/agenda/`

Response: ver `module-06-matrix-agenda.md`.

**Wireframe**:
```
+---------+---------+---------+---------+---------+---------+---------+
| Hora    | Lunes   | Martes  | Miérc.  | Jueves  | Viern.  | Sábado  |
+---------+---------+---------+---------+---------+---------+---------+
| 9-10am  |         |         |         |         |         | Angel   |
|         |         |         |         |         |         | (bat.)  |
|         |         |         |         |         |         | Esteban |
|         |         |         |         |         |         | (bajo)  |
+---------+---------+---------+---------+---------+---------+---------+
| 4-5pm   | Sofía   | Inicia. | Héctor  | Inicia. | Andrea  |         |
|         | (guit.) |         | (acus.) | Lupita  | (bat.)  |         |
+---------+---------+---------+---------+---------+---------+---------+
```

**Filtros útiles**:
- `?instructor=<uuid>` — ver solo los slots de un instructor
- `?is_individual=true` — solo clases individuales
- `?discipline=<uuid>` — solo los grupos de una disciplina

**Color-coding sugerido**: cada instructor un color de fondo distinto.

**Acción en celda**:
- Click en un chip → abrir detalle del alumno/grupo (mini popover)
- Click en celda vacía → "Agregar horario" (requiere elegir un ClassGroup existente)

---

### 5. Vista "Instructores"

**Objetivo**: gestionar instructores con sus disciplinas.

**Endpoints**:
- `GET /api/v1/employees/?role=instructor`
- `POST /api/v1/employees/` con `{ first_name, last_name, phone, email, disciplines[uuid, uuid] }`
- `PATCH /api/v1/employees/{id}/` con `{ disciplines: [...] }`

**Wireframe**:
```
+-------------+----------+-----------------+------------+--------+
| Nombre      | Teléfono | Disciplinas     | Email      | Activo |
+-------------+----------+-----------------+------------+--------+
| Juan Pérez  | 555-1111 | 🎸 🎹 🎷        | j@acad.mx  | ✓      |
| María López | 555-2222 | 🎼 Canto        | —          | ✓      |
+-------------+----------+-----------------+------------+--------+
   [+ Nuevo instructor]
```

**Form nuevo/editar**: campo `disciplines` → multi-select de `/api/v1/disciplines/`.

---

## Resumen de endpoints nuevos (TL;DR)

| Método | Path | Módulo |
|---|---|---|
| GET/POST/PATCH/DELETE | `/api/v1/disciplines/` | 1 |
| GET/POST/PATCH/DELETE | `/api/v1/client-contacts/` | 2 |
| GET | `/api/v1/payments/matrix/?year=X` | 6 |
| GET | `/api/v1/agenda/` | 6 |

## Endpoints existentes con cambios

| Endpoint | Cambio |
|---|---|
| `/api/v1/clients/*` | `phone` nullable + `primary_contact_phone`, `birth_date`, `notes`, `contacts[]` |
| `/api/v1/enrollments/*` | `custom_monthly_fee`, `effective_monthly_fee`, `classes_per_week`, `signup_fee`, `disciplines[]` |
| `/api/v1/class-groups/*` | `is_individual`, `disciplines[]`, `primary_client`, `monthly_fee` nullable |
| `/api/v1/employees/*` | `disciplines[]` M2M; `specialty` DEPRECADO |
| `/api/v1/payments/*` | `disciplines_display[]`, `client_phone` usa primary_contact_phone |

---

## Orden recomendado de implementación frontend

Para maximizar el valor entregado al cliente rápido:

1. **Módulo 1 → Vista "Disciplinas"** (~2h) — simple CRUD, base de todo lo demás
2. **Módulo 2 → Sección "Contactos" en detalle de alumno** (~4h) — resuelve el dolor real del cliente
3. **Módulo 3+4 → Wizard de "Nuevo alumno" individual** (~1 día) — feature principal de la demo
4. **Módulo 6 → Vista "Pagos mensuales" (matrix)** (~1 día) — el Excel más usado
5. **Módulo 6 → Vista "Agenda"** (~6h) — wow factor visual
6. **Módulo 5 → Form de "Instructor" con disciplines** (~2h) — polish

Total estimado: 3-4 días de frontend para tener algo sólido para la demo.

---

## Testing sugerido

Antes de la demo:
1. Correr migraciones (ver más abajo)
2. Correr backfill de contactos
3. Correr backfill de disciplines de employees (si hay data legacy)
4. Importar los 3 docx del cliente con `--dry-run` primero, luego real
5. Validar en admin Django que todo se creó correctamente
6. Hacer las 5 vistas del frontend consumiendo los endpoints

---

## Migraciones a correr (en orden)

```bash
# 1. Aplicar las 5 migraciones nuevas
python manage.py migrate companies

# 2. Backfill de contactos (convierte client.phone → ClientContact self+primary)
python manage.py backfill_client_contacts --dry-run
python manage.py backfill_client_contacts

# 3. Backfill de disciplines en employees (opcional, solo si había specialty previo)
python manage.py backfill_employee_disciplines --dry-run
python manage.py backfill_employee_disciplines

# 4. Importar datos del cliente piloto
python manage.py import_academy_excel \
    --company-id=<uuid> \
    --alumnos=files-example/REGISTRO_ALUMNOS.docx \
    --pagos=files-example/REGISTRO_PAGOS_MENSUALES.docx \
    --agenda=files-example/AGENDA.docx \
    --year=2026 \
    --dry-run

# 5. Si el dry-run está OK, correr sin --dry-run
```
