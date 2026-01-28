# Plan de Implementación: Frontend Público de Reservas (White Label)

## 📋 Resumen Ejecutivo

**Objetivo**: Crear un frontend público para que clientes finales puedan agendar citas directamente, con marca blanca personalizada por empresa (subdomain).

**Recomendación**: **SÍ, crear un frontend separado** es la mejor opción por razones de seguridad, rendimiento y mantenibilidad.

---

## 🎯 Arquitectura Recomendada

### Opción A: Frontend Separado (✅ RECOMENDADO)

```
┌─────────────────────────────────────────────────────────────┐
│                    ARQUITECTURA PROPUESTA                    │
└─────────────────────────────────────────────────────────────┘

┌──────────────────────┐         ┌──────────────────────┐
│  Admin Dashboard     │         │  Public Booking      │
│  (Actual)            │         │  (Nuevo)             │
│                      │         │                      │
│  admin.agendyfix.com │         │  *.agendyfix.com     │
│  /dashboard          │         │  /book               │
│                      │         │                      │
│  - Gestión completa  │         │  - Solo agendar      │
│  - Autenticación JWT │         │  - Sin auth          │
│  - Roles: admin/op   │         │  - Público           │
└──────────┬───────────┘         └──────────┬───────────┘
           │                                │
           │                                │
           └────────────┬───────────────────┘
                        │
                        ▼
           ┌────────────────────────┐
           │   Backend API Django   │
           │   api.agendyfix.com    │
           │                        │
           │  - Endpoints públicos  │
           │  - Endpoints privados  │
           │  - Multi-tenant        │
           └────────────────────────┘
```

### Ventajas de Frontend Separado

✅ **Seguridad**
- Código admin completamente aislado
- No expones lógica de negocio sensible
- Diferentes políticas de CORS
- Menor superficie de ataque

✅ **Rendimiento**
- Bundle más pequeño (solo lo necesario)
- Optimización específica para público
- Mejor SEO para cada empresa
- Carga más rápida

✅ **Mantenibilidad**
- Código más limpio y enfocado
- Deploys independientes
- Testing más simple
- Menos riesgo de romper admin

✅ **Escalabilidad**
- Puede estar en CDN diferente
- Caché más agresivo
- Diferentes estrategias de deploy

---

## 🏗️ Estructura del Proyecto

### Repositorios Sugeridos

```
agendyfix/
├── agendy-admin/          # Frontend actual (admin)
├── agendy-booking/        # Frontend nuevo (público)
└── agendy-backend/        # Backend Django (actual)
```

### Estructura del Frontend Público

```
agendy-booking/
├── app/
│   ├── [subdomain]/           # Rutas dinámicas por subdomain
│   │   ├── page.tsx          # Landing page personalizada
│   │   ├── services/         # Catálogo de servicios
│   │   ├── book/             # Formulario de reserva
│   │   └── confirmation/     # Confirmación de cita
│   ├── layout.tsx            # Layout base
│   └── not-found.tsx         # 404 personalizado
├── components/
│   ├── booking/
│   │   ├── ServiceSelector.tsx
│   │   ├── DateTimePicker.tsx
│   │   ├── ClientForm.tsx
│   │   └── BookingSummary.tsx
│   ├── branding/
│   │   ├── CompanyHeader.tsx
│   │   ├── CompanyFooter.tsx
│   │   └── ThemeProvider.tsx
│   └── ui/                   # Componentes reutilizables
├── lib/
│   ├── api/
│   │   ├── public.ts         # API pública (sin auth)
│   │   └── booking.ts        # Lógica de reservas
│   ├── hooks/
│   │   ├── useCompany.ts     # Hook para datos de empresa
│   │   └── useBooking.ts     # Hook para proceso de reserva
│   └── utils/
│       ├── subdomain.ts      # Extracción de subdomain
│       └── validation.ts     # Validaciones
└── public/
    └── default-assets/       # Assets por defecto
```

---

## 🔐 Consideraciones de Seguridad

### 1. Endpoints Públicos en Backend

