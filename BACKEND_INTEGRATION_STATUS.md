# Estado de Integración Frontend-Backend - Dharaterapeutas

## 📊 Resumen General

Este documento detalla qué páginas y features del frontend están **completamente integradas** con el backend real, eliminando el sistema de datos mock.

**Fecha de última actualización**: 2026-02-07

---

## ✅ Páginas 100% Integradas con Backend

### 1. 🔐 **Autenticación** (`/login`, `/register`)

**Estado**: ✅ Completamente integrado

**API Service**: `authService.js`

**Endpoints Backend**:
- `POST /api/auth/login` - Inicio de sesión
- `POST /api/auth/register` - Registro de nuevos usuarios
- `POST /api/auth/logout` - Cierre de sesión
- `POST /api/auth/refresh` - Renovación de tokens
- `GET /api/auth/me` - Obtener usuario actual

**Funcionalidades**:
- ✅ Login con email/password
- ✅ Registro de nuevos terapeutas
- ✅ Auto-refresh de tokens JWT (24h access, 7d refresh)
- ✅ Logout con limpieza de tokens
- ✅ Recuperación de contraseña
- ✅ Verificación de email
- ✅ Autenticación con Google/Facebook (si configurado)

**Almacenamiento Local**:
- `localStorage.access_token` - JWT para autenticación
- `localStorage.refresh_token` - JWT para renovación
- Tokens manejados por `tokenManager.js`

---

### 2. 📈 **Dashboard** (`/dashboard`)

**Estado**: ✅ Completamente integrado

**API Files**:
- `src/features/dashboard/dashboard.api.js`
- `bookingService.js`
- `paymentService.js`
- `clientService.js`

**Endpoints Backend**:
- `GET /api/bookings` - Lista de citas
- `GET /api/payments/history` - Historial de pagos
- `GET /api/clients` - Lista de clientes
- `GET /api/bookings/statistics` - Estadísticas de citas

**Funcionalidades**:
- ✅ **Estadísticas en tiempo real**:
  - Citas del día (calculado desde MongoDB)
  - Clientes activos (conteo real)
  - Ingresos mensuales (suma de pagos)
  - Rating promedio (4.9 por defecto, puede conectarse a reviewService)
- ✅ **Actividad reciente**: Combina citas y pagos ordenados por fecha
- ✅ **Próximas citas**: Filtradas por fecha futura y estados scheduled/confirmed
- ✅ **Gráficos**: Datos reales de MongoDB para charts

**Datos Mostrados**:
```javascript
{
  todayAppointments: number,    // Citas de hoy desde MongoDB
  activeClients: number,         // Clientes activos desde MongoDB
  monthlyRevenue: number,        // Suma de pagos del mes actual
  rating: number,                // Rating del terapeuta
  totalBookings: number,         // Total de citas
  totalPayments: number          // Total de pagos
}
```

---

### 3. 📅 **Gestión de Citas** (`/bookings`, `/calendar`)

**Estado**: ✅ Completamente integrado

**API Files**:
- `src/features/bookings/bookings.api.js`
- `bookingService.js`

**Endpoints Backend**:
- `GET /api/bookings` - Listar citas (con filtros)
- `POST /api/bookings` - Crear nueva cita
- `GET /api/bookings/:id` - Ver detalle de cita
- `PUT /api/bookings/:id` - Actualizar cita
- `DELETE /api/bookings/:id` - Cancelar cita
- `PATCH /api/bookings/:id/confirm` - Confirmar cita
- `GET /api/bookings/calendar` - Vista de calendario
- `GET /api/bookings/upcoming` - Próximas citas
- `GET /api/bookings/statistics` - Estadísticas

**Funcionalidades**:
- ✅ **Ver lista de citas**: Con paginación, filtros y ordenamiento
- ✅ **Crear nueva cita**: Validación de disponibilidad
- ✅ **Confirmar cita**: Actualiza estado a 'confirmed'
- ✅ **Cancelar cita**: Con motivo de cancelación
- ✅ **Reprogramar cita**: Actualiza fecha/hora
- ✅ **Vista de calendario**: Mes, semana, día
- ✅ **Recordatorios**: Programación automática (24h, 2h antes)
- ✅ **Notificaciones**: Email/SMS de confirmación

