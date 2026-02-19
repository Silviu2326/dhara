# 🚀 Plan de Migración: MongoDB → Supabase (PostgreSQL)

## 📊 Resumen del Proyecto

| Aspecto | Detalle |
|---------|---------|
| **Modelos** | 30 colecciones en MongoDB |
| **Relaciones** | Múltiples relaciones 1:N y N:M |
| **Middleware** | Pre/post save hooks en modelos |
| **Virtuals** | Campos virtuales Mongoose |
| **Aggregations** | Estadísticas y reportes |

---

## 🎯 Arquitectura de Migración

### Antes (MongoDB + Mongoose)
```
Frontend → API Express → Mongoose → MongoDB
```

### Después (Supabase PostgreSQL)
```
Frontend → API Express → Supabase Client → PostgreSQL
                              ↓
                    Row Level Security (RLS)
```

---

## 📋 Modelos a Migrar (30 total)

### Core (4 modelos)
1. ✅ **User** - Usuarios terapeutas/admin
2. ✅ **Client** - Pacientes/clientes
3. ✅ **Booking** - Citas/reservas
4. ✅ **ProfessionalProfile** - Perfiles profesionales

### Documentación (4 modelos)
5. ✅ **SessionNote** - Notas de sesiones
6. ✅ **Document** - Documentos adjuntos
7. ✅ **Note** - Notas generales
8. ✅ **VerificationDocument** - Documentos de verificación

### Comunicación (3 modelos)
9. ✅ **Conversation** - Conversaciones
10. ✅ **Message** - Mensajes
11. ✅ **Notification** - Notificaciones

### Configuración (6 modelos)
12. ✅ **AvailabilitySlot** - Disponibilidad horaria
13. ✅ **Absence** - Ausencias/permisos
14. ✅ **WorkLocation** - Lugares de trabajo
15. ✅ **NotificationSettings** - Config notificaciones
16. ✅ **Rates** - Tarifas/precios
17. ✅ **Integration** - Integraciones API

### Pagos y Suscripciones (5 modelos)
18. ✅ **Payment** - Pagos
19. ✅ **Subscription** - Suscripciones
20. ✅ **PricingPackage** - Paquetes de precios
21. ✅ **PlanAssignment** - Asignaciones de planes
22. ✅ **PayoutRequest** - Solicitudes de pago

### Terapia (3 modelos)
23. ✅ **TherapyPlan** - Planes de terapia
24. ✅ **ClientPlanProgress** - Progreso del cliente
25. ✅ **Credentials** - Credenciales

### Misceláneos (5 modelos)
26. ✅ **Review** - Reseñas
27. ✅ **Favorite** - Favoritos
28. ✅ **Coupon** - Cupones
29. ✅ **AuditLog** - Logs de auditoría
30. ✅ **Webhook** - Webhooks

---

## 🗄️ Esquema SQL para Supabase

### 1. Tabla `users`
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255), -- NULL para OAuth
  supabase_id VARCHAR(255) UNIQUE,
  auth_provider VARCHAR(20) DEFAULT 'local',
  email_verified BOOLEAN DEFAULT FALSE,
  name VARCHAR(100) NOT NULL,
  avatar TEXT,
  banner TEXT,
  is_verified BOOLEAN DEFAULT FALSE,
  verification_status VARCHAR(20) DEFAULT 'not_submitted',
  role VARCHAR(20) DEFAULT 'therapist',
  is_active BOOLEAN DEFAULT TRUE,
  last_login TIMESTAMPTZ,
  reset_password_token VARCHAR(255),
  reset_password_expire TIMESTAMPTZ,
  email_verification_token VARCHAR(255),
  email_verification_expire TIMESTAMPTZ,
  preferences JSONB DEFAULT '{}',
  stripe_customer_id VARCHAR(255),
  stripe_subscription_id VARCHAR(255),
  subscription_status VARCHAR(20) DEFAULT 'none',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 2. Tabla `clients`
```sql
CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL,
  password VARCHAR(255) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  avatar TEXT,
  status VARCHAR(20) DEFAULT 'active',
  age INTEGER CHECK (age >= 16 AND age <= 120),
  address VARCHAR(200),
  emergency_contact JSONB,
  notes TEXT,
  tags TEXT[],
  therapist_id UUID REFERENCES users(id) ON DELETE CASCADE,
  last_session TIMESTAMPTZ,
  sessions_count INTEGER DEFAULT 0,
  rating DECIMAL(2,1),
  payments_count INTEGER DEFAULT 0,
  documents_count INTEGER DEFAULT 0,
  messages_count INTEGER DEFAULT 0,
  preferences JSONB DEFAULT '{}',
  gdpr_consent JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(email, therapist_id)
);
```

