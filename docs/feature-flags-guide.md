# Feature Flags - Guía de Implementación

## Descripción General

Sistema de feature flags para habilitar/deshabilitar módulos por compañía desde el Django admin. Permite control granular de funcionalidades sin necesidad de desplegar código.

## Arquitectura

### Backend (Django)
- **Endpoint**: `GET /api/v1/features/me/`
- **Autenticación**: JWT Bearer token requerido
- **Scope**: Retorna features de la compañía actual del usuario

### Frontend (Next.js)
- **Store**: Zustand (`lib/stores/featureStore.ts`)
- **API Client**: `lib/api/features.ts`
- **Hook**: `lib/hooks/useFeatures.ts`
- **Provider**: `components/features/FeaturesProvider.tsx`

## Estructura de Datos

### Response del API

```typescript
{
  "features": [
    {
      "slug": "appointments",
      "name": "Gestión de Citas",
      "description": "Módulo de appointments con calendario, servicios y seguimiento",
      "is_enabled": true,
      "config": {}
    },
    {
      "slug": "reminders",
      "name": "Recordatorios",
      "description": "Sistema de recordatorios automáticos (WhatsApp, Email, SMS)",
      "is_enabled": true,
      "config": {}
    },
    {
      "slug": "client_groups",
      "name": "Grupos de Clientes",
      "description": "Segmentación de clientes para envío masivo de recordatorios",
      "is_enabled": true,
      "config": {}
    },
    {
      "slug": "teams",
      "name": "Equipos de Trabajo",
      "description": "Gestión de equipos y asignación de empleados",
      "is_enabled": true,
      "config": {}
    },
    {
      "slug": "metabase_analytics",
      "name": "Analytics con Metabase",
      "description": "Dashboards de Metabase con métricas y reportes",
      "is_enabled": true,
      "config": {
        "dashboards": {
          "dashboard-general": {
            "id": "2",
            "name": "Dashboard General",
            "description": "Dashboard principal con métricas generales"
          },
          "dashboard-reminders": {
            "id": "5",
            "name": "Dashboard de Recordatorios",
            "description": "Dashboard enfocado en recordatorios"
          },
          "dashboard-appointments": {
            "id": "3",
            "name": "Dashboard de Citas",
            "description": "Dashboard enfocado en appointments"
          }
        },
        "active_dashboard": "dashboard-general"
      }
    }
  ]
}
```

## Mapeo de Features a Módulos

| Feature Slug | Módulos del Frontend | Rutas Afectadas |
|--------------|---------------------|------------------|
| `appointments` | Citas, Servicios | `/appointments`, `/services` |
| `client_groups` | Clientes, Grupos | `/clients` |
| `teams` | Equipos, Empleados | `/teams`, `/employees` |
| `reminders` | Recordatorios | `/reminders` |
| `metabase_analytics` | Dashboard | `/` (dashboard principal) |

## Uso en el Frontend

### 1. Verificar si un Feature está Habilitado

```typescript
import { useFeatures } from "@/lib/hooks/useFeatures";

function MyComponent() {
  const { isFeatureEnabled } = useFeatures();
  
  if (!isFeatureEnabled("appointments")) {
    return <div>Módulo no disponible</div>;
  }
  
  return <div>Contenido del módulo</div>;
}
```

### 2. Obtener Configuración de un Feature

```typescript
import { useFeatures } from "@/lib/hooks/useFeatures";

function DashboardComponent() {
  const { getFeatureConfig } = useFeatures();
  
  const metabaseConfig = getFeatureConfig<{
    dashboards: Record<string, any>;
    active_dashboard: string;
  }>("metabase_analytics");
  
  if (!metabaseConfig) {
    return <div>Dashboard no configurado</div>;
  }
  
  const activeDashboard = metabaseConfig.dashboards[metabaseConfig.active_dashboard];
  
  return <div>Dashboard: {activeDashboard.name}</div>;
}
```

### 3. Sidebar con Feature Flags

El [`Sidebar`](components/layout/Sidebar.tsx) ya está configurado para filtrar items según feature flags:

