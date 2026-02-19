# Documentación de Capacidad - Frontend Dharaterapeutas

## 1. Resumen Ejecutivo

### Arquitectura de la Aplicación
- **Tipo**: SPA (Single Page Application) React + TypeScript
- **Bundler**: Vite 5.4.2 con optimización de dependencias
- **Routing**: React Router DOM 7.7.1 con lazy loading y route protection
- **State Management**:
  - Zustand 5.0.7 con persistencia (estado local)
  - TanStack Query 5.89.0 (estado servidor/cache)
- **UI Framework**: Tailwind CSS 3.4.1 con componentes custom
- **HTTP Client**: Axios 1.12.2 con interceptors avanzados

### SLO de UX (Service Level Objectives)

| Métrica | Objetivo p95 | Objetivo p99 | Umbral Crítico |
|---------|-------------|-------------|-----------------|
| TTFB (Time to First Byte) | < 300ms | < 500ms | > 1s |
| LCP (Largest Contentful Paint) | < 2.5s | < 3.5s | > 5s |
| FID/INP (First Input Delay/Interaction) | < 100ms | < 200ms | > 300ms |
| CLS (Cumulative Layout Shift) | < 0.1 | < 0.15 | > 0.25 |
| Tasa de Error UI | < 0.1% | < 0.5% | > 1% |
| Bundle Initial Load | < 1MB | < 1.5MB | > 2MB |

## 2. Flujos Críticos de Usuario

### 2.1 Flujo de Autenticación
**Pasos del flujo:**
1. **Login** → Pantalla de autenticación (2-3s think time)
2. **Validación** → Verificación de credenciales (0.5s)
3. **Dashboard** → Redirección a panel principal (1-2s think time)

**Llamadas de red:**
- `POST /auth/login` → Timeout: 10s, Reintentos: 3
- `GET /auth/me` → Cache TTL: 5min
- `GET /notifications` → Polling cada 30s (si hay sesión activa)

### 2.2 Flujo de Gestión de Citas
**Pasos del flujo:**
1. **Calendario** → Vista de disponibilidad (2-3s think time)
2. **Selección** → Elegir slot temporal (1s think time)
3. **Cliente** → Buscar/seleccionar cliente (3-5s think time)
4. **Confirmación** → Crear cita (2s think time)
5. **Notificación** → Envío automático (background)

**Llamadas de red:**
- `GET /availability/calendar` → Cache TTL: 2min
- `GET /clients/search` → Debounce: 300ms
- `POST /bookings` → Timeout: 15s, Reintentos: 2
- `POST /notifications` → Background, fire-and-forget

### 2.3 Flujo de Chat/Mensajería
**Pasos del flujo:**
1. **Lista Conversaciones** → Cargar chats activos (1s think time)
2. **Selección Chat** → Abrir conversación (0.5s think time)
3. **Mensajería** → Intercambio en tiempo real (instant)

**Llamadas de red:**
- `GET /messages/conversations` → Cache TTL: 1min
- **WebSocket** → `/ws/chat` con reconexión automática
- `POST /messages/conversations/:id/send` → Optimistic updates

### 2.4 Flujo de Pagos
**Pasos del flujo:**
1. **Selección Servicio** → Elegir tarifa (2s think time)
2. **Método Pago** → Configurar payment method (5-10s think time)
3. **Procesamiento** → Gateway de pago (3-5s processing)
4. **Confirmación** → Recibo y notificación (1s think time)

**Llamadas de red:**
- `GET /payments/methods` → Cache TTL: 10min
- `POST /payments/process` → Timeout: 30s, Reintentos: 1
- `GET /payments/:id/invoice/download` → Streaming response

### 2.5 Flujo de Perfil Profesional
**Pasos del flujo:**
1. **Edición Perfil** → Formulario multi-step (5-10s think time/step)
2. **Subida Documentos** → Upload con chunks (variable)
3. **Validación** → Verificación automática (background)
4. **Publicación** → Activar perfil público (1s think time)

**Llamadas de red:**
- `GET /profile` → Cache TTL: 5min
- `POST /documents/upload` → Chunked upload para archivos >10MB
- `PUT /profile/specialties` → Optimistic updates
- `POST /verification/submit` → Timeout: 45s

## 3. Recursos Estáticos

### 3.1 Bundles JavaScript

| Ruta/Página | JS Inicial | JS Lazy | CSS | Imágenes Críticas |
|-------------|------------|---------|-----|-------------------|
| `/login` | 245KB | 0KB | 12KB | 15KB (logo, bg) |
| `/dashboard` | 245KB | 85KB | 18KB | 8KB (iconos) |
| `/perfil-profesional` | 245KB | 125KB | 22KB | 25KB (placeholder) |
| `/disponibilidad` | 245KB | 95KB | 20KB | 12KB (calendario) |
| `/reservas` | 245KB | 110KB | 24KB | 18KB (estados) |
| `/clientes` | 245KB | 88KB | 16KB | 10KB (avatares) |
| `/chat` | 245KB | 75KB | 14KB | 5KB (iconos chat) |
| `/pagos` | 245KB | 105KB | 19KB | 20KB (providers) |