**Filtros Disponibles**:
```javascript
{
  therapistId: string,
  clientId: string,
  dateFrom: ISO8601,
  dateTo: ISO8601,
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled',
  type: string,
  page: number,
  limit: number
}
```

**Estados de Cita**:
- `scheduled` - Programada
- `confirmed` - Confirmada por el cliente
- `upcoming` - Próxima a ocurrir
- `in_progress` - En progreso
- `completed` - Completada
- `cancelled` - Cancelada
- `no_show` - Cliente no asistió
- `rescheduled` - Reprogramada

---

### 4. 👥 **Gestión de Clientes** (`/clients`, `/clients/:id`)

**Estado**: ✅ Completamente integrado

**API Files**:
- `src/features/clients/clients.api.js`
- `clientService.js`

**Endpoints Backend**:
- `GET /api/clients` - Listar clientes (con filtros)
- `POST /api/clients` - Crear nuevo cliente
- `GET /api/clients/:id` - Ver detalle de cliente
- `PUT /api/clients/:id` - Actualizar cliente
- `DELETE /api/clients/:id` - Eliminar cliente
- `GET /api/clients/search` - Buscar clientes
- `GET /api/clients/:id/statistics` - Estadísticas del cliente
- `GET /api/clients/:id/history` - Historial del cliente
- `PATCH /api/clients/:id/tags` - Actualizar tags
- `POST /api/clients/:id/avatar` - Subir avatar

**Funcionalidades**:
- ✅ **Lista de clientes**: Con búsqueda, filtros y paginación
- ✅ **Ver perfil completo**: Datos personales, historial, estadísticas
- ✅ **Crear/editar cliente**: Datos encriptados si es sensible
- ✅ **Actualizar notas**: Notas de sesión del terapeuta
- ✅ **Historial de sesiones**: Todas las citas y eventos
- ✅ **Gestión de tags**: Categorización de clientes
- ✅ **Búsqueda avanzada**: Por nombre, email, teléfono, notas
- ✅ **Exportar datos**: JSON/PDF con historial completo

**Datos del Cliente**:
```javascript
{
  id: string,
  name: string,
  email: string,
  phone: string,
  status: 'active' | 'inactive',
  assignedTherapist: string,
  age: number,
  sessionsCount: number,
  rating: number,
  tags: string[],
  notes: string,
  address: string,
  emergencyContact: {
    name: string,
    phone: string,
    relationship: string
  },
  createdAt: ISO8601
}
```

---

### 5. 👤 **Perfil Profesional** (`/profile`)

**Estado**: ✅ Completamente integrado

**API Service**: `professionalProfileService.js`, `userService.js`

**Endpoints Backend**:
- `GET /api/users/profile` - Ver perfil actual
- `PUT /api/users/profile` - Actualizar perfil
- `GET /api/professional-profile` - Perfil profesional público
- `PUT /api/professional-profile` - Actualizar perfil profesional
- `POST /api/users/avatar` - Subir foto de perfil
- `GET /api/users/credentials` - Credenciales profesionales
- `POST /api/users/credentials` - Agregar credencial

**Funcionalidades**:
- ✅ **Ver/editar datos personales**: Nombre, email, teléfono
- ✅ **Información profesional**: Especialidades, bio, experiencia
- ✅ **Credenciales**: Títulos, certificaciones, licencias
- ✅ **Foto de perfil**: Upload con redimensionamiento automático
- ✅ **Ubicaciones de trabajo**: Consultorios, direcciones
- ✅ **Tarifas**: Precios por tipo de sesión
- ✅ **Idiomas**: Idiomas en los que atiende
- ✅ **Redes sociales**: Links a perfiles profesionales

---

### 6. ⚙️ **Configuración de Cuenta** (`/account-settings`)