```typescript
const navigation = [
  {
    name: "Citas",
    href: "/appointments",
    icon: Calendar,
    featureFlag: "appointments", // Se oculta si no está habilitado
  },
  // ...
];
```

### 4. Proteger Rutas Completas

Para páginas que dependen de un feature:

```typescript
// app/(dashboard)/appointments/page.tsx
"use client";

import { useFeatures } from "@/lib/hooks/useFeatures";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AppointmentsPage() {
  const { isFeatureEnabled } = useFeatures();
  const router = useRouter();
  
  useEffect(() => {
    if (!isFeatureEnabled("appointments")) {
      router.push("/");
    }
  }, [isFeatureEnabled, router]);
  
  if (!isFeatureEnabled("appointments")) {
    return null;
  }
  
  return <div>Appointments content</div>;
}
```

## Estado Actual (v1.0)

### ✅ Implementado
- [x] Types para features (`lib/types/models.ts`)
- [x] API client (`lib/api/features.ts`)
- [x] Zustand store (`lib/stores/featureStore.ts`)
- [x] Custom hook (`lib/hooks/useFeatures.ts`)
- [x] Provider component (`components/features/FeaturesProvider.tsx`)
- [x] Integración en Sidebar (`components/layout/Sidebar.tsx`)
- [x] Carga automática en dashboard layout

### 🔄 Validación Actual
- Solo se valida `is_enabled: true/false`
- El campo `config` se retorna pero no se usa activamente

## Roadmap Futuro

### Fase 2: Configuración Avanzada
- [ ] Usar `config` para personalizar comportamiento de módulos
- [ ] Dashboards dinámicos según `metabase_analytics.config`
- [ ] Límites de uso por feature (ej: max 100 clientes en plan básico)
- [ ] Features con fecha de expiración

### Fase 3: UI de Gestión
- [ ] Página de administración de features en el frontend
- [ ] Preview de cambios antes de aplicar
- [ ] Historial de cambios de features

### Fase 4: Analytics
- [ ] Tracking de uso de features
- [ ] Métricas de adopción por compañía
- [ ] A/B testing de features

## Consideraciones Técnicas

### Performance
- Features se cargan una vez al iniciar sesión
- Se recargan al cambiar de compañía
- No hay polling automático (considerar WebSocket para updates en tiempo real)

### Caché
- Features se almacenan en Zustand (memoria)
- Se pierden al refrescar la página (se recargan automáticamente)
- Considerar localStorage para persistencia si es necesario

### Seguridad
- Validación en backend es OBLIGATORIA
- Frontend solo oculta UI, no previene acceso directo a APIs
- Siempre validar permisos en el backend

### Testing
```typescript
// Ejemplo de test
import { renderHook } from "@testing-library/react";
import { useFeatures } from "@/lib/hooks/useFeatures";

test("should check if feature is enabled", () => {
  const { result } = renderHook(() => useFeatures());
  
  // Mock features
  result.current.features = [
    { slug: "appointments", is_enabled: true, ... }
  ];
  
  expect(result.current.isFeatureEnabled("appointments")).toBe(true);
  expect(result.current.isFeatureEnabled("unknown")).toBe(false);
});
```

## Troubleshooting

### Features no se cargan
1. Verificar que el usuario esté autenticado
2. Verificar que tenga una compañía seleccionada
3. Revisar console para errores de API
4. Verificar que el endpoint `/api/v1/features/me/` esté disponible

### Sidebar muestra items deshabilitados
1. Verificar que `FeaturesProvider` esté en el layout
2. Verificar que features se hayan cargado (`useFeatures().features`)
3. Revisar mapeo de `featureFlag` en navigation array

### Config no se obtiene correctamente
1. Verificar tipo genérico en `getFeatureConfig<T>()`
2. Verificar estructura del `config` en el response del API
3. Manejar caso cuando config es `null` o `undefined`

## Contacto y Soporte

Para dudas o mejoras, contactar al equipo de desarrollo.