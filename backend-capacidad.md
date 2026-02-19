# Documentación de Capacidad - Backend Dharaterapeutas

## 1. Resumen de Arquitectura

### Stack Tecnológico
- **Runtime**: Node.js 18+ con Express 5.1.0
- **Orquestación**: Standalone / PM2 (recomendado para producción)
- **Réplicas**: 3-4 instancias recomendadas (load balanced)
- **Contenedores**: Docker ready (Dockerfile no encontrado - pendiente)

### Base de Datos
- **MongoDB**: 8.18.1 con Mongoose ODM
- **Configuración**: Single cluster (recomendado: Replica Set 3 nodos)
- **Regiones**: Primaria Europe-West (Madrid/Frankfurt)
- **WriteConcern**: `majority` (default)
- **ReadPreference**: `primary` (lecturas críticas), `secondaryPreferred` (analytics)

### Colas y Background Jobs
- **Estado Actual**: Sin implementación de colas
- **Recomendado**: BullMQ + Redis para:
  - Email notifications (nodemailer@7.0.6)
  - Payment processing
  - Booking reminders
  - Document processing

## 2. SLO/SLA (Service Level Objectives)

### Objetivos de Rendimiento

| Tipo de Endpoint | P95 Objetivo | P99 Objetivo | Error Rate | Timeout |
|------------------|-------------|-------------|------------|---------|
| **Auth** (login/refresh) | <200ms | <400ms | <0.1% | 5s |
| **CRUD Simple** (get/update) | <300ms | <600ms | <0.5% | 8s |
| **CRUD Complejo** (with joins) | <500ms | <1000ms | <1% | 10s |
| **Búsquedas** (search/filter) | <800ms | <1500ms | <1% | 15s |
| **File Upload** | <2000ms | <4000ms | <2% | 30s |
| **Analytics/Reports** | <2000ms | <5000ms | <2% | 45s |

### Límites de Cola y Concurrencia
- **Max concurrent requests**: 500 per instance
- **Queue size**: 100 pending requests
- **Connection pool**: 10-20 connections per instance
- **Memory usage**: <512MB per instance
- **CPU usage**: <80% sustained

## 3. Inventario de Endpoints (Top 15 por Tráfico)

| Método | Ruta | RPS Esperado | Payload Avg | Queries MongoDB | Índices Requeridos | Cache Key/TTL | P95 Objetivo |
|--------|------|--------------|-------------|-----------------|--------------------|--------------|--------------|
| POST | `/api/auth/login` | 50 | 0.5KB | 1 find + 1 update | `users.email` | No cache | 200ms |
| GET | `/api/auth/me` | 200 | 0KB | 1 find | `users._id` | `user:{id}` 5min | 150ms |
| GET | `/api/bookings` | 150 | 0KB | 1 find + populate | `bookings.therapistId_date`, `bookings.status_date` | `bookings:{therapistId}` 2min | 400ms |
| POST | `/api/bookings` | 30 | 2KB | 1 insert + conflict check | `bookings.therapistId_date` | Invalidate cache | 600ms |
| GET | `/api/clients` | 120 | 0KB | 1 find + pagination | `clients.therapistId`, `clients.status` | `clients:{therapistId}:p{page}` 5min | 350ms |
| PUT | `/api/bookings/:id` | 25 | 1.5KB | 1 update + validation | `bookings._id` | Invalidate cache | 500ms |
| GET | `/api/dashboard` | 80 | 0KB | 5-8 aggregations | Multiple | `dashboard:{therapistId}` 3min | 1200ms |
| GET | `/api/availability` | 100 | 0KB | 1 find + populate | `availability.therapistId` | `availability:{therapistId}` 10min | 300ms |
| POST | `/api/payments` | 20 | 3KB | 1 insert + booking update | `payments.therapistId_status` | No cache | 1500ms |
| GET | `/api/notifications` | 90 | 0KB | 1 find + pagination | `notifications.userId_createdAt` | `notifications:{userId}` 1min | 250ms |
| POST | `/api/clients` | 15 | 4KB | 1 insert + validation | `clients.email` (sparse) | Invalidate cache | 400ms |
| GET | `/api/reviews` | 60 | 0KB | 1 find + populate | `reviews.therapistId`, `reviews.status` | `reviews:{therapistId}` 10min | 350ms |
| POST | `/api/documents/upload` | 10 | 5MB | 1 insert + file processing | `documents.ownerId` | No cache | 3000ms |
| GET | `/api/profile` | 70 | 0KB | 1 find + populate | `profiles.userId` | `profile:{userId}` 10min | 300ms |
| PUT | `/api/profile` | 25 | 8KB | 1 update + validation | `profiles.userId` | Invalidate cache | 800ms |

## 4. Base de Datos