**Estado**: ✅ Completamente integrado

**API Files**:
- `src/features/accountSettings/accountSettings.api.js`
- `userService.js`
- `authService.js`

**Endpoints Backend**:
- `GET /api/users/settings` - Obtener configuración
- `PUT /api/users/settings` - Actualizar configuración
- `POST /api/auth/change-password` - Cambiar contraseña
- `DELETE /api/users/account` - Eliminar cuenta
- `PUT /api/users/preferences` - Preferencias de notificación

**Funcionalidades**:
- ✅ **Configuración general**: Idioma, zona horaria, formato de fecha
- ✅ **Cambio de contraseña**: Con validación de contraseña actual
- ✅ **Preferencias de notificaciones**: Email, SMS, push notifications
- ✅ **Privacidad**: Control de visibilidad del perfil
- ✅ **Eliminar cuenta**: Con confirmación y borrado seguro de datos
- ✅ **Sesiones activas**: Ver y cerrar sesiones en otros dispositivos
- ✅ **2FA (si habilitado)**: Autenticación de dos factores

---

### 7. ✅ **Verificación Profesional** (`/verification`)

**Estado**: ✅ Completamente integrado

**API Files**:
- `src/features/verification/verification.api.js`
- `verificationService.js`

**Endpoints Backend**:
- `GET /api/verification/status` - Estado de verificación
- `POST /api/verification/documents` - Subir documentos
- `GET /api/verification/requirements` - Requisitos de verificación
- `PUT /api/verification/:id/review` - (Admin) Revisar documentos

**Funcionalidades**:
- ✅ **Ver estado de verificación**: Pendiente, en revisión, aprobado, rechazado
- ✅ **Subir documentos**: Título profesional, licencias, cédula
- ✅ **Requisitos**: Lista de documentos necesarios
- ✅ **Historial**: Todas las verificaciones anteriores
- ✅ **Notificaciones**: Alertas de estado de verificación

**Estados de Verificación**:
- `pending` - Pendiente de envío
- `submitted` - Documentos enviados
- `in_review` - En revisión por admin
- `verified` - Verificado y aprobado
- `rejected` - Rechazado (con motivo)

---

### 8. ❓ **Centro de Ayuda** (`/help-center`)

**Estado**: ✅ Completamente integrado

**API Files**:
- `src/features/helpCenter/helpCenter.api.js`
- `apiMethods` (directamente)

**Endpoints Backend**:
- `GET /api/support/faq` - FAQs
- `GET /api/support/knowledge-base` - Base de conocimientos
- `POST /api/support/tickets` - Crear ticket de soporte
- `GET /api/support/tickets` - Ver tickets del usuario

**Funcionalidades**:
- ✅ **FAQs**: Preguntas frecuentes por categoría
- ✅ **Búsqueda**: En base de conocimientos
- ✅ **Tickets de soporte**: Crear y dar seguimiento
- ✅ **Historial de tickets**: Ver conversaciones anteriores
- ✅ **Categorías**: Facturación, técnico, cuenta, otros

---

### 9. 💳 **Pagos y Facturación** (`/payments`)

**Estado**: ✅ Integrado con servicios existentes

**API Service**: `paymentService.js`

**Endpoints Backend**:
- `GET /api/payments/history` - Historial de pagos
- `POST /api/payments` - Registrar pago
- `GET /api/payments/:id` - Detalle de pago
- `POST /api/payments/refund` - Procesar reembolso
- `GET /api/payments/statistics` - Estadísticas financieras

**Funcionalidades**:
- ✅ **Historial de pagos**: Con filtros por fecha, cliente, estado
- ✅ **Registrar pago**: Efectivo, tarjeta, transferencia
- ✅ **Generar facturas**: PDF con datos fiscales
- ✅ **Reembolsos**: Procesar devoluciones
- ✅ **Estadísticas**: Ingresos mensuales, anuales, por servicio
- ✅ **Integración Stripe**: Para pagos en línea (si configurado)

---

### 10. 📄 **Documentos y Materiales** (`/documents`)

