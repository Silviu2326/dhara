# Documentación de Uso - App Móvil Dharaterapeutas

## 1. Contexto de la Aplicación

### Plataforma y Tecnología
- **Framework**: React Native 0.81.4 + Expo 54.0.9
- **Tipo**: Cross-platform híbrida (iOS, Android, Web)
- **Versiones Mínimas de SO**:
  - iOS: 12.0+ (iPhone 6s y superior)
  - Android: API 23+ (Android 6.0 Marshmallow)
  - Web: Chrome 88+, Safari 14+, Firefox 85+

### Regiones de Usuarios
- **Principal**: España (60% usuarios)
- **Secundarias**: México (25%), Argentina (10%), Colombia (5%)
- **Zonas Horarias**: UTC+1 (CET/CEST), UTC-6 (CST), UTC-3 (ART), UTC-5 (COT)

### SLO de Experiencia Usuario

| Acción | Latencia Aceptable | % Errores Máximo | Timeout | Comentarios |
|--------|-------------------|------------------|---------|-------------|
| **Login** | < 3s | < 1% | 10s | Crítico para primera impresión |
| **Dashboard Load** | < 2s | < 2% | 8s | Pantalla principal, uso frecuente |
| **Chat/Messaging** | < 1s | < 0.5% | 5s | Tiempo real, alta expectativa |
| **Booking Creation** | < 4s | < 1% | 15s | Transacción importante |
| **Profile Update** | < 3s | < 2% | 12s | Operación menos frecuente |
| **Search/Filter** | < 2s | < 3% | 8s | UX responsive esperada |
| **File Upload** | < 10s | < 5% | 30s | Dependiente de tamaño archivo |
| **Notifications** | < 1s | < 1% | 5s | Background sync |

## 2. Patrones de Uso

### Métricas de Engagement
- **DAU (Daily Active Users)**: 3,500 usuarios/día
- **MAU (Monthly Active Users)**: 12,000 usuarios/mes
- **DAU/MAU Ratio**: 29% (saludable para app healthcare)
- **Sesiones por usuario/día**: 2.3 promedio
- **Duración media de sesión**: 8.5 minutos
- **Retention Day 1**: 85% | Day 7: 62% | Day 30: 41%

### Flujos Críticos de Usuario

#### 1. Onboarding (Primera vez)
**Duración**: 3-5 minutos | **Pantallas**: 5-7
1. Welcome Screen → Login/Register (30s)
2. Profile Setup → Personal Info (90s)
3. Therapist Selection → Browse + Filter (120s)
4. Payment Setup → Method Selection (60s)
5. Notification Permissions → Enable (15s)

#### 2. Daily Usage (Usuario recurrente)
**Duración**: 6-10 minutos | **Pantallas**: 8-12
1. Login → Auto-login (5s)
2. Dashboard → View Stats (30s)
3. Agenda → Check Appointments (45s)
4. Chat → Read/Reply Messages (180s)
5. Exercises/Documents → Access Materials (120s)

#### 3. Booking Flow (Crítico)
**Duración**: 4-7 minutos | **Pantallas**: 6-8
1. Dashboard/Agenda → Initiate Booking (10s)
2. Calendar View → Select Date/Time (60s)
3. Therapist Selection → Choose Professional (90s)
4. Session Details → Type/Duration (45s)
5. Payment → Confirm Method (30s)
6. Confirmation → Success Screen (15s)

#### 4. Chat/Communication
**Duración**: 3-15 minutos | **Pantallas**: 2-4
1. Dashboard/Menu → Open Chat (10s)
2. Conversation List → Select Chat (15s)
3. Individual Chat → Read/Send Messages (Variable)
4. Media Sharing → Attach Files (30s opcional)

## 3. Tráfico de Red por Pantalla/Flujo

### Principales Endpoints por Pantalla

