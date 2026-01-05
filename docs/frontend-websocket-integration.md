# WebSocket Notifications - Frontend Integration Guide

## Overview

Sistema de notificaciones en tiempo real usando WebSockets. Cuando se crea/actualiza una cita, los usuarios reciben notificaciones instantáneas.

## WebSocket Endpoint

```
wss://us-api.agendyfix.com/ws/notifications/?token={JWT_ACCESS_TOKEN}
```

**Desarrollo:**
```
ws://localhost:8000/ws/notifications/?token={JWT_ACCESS_TOKEN}
```

## Authentication

El WebSocket requiere JWT token en query params:

```typescript
const accessToken = localStorage.getItem('access_token');
const wsUrl = `wss://us-api.agendyfix.com/ws/notifications/?token=${accessToken}`;
const socket = new WebSocket(wsUrl);
```

## Message Types

### 1. Connection Established

Recibido al conectar exitosamente:

```json
{
  "type": "connection_established",
  "message": "Connected to notifications for company: Doctor Iphone"
}
```

### 2. Notification

Recibido cuando hay una nueva notificación:

```json
{
    "type": "notification",
    "data": {
        "id": 2,
        "notification_type": "appointment_created",
        "notification_type_display": "Cita creada",
        "title": "Nueva cita creada",
        "description": "Se ha creado una nueva cita: Paul Mena Zapata - Reparacion de pantalla - iphone",
        "metadata": {
            "appointment_id": "66470c49-db9c-4fa2-8443-70a982b9ae36",
            "appointment_title": "reparacion de pantalla",
            "client_name": "Paul Mena Zapata",
            "service_name": "Reparacion de pantalla - iphone",
            "start_at": "2026-01-05T08:23:53-06:00",
            "status": "pending"
        },
        "is_read": false,
        "created_at": "2026-01-05T14:24:07.032981+00:00",
        "user_id": 11,
        "company_id": "8d80de9a-b922-44ef-b73d-e272a629d9b2"
    }
}
```

## Notification Types

| Type | Display | Descripción |
|------|---------|-------------|
| `appointment_created` | Cita creada | Nueva cita asignada |
| `appointment_updated` | Cita actualizada | Cita modificada |
| `appointment_cancelled` | Cita cancelada | Cita cancelada |
| `appointment_confirmed` | Cita confirmada | Cita confirmada |

## REST API Endpoints

Además del WebSocket, puedes consultar el historial de notificaciones:

### Get Notifications

```http
GET https://us-api.agendyfix.com/api/v1/notifications/
Authorization: Bearer {access_token}
```

**Response:**

```json
{
    "count": 1,
    "next": null,
    "previous": null,
    "results": [
        {
            "id": 2,
            "notification_type": "appointment_created",
            "notification_type_display": "Cita creada",
            "title": "Nueva cita creada",
            "description": "Se ha creado una nueva cita: Paul Mena Zapata - Reparacion de pantalla - iphone",
            "metadata": {
                "status": "pending",
                "start_at": "2026-01-05T08:23:53-06:00",
                "client_name": "Paul Mena Zapata",
                "service_name": "Reparacion de pantalla - iphone",
                "appointment_id": "66470c49-db9c-4fa2-8443-70a982b9ae36",
                "appointment_title": "reparacion de pantalla"
            },
            "is_read": false,
            "company": "8d80de9a-b922-44ef-b73d-e272a629d9b2",
            "company_name": "Doctor Iphone",
            "user": 11,
            "user_name": "Javier Bañuelos",
            "created_at": "2026-01-05T08:24:07.032981-06:00",
            "updated_at": "2026-01-05T08:24:07.033003-06:00"
        }
    ]
}
```

### Mark as Read

```http
PATCH https://us-api.agendyfix.com/api/v1/notifications/{id}/
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "is_read": true
}
```

### get specific notification
get /notifications/{id}/

response:

{
    "id": 2,
    "notification_type": "appointment_created",
    "notification_type_display": "Cita creada",
    "title": "Nueva cita creada",
    "description": "Se ha creado una nueva cita: Paul Mena Zapata - Reparacion de pantalla - iphone",
    "metadata": {
        "status": "pending",
        "start_at": "2026-01-05T08:23:53-06:00",
        "client_name": "Paul Mena Zapata",
        "service_name": "Reparacion de pantalla - iphone",
        "appointment_id": "66470c49-db9c-4fa2-8443-70a982b9ae36",
        "appointment_title": "reparacion de pantalla"
    },
    "is_read": false,
    "company": {
        "id": "8d80de9a-b922-44ef-b73d-e272a629d9b2",
        "name": "Doctor Iphone"
    },
    "user": {
        "id": 11,
        "username": "javier@gmail.com",
        "email": "javier@gmail.com",
        "first_name": "Javier",
        "last_name": "Bañuelos",
        "full_name": "Javier Bañuelos",
        "is_active": true,
        "date_joined": "2026-01-02T12:40:14.133354-06:00"
    },
    "status": "unread",
    "datetime_notification": null,
    "created_at": "2026-01-05T08:24:07.032981-06:00",
    "updated_at": "2026-01-05T08:24:07.033003-06:00"
}

### get number for unread notifications
GET /notifications/unread-count/

### mark all notifications as a read
POST /notifications/mark-all-read/



## User Roles & Filtering

El backend ya filtra automáticamente:

- **Admin**: Recibe TODAS las notificaciones de su company
- **Operator**: Solo recibe notificaciones donde él es el destinatario (assigned_to)

No necesitas filtrar en el frontend, solo mostrar lo que llega.

## Error Handling

### Token Expired

Si el token expira, el WebSocket se cierra con código 4001:

```typescript
ws.onclose = (event) => {
  if (event.code === 4001) {
    // Token inválido, refrescar token y reconectar
    refreshToken().then(() => {
      // Reconectar WebSocket
    });
  }
};
```

### No Company Selected

Si el usuario no tiene `current_company`, se cierra con código 4003:

```typescript
ws.onclose = (event) => {
  if (event.code === 4003) {
    // Redirigir a selección de company
    router.push('/select-company');
  }
};
```

## Best Practices

1. **Reconexión automática**: Implementar retry logic si se pierde la conexión
2. **Cleanup**: Cerrar WebSocket al desmontar componente
3. **Token refresh**: Manejar expiración de token y reconectar
4. **Optimistic UI**: Mostrar notificación inmediatamente, no esperar confirmación
5. **Persistencia**: Guardar notificaciones en estado global (Zustand, Redux, etc.)