```python
# backend/api/views/public.py

class PublicCompanyView(APIView):
    """
    Endpoint público para obtener info de empresa
    NO requiere autenticación
    """
    permission_classes = [AllowAny]
    throttle_classes = [AnonRateThrottle]  # Rate limiting
    
    def get(self, request, subdomain):
        # Solo devolver datos públicos
        company = Company.objects.filter(
            subdomain=subdomain,
            is_active=True,
            is_public_booking=True  # Flag importante
        ).first()
        
        if not company:
            return Response(status=404)
        
        # SOLO datos públicos
        return Response({
            'name': company.name,
            'description': company.description,
            'phone': company.phone,
            'email': company.email,
            'logo_url': company.logo_url,
            'primary_color': company.primary_color,
            'secondary_color': company.secondary_color,
        })

class PublicServicesView(APIView):
    """
    Servicios disponibles para reserva pública
    """
    permission_classes = [AllowAny]
    throttle_classes = [AnonRateThrottle]
    
    def get(self, request, subdomain):
        company = get_company_by_subdomain(subdomain)
        
        # Solo servicios marcados como reservables online
        services = Service.objects.filter(
            company=company,
            is_active=True,
            is_bookable_online=True  # Flag importante
        )
        
        return Response(ServiceSerializer(services, many=True).data)

class PublicBookingView(APIView):
    """
    Crear cita desde frontend público
    """
    permission_classes = [AllowAny]
    throttle_classes = [AnonRateThrottle]  # Importante: rate limiting
    
    def post(self, request, subdomain):
        company = get_company_by_subdomain(subdomain)
        
        # Validaciones estrictas
        serializer = PublicBookingSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        # Verificar disponibilidad
        if not is_slot_available(
            company, 
            serializer.validated_data['service'],
            serializer.validated_data['start_at']
        ):
            return Response(
                {'error': 'Horario no disponible'},
                status=400
            )
        
        # Crear cita con source='public'
        appointment = Appointment.objects.create(
            company=company,
            source='public',  # Importante para tracking
            status='pending',  # Siempre pending
            **serializer.validated_data
        )
        
        # Enviar notificación al admin
        send_new_booking_notification(appointment)
        
        return Response(
            AppointmentSerializer(appointment).data,
            status=201
        )
```

### 2. Rate Limiting Agresivo

```python
# settings.py

REST_FRAMEWORK = {
    'DEFAULT_THROTTLE_RATES': {
        'anon': '10/minute',      # Público: muy restrictivo
        'user': '100/minute',     # Admin: más permisivo
        'booking': '3/minute',    # Crear citas: muy restrictivo
    }
}
```

### 3. Validaciones en Frontend

```typescript
// lib/validation/booking.ts

export const bookingSchema = z.object({
  service: z.string().uuid(),
  start_at: z.string().datetime(),
  client: z.object({
    name: z.string().min(2).max(100),
    last_name: z.string().min(2).max(100),
    email: z.string().email(),
    phone: z.string().regex(/^\+?[1-9]\d{1,14}$/), // E.164 format
  }),
  notes: z.string().max(500).optional(),
}).refine((data) => {
  // No permitir fechas pasadas
  const appointmentDate = new Date(data.start_at);
  return appointmentDate > new Date();
}, {
  message: "No se pueden agendar citas en el pasado",
});
```

### 4. Protección CSRF y CORS

```python
# settings.py

# CORS para frontend público
CORS_ALLOWED_ORIGINS = [
    'https://admin.agendyfix.com',      # Admin
    'https://*.agendyfix.com',          # Subdomains públicos
]

# CSRF solo para admin
CSRF_TRUSTED_ORIGINS = [
    'https://admin.agendyfix.com',
]

# Endpoints públicos sin CSRF
CSRF_EXEMPT_URLS = [
    r'^api/v1/public/',
]
```

---

## 🎨 Sistema de White Label

### 1. Detección de Subdomain

```typescript
// lib/utils/subdomain.ts

export function getSubdomain(): string | null {
  if (typeof window === 'undefined') return null;
  
  const hostname = window.location.hostname;
  
  // Desarrollo local
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    // Leer de query param: ?subdomain=acme-plomeria
    const params = new URLSearchParams(window.location.search);
    return params.get('subdomain');
  }
  
  // Producción: extraer subdomain
  // acme-plomeria.agendyfix.com -> acme-plomeria
  const parts = hostname.split('.');
  if (parts.length >= 3) {
    return parts[0];
  }
  
  return null;
}
```

### 2. Carga de Configuración de Empresa

```typescript
// lib/hooks/useCompany.ts

export function useCompany() {
  const subdomain = getSubdomain();
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!subdomain) {
      setError('Subdomain no válido');
      setLoading(false);
      return;
    }

    async function loadCompany() {
      try {
        const response = await fetch(
          `${API_URL}/public/companies/${subdomain}/`
        );
        
        if (!response.ok) {
          throw new Error('Empresa no encontrada');
        }
        
        const data = await response.json();
        setCompany(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    loadCompany();
  }, [subdomain]);

  return { company, loading, error };
}
```