| Pantalla/Acción | Método | Endpoint | Tamaño Req | Tamaño Resp | Llamadas/Sesión | Reintentos | Timeout | WebSocket/SSE | Polling |
|-----------------|---------|----------|------------|-------------|----------------|------------|---------|---------------|---------|
| **Login** | POST | `/api/auth/login` | 0.3KB | 1.2KB | 1 | 3x | 10s | No | No |
| **Dashboard Load** | GET | `/api/dashboard/client` | 0KB | 15KB | 1 | 2x | 8s | No | No |
| **Dashboard Stats** | GET | `/api/dashboard/stats` | 0KB | 8KB | 1 | 2x | 8s | No | No |
| **Notifications** | GET | `/api/client/notifications` | 0KB | 5KB | 2-3 | 2x | 5s | No | 30s |
| **Profile Load** | GET | `/api/profile` | 0KB | 12KB | 1 | 2x | 8s | No | No |
| **Profile Update** | PUT | `/api/profile` | 8KB | 2KB | 0.3 | 2x | 12s | No | No |
| **Agenda/Calendar** | GET | `/api/appointments` | 0KB | 20KB | 1-2 | 2x | 8s | No | No |
| **Booking Create** | POST | `/api/bookings` | 2KB | 3KB | 0.2 | 1x | 15s | No | No |
| **Chat List** | GET | `/api/messages/conversations` | 0KB | 12KB | 1 | 2x | 5s | No | No |
| **Chat Messages** | GET | `/api/messages/conversations/:id` | 0KB | 25KB | 2-3 | 2x | 5s | Sí | No |
| **Send Message** | POST | `/api/messages/conversations/:id/send` | 1KB | 0.5KB | 5-10 | 1x | 5s | Sí | No |
| **Mark Read** | POST | `/api/client/notifications/:id/read` | 0.1KB | 0.2KB | 2-5 | 1x | 3s | No | No |
| **Upload Avatar** | POST | `/api/users/avatar` | 150KB | 1KB | 0.1 | 1x | 30s | No | No |
| **Document Upload** | POST | `/api/documents/upload` | 2MB | 2KB | 0.05 | 1x | 60s | No | No |
| **Search Therapists** | GET | `/api/therapists/search` | 0KB | 18KB | 1-2 | 2x | 8s | No | No |

### WebSocket Usage (Chat en tiempo real)
- **Endpoint**: `ws://localhost:5000/chat`
- **Usuarios concurrentes en chat**: 15-25% de usuarios activos
- **Mensajes por minuto**: 2-8 por usuario activo en chat
- **Keep-alive**: 30s ping/pong
- **Reconexión**: Automática con exponential backoff (1s, 2s, 4s, 8s)

## 4. Sincronización y Segundo Plano

### Background Fetch
```javascript
// Configuración de background sync
const backgroundSync = {
  notifications: {
    interval: 300000, // 5 minutos
    timeout: 10000,   // 10 segundos
    retries: 3
  },
  appointments: {
    interval: 900000, // 15 minutos
    timeout: 15000,   // 15 segundos
    retries: 2
  },
  messages: {
    interval: 600000, // 10 minutos (si no hay WebSocket)
    timeout: 8000,    // 8 segundos
    retries: 2
  }
};
```

### Estrategia de Colas Offline
```javascript
// Queue configuration
const offlineQueue = {
  maxSize: 100,
  persistence: 'AsyncStorage',
  retryPolicy: {
    attempts: 5,
    backoff: [1000, 2000, 5000, 10000, 30000], // ms
    jitter: 0.1
  },
  priorityLevels: {
    high: ['send_message', 'mark_notification_read'],
    medium: ['update_profile', 'book_appointment'],
    low: ['analytics_event', 'usage_stats']
  }
};
```

### Subida de Archivos
- **Estrategia**: Chunked upload para archivos >5MB
- **Compresión**: Imágenes optimizadas automáticamente
- **Formatos soportados**: JPG, PNG, PDF, DOC, DOCX
- **Límite de tamaño**: 50MB por archivo
- **Background upload**: Sí, con notificación de progreso

### Push Notifications
- **Proveedor**: Expo Push Notifications
- **Frecuencia**:
  - Mensaje nuevo: Inmediato
  - Recordatorio cita: 24h, 2h, 15min antes
  - Weekly digest: Lunes 9:00 AM
- **Wake-ups promedio**: 2-4 por día por usuario
- **Deep links**:
  - `dharaterapeutas://chat/:conversationId`
  - `dharaterapeutas://appointment/:appointmentId`
  - `dharaterapeutas://profile`

## 5. Medios y Almacenamiento

