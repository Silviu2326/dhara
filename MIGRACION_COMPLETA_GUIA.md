# 🚀 Guía de Migración Completa: MongoDB → Supabase

Esta guía te ayudará a completar la migración del backend de MongoDB a Supabase (PostgreSQL).

---

## ✅ Lo que ya está hecho

1. ✅ Esquema SQL completo (30 tablas) - `backend/supabase/migrations/001_complete_schema.sql`
2. ✅ Configuración de Supabase - `backend/src/config/supabase.js`
3. ✅ Servicio base de Supabase - `backend/src/services/supabaseService.js`
4. ✅ Modelos migrados (User, Client, Booking) - `backend/src/models/supabase/`
5. ✅ Script de migración de datos - `backend/scripts/migrate-to-supabase.js`
6. ✅ Políticas RLS de seguridad - `backend/supabase/policies/rls_policies.sql`
7. ✅ Configuración dual (MongoDB/Supabase) - `backend/src/models/index.js`

---

## 📋 Pasos para completar la migración

### Paso 1: Configurar Variables de Entorno

Agrega estas variables a tu `backend/.env`:

```env
# Usar Supabase en lugar de MongoDB
USE_SUPABASE=true

# Supabase Configuration
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Mantener MongoDB por si necesitas rollback
MONGODB_URI=mongodb://localhost:27017/dharaterapeutas
```

### Paso 2: Crear el Esquema en Supabase

1. Ve a tu proyecto en [Supabase Dashboard](https://app.supabase.io)
2. Navega a **SQL Editor**
3. Crea un **New Query**
4. Copia y pega el contenido de `backend/supabase/migrations/001_complete_schema.sql`
5. Ejecuta el script (botón **Run**)

### Paso 3: Aplicar Políticas RLS

1. En el **SQL Editor**, crea otro query
2. Copia y pega el contenido de `backend/supabase/policies/rls_policies.sql`
3. Ejecuta el script

### Paso 4: Instalar Dependencias

```bash
cd backend
npm install
```

### Paso 5: Migrar los Datos (si tienes datos en MongoDB)

```bash
cd backend
node scripts/migrate-to-supabase.js
```

Este script migrará:
- Users
- Clients
- Bookings
- Professional Profiles
- Session Notes

**Nota**: Si tienes muchos datos, el script puede tardar varios minutos.

### Paso 6: Iniciar el Servidor

```bash
cd backend
npm run dev
```

Verás en la consola:
```
📦 Usando modelos de Supabase (PostgreSQL)
✅ Supabase PostgreSQL Connected
🚀 Server running on port 5000
```

---

## 🔧 Migración de Controladores

Los controladores actuales usan Mongoose. Necesitas actualizarlos para usar los modelos de Supabase.

### Ejemplo: Antes vs Después

**Antes (Mongoose):**
```javascript
const User = require('../models/User');

// Buscar usuario
const user = await User.findById(id);

// Crear usuario
const user = await User.create(data);

// Actualizar
const user = await User.findByIdAndUpdate(id, data, { new: true });
```

**Después (Supabase):**
```javascript
const { User } = require('../models'); // Usa el índice que detecta automáticamente

// Buscar usuario
const user = await User.findById(id);

// Crear usuario
const user = await User.create(data);

// Actualizar
const user = await User.findByIdAndUpdate(id, data, { new: true });
```

**¡La API es casi idéntica!** Los modelos de Supabase mantienen compatibilidad con los métodos de Mongoose.

---

## 📊 Resumen de Archivos Creados/Modificados

### Nuevos Archivos
- `backend/src/config/supabase.js` - Cliente Supabase
- `backend/src/config/database-supabase.js` - Configuración DB
- `backend/src/services/supabaseService.js` - Servicio CRUD
- `backend/src/models/supabase/User.js` - Modelo User
- `backend/src/models/supabase/Client.js` - Modelo Client
- `backend/src/models/supabase/Booking.js` - Modelo Booking
- `backend/src/models/index.js` - Índice con switch Mongo/Supabase
- `backend/supabase/migrations/001_complete_schema.sql` - Esquema SQL
- `backend/supabase/policies/rls_policies.sql` - Políticas de seguridad
- `backend/scripts/migrate-to-supabase.js` - Script de migración

### Archivos Modificados
- `backend/src/server.js` - Soporte dual Mongo/Supabase
- `backend/package.json` - Nueva dependencia `@supabase/supabase-js`

---

## 🔄 Rollback (volver a MongoDB)

Si necesitas volver a MongoDB:

1. Cambia en `backend/.env`:
```env
USE_SUPABASE=false
```

2. Reinicia el servidor:
```bash
npm run dev
```

---

## 📝 Próximos Pasos (Migrar más modelos)

Los modelos User, Client y Booking ya están migrados. Para migrar el resto:

1. Crea el modelo en `backend/src/models/supabase/[Nombre].js`
2. Actualiza `backend/src/models/index.js` para exportar el modelo de Supabase
3. Actualiza el script `backend/scripts/migrate-to-supabase.js`

### Lista de modelos pendientes:
- [ ] ProfessionalProfile (estructura compleja con JSONB)
- [ ] SessionNote
- [ ] AvailabilitySlot
- [ ] Absence
- [ ] WorkLocation
- [ ] Notification
- [ ] Payment
- [ ] Subscription
- [ ] Conversation
- [ ] Message
- [ ] Document
- [ ] Note
- [ ] TherapyPlan
- [ ] PlanAssignment
- [ ] ClientPlanProgress
- [ ] Review
- [ ] Favorite
- [ ] Coupon
- [ ] Rates
- [ ] Integration
- [ ] Credentials
- [ ] VerificationDocument
- [ ] PricingPackage
- [ ] PayoutRequest
- [ ] Webhook
- [ ] AuditLog

---

## 🆘 Troubleshooting

### Error: "Supabase URL and Service Key are required"
**Solución**: Asegúrate de tener las variables `SUPABASE_URL` y `SUPABASE_SERVICE_KEY` en tu `.env`

### Error: "relation 'users' does not exist"
**Solución**: No has ejecutado el script SQL. Ve a Supabase Dashboard > SQL Editor y ejecuta `001_complete_schema.sql`

### Error: "new row violates row-level security policy"
**Solución**: Las políticas RLS están activas pero el usuario no tiene permisos. Verifica que el JWT token sea válido.

### Los datos no se migran
**Solución**: Verifica que MongoDB esté corriendo y que `MONGODB_URI` sea correcta.

---

## 📚 Documentación Adicional

- [Documentación de Supabase](https://supabase.com/docs)
- [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)

---

## ✅ Checklist de Migración Completa

- [ ] Variables de entorno configuradas
- [ ] Esquema SQL creado en Supabase
- [ ] Políticas RLS aplicadas
- [ ] Dependencias instaladas
- [ ] Datos migrados (si aplica)
- [ ] Servidor iniciado sin errores
- [ ] Login funciona correctamente
- [ ] CRUD de usuarios funciona
- [ ] CRUD de clientes funciona
- [ ] CRUD de bookings funciona
- [ ] Tests pasan (si hay tests)

---

**¿Necesitas ayuda con algún paso específico?** 

¡Avísame y te ayudo a completar la migración!
