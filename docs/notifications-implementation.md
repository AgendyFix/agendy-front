# Sistema de Notificaciones - Implementación Frontend

## Resumen

Sistema completo de notificaciones en tiempo real usando WebSocket y REST API integrado en AgendyFix.

## Archivos Creados

### 1. Tipos TypeScript
- **[`lib/types/models.ts`](../lib/types/models.ts)** - Tipos para notificaciones, metadata y mensajes WebSocket

### 2. API REST
- **[`lib/api/notifications.ts`](../lib/api/notifications.ts)** - Cliente API para endpoints de notificaciones

### 3. WebSocket
- **[`lib/hooks/useWebSocket.ts`](../lib/hooks/useWebSocket.ts)** - Hook para manejo de conexión WebSocket con reconexión automática

### 4. Estado Global
- **[`lib/stores/notificationStore.ts`](../lib/stores/notificationStore.ts)** - Store Zustand para estado de notificaciones

### 5. Hook de Negocio
- **[`lib/hooks/useNotifications.ts`](../lib/hooks/useNotifications.ts)** - Hook principal que combina WebSocket + API + Store

### 6. Componentes UI
- **[`components/notifications/NotificationBell.tsx`](../components/notifications/NotificationBell.tsx)** - Icono de campana con badge
- **[`components/notifications/NotificationPanel.tsx`](../components/notifications/NotificationPanel.tsx)** - Panel dropdown con lista
- **[`components/notifications/NotificationItem.tsx`](../components/notifications/NotificationItem.tsx)** - Item individual de notificación

### 7. Integración
- **[`components/layout/Header.tsx`](../components/layout/Header.tsx)** - Integrado NotificationBell en header

### 8. Variables de Entorno
- **[`.env.local`](../.env.local)** - Variables para desarrollo
- **[`.env.production`](../.env.production)** - Variables para producción

## Dependencias a Instalar

```bash
pnpm add date-fns
```

Ya instaladas:
- `@radix-ui/react-scroll-area` ✅
- `@radix-ui/react-popover` ✅

## Variables de Entorno

### Desarrollo (`.env.local`)
```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
NEXT_PUBLIC_WS_URL=ws://localhost:8000
```

### Producción (`.env.production`)
```env
NEXT_PUBLIC_API_URL=https://us-api.agendyfix.com/api/v1
NEXT_PUBLIC_WS_URL=wss://us-api.agendyfix.com
```

## Funcionalidades Implementadas

### ✅ WebSocket
- Conexión automática al autenticarse
- Reconexión automática (máx 10 intentos)
- Manejo de errores (token inválido, sin company)
- Cleanup al desmontar componente

### ✅ REST API
- GET `/notifications/` - Listar notificaciones
- GET `/notifications/{id}/` - Detalle de notificación
- PATCH `/notifications/{id}/` - Marcar como leída
- GET `/notifications/unread-count/` - Contador de no leídas
- POST `/notifications/mark-all-read/` - Marcar todas como leídas

### ✅ UI/UX
- Badge con contador de no leídas
- Panel dropdown con scroll
- Indicador visual de no leídas
- Formato de tiempo relativo (hace X minutos)
- Toast notifications en tiempo real
- Click para navegar a la cita
- Marcar como leída automáticamente

### ✅ Estado
- Store Zustand para notificaciones
- Sincronización con WebSocket
- Fetch inicial al autenticarse
- Limpieza al cambiar de company

## Flujo de Funcionamiento

1. **Usuario se autentica** → [`useNotifications`](../lib/hooks/useNotifications.ts) se activa
2. **Fetch inicial** → Carga notificaciones existentes vía REST API
3. **WebSocket conecta** → Escucha notificaciones en tiempo real
4. **Nueva notificación** → 
   - Llega por WebSocket
   - Se agrega al store
   - Se muestra toast
   - Se actualiza badge
5. **Usuario hace click** →
   - Se marca como leída
   - Navega a la cita (si aplica)
   - Se actualiza UI

## Cómo Probar

### 1. Instalar dependencia faltante
```bash
pnpm add date-fns
```

### 2. Iniciar servidor de desarrollo
```bash
pnpm dev
```

### 3. Autenticarse en la app
- Login con usuario válido
- Seleccionar company

### 4. Verificar conexión WebSocket
- Abrir DevTools → Console
- Buscar: `[WebSocket] Connected`
- Buscar: `[Notifications] Connected to notifications for company: ...`

### 5. Crear una cita
- Ir a `/appointments/new`
- Crear una nueva cita
- Verificar que aparece notificación en tiempo real

### 6. Verificar UI
- Badge muestra contador de no leídas
- Click en campana abre panel
- Notificaciones no leídas tienen fondo azul
- Click en notificación marca como leída y navega

## Próximos Pasos

1. **Probar en producción** - Verificar WebSocket con WSS
2. **Optimizaciones** - Paginación infinita en panel
3. **Sonidos** - Agregar sonido opcional para notificaciones
4. **Preferencias** - Permitir al usuario configurar tipos de notificaciones
5. **Push Notifications** - Integrar service worker para notificaciones del navegador

## Troubleshooting

### WebSocket no conecta
- Verificar `NEXT_PUBLIC_WS_URL` en `.env.local`
- Verificar que backend está corriendo
- Verificar token JWT válido en localStorage

### No aparecen notificaciones
- Verificar que el usuario tiene `current_company` seleccionada
- Verificar permisos del usuario (admin vs operator)
- Verificar en Network tab que WebSocket está conectado

### Error de tipos TypeScript
- Ejecutar `pnpm install` para actualizar dependencias
- Verificar que `date-fns` está instalado

## Notas Técnicas

- **Reconexión**: Máximo 10 intentos con 3 segundos entre cada uno
- **Filtrado**: El backend filtra automáticamente por rol (admin/operator)
- **Timezone**: Las fechas se muestran en timezone del usuario
- **Performance**: Solo se cargan las últimas 50 notificaciones inicialmente
- **Seguridad**: Token JWT en query params del WebSocket (único método soportado por WebSocket API)