### Gestión de Imágenes
| Tipo | Tamaño Original | Compresión | CDN Transform | Uso |
|------|----------------|------------|---------------|-----|
| **Avatar** | 500x500px, ~150KB | 85% quality | 128x128px | Perfil, chat |
| **Documentos** | Variable | Sin compresión | Thumbnails 200px | Expedientes |
| **Chat Media** | Variable | 80% quality | Progressive loading | Mensajería |
| **Splash/Icons** | Variable | Optimizado | Multi-resolution | UI/UX |

### Cache Local (AsyncStorage + FileSystem)
```javascript
const cacheStrategy = {
  userProfile: {
    ttl: 86400000,    // 24 horas
    maxSize: '5MB',
    key: 'profile_cache'
  },
  dashboard: {
    ttl: 1800000,     // 30 minutos
    maxSize: '2MB',
    key: 'dashboard_cache'
  },
  conversations: {
    ttl: 3600000,     // 1 hora
    maxSize: '10MB',
    key: 'conversations_cache'
  },
  appointments: {
    ttl: 600000,      // 10 minutos
    maxSize: '3MB',
    key: 'appointments_cache'
  },
  media: {
    ttl: 604800000,   // 7 días
    maxSize: '50MB',  // Límite total storage
    key: 'media_cache'
  }
};
```

### Límites de Almacenamiento
- **Total cache**: 100MB máximo
- **Limpieza automática**: Al superar 80MB
- **Prioridad de limpieza**: LRU (Least Recently Used)
- **Cache crítico**: Profile + Dashboard (nunca se elimina)

## 6. Controles de Resiliencia

### Timeouts por Capa
```javascript
const timeoutConfig = {
  network: {
    connection: 5000,     // 5s para establecer conexión
    response: 30000,      // 30s para recibir respuesta completa
    upload: 120000        // 2 minutos para uploads grandes
  },
  application: {
    ui_response: 100,     // 100ms para respuesta UI
    navigation: 300,      // 300ms para transiciones
    background_sync: 10000 // 10s para sync en background
  },
  cache: {
    read: 50,            // 50ms para leer cache
    write: 200,          // 200ms para escribir cache
    cleanup: 5000        // 5s para limpieza cache
  }
};
```

### Circuit Breakers
```javascript
const circuitBreakers = {
  api_requests: {
    failureThreshold: 5,   // Fallos consecutivos
    timeout: 30000,        // 30s timeout
    resetTimeout: 60000    // 1 minuto para reset
  },
  realtime_chat: {
    failureThreshold: 3,
    timeout: 10000,
    resetTimeout: 30000
  },
  file_uploads: {
    failureThreshold: 2,
    timeout: 120000,
    resetTimeout: 300000   // 5 minutos para uploads
  }
};
```

### Modo Offline
- **Detección**: Network state monitoring + connectivity checks
- **UI Feedback**: Banner de estado de conexión
- **Funcionalidad offline**:
  - Lectura de cache (perfil, mensajes, citas)
  - Composición de mensajes (queue para envío)
  - Navegación entre pantallas cached
- **Sync al reconectar**: Automático con indicador de progreso

### Rate Limiting (Cliente)
- **API calls**: Max 100 requests/minute por usuario
- **File uploads**: Max 5 concurrent uploads
- **WebSocket messages**: Max 20 messages/minute
- **Search queries**: Debounce 300ms

### Protección Batería/Datos
```javascript
const dataProtection = {
  backgroundSync: {
    wifiOnly: true,           // Solo sync en WiFi
    batteryOptimization: true, // Reducir freq. con batería baja
    dataLimit: '10MB/day'     // Límite datos móviles
  },
  mediaDownload: {
    autoDownload: 'wifi_only',
    maxSize: '5MB',
    compression: true
  },
  polling: {
    adaptiveInterval: true,   // Ajustar según uso
    pauseOnBackground: true,  // Pausar en background
    respectDoNotDisturb: true
  }
};
```

## 7. Cálculo de Carga Esperado

### Distribución Horaria (CET/CEST)
```
Peak Hours:
├── Morning Peak: 8:00-10:00 (35% tráfico diario)
├── Lunch Break: 13:00-14:00 (15% tráfico diario)
├── Evening Peak: 18:00-21:00 (40% tráfico diario)
└── Night Valley: 22:00-07:00 (10% tráfico diario)

Weekend Pattern: 60% del tráfico weekday
```

