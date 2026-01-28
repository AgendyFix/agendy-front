# 📱 WhatsApp Templates - Resumen para Frontend

## 🎯 ¿Qué Cambió?

Ahora los reminders pueden usar **templates de WhatsApp** en lugar de mensajes personalizados. Esto es **requerido por WhatsApp Business API** para iniciar conversaciones.

---

## 🔌 Nuevos Endpoints

### **1. Listar Templates Disponibles**
```http
GET /api/v1/templates/
```

**Response:**
```json
{
  "results": [
    {
      "id": "uuid",
      "name": "ibits_academy_class_reminder_v1",
      "display_name": "Recordatorio de Clase - Ibits Academy",
      "description": "Template para recordar clases",
      "category": "reminder",
      "variable_count": 7,
      "variable_names": ["tema", "profesor", "hora", "dias", "link_zoom", "id_reunion", "codigo_acceso"]
    }
  ]
}
```

### **2. Ver Detalle de Template**
```http
GET /api/v1/templates/{id}/
```

**Response incluye:**
- `body`: Texto completo con variables `{{1}}`, `{{2}}`, etc.
- `variables_metadata`: Descripción de cada variable

### **3. Preview de Mensaje**
```http
POST /api/v1/templates/{id}/preview/
Body: {"variables": {"1": "valor1", "2": "valor2"}}
```

**Response:**
```json
{
  "rendered_message": "Mensaje completo con variables reemplazadas"
}
```

### **4. Crear Reminder con Template**
```http
POST /api/v1/reminders/
```

**Body (NUEVO):**
```json
{
  "channel": "whatsapp",
  "client_group": "group-uuid",
  "template": "template-uuid",           // ← NUEVO
  "template_variables": {                // ← NUEVO
    "1": "Python Avanzado",
    "2": "Ing. Carlos",
    "3": "10:00 AM"
  },
  "scheduled_at": "2026-01-25T10:00:00-06:00",
  "recurrence": "once"
}
```

**⚠️ IMPORTANTE:**
- **NO** enviar `message` si usas `template`
- **DEBE** enviar `template` + `template_variables` juntos
- Backend valida que todas las variables estén completas

---

## 🎨 Cambios en UI

### **Pantalla "Crear Recordatorio"**

**ANTES:**
```
┌─────────────────────────────┐
│ Canal: WhatsApp             │
│ Destinatario: Grupo H       │
│ Mensaje: [textarea libre]   │
│ Fecha: 25/01/2026           │
│ [Crear Recordatorio]        │
└─────────────────────────────┘
```

**AHORA:**
```
┌─────────────────────────────────────────┐
│ Canal: WhatsApp                         │
│ Destinatario: Grupo H                   │
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │ ⚪ Mensaje Personalizado            │ │
│ │ ⚫ Template de WhatsApp              │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ [Si selecciona Template:]               │
│                                         │
│ Seleccionar Template:                   │
│ ┌─────────────────────────────────────┐ │
│ │ 📋 Recordatorio de Clase - Ibits    │ │
│ │ 🎉 Promoción Especial               │ │
│ │ 📅 Recordatorio de Cita             │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ Variables del Template:                 │
│ • Tema: [input]                         │
│ • Profesor: [input]                     │
│ • Hora: [input]                         │
│ • Días: [input]                         │
│ • Link Zoom: [input]                    │
│ • ID Reunión: [input]                   │
│ • Código: [input]                       │
│                                         │
│ [👁️ Vista Previa] [✅ Crear]           │
└─────────────────────────────────────────┘
```

---

## 💻 Código de Ejemplo

### **1. Cargar Templates**
```javascript
const [templates, setTemplates] = useState([]);
const [selectedTemplate, setSelectedTemplate] = useState(null);
const [templateVars, setTemplateVars] = useState({});

useEffect(() => {
  fetch('/api/v1/templates/', {
    headers: { 'Authorization': `Bearer ${token}` }
  })
  .then(res => res.json())
  .then(data => setTemplates(data.results));
}, []);
```

