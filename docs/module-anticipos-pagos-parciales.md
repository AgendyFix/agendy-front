# Módulo: Anticipos y Pagos Parciales

## Resumen de cambios

### Nuevos campos en `Enrollment`

| Campo | Tipo | Descripción |
|---|---|---|
| `signup_fee_paid` | `int \| null` | Cuánto pagó de la inscripción. `null` = no ha pagado nada. |
| `signup_fee_balance` | `int` (read-only) | Saldo pendiente: `signup_fee - signup_fee_paid`. `0` si no hay inscripción o ya liquidó. |

### Nuevos campos en `Payment`

| Campo | Tipo | Descripción |
|---|---|---|
| `amount_paid` | `int \| null` | Cuánto pagó de la mensualidad. `null` = no ha pagado nada. |
| `balance` | `int` (read-only) | Saldo pendiente: `amount - amount_paid`. |

### Nuevo estado en `Payment.status`

| Valor | Label | Cuándo |
|---|---|---|
| `partial` | Pago parcial | `0 < amount_paid < amount` |
| `pending` | Pendiente | `amount_paid` es `null` o `0` |
| `paid` | Pagado | `amount_paid >= amount` |
| `overdue` | Vencido | Forzado por Celery o manualmente |
| `waived` | Condonado | Forzado manualmente |

El status se **calcula automáticamente** al enviar `amount_paid` en un PATCH. No es necesario enviarlo manualmente salvo para `waived` o `overdue`.

---

## Flujos y requests

### Flujo 1 — Crear alumno con anticipo de inscripción

**Caso:** Sofía se inscribe. La inscripción cuesta $500 pero solo trajo $300 hoy.

```
POST /api/v1/clients/
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Sofía",
  "last_name": "Ramírez",
  "contacts": [
    { "phone": "5569710243", "relationship": "mother", "receive_notifications": true }
  ],
  "enrollment": {
    "is_individual": true,
    "start_date": "2026-04-21",
    "custom_billing_day": 21,
    "custom_monthly_fee": 1200,
    "signup_fee": 500,
    "signup_fee_paid": 300,
    "disciplines": ["<uuid-guitarra>"]
  }
}
```

**Response 201:**
```json
{
  "id": "<uuid-sofia>",
  "name": "Sofía",
  "last_name": "Ramírez",
  ...
}
```

Para ver el saldo de inscripción, consultar el enrollment:

```
GET /api/v1/enrollments/<uuid-enrollment>/
```

**Response:**
```json
{
  "id": "<uuid-enrollment>",
  "client": { "id": "<uuid-sofia>", "name": "Sofía", ... },
  "signup_fee": 500,
  "signup_fee_paid": 300,
  "signup_fee_balance": 200,
  ...
}
```

> **En la UI:** mostrar junto al campo "Inscripción":
> `$500 — Pagado: $300 — Saldo: $200`

---

### Flujo 2 — Liquidar saldo de inscripción pendiente

**Caso:** Sofía paga los $200 restantes de su inscripción.

```
PATCH /api/v1/enrollments/<uuid-enrollment>/
Authorization: Bearer <token>
Content-Type: application/json

{
  "signup_fee_paid": 500
}
```

**Response 200:** el enrollment ahora muestra `signup_fee_balance: 0`.

---

### Flujo 3 — Registrar mensualidad con pago parcial

**Caso:** Omar Ortegón debía $1200 de abril pero solo pagó $600.

```
POST /api/v1/payments/
Authorization: Bearer <token>
Content-Type: application/json

{
  "enrollment": "<uuid-enrollment-omar>",
  "amount_paid": 600,
  "payment_date": "2026-04-20",
  "payment_method": "cash"
}
```

**Response 201:**
```json
{
  "id": "<uuid-payment>",
  "amount": 1200,
  "amount_paid": 600,
  "balance": 600,
  "status": "partial",
  "status_display": "Pago parcial",
  "payment_date": "2026-04-20",
  "payment_method": "cash",
  ...
}
```

> **En la UI:** mostrar con badge naranja "Pago parcial" y el saldo pendiente `$600`.

---

### Flujo 4 — Liquidar una mensualidad que estaba parcial

**Caso:** Omar paga los $600 restantes.

```
PATCH /api/v1/payments/<uuid-payment>/
Authorization: Bearer <token>
Content-Type: application/json

{
  "amount_paid": 1200,
  "payment_date": "2026-04-25",
  "payment_method": "cash"
}
```

**Response 200:**
```json
{
  "id": "<uuid-payment>",
  "amount": 1200,
  "amount_paid": 1200,
  "balance": 0,
  "status": "paid",
  "status_display": "Pagado",
  ...
}
```

El status cambia automáticamente a `paid` porque `amount_paid >= amount`.

---

### Flujo 5 — Actualizar mensualidad existente a pago parcial (PATCH)

**Caso:** Un pago que ya estaba en `pending` y el alumno paga algo.

```
PATCH /api/v1/payments/<uuid-payment>/
Authorization: Bearer <token>
Content-Type: application/json

{
  "amount_paid": 400
}
```

**Response 200:** `status` cambia automáticamente a `partial`.

---

### Flujo 6 — Condonar un pago (waived)

Para forzar un status que el backend no calcula automáticamente:

```
PATCH /api/v1/payments/<uuid-payment>/
Authorization: Bearer <token>
Content-Type: application/json

{
  "status": "waived"
}
```

**Response 200:** `status: "waived"`, `balance` no cambia (es informativo).

---

## Tabla de estados y colores sugeridos para la UI

| Status | Label | Color sugerido |
|---|---|---|
| `pending` | Pendiente | Amarillo |
| `partial` | Pago parcial | Naranja |
| `paid` | Pagado | Verde |
| `overdue` | Vencido | Rojo |
| `waived` | Condonado | Gris |

---

## Lógica de auto-cálculo de status (resumen)

El backend calcula el `status` automáticamente cuando se envía `amount_paid`:

```
amount_paid = null o 0  → pending
amount_paid > 0 y < amount → partial
amount_paid >= amount   → paid
status = 'waived'       → waived (siempre respetado)
status = 'overdue'      → overdue (siempre respetado)
```

El frontend **no necesita calcular ni enviar `status`** salvo para `waived`/`overdue`.

---

## Campos nuevos en responses existentes

### `GET /api/v1/enrollments/` y `GET /api/v1/enrollments/<id>/`

```json
{
  "signup_fee": 500,
  "signup_fee_paid": 300,
  "signup_fee_balance": 200
}
```

### `GET /api/v1/payments/` y `GET /api/v1/payments/<id>/`

```json
{
  "amount": 1200,
  "amount_paid": 600,
  "balance": 600,
  "status": "partial",
  "status_display": "Pago parcial"
}
```

Estos campos son **aditivos** — no rompen respuestas existentes.