### 3. Theming Dinámico

```typescript
// components/branding/ThemeProvider.tsx

export function CompanyThemeProvider({ 
  children,
  company 
}: { 
  children: React.ReactNode;
  company: Company;
}) {
  useEffect(() => {
    // Aplicar colores de la empresa
    document.documentElement.style.setProperty(
      '--primary', 
      company.primary_color || '#3B82F6'
    );
    document.documentElement.style.setProperty(
      '--secondary', 
      company.secondary_color || '#10B981'
    );
    
    // Actualizar favicon
    const favicon = document.querySelector("link[rel='icon']");
    if (favicon && company.favicon_url) {
      favicon.setAttribute('href', company.favicon_url);
    }
    
    // Actualizar título
    document.title = `Reservar - ${company.name}`;
  }, [company]);

  return <>{children}</>;
}
```

---

## 🚀 Flujo de Reserva

### Paso 1: Landing Page

```typescript
// app/[subdomain]/page.tsx

export default function BookingLandingPage() {
  const { company, loading, error } = useCompany();

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorPage message={error} />;
  if (!company) return <NotFoundPage />;

  return (
    <CompanyThemeProvider company={company}>
      <div className="min-h-screen">
        <CompanyHeader company={company} />
        
        <Hero 
          title={`Agenda tu cita con ${company.name}`}
          description={company.description}
          image={company.hero_image_url}
        />
        
        <ServicesSection companyId={company.id} />
        
        <CTASection 
          text="¿Listo para agendar?"
          buttonText="Reservar ahora"
          href={`/${company.subdomain}/book`}
        />
        
        <CompanyFooter company={company} />
      </div>
    </CompanyThemeProvider>
  );
}
```

### Paso 2: Selección de Servicio

```typescript
// app/[subdomain]/book/page.tsx

export default function BookingPage() {
  const { company } = useCompany();
  const [step, setStep] = useState<'service' | 'datetime' | 'client' | 'confirm'>('service');
  const [booking, setBooking] = useState<Partial<Booking>>({});

  return (
    <BookingWizard>
      {step === 'service' && (
        <ServiceSelector
          companyId={company.id}
          onSelect={(service) => {
            setBooking({ ...booking, service });
            setStep('datetime');
          }}
        />
      )}
      
      {step === 'datetime' && (
        <DateTimePicker
          service={booking.service}
          onSelect={(datetime) => {
            setBooking({ ...booking, start_at: datetime });
            setStep('client');
          }}
        />
      )}
      
      {step === 'client' && (
        <ClientForm
          onSubmit={(client) => {
            setBooking({ ...booking, client });
            setStep('confirm');
          }}
        />
      )}
      
      {step === 'confirm' && (
        <BookingSummary
          booking={booking}
          onConfirm={handleCreateBooking}
        />
      )}
    </BookingWizard>
  );
}
```

### Paso 3: Confirmación

```typescript
// lib/api/booking.ts

export async function createPublicBooking(
  subdomain: string,
  booking: BookingData
): Promise<Appointment> {
  const response = await fetch(
    `${API_URL}/public/${subdomain}/bookings/`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(booking),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Error al crear la reserva');
  }

  return response.json();
}
```

---

## 📊 Campos Necesarios en Backend

### Modelo Company (Actualizar)

```python
class Company(models.Model):
    # ... campos existentes ...
    
    # White Label
    subdomain = models.SlugField(unique=True, max_length=50)
    is_public_booking = models.BooleanField(default=False)
    
    # Branding
    logo_url = models.URLField(blank=True)
    favicon_url = models.URLField(blank=True)
    hero_image_url = models.URLField(blank=True)
    primary_color = models.CharField(max_length=7, default='#3B82F6')  # Hex
    secondary_color = models.CharField(max_length=7, default='#10B981')
    
    # Contacto público
    description = models.TextField(blank=True)
    phone = models.CharField(max_length=20, blank=True)
    email = models.EmailField(blank=True)
    address = models.TextField(blank=True)
    
    # Configuración de reservas
    booking_advance_days = models.IntegerField(default=30)  # Cuántos días adelante
    booking_min_notice_hours = models.IntegerField(default=2)  # Mínimo aviso
    booking_confirmation_required = models.BooleanField(default=True)
    
    # SEO
    meta_title = models.CharField(max_length=60, blank=True)
    meta_description = models.CharField(max_length=160, blank=True)
```