### Colecciones Críticas y Cardinalidades

#### Users Collection (~10K docs, 50MB)
```javascript
// Índices críticos
db.users.createIndex({ "email": 1 }, { unique: true })
db.users.createIndex({ "verificationStatus": 1 })
db.users.createIndex({ "createdAt": -1 })

// Query performance
db.users.find({ email: "user@example.com" }).explain("executionStats")
// Expected: { executionTimeMillis: 5, totalDocsExamined: 1 }
```

#### Bookings Collection (~100K docs, 200MB)
```javascript
// Índices críticos para queries frecuentes
db.bookings.createIndex({ "therapistId": 1, "date": 1 })
db.bookings.createIndex({ "clientId": 1, "status": 1 })
db.bookings.createIndex({ "status": 1, "date": 1 })
db.bookings.createIndex({ "therapistId": 1, "status": 1 })

// Compound index para conflictos
db.bookings.createIndex({
  "therapistId": 1,
  "date": 1,
  "startTime": 1,
  "endTime": 1
})

// Query típica: obtener bookings del terapeuta
db.bookings.find({
  therapistId: ObjectId("..."),
  date: { $gte: ISODate("2024-01-01") }
}).explain("executionStats")
// Expected: { executionTimeMillis: 50, totalDocsExamined: 100 }
```

#### Payments Collection (~50K docs, 150MB)
```javascript
// Índices para analytics y búsquedas
db.payments.createIndex({ "therapistId": 1, "status": 1 })
db.payments.createIndex({ "clientId": 1, "createdAt": -1 })
db.payments.createIndex({ "status": 1, "paymentDate": -1 })
db.payments.createIndex({ "transactionId": 1 }, { unique: true, sparse: true })
```

### Configuración de Conexiones
```javascript
// Configuración recomendada para producción
const mongoConfig = {
  maxPoolSize: 20,           // Max connections per instance
  minPoolSize: 5,            // Min connections
  maxIdleTimeMS: 30000,      // Close connections after 30s idle
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  bufferMaxEntries: 0,       // Disable mongoose buffering
  bufferCommands: false
}

// Por instancia API: 15-20 conexiones
// 4 instancias = 60-80 conexiones totales a MongoDB
```

### Patrón de Acceso y Growth
- **Lectura/Escritura**: 85% lecturas / 15% escrituras
- **Hot keys**:
  - `user:{therapistId}` (profile data)
  - `bookings:{therapistId}:{date}` (calendar views)
- **Growth estimado**: 20% usuarios/año, 40% bookings/año
- **Data retention**: 7 años (compliance GDPR)

## 5. Infraestructura de Red

### Load Balancer / Reverse Proxy
```nginx
# NGINX Configuration
upstream dharaterapeutas_backend {
    least_conn;
    server api1.internal:5000 max_fails=3 fail_timeout=30s;
    server api2.internal:5000 max_fails=3 fail_timeout=30s;
    server api3.internal:5000 max_fails=3 fail_timeout=30s;
    keepalive 32;
}

server {
    listen 443 ssl http2;
    server_name api.dharaterapeutas.com;

    # SSL Configuration
    ssl_certificate /etc/ssl/certs/dharaterapeutas.pem;
    ssl_certificate_key /etc/ssl/private/dharaterapeutas.key;
    ssl_protocols TLSv1.2 TLSv1.3;

    # Compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types application/json application/javascript text/css;

    # Timeouts
    proxy_connect_timeout 5s;
    proxy_send_timeout 60s;
    proxy_read_timeout 60s;

    # Upload limits
    client_max_body_size 50M;
    client_body_timeout 60s;

    location /api/ {
        proxy_pass http://dharaterapeutas_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Límites de Sistema
```bash
# /etc/security/limits.conf
api_user soft nofile 65536
api_user hard nofile 65536
api_user soft nproc 4096
api_user hard nproc 4096

# sysctl.conf
net.core.somaxconn = 1024
net.ipv4.tcp_max_syn_backlog = 1024
```

### Recursos por Instancia
- **CPU**: 2 vCPU (4 vCPU recomendado para pico)
- **Memory**: 2GB RAM (3GB recomendado)
- **Disk**: 20GB SSD (logs + temp files)
- **Network**: 1Gbps (burst capability)

## 6. Observabilidad

### Logs Estructurados
```javascript
// winston + morgan configuration
const logger = winston.createLogger({
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'dharaterapeutas-api' },
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
    new winston.transports.Console({ format: winston.format.simple() })
  ]
});

// Request logging with correlation ID
app.use(morgan('combined', {
  stream: { write: message => logger.info(message.trim()) }
}));
```

### Métricas Críticas (Prometheus/OpenTelemetry)
```javascript
// Custom metrics
const promClient = require('prom-client');