### 3.2 Estrategia de Carga
- **Code Splitting**: Por rutas principales + features
- **Prefetch**: Rutas adyacentes en idle time
- **Preload**: Recursos críticos (fonts, iconos principales)
- **Defer**: Bibliotecas no críticas (analytics, widgets)
- **Dynamic Imports**: Componentes pesados (calendar, charts)

### 3.3 Service Worker & PWA
```
Cache Strategy:
- App Shell: StaleWhileRevalidate (TTL: 7 días)
- API Calls: NetworkFirst (TTL: 5 min)
- Assets Estáticos: CacheFirst (TTL: 30 días)
- Imágenes: StaleWhileRevalidate (TTL: 7 días)
```

## 4. Tráfico Esperado

### 4.1 Volumetría Base
- **Sesiones/día**: 15,000-25,000
- **Sesiones concurrentes pico**: 800-1,200 (9-11am, 6-8pm)
- **Páginas por sesión**: 8-12 (promedio: 10)
- **Duración sesión promedio**: 12-18 minutos

### 4.2 Requests por Usuario/Minuto

| Tipo Request | Lectura/min | Escritura/min | Notas |
|-------------|-------------|---------------|-------|
| **Navegación** | 3-5 | 0 | Page loads, routing |
| **Dashboard** | 8-12 | 1-2 | Métricas, notificaciones |
| **Calendario** | 15-20 | 2-3 | Disponibilidad, citas |
| **Chat Activo** | 20-30 | 5-10 | Mensajería en tiempo real |
| **Edición Perfil** | 5-8 | 3-5 | Updates, uploads |
| **Background** | 2-4 | 0-1 | Polling, heartbeat |

### 4.3 Distribución Horaria
- **Zona Horaria Principal**: America/Mexico_City (UTC-6)
- **Picos Primarios**:
  - Mañana: 8:00-11:00 (40% tráfico)
  - Tarde: 17:00-20:00 (35% tráfico)
- **Valle Nocturno**: 23:00-06:00 (5% tráfico)
- **Fin de Semana**: 60% del tráfico weekday

## 5. Infraestructura de Entrega

### 5.1 CDN Configuration
- **Proveedor**: Cloudflare/AWS CloudFront
- **Dominios**:
  - App: `app.dharaterapeutas.com`
  - CDN Assets: `cdn.dharaterapeutas.com`
  - API: `api.dharaterapeutas.com`

**Cache Keys & TTLs:**
```
Recursos Estáticos:
- JS/CSS: cache-control: max-age=31536000 (1 año) + hash
- Imágenes: cache-control: max-age=2592000 (30 días)
- Fonts: cache-control: max-age=31536000 (1 año)

HTML:
- SPA Shell: cache-control: no-cache, must-revalidate
- API Responses: cache-control: private, max-age=300 (5 min)

Invalidaciones:
- Deploy automático: Purge cache de JS/CSS hasheados
- Content updates: Purge específico por path
```

### 5.2 HTTP Optimizations
- **Compresión**: Brotli (nivel 6) + fallback gzip
- **Protocolos**: HTTP/2 con Server Push para recursos críticos
- **Keep-Alive**: 120s timeout, max 100 requests/connection
- **Headers de Seguridad**: CSP, HSTS, CSRF protection

### 5.3 Servicios Terceros

| Servicio | Propósito | Impacto Carga | Tolerancia Fallos | Timeout |
|----------|-----------|---------------|-------------------|---------|
| Google Analytics | Tracking | 45KB async | Graceful degradation | 5s |
| Stripe JS | Pagos | 185KB lazy | Critical - retry | 10s |
| Google Maps | Geocoding | 120KB on-demand | Fallback manual | 8s |
| Intercom/Zendesk | Support chat | 95KB defer | Optional feature | 6s |
| Twilio Video | Video calls | 340KB lazy | Critical - retry | 15s |

## 6. Observabilidad

### 6.1 Métricas de Rendimiento (RUM)
```javascript
// Core Web Vitals Collection
Performance Observer Config:
- LCP: threshold 2500ms (good), 4000ms (needs improvement)
- FID: threshold 100ms (good), 300ms (needs improvement)
- CLS: threshold 0.1 (good), 0.25 (needs improvement)
- TTFB: threshold 800ms (good), 1800ms (needs improvement)

// Sampling Rate: 1% production, 100% staging
```

### 6.2 Error Monitoring
- **Proveedor**: Sentry.io / LogRocket
- **Sampling**: 25% error capture, 1% session replay
- **Alertas Críticas**:
  - Error rate > 2% (5 min window)
  - Bundle load failure > 1%
  - API errors > 5% (specific endpoints)

### 6.3 Dashboards y Alertas