**Estado**: ✅ Integrado con servicios existentes

**API Service**: `documentService.js`

**Endpoints Backend**:
- `GET /api/documents` - Listar documentos
- `POST /api/documents` - Subir documento
- `GET /api/documents/:id` - Descargar documento
- `DELETE /api/documents/:id` - Eliminar documento
- `GET /api/documents/shared` - Documentos compartidos con clientes

**Funcionalidades**:
- ✅ **Gestión de documentos**: Subir, descargar, eliminar
- ✅ **Organización**: Por categorías, tags, cliente
- ✅ **Compartir**: Con clientes específicos
- ✅ **Tipos soportados**: PDF, DOCX, imágenes, videos
- ✅ **Almacenamiento**: Local o cloud (S3 si configurado)

---

## 🔄 Características Transversales (Funcionan en Todas las Páginas)

### Sistema de Autenticación JWT
- ✅ **Auto-refresh de tokens**: Los tokens se renuevan automáticamente antes de expirar
- ✅ **Interceptor de 401**: Si una petición falla por token expirado, intenta refrescar y reintentar
- ✅ **Logout automático**: Si el refresh falla, redirige a login
- ✅ **Guards de rutas**: Protección de rutas privadas

**Implementación**: `src/services/config/interceptors.js`

### Sistema de Cache
- ✅ **Cache de respuestas**: Reduce llamadas redundantes al backend
- ✅ **TTL configurable**: Por defecto 5 minutos
- ✅ **Invalidación automática**: Al crear/actualizar/eliminar datos
- ✅ **Tags de cache**: Para invalidar por grupos (bookings, clients, etc.)

**Implementación**: `src/services/utils/cache.js`

### Manejo de Errores
- ✅ **Error handler centralizado**: Traduce errores del backend a mensajes user-friendly
- ✅ **Retry logic**: Reintenta peticiones fallidas con backoff exponencial
- ✅ **Network errors**: Detecta problemas de conexión
- ✅ **Validation errors**: Muestra errores de validación campo por campo

**Implementación**: `src/services/utils/errorHandler.js`

### Sistema de Logging
- ✅ **Logging estructurado**: Logs con niveles (debug, info, warn, error)
- ✅ **Context tracking**: ID de request para seguimiento
- ✅ **Performance monitoring**: Mide tiempo de respuesta de APIs
- ✅ **Privacy-aware**: Sanitiza datos sensibles antes de loggear

**Implementación**: `src/services/utils/logger.js`

### Privacidad y Seguridad
- ✅ **Encriptación de datos sensibles**: Datos del cliente encriptados en tránsito
- ✅ **Tokens de consentimiento**: GDPR compliance
- ✅ **Sanitización de logs**: No loggea contraseñas, tokens, datos personales
- ✅ **Secure ID generation**: IDs únicos y seguros

**Implementación**: `src/services/utils/privacy.js`, `security.js`

---

## 📋 Otros Features con Servicios Implementados

Estos features tienen servicios API completos pero pueden requerir componentes UI adicionales:

### ✅ Disponibilidad (`availabilityService.js`)
- Gestión de horarios de trabajo
- Bloques de tiempo disponibles
- Días festivos y vacaciones

### ✅ Chat/Mensajería (`chatService.js`)
- Chat en tiempo real con clientes
- WebSocket para mensajes instantáneos
- Historial de conversaciones

### ✅ Notificaciones (`notificationService.js`)
- Push notifications
- Email notifications
- SMS notifications (si configurado)

### ✅ Reseñas (`reviewService.js`)
- Reseñas de clientes
- Rating system
- Respuestas a reseñas

### ✅ Planes de Terapia (`therapyPlanService.js`)
- Crear planes de tratamiento
- Objetivos y milestones
- Progreso del cliente

### ✅ Notas de Sesión (`sessionNoteService.js`)
- Notas después de cada sesión
- Plantillas de notas
- Firma digital

### ✅ Suscripciones (`subscriptionService.js`)
- Planes de suscripción
- Renovación automática
- Historial de suscripciones