const httpRequestDuration = new promClient.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10]
});

const mongoQueries = new promClient.Counter({
  name: 'mongodb_queries_total',
  help: 'Total number of MongoDB queries',
  labelNames: ['collection', 'operation', 'status']
});

const activeConnections = new promClient.Gauge({
  name: 'mongodb_connections_active',
  help: 'Active MongoDB connections'
});
```

### Métricas Node.js Específicas
- **Event Loop Lag**: Target <10ms, Alert >50ms
- **Memory Usage**: Target <80%, Alert >90%
- **GC Pause**: Target <10ms, Alert >50ms
- **CPU Usage**: Target <70%, Alert >85%

### Dashboards Clave

#### API Performance Dashboard
```yaml
Panels:
  - Request Rate (RPS) by endpoint
  - Response time percentiles (p50, p95, p99)
  - Error rate by endpoint and status code
  - Active connections and queue size

Alerts:
  - P95 response time > SLO thresholds
  - Error rate > 2% for 5 minutes
  - Memory usage > 90%
  - MongoDB connection pool exhausted
```

#### Database Dashboard
```yaml
Panels:
  - Query performance by collection
  - Index usage statistics
  - Connection pool metrics
  - Slow query log (>100ms)

Alerts:
  - Slow queries > 1000ms
  - Index miss rate > 5%
  - Connection pool > 80% utilization
```

## 7. Plan de Load Testing

### Herramientas Recomendadas
- **Artillery.js** para API load testing
- **k6** para escenarios complejos
- **MongoDB Atlas Performance Advisor** para DB profiling

### Escenarios de Prueba

#### Escenario 1: Lectura Normal (70% tráfico)
```javascript
// artillery-read-heavy.yml
config:
  target: 'https://api.dharaterapeutas.com'
  phases:
    - duration: 300
      arrivalRate: 10
      rampTo: 100
  variables:
    therapistId: ['507f1f77bcf86cd799439011', '507f1f77bcf86cd799439012']

scenarios:
  - name: "Read Heavy Workload"
    weight: 70
    flow:
      - post:
          url: "/api/auth/login"
          json:
            email: "therapist{{ $randomInt(1, 100) }}@test.com"
            password: "password123"
          capture:
            - json: "$.token"
              as: "token"
      - loop:
          - get:
              url: "/api/bookings"
              headers:
                Authorization: "Bearer {{ token }}"
          - get:
              url: "/api/clients"
              headers:
                Authorization: "Bearer {{ token }}"
          - think: 2
        count: 5
```

#### Escenario 2: Escritura Intensiva (20% tráfico)
```javascript
scenarios:
  - name: "Write Heavy Workload"
    weight: 20
    flow:
      - post:
          url: "/api/bookings"
          headers:
            Authorization: "Bearer {{ token }}"
          json:
            clientId: "{{ $randomString() }}"
            date: "{{ $randomString() }}"
            startTime: "09:00"
            endTime: "10:00"
            therapyType: "Cognitive Therapy"
            amount: 80
```

#### Escenario 3: Picos de Tráfico (10% tráfico)
```javascript
config:
  phases:
    - duration: 60
      arrivalRate: 1
    - duration: 120
      arrivalRate: 200  # Spike traffic
    - duration: 60
      arrivalRate: 1
```

### Criterios de Éxito
- **RPS Sostenido**: 500 RPS sin degradación
- **P95 Response Time**: Dentro de SLO targets
- **Error Rate**: <1% durante prueba
- **Memory Usage**: <85% máximo
- **Database Connections**: <80% pool usage

### Punto de Saturación Esperado
- **Single Instance**: ~150 RPS
- **3 Instances**: ~400-450 RPS
- **Database Bottleneck**: ~1000 concurrent connections

## 8. Riesgos y Mitigaciones

### Riesgos Identificados

#### Queries Sin Índice
```javascript
// RIESGO: Query sin índice en bookings
db.bookings.find({
  "client.email": "user@example.com"
}) // Scan completo de colección

// MITIGACIÓN: Crear índice compuesto
db.bookings.createIndex({ "clientId": 1 });
// + JOIN en aplicación o populate optimizado
```

#### Problema N+1
```javascript
// RIESGO: N+1 en populación de bookings
const bookings = await Booking.find({ therapistId })
  .populate('client')  // N queries adicionales
  .populate('payment') // N queries adicionales

// MITIGACIÓN: Populate selectivo
const bookings = await Booking.find({ therapistId })
  .populate('client', 'name email phone')
  .populate('payment', 'status amount')
  .lean() // Mejora performance 40%
```

#### Serialización Pesada
```javascript
// RIESGO: Virtual fields y transformaciones costosas
userSchema.virtual('stats').get(async function() {
  return await this.getStats(); // Query pesada en cada serialización
});