**Dashboard Principal - Grafana/DataDog:**
```
Real User Monitoring (RUM):
├── Core Web Vitals (LCP, FID, CLS)
├── Bundle Performance (Initial load, chunks)
├── Error Rates (JS errors, API errors)
├── User Journey Funnels
└── Device/Browser Breakdown

Synthetic Monitoring:
├── Page Load Times (key routes)
├── API Response Times
├── Uptime Monitoring
└── Transaction Flows
```

**Umbrales de Alerta:**
- 🚨 **Critical**: Error rate > 5%, LCP > 4s, API timeout > 10%
- ⚠️ **Warning**: Error rate > 2%, LCP > 2.5s, Bundle > 1.5MB
- 📊 **Info**: Trends degrading >10% week-over-week

### 6.4 Performance Budget
```yaml
Performance Budget:
  javascript:
    initial: 250KB
    lazy_total: 1.5MB
  css:
    total: 50KB
  images:
    critical: 100KB
    total_per_page: 500KB
  third_party:
    total: 300KB

Monitoring:
  lighthouse_score: 90+
  web_vitals_pass_rate: 80%
  error_rate: <1%
```

## 7. Tablas de Referencia

### 7.1 Flujos vs. Requests Detallado

| Flujo | Paso | Método | Endpoint | Tamaño Req | Tamaño Resp | P95 Objetivo |
|-------|------|--------|----------|------------|-------------|--------------|
| **Auth** | Login | POST | `/auth/login` | 1KB | 2KB | 500ms |
| **Auth** | Get Profile | GET | `/auth/me` | 0KB | 3KB | 300ms |
| **Dashboard** | Load Metrics | GET | `/analytics/dashboard` | 0KB | 25KB | 800ms |
| **Dashboard** | Notifications | GET | `/notifications` | 0KB | 15KB | 400ms |
| **Calendario** | Load Calendar | GET | `/availability/calendar` | 0KB | 45KB | 1000ms |
| **Calendario** | Create Booking | POST | `/bookings` | 3KB | 5KB | 1200ms |
| **Clientes** | Search | GET | `/clients/search` | 0KB | 20KB | 600ms |
| **Clientes** | Client Detail | GET | `/clients/:id` | 0KB | 8KB | 400ms |
| **Chat** | Conversations | GET | `/messages/conversations` | 0KB | 30KB | 700ms |
| **Chat** | Send Message | POST | `/messages/conversations/:id/send` | 2KB | 1KB | 300ms |
| **Pagos** | Payment Methods | GET | `/payments/methods` | 0KB | 12KB | 500ms |
| **Pagos** | Process Payment | POST | `/payments/process` | 5KB | 8KB | 2000ms |
| **Perfil** | Get Profile | GET | `/profile` | 0KB | 35KB | 800ms |
| **Perfil** | Update Profile | PUT | `/profile` | 15KB | 5KB | 1500ms |
| **Upload** | Document Upload | POST | `/documents/upload` | Variable | 3KB | 5000ms |

### 7.2 Bundle Analysis por Página

| Ruta | JS Inicial (gzip) | JS Lazy Load | CSS (gzip) | Imágenes Críticas | First Paint | Time to Interactive |
|------|-------------------|--------------|------------|-------------------|-------------|-------------------|
| `/login` | 85KB | 0KB | 4KB | 15KB | <1s | <1.5s |
| `/dashboard` | 85KB | 28KB | 6KB | 8KB | <1.2s | <2s |
| `/perfil-profesional` | 85KB | 42KB | 7KB | 25KB | <1.5s | <2.5s |
| `/disponibilidad` | 85KB | 32KB | 6.5KB | 12KB | <1.3s | <2.2s |
| `/reservas` | 85KB | 37KB | 8KB | 18KB | <1.4s | <2.3s |
| `/clientes` | 85KB | 29KB | 5KB | 10KB | <1.2s | <2s |
| `/chat` | 85KB | 25KB | 4.5KB | 5KB | <1s | <1.8s |
| `/pagos` | 85KB | 35KB | 6KB | 20KB | <1.3s | <2.2s |
| `/configuracion-cuenta` | 85KB | 22KB | 5.5KB | 8KB | <1.1s | <1.9s |

### 7.3 API Response Times por Criticidad

| Criticidad | Endpoints | P95 Target | P99 Target | Timeout | Retry Policy |
|------------|-----------|------------|------------|---------|--------------|
| **Critical** | `/auth/*`, `/bookings`, `/payments/process` | <500ms | <1000ms | 10s | 3x exponential |
| **High** | `/dashboard`, `/clients/*`, `/messages/*` | <800ms | <1500ms | 8s | 2x linear |
| **Medium** | `/profile/*`, `/documents/*`, `/reviews/*` | <1200ms | <2000ms | 15s | 2x exponential |
| **Low** | `/analytics/*`, `/audit-logs/*`, `/support/*` | <2000ms | <3000ms | 30s | 1x retry |

---

**Generado**: $(date)
**Versión**: 1.0
**Última actualización**: Frontend v0.0.0
**Responsable**: Equipo DevOps/Frontend