### **2. Seleccionar Template**
```javascript
const onSelectTemplate = async (templateId) => {
  const res = await fetch(`/api/v1/templates/${templateId}/`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const template = await res.json();
  
  // Inicializar variables vacías
  const emptyVars = {};
  Object.keys(template.variables_metadata).forEach(key => {
    emptyVars[key] = '';
  });
  
  setSelectedTemplate(template);
  setTemplateVars(emptyVars);
};
```

### **3. Renderizar Inputs de Variables**
```javascript
const renderVariableInputs = () => {
  if (!selectedTemplate) return null;
  
  return Object.entries(selectedTemplate.variables_metadata).map(([key, meta]) => (
    <div key={key}>
      <label>{meta.description}</label>
      <input
        type="text"
        placeholder={meta.example}
        value={templateVars[key] || ''}
        onChange={(e) => setTemplateVars({
          ...templateVars,
          [key]: e.target.value
        })}
      />
    </div>
  ));
};
```

### **4. Preview**
```javascript
const showPreview = async () => {
  const res = await fetch(`/api/v1/templates/${selectedTemplate.id}/preview/`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ variables: templateVars })
  });
  
  const data = await res.json();
  alert(data.rendered_message);
};
```

### **5. Crear Reminder**
```javascript
const createReminder = async () => {
  const body = {
    channel: 'whatsapp',
    reminder_type: 'custom',
    client_group: selectedGroup,
    scheduled_at: scheduledDate,
    recurrence: 'once'
  };
  
  // Si usa template
  if (selectedTemplate) {
    body.template = selectedTemplate.id;
    body.template_variables = templateVars;
  } else {
    // Si usa mensaje personalizado
    body.message = customMessage;
  }
  
  const res = await fetch('/api/v1/reminders/', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });
  
  if (res.ok) {
    alert('Recordatorio creado');
  }
};
```

---

## 📊 Cambios en Responses

### **GET /api/v1/reminders/**

**Campos NUEVOS:**
```json
{
  "id": 55,
  "template": "template-uuid",           // ← NUEVO
  "template_name": "Recordatorio...",    // ← NUEVO
  "uses_template": true,                 // ← NUEVO
  "template_variables": {...},           // ← NUEVO (solo en detail)
  "message": "",                         // Vacío si usa template
  "final_message": "Mensaje renderizado" // ← NUEVO (solo en detail)
}
```

### **Compatibilidad:**
- Reminders antiguos (sin template) siguen funcionando
- `message` sigue disponible para mensajes personalizados
- Frontend debe detectar `uses_template` para mostrar UI correcta

---

## ✅ Checklist de Implementación

### **Fase 1: Básico (Requerido)**
- [ ] Agregar selector de template en "Crear Recordatorio"
- [ ] Renderizar inputs dinámicos según variables del template
- [ ] Validar que todas las variables estén llenas
- [ ] Enviar `template` + `template_variables` al crear reminder

### **Fase 2: Mejorado (Recomendado)**
- [ ] Agregar botón "Vista Previa"
- [ ] Mostrar modal con mensaje renderizado
- [ ] Filtrar templates por categoría
- [ ] Búsqueda de templates

### **Fase 3: Avanzado (Opcional)**
- [ ] Guardar variables como "favoritos" para reutilizar
- [ ] Autocompletar variables comunes (nombre de cliente, etc.)
- [ ] Mostrar estadísticas de uso de templates

---

## 🐛 Errores Comunes

### **Error: "Debe proporcionar template o message"**
```json
{
  "template": ["Debe proporcionar 'template' o 'message'."],
  "message": ["Debe proporcionar 'template' o 'message'."]
}
```
**Solución:** Enviar `template` + `template_variables` O `message`, no ambos.

### **Error: "Faltan variables requeridas"**
```json
{
  "template_variables": ["Faltan variables requeridas: tema, profesor"]
}
```
**Solución:** Llenar todas las variables del template.

### **Error: "Template no está aprobado"**
```json
{
  "template": ["El template 'X' no está aprobado por WhatsApp."]
}
```
**Solución:** Solo superadmin puede aprobar templates en Django Admin.

---

## 📞 Soporte

**Documentación completa:** `docs/whatsapp-templates-guide.md`

**Endpoints de prueba:**
```bash
# Listar templates
GET /api/v1/templates/

# Ver detalle
GET /api/v1/templates/{id}/

# Preview
POST /api/v1/templates/{id}/preview/
Body: {"variables": {"1": "test"}}
```