// MITIGACIÓN: Computación lazy o cache
userSchema.methods.getStatsCache = async function() {
  const cached = await redis.get(`user:${this._id}:stats`);
  if (cached) return JSON.parse(cached);

  const stats = await this.getStats();
  await redis.setex(`user:${this._id}:stats`, 300, JSON.stringify(stats));
  return stats;
};
```

### Plan de Escalado

#### Escalado Horizontal (API)
```yaml
# Docker Compose escalado
version: '3.8'
services:
  api:
    image: dharaterapeutas-api:latest
    deploy:
      replicas: 4
      resources:
        limits:
          memory: 2G
          cpus: '2'
    environment:
      - NODE_ENV=production
      - MONGODB_URI=mongodb://mongo1,mongo2,mongo3/dharaterapeutas
      - REDIS_URL=redis://redis-cluster
```

#### Escalado MongoDB
```javascript
// Replica Set Configuration
rs.initiate({
  _id: "dharaterapeutas-rs",
  members: [
    { _id: 0, host: "mongo1:27017", priority: 2 },
    { _id: 1, host: "mongo2:27017", priority: 1 },
    { _id: 2, host: "mongo3:27017", priority: 0, arbiterOnly: true }
  ]
});

// Read Preference por tipo de query
const readHeavyQueries = { readPreference: 'secondaryPreferred' };
const criticalWrites = { readPreference: 'primary', w: 'majority' };
```

#### Implementación de Cache (Redis)
```javascript
// Redis Cluster Configuration
const redis = require('ioredis');
const cluster = new Redis.Cluster([
  { port: 6379, host: 'redis1' },
  { port: 6379, host: 'redis2' },
  { port: 6379, host: 'redis3' }
]);

// Cache strategy implementation
const cacheMiddleware = (ttl = 300) => async (req, res, next) => {
  const key = `api:${req.method}:${req.originalUrl}:${req.user?.id}`;
  const cached = await cluster.get(key);

  if (cached) {
    return res.json(JSON.parse(cached));
  }

  const originalSend = res.json;
  res.json = function(data) {
    cluster.setex(key, ttl, JSON.stringify(data));
    originalSend.call(this, data);
  };

  next();
};
```

## 9. Tabla de Límites de Sistema

| Recurso | Umbral Warning | Umbral Critical | Acción Recomendada |
|---------|---------------|-----------------|-------------------|
| **CPU Usage** | 70% | 85% | Scale out instances |
| **Memory Usage** | 80% | 90% | Restart + investigate memory leaks |
| **MongoDB Connections** | 80% pool | 95% pool | Add more API instances |
| **File Descriptors** | 50K | 60K | Increase ulimit |
| **Event Loop Lag** | 50ms | 100ms | Profile and optimize blocking code |
| **Disk Usage** | 80% | 90% | Clean logs + scale storage |
| **Response Time P95** | SLO + 50% | SLO + 100% | Investigate bottlenecks |
| **Error Rate** | 1% | 3% | Emergency investigation |
| **MongoDB Slow Queries** | 100ms | 1000ms | Add indexes + optimize |
| **Request Queue Size** | 50 | 100 | Scale out immediately |

## 10. Configuraciones de Ejemplo

### PM2 Ecosystem
```javascript
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'dharaterapeutas-api',
    script: 'src/server.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 5000
    },
    env_production: {
      NODE_ENV: 'production',
      MONGODB_URI: 'mongodb://mongo1,mongo2,mongo3/dharaterapeutas',
      REDIS_URL: 'redis://redis-cluster'
    },
    max_memory_restart: '2G',
    node_args: '--max-old-space-size=2048',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
};
```

### Kubernetes Deployment
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: dharaterapeutas-api
spec:
  replicas: 4
  selector:
    matchLabels:
      app: dharaterapeutas-api
  template:
    metadata:
      labels:
        app: dharaterapeutas-api
    spec:
      containers:
      - name: api
        image: dharaterapeutas-api:latest
        ports:
        - containerPort: 5000
        env:
        - name: NODE_ENV
          value: "production"
        - name: MONGODB_URI
          valueFrom:
            secretKeyRef:
              name: mongo-secret
              key: uri
        resources:
          requests:
            memory: "1Gi"
            cpu: "1"
          limits:
            memory: "2Gi"
            cpu: "2"
        livenessProbe:
          httpGet:
            path: /health
            port: 5000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health
            port: 5000
          initialDelaySeconds: 5
          periodSeconds: 5
```

---

**Generado**: $(date)
**Versión**: 1.0
**Backend Version**: dharaterapeutas-backend v1.0.0
**Responsable**: Equipo DevOps/Backend