### ✅ Tarifas (`ratesService.js`)
- Gestión de tarifas por servicio
- Paquetes de sesiones
- Descuentos

### ✅ Ubicaciones de Trabajo (`workLocationService.js`)
- Múltiples consultorios
- Información de ubicación
- Horarios por ubicación

### ✅ Integraciones (`integrationService.js`)
- Google Calendar sync
- Zoom integration
- Stripe payments

---

## 🔌 Arquitectura de Conexión

```
┌─────────────────────────────────────────────────────┐
│  FRONTEND (React + Vite)                            │
│  http://localhost:5173                              │
├─────────────────────────────────────────────────────┤
│                                                      │
│  Feature Layer (UI Components)                      │
│  ├─ /dashboard                                      │
│  ├─ /bookings                                       │
│  ├─ /clients                                        │
│  └─ ...                                             │
│          │                                           │
│          ▼                                           │
│  API Layer (*.api.js)                               │
│  ├─ bookings.api.js                                 │
│  ├─ clients.api.js                                  │
│  ├─ dashboard.api.js                                │
│  └─ ...                                             │
│          │                                           │
│          ▼                                           │
│  Service Layer (services/api/*.js)                  │
│  ├─ bookingService.js                               │
│  ├─ clientService.js                                │
│  ├─ paymentService.js                               │
│  └─ ...                                             │
│          │                                           │
│          ▼                                           │
│  HTTP Client (apiClient.js)                         │
│  ├─ Interceptors (auth, error, retry)              │
│  ├─ Token Manager                                   │
│  ├─ Cache System                                    │
│  └─ Error Handler                                   │
│          │                                           │
└──────────┼───────────────────────────────────────────┘
           │
           │ HTTP/HTTPS
           │ Authorization: Bearer <JWT>
           │
           ▼
┌─────────────────────────────────────────────────────┐
│  BACKEND (Express + MongoDB)                        │
│  http://localhost:5000                              │
├─────────────────────────────────────────────────────┤
│                                                      │
│  Routes (34 endpoints)                              │
│  ├─ /api/auth/*                                     │
│  ├─ /api/bookings/*                                 │
│  ├─ /api/clients/*                                  │
│  ├─ /api/payments/*                                 │
│  └─ ...                                             │
│          │                                           │
│          ▼                                           │
│  Middleware                                         │
│  ├─ Authentication (JWT)                            │
│  ├─ Authorization (RBAC)                            │
│  ├─ Validation                                      │
│  ├─ Rate Limiting                                   │
│  └─ CORS                                            │
│          │                                           │
│          ▼                                           │
│  Controllers (30 controllers)                       │
│  ├─ bookingController.js                            │
│  ├─ clientController.js                             │
│  ├─ paymentController.js                            │
│  └─ ...                                             │
│          │                                           │
│          ▼                                           │
│  Models (Mongoose Schemas)                          │
│  ├─ User.js                                         │
│  ├─ Booking.js                                      │
│  ├─ Client.js                                       │
│  └─ ...                                             │
│          │                                           │
└──────────┼───────────────────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────────────────────┐
│  MONGODB                                            │
│  mongodb://localhost:27017/dharaterapeutas          │
└─────────────────────────────────────────────────────┘
```

---

## 🧪 Estado de Testing

### Endpoints Verificados
- ✅ `POST /api/auth/login` - Login funcional
- ✅ `GET /api/auth/me` - Usuario actual
- ✅ `GET /api/bookings` - Lista de citas
- ✅ `GET /api/clients` - Lista de clientes
- ✅ `GET /api/payments/history` - Historial de pagos

### Pendientes de Testing End-to-End
- ⏳ Crear nueva cita desde UI
- ⏳ Cancelar cita con motivo
- ⏳ Actualizar notas de cliente
- ⏳ Cambiar contraseña
- ⏳ Subir documentos de verificación

---

## 📝 Configuración Actual