**Testing en Postman:**
1. Importar colección "WhatsApp Templates"
2. Configurar `access_token` en environment
3. Ejecutar tests en orden

---

## 🚀 Próximos Pasos

1. **Implementar UI básica** (Fase 1)
2. **Probar con templates de ejemplo** en Admin
3. **Agregar preview** (Fase 2)
4. **Testing end-to-end** con n8n

---

**¿Dudas?** Revisar `docs/whatsapp-templates-guide.md` para ejemplos completos.


te hago un resumen de los endpoints para que tengas en cuenta:


## 🔌 Endpoints API

### **1. Listar Templates Disponibles**

```http
GET /api/v1/templates/
```

**Headers:**
```
Authorization: Bearer {access_token}
```

**Query Params (opcionales):**
- `?category=appointment` - Filtrar por categoría
- `?status=approved` - Filtrar por estado
- `?search=ibits` - Buscar por nombre

**Response:**
```json
{
  "count": 3,
  "results": [
    {
      "id": "uuid",
      "name": "ibits_academy_class_reminder_v1",
      "display_name": "Recordatorio de Clase - Ibits Academy",
      "description": "Template para recordar clases programadas",
      "category": "reminder",
      "category_display": "Recordatorio General",
      "status": "approved",
      "status_display": "Aprobado por WhatsApp",
      "is_approved": true,
      "variable_count": 7,
      "variable_names": [
        "nombre_alumno",
        "materia",
        "profesor",
        "hora",
        "dias",
        "link_zoom",
        "id_reunion",
        "codigo_acceso"
      ],
      "is_active": true,
      "created_at": "2026-01-20T10:00:00Z"
    }
  ]
}
```

---

### **2. Ver Detalle de Template**

```http
GET /api/v1/templates/{id}/
```

**Response:**
```json
{
  "id": "uuid",
  "name": "ibits_academy_class_reminder_v1",
  "display_name": "Recordatorio de Clase - Ibits Academy",
  "description": "Template para recordar clases programadas",
  "body": "💻👨‍💻💻👨‍💻💻👨‍💻💻👨‍💻💻👨‍💻\nIbits Academy le está invitando a una reunión de Zoom programada.\nIbits.academy@gmail.com\n\nTema: {{1}}\n👨‍🏫Profesor: {{2}}\nHora: {{3}}\nDias: {{4}}\n\nÚnase a la reunión de Zoom\n{{5}}\nID de reunión: {{6}}\nCódigo de acceso: {{7}}\n\n¡Bienvenidos al emocionante mundo de la tecnología!\n💫𝐈𝐁𝐈𝐓𝐒 Academy\n💻👨‍💻💻👨‍💻💻👨‍💻💻👨‍💻💻👨‍💻",
  "variables_metadata": {
    "1": {
      "name": "tema",
      "description": "Tema de la clase",
      "example": "Python Avanzado - Módulo 3"
    },
    "2": {
      "name": "profesor",
      "description": "Nombre del profesor",
      "example": "Ing. Carlos Méndez"
    },
    "3": {
      "name": "hora",
      "description": "Hora de la clase",
      "example": "10:00 AM"
    },
    "4": {
      "name": "dias",
      "description": "Días de la semana",
      "example": "Lunes y Miércoles"
    },
    "5": {
      "name": "link_zoom",
      "description": "Link de la reunión de Zoom",
      "example": "https://zoom.us/j/123456789"
    },
    "6": {
      "name": "id_reunion",
      "description": "ID de la reunión",
      "example": "123 456 789"
    },
    "7": {
      "name": "codigo_acceso",
      "description": "Código de acceso",
      "example": "abc123"
    }
  },
  "category": "reminder",
  "status": "approved",
  "is_approved": true,
  "variable_count": 7,
  "variable_names": ["tema", "profesor", "hora", "dias", "link_zoom", "id_reunion", "codigo_acceso"],
  "companies_count": 0,
  "metadata": {},
  "is_active": true,
  "created_at": "2026-01-20T10:00:00Z",
  "updated_at": "2026-01-20T10:00:00Z"
}
```

---