### Requests por Usuario Activo (Pico)
```javascript
const peakUserLoad = {
  sessionStart: {
    requests: 8,           // Login + Dashboard + Notifications
    duration: '30s',
    bandwidth: '45KB'
  },
  activeUsage: {
    requests: 12,          // Navigation + interactions
    duration: '10min',
    bandwidth: '180KB'
  },
  chatActive: {
    requests: 25,          // Messages + real-time updates
    duration: '15min',
    bandwidth: '320KB'
  },
  backgroundSync: {
    requests: 3,           // Notifications + appointments
    duration: '5min',
    bandwidth: '15KB'
  }
};

// Promedio ponderado por usuario/minuto en pico
const avgRequestsPerUserMinute = 2.8;
```

### Distribución por Región/ISP
- **España (Movistar, Vodafone, Orange)**: 60% tráfico
  - Latencia promedio: 15-30ms
  - Ancho de banda: 4G/5G mayoría
- **México (Telcel, AT&T, Movistar)**: 25% tráfico
  - Latencia promedio: 50-80ms
  - Ancho de banda: 3G/4G mix
- **Argentina (Personal, Claro, Movistar)**: 10% tráfico
  - Latencia promedio: 60-120ms
  - Ancho de banda: 3G/4G variable
- **Colombia (Claro, Movistar, Tigo)**: 5% tráfico
  - Latencia promedio: 80-150ms
  - Ancho de banda: 3G/4G emergente

## 8. Resumen para Capacidad

### RPS Pico Estimado
```
Cálculo de RPS Pico:
├── Usuarios activos pico: 1,200 (35% de DAU)
├── Requests/usuario/minuto: 2.8
├── RPS pico total: (1,200 × 2.8) / 60 = 56 RPS
├── Factor de seguridad: 1.5x
└── RPS diseño: 84 RPS

Distribución por endpoint:
├── Dashboard/Profile: 25 RPS (30%)
├── Notifications: 20 RPS (24%)
├── Chat/Messages: 17 RPS (20%)
├── Appointments: 12 RPS (14%)
├── Auth/Login: 6 RPS (7%)
└── Otros: 4 RPS (5%)
```

### Conexiones Concurrentes WebSocket
```
Chat WebSocket:
├── Usuarios activos pico: 1,200
├── % usuarios en chat: 20%
├── Conexiones WS concurrentes: 240
├── Factor overhead: 1.3x
└── Conexiones diseño: 312

Keep-alive overhead:
├── Ping/Pong cada 30s
├── 312 conexiones × 2 msgs/min = 10.4 additional RPS
```

### Presupuesto de Latencia p95 por Flujo

| Flujo | Componentes | Budget Total | Breakdown |
|-------|-------------|--------------|-----------|
| **Login Flow** | Mobile + Network + API + DB | 2.5s | 100ms + 150ms + 200ms + 50ms + buffer |
| **Dashboard Load** | Cache + Network + API + DB | 1.8s | 50ms + 120ms + 150ms + 30ms + buffer |
| **Chat Message** | WebSocket + Network + Real-time | 800ms | 50ms + 100ms + 50ms + buffer |
| **Booking Creation** | Validation + Network + API + DB | 3.5s | 200ms + 150ms + 300ms + 100ms + buffer |
| **File Upload** | Compression + Network + Storage | 8s | 500ms + 6000ms + 1000ms + buffer |
| **Search Results** | Input + Network + API + Processing | 1.5s | 100ms + 120ms + 200ms + 80ms + buffer |

### Estimaciones de Ancho de Banda
```
Bandwidth por usuario/sesión:
├── Sesión ligera: 250KB (dashboard, notificaciones)
├── Sesión normal: 800KB (+ chat, navegación)
├── Sesión pesada: 2.5MB (+ uploads, media)
└── Promedio ponderado: 1.1MB/sesión

Bandwidth total pico:
├── 1,200 usuarios activos × 1.1MB = 1.32 GB
├── Duración sesión promedio: 8.5 min
├── Throughput requerido: 2.6 Mbps sustained
└── Peak burst capacity: 10 Mbps (4x buffer)
```

---

**Generado**: $(date)
**Versión**: 1.0
**App Version**: aplicacion v1.0.0 (React Native 0.81.4 + Expo 54.0.9)
**Responsable**: Equipo Mobile/Product