### Modelo Service (Actualizar)

```python
class Service(models.Model):
    # ... campos existentes ...
    
    # Reserva pública
    is_bookable_online = models.BooleanField(default=False)
    online_description = models.TextField(blank=True)  # Descripción para público
    image_url = models.URLField(blank=True)
```

---

## 🔒 Checklist de Seguridad

### Backend

- [ ] Rate limiting en endpoints públicos (3-10 req/min)
- [ ] Validación estricta de todos los inputs
- [ ] CORS configurado correctamente
- [ ] Endpoints públicos sin autenticación pero con throttling
- [ ] Logs de todas las reservas públicas
- [ ] Verificación de disponibilidad antes de crear cita
- [ ] Sanitización de datos de cliente
- [ ] Protección contra SQL injection (usar ORM)
- [ ] Protección contra XSS (sanitizar outputs)
- [ ] Honeypot fields en formularios
- [ ] reCAPTCHA en formulario de reserva
- [ ] Email verification opcional
- [ ] Blacklist de IPs abusivas

### Frontend

- [ ] Validación de formularios con Zod
- [ ] Sanitización de inputs
- [ ] HTTPS obligatorio
- [ ] No exponer API keys
- [ ] CSP (Content Security Policy) headers
- [ ] No almacenar datos sensibles en localStorage
- [ ] Timeout en requests
- [ ] Manejo de errores sin exponer detalles técnicos

---

## 📈 Roadmap de Implementación

### Fase 1: MVP (2-3 semanas)

**Semana 1: Backend**
- [ ] Crear endpoints públicos
- [ ] Implementar rate limiting
- [ ] Agregar campos de white label a Company
- [ ] Agregar flag is_bookable_online a Service
- [ ] Testing de endpoints

**Semana 2: Frontend Base**
- [ ] Setup proyecto Next.js
- [ ] Implementar detección de subdomain
- [ ] Crear componentes de UI base
- [ ] Implementar theming dinámico
- [ ] Landing page básica

**Semana 3: Flujo de Reserva**
- [ ] Selector de servicios
- [ ] Calendario de disponibilidad
- [ ] Formulario de cliente
- [ ] Página de confirmación
- [ ] Testing end-to-end

### Fase 2: Mejoras (1-2 semanas)

- [ ] Optimización de rendimiento
- [ ] SEO por empresa
- [ ] Analytics
- [ ] Email de confirmación
- [ ] SMS de recordatorio (opcional)
- [ ] Multi-idioma

### Fase 3: Avanzado (Futuro)

- [ ] Pagos online
- [ ] Integración con Google Calendar
- [ ] Chat en vivo
- [ ] Reviews y ratings
- [ ] Programa de lealtad

---

## 💰 Consideraciones de Costos

### Hosting

- **Admin**: Vercel/Netlify (~$20/mes)
- **Booking**: Vercel/Netlify (~$20/mes)
- **Backend**: Actual (sin cambio)
- **CDN**: Cloudflare (gratis)

### Desarrollo

- **MVP**: 2-3 semanas (1 dev)
- **Mejoras**: 1-2 semanas
- **Mantenimiento**: Mínimo (código simple)

---

## 🎯 Conclusión

### ✅ Recomendación Final

**SÍ, crear un frontend separado** es la mejor opción porque:

1. **Seguridad**: Aislamiento completo del código admin
2. **Rendimiento**: Bundle optimizado para público
3. **Mantenibilidad**: Código más limpio y enfocado
4. **Escalabilidad**: Fácil de escalar independientemente
5. **Flexibilidad**: Diferentes estrategias de deploy y caché

### 🚀 Próximos Pasos

1. **Revisar y aprobar** este plan
2. **Actualizar backend** con campos de white label
3. **Crear proyecto** agendy-booking
4. **Implementar MVP** siguiendo el roadmap
5. **Testing exhaustivo** de seguridad
6. **Deploy gradual** (beta con 1-2 empresas)
7. **Iterar** basado en feedback

### 📞 Preguntas a Resolver

1. ¿Qué dominio usar? (*.agendyfix.com vs dominios custom)
2. ¿Requiere pago online desde el inicio?
3. ¿Confirmación automática o manual por admin?
4. ¿Email/SMS de confirmación incluido?
5. ¿Multi-idioma necesario?

---

**Documento creado**: 2026-01-06  
**Versión**: 1.0  
**Autor**: Kilo Code (AI Assistant)