### **3. Previsualizar Template con Variables**

```http
POST /api/v1/templates/{id}/preview/
```

**Body:**
```json
{
  "variables": {
    "1": "Python Avanzado - Módulo 3",
    "2": "Ing. Carlos Méndez",
    "3": "10:00 AM",
    "4": "Lunes y Miércoles",
    "5": "https://zoom.us/j/123456789",
    "6": "123 456 789",
    "7": "abc123"
  }
}
```

**Response:**
```json
{
  "template_id": "uuid",
  "template_name": "ibits_academy_class_reminder_v1",
  "template_display_name": "Recordatorio de Clase - Ibits Academy",
  "variables": {
    "1": "Python Avanzado - Módulo 3",
    "2": "Ing. Carlos Méndez",
    "3": "10:00 AM",
    "4": "Lunes y Miércoles",
    "5": "https://zoom.us/j/123456789",
    "6": "123 456 789",
    "7": "abc123"
  },
  "rendered_message": "💻👨‍💻💻👨‍💻💻👨‍💻💻👨‍💻💻👨‍💻\nIbits Academy le está invitando a una reunión de Zoom programada.\nIbits.academy@gmail.com\n\nTema: Python Avanzado - Módulo 3\n👨‍🏫Profesor: Ing. Carlos Méndez\nHora: 10:00 AM\nDias: Lunes y Miércoles\n\nÚnase a la reunión de Zoom\nhttps://zoom.us/j/123456789\nID de reunión: 123 456 789\nCódigo de acceso: abc123\n\n¡Bienvenidos al emocionante mundo de la tecnología!\n💫𝐈𝐁𝐈𝐓𝐒 Academy\n💻👨‍💻💻👨‍💻💻👨‍💻💻👨‍💻💻👨‍💻"
}
```

---

### **4. Listar Categorías de Templates**

```http
GET /api/v1/templates/categories/
```

**Response:**
```json
[
  {
    "value": "appointment",
    "label": "Recordatorio de Cita",
    "count": 5
  },
  {
    "value": "promotion",
    "label": "Promoción",
    "count": 3
  },
  {
    "value": "reminder",
    "label": "Recordatorio General",
    "count": 8
  }
]
```

---

### **5. Crear Reminder con Template**

```http
POST /api/v1/reminders/
```

**Body (Individual con Template):**
```json
{
  "channel": "whatsapp",
  "reminder_type": "custom",
  "client": "client-uuid",
  "template": "template-uuid",
  "template_variables": {
    "1": "Python Avanzado - Módulo 3",
    "2": "Ing. Carlos Méndez",
    "3": "10:00 AM",
    "4": "Lunes y Miércoles",
    "5": "https://zoom.us/j/123456789",
    "6": "123 456 789",
    "7": "abc123"
  },
  "scheduled_at": "2026-01-25T10:00:00-06:00",
  "recurrence": "once"
}
```

**Body (Grupal con Template):**
```json
{
  "channel": "whatsapp",
  "reminder_type": "custom",
  "client_group": "group-uuid",
  "template": "template-uuid",
  "template_variables": {
    "1": "Python Avanzado - Módulo 3",
    "2": "Ing. Carlos Méndez",
    "3": "10:00 AM",
    "4": "Lunes y Miércoles",
    "5": "https://zoom.us/j/123456789",
    "6": "123 456 789",
    "7": "abc123"
  },
  "scheduled_at": "2026-01-25T10:00:00-06:00",
  "recurrence": "weekly",
  "recurrence_weekday": 0,
  "recurrence_time": "10:00:00",
  "recurrence_end_date": "2026-03-25"
}
```

**Response:**
```json
{
  "id": 55,
  "channel": "whatsapp",
  "reminder_type": "custom",
  "status": "pending",
  "client": "client-uuid",
  "client_group": null,
  "template": "template-uuid",
  "template_name": "Recordatorio de Clase - Ibits Academy",
  "template_variables": {...},
  "uses_template": true,
  "message": "",
  "scheduled_at": "2026-01-25T10:00:00-06:00",
  "recurrence": "once",
  "is_bulk": false,
  "is_recurring": false,
  "created_at": "2026-01-22T10:00:00-06:00"
}
```

---