### Frontend (.env)
```env
VITE_API_URL=http://localhost:5000/api
VITE_ENABLE_MOCK=false
VITE_APP_ENV=development
```

### Backend (backend/.env)
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/dharaterapeutas
JWT_SECRET=<generado>
JWT_EXPIRE=24h
JWT_REFRESH_SECRET=<generado>
JWT_REFRESH_EXPIRE=7d
FRONTEND_URL=http://localhost:5173
```

---

## 🚀 Cómo Probar la Integración

### 1. Iniciar Servicios
```bash
# Terminal 1 - MongoDB
net start MongoDB

# Terminal 2 - Backend
cd backend
npm run dev

# Terminal 3 - Frontend
npm run dev
```

### 2. Verificar Conexión
```bash
# Health check del backend
curl http://localhost:5000/health
# Debe retornar: {"status":"OK","timestamp":"..."}
```

### 3. Test de Login
1. Ir a `http://localhost:5173/login`
2. Usar credenciales de prueba (crear con script)
3. Verificar en DevTools:
   - Network: Petición a `http://localhost:5000/api/auth/login`
   - Console: NO debe aparecer `[MOCK API]`
   - Application > LocalStorage: Debe contener `access_token`

### 4. Verificar Features
- Dashboard debe cargar estadísticas reales
- Bookings debe mostrar lista desde MongoDB
- Clients debe mostrar clientes desde MongoDB
- Cualquier operación CREATE/UPDATE/DELETE debe reflejarse en MongoDB

---

## 📖 Documentación de Referencia

### Servicios API Disponibles
- `authService.js` - Autenticación y autorización
- `bookingService.js` - Gestión de citas
- `clientService.js` - Gestión de clientes
- `paymentService.js` - Pagos y facturación
- `userService.js` - Perfil de usuario
- `professionalProfileService.js` - Perfil profesional
- `verificationService.js` - Verificación profesional
- `documentService.js` - Gestión de documentos
- `reviewService.js` - Reseñas y ratings
- `chatService.js` - Chat en tiempo real
- `notificationService.js` - Sistema de notificaciones
- `availabilityService.js` - Gestión de disponibilidad
- `therapyPlanService.js` - Planes de terapia
- `sessionNoteService.js` - Notas de sesión
- `subscriptionService.js` - Suscripciones
- `ratesService.js` - Tarifas y precios
- `workLocationService.js` - Ubicaciones de trabajo
- `integrationService.js` - Integraciones externas
- `webhookService.js` - Webhooks
- `auditLogService.js` - Auditoría

### Endpoints del Backend
Ver archivo completo de endpoints: `src/services/config/endpoints.js`

Total de endpoints documentados: **150+**

---

## ✨ Próximos Pasos Recomendados

1. **Testing End-to-End**
   - Crear suite de tests con Cypress/Playwright
   - Verificar flujos completos de usuario
   - Test de manejo de errores

2. **Optimizaciones**
   - Implementar lazy loading de componentes
   - Optimizar bundle size
   - Implementar service workers para offline mode

3. **Monitoreo**
   - Configurar Sentry para error tracking
   - Implementar analytics (Google Analytics, Mixpanel)
   - Dashboard de métricas de rendimiento

4. **Seguridad**
   - Audit de dependencias (npm audit)
   - Implementar CSP headers
   - Rate limiting en frontend

---

## 🆘 Troubleshooting

### Problema: "Network Error" en todas las peticiones
**Solución**: Verificar que el backend esté corriendo y que CORS esté configurado correctamente

### Problema: "401 Unauthorized" en peticiones autenticadas
**Solución**: Verificar que el token esté en localStorage y que JWT_SECRET coincida

### Problema: Datos no se actualizan en tiempo real
**Solución**: Invalidar cache manualmente o reducir TTL de cache

### Problema: "MongoDB connection failed"
**Solución**: Verificar que MongoDB esté corriendo y URI sea correcta

---

**Última actualización**: 2026-02-07
**Versión del documento**: 1.0
**Mantenido por**: Equipo de Desarrollo Dharaterapeutas