### 3. Tabla `bookings`
```sql
CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  therapist_id UUID REFERENCES users(id) ON DELETE CASCADE,
  therapy_type VARCHAR(100) NOT NULL,
  therapy_duration INTEGER DEFAULT 60,
  status VARCHAR(20) DEFAULT 'upcoming',
  amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'EUR',
  payment_status VARCHAR(20) DEFAULT 'unpaid',
  payment_method VARCHAR(20),
  location VARCHAR(255) NOT NULL,
  notes TEXT,
  meeting_link TEXT,
  session_document TEXT,
  plan_id UUID,
  reminder_sent BOOLEAN DEFAULT FALSE,
  cancellation_reason VARCHAR(500),
  cancelled_by VARCHAR(20),
  cancelled_at TIMESTAMPTZ,
  last_status_change TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 4. Tabla `professional_profiles`
```sql
CREATE TABLE professional_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  about TEXT,
  therapies TEXT[],
  is_available BOOLEAN DEFAULT TRUE,
  video_presentation JSONB,
  stats JSONB DEFAULT '{}',
  specializations JSONB[],
  languages JSONB[],
  education JSONB[],
  experience JSONB[],
  rates JSONB DEFAULT '{}',
  work_locations JSONB[],
  social_media JSONB,
  external_links JSONB[],
  pricing_packages JSONB,
  preferences JSONB DEFAULT '{}',
  legal_info JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 5. Tabla `session_notes`
```sql
CREATE TABLE session_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE UNIQUE NOT NULL,
  therapist_id UUID REFERENCES users(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  notes TEXT NOT NULL,
  objectives TEXT[],
  homework TEXT[],
  next_steps TEXT,
  mood VARCHAR(20) NOT NULL,
  progress VARCHAR(20) NOT NULL,
  is_confidential BOOLEAN DEFAULT TRUE,
  session_type VARCHAR(20) DEFAULT 'follow_up',
  treatment_plan JSONB,
  risk_assessment JSONB DEFAULT '{"level": "none", "flagged": false}',
  clinical_measures JSONB,
  session_duration INTEGER,
  tags TEXT[],
  last_edited_by UUID REFERENCES users(id),
  edit_history JSONB[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 📁 Estructura del Código Migrado

```
backend/
├── src/
│   ├── config/
│   │   ├── database.js          # ← Actualizar a Supabase
│   │   └── supabase.js          # ← NUEVO: Configuración Supabase
│   ├── models/
│   │   ├── _migrations/         # ← NUEVO: Scripts de migración
│   │   ├── User.js              # ← Migrar a Supabase
│   │   ├── Client.js            # ← Migrar a Supabase
│   │   └── ... (30 modelos)
│   ├── services/
│   │   ├── supabaseService.js   # ← NUEVO: Capa de servicio Supabase
│   │   └── ...
│   └── ...
├── supabase/
│   ├── migrations/
│   │   ├── 001_initial_schema.sql
│   │   └── 002_seed_data.sql
│   ├── functions/               # Edge Functions (si es necesario)
│   └── policies/                # Políticas RLS
└── scripts/
    ├── migrate-data.js          # Script de migración Mongo → Supabase
    └── validate-migration.js    # Validación post-migración
```

---

## 🔄 Pasos de Implementación

### Fase 1: Preparación (1-2 días)
1. ✅ Instalar dependencias (`@supabase/supabase-js`)
2. ✅ Configurar proyecto Supabase
3. ✅ Crear esquema SQL inicial
4. ✅ Configurar RLS policies
5. ✅ Crear cliente Supabase en backend

### Fase 2: Migración de Modelos (1 semana)
1. Migrar modelos principales (User, Client, Booking)
2. Migrar modelos de perfil y configuración
3. Migrar modelos de comunicación
4. Migrar modelos de pagos
5. Migrar modelos de terapia y documentos

### Fase 3: Actualización de Controladores (1 semana)
1. Actualizar auth controllers
2. Actualizar user controllers
3. Actualizar client controllers
4. Actualizar booking controllers
5. Actualizar todos los demás controllers

### Fase 4: Migración de Datos (2-3 días)
1. Exportar datos de MongoDB
2. Transformar datos para PostgreSQL
3. Importar datos a Supabase
4. Validar integridad de datos
5. Pruebas completas

### Fase 5: Testing y Deploy (3-5 días)
1. Tests de integración
2. Tests end-to-end
3. Optimización de queries
4. Configuración de backups
5. Deploy a producción

---

## 💡 Consideraciones Importantes

### Cambios de Paradigma

| MongoDB (Mongoose) | Supabase (PostgreSQL) |
|-------------------|----------------------|
| Esquema flexible | Esquema rígido (SQL) |
| Relaciones con `ref` | Foreign Keys |
| Virtuals | Views o computed columns |
| Pre/post hooks | Triggers o middleware app |
| Aggregations | SQL GROUP BY, CTEs |
| ObjectId | UUID |
| Arrays embebidos | JSONB o tablas separadas |

### Mapeo de Tipos de Datos

| MongoDB | PostgreSQL |
|---------|-----------|
| `ObjectId` | `UUID` |
| `String` | `VARCHAR/TEXT` |
| `Number` | `INTEGER/DECIMAL` |
| `Date` | `TIMESTAMPTZ` |
| `Boolean` | `BOOLEAN` |
| `Array` | `ARRAY` o `JSONB` |
| `Object` | `JSONB` |
| `Mixed` | `JSONB` |

### Relaciones a Mantener

1. **User → ProfessionalProfile** (1:1)
2. **User → Client** (1:N)
3. **User → Booking** (1:N)
4. **Client → Booking** (1:N)
5. **Booking → SessionNote** (1:1)
6. **User → AvailabilitySlot** (1:N)
7. **User → Notification** (1:N)
8. **Client → Payment** (1:N)
9. **Booking → Payment** (1:1)
10. **User → TherapyPlan** (1:N)

---

## 🛡️ Seguridad (RLS Policies)

### Ejemplo de Policy para `clients`
```sql
-- Usuarios solo ven sus propios clientes
CREATE POLICY "Users can only see their own clients"
  ON clients
  FOR ALL
  TO authenticated
  USING (therapist_id = auth.uid());
```

### Ejemplo de Policy para `bookings`
```sql
-- Terapeutas ven citas de sus clientes
CREATE POLICY "Therapists can manage their bookings"
  ON bookings
  FOR ALL
  TO authenticated
  USING (
    therapist_id = auth.uid() OR
    client_id IN (SELECT id FROM clients WHERE therapist_id = auth.uid())
  );
```

---

## 📊 Performance

### Índices a Crear
```sql
-- Users
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_supabase_id ON users(supabase_id);

-- Clients
CREATE INDEX idx_clients_therapist ON clients(therapist_id);
CREATE INDEX idx_clients_email ON clients(email);

-- Bookings
CREATE INDEX idx_bookings_therapist_date ON bookings(therapist_id, date);
CREATE INDEX idx_bookings_client ON bookings(client_id);

-- Session Notes
CREATE INDEX idx_session_notes_booking ON session_notes(booking_id);
CREATE INDEX idx_session_notes_therapist_client ON session_notes(therapist_id, client_id);
```

---

## ✅ Checklist de Migración

- [ ] Crear proyecto Supabase
- [ ] Configurar variables de entorno
- [ ] Crear esquema SQL completo
- [ ] Configurar RLS policies
- [ ] Migrar modelo User
- [ ] Migrar modelo Client
- [ ] Migrar modelo Booking
- [ ] Migrar modelo ProfessionalProfile
- [ ] Migrar modelo SessionNote
- [ ] Migrar resto de modelos
- [ ] Actualizar auth controllers
- [ ] Actualizar user controllers
- [ ] Actualizar client controllers
- [ ] Actualizar booking controllers
- [ ] Actualizar resto de controllers
- [ ] Crear scripts de migración de datos
- [ ] Ejecutar migración de datos
- [ ] Validar datos migrados
- [ ] Tests de integración
- [ ] Tests end-to-end
- [ ] Optimizar queries lentas
- [ ] Configurar backups
- [ ] Deploy a staging
- [ ] Deploy a producción

---

## 🚀 Comenzar la Migración

Para comenzar, necesito que confirmes:

1. **¿Tienes un proyecto Supabase creado?** (Si no, te ayudo a crearlo)
2. **¿Quieres migrar los datos existentes de MongoDB?** (O empezar desde cero)
3. **¿Prefieres migración gradual o completa?** (Algunos modelos primero, luego el resto)

Una vez confirmado, comenzaré con la implementación real.
