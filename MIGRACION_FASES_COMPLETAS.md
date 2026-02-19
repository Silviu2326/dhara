# 🚀 Migración MongoDB → Supabase: Plan por Fases

## ✅ FASE 0: COMPLETADA (Base)
- [x] Esquema SQL con 30 tablas
- [x] Configuración de Supabase en backend
- [x] Modelos migrados: User, Client, Booking
- [x] Script de migración de datos
- [x] Políticas RLS básicas

---

## 📋 FASE 1: Migración de Modelos Restantes

### 1.1 Modelos de Perfil y Configuración
**Prioridad: Alta** (Necesarios para el funcionamiento básico)

| Modelo | Tabla SQL | Dificultad | Estado |
|--------|-----------|------------|--------|
| ProfessionalProfile | professional_profiles | Media | ✅ Completo |
| AvailabilitySlot | availability_slots | Baja | ✅ Completo |
| Absence | absences | Baja | ✅ Completo |
| WorkLocation | work_locations | Baja | ✅ Completo |
| NotificationSettings | notification_settings | Baja | ✅ Completo |
| Rates | rates | Baja | ✅ Completo |
| Integration | integrations | Baja | ✅ Completo |

**Archivos a crear:**
- backend/src/models/supabase/ProfessionalProfile.js
- backend/src/models/supabase/AvailabilitySlot.js
- backend/src/models/supabase/Absence.js
- backend/src/models/supabase/WorkLocation.js
- backend/src/models/supabase/NotificationSettings.js
- backend/src/models/supabase/Rates.js
- backend/src/models/supabase/Integration.js

**Tareas:**
1. Crear clases modelo con métodos de instancia
2. Crear métodos estáticos (find, findById, create, update, delete)
3. Mapear campos snake_case a camelCase
4. Agregar a backend/src/models/index.js

---

### 1.2 Modelos de Documentación
**Prioridad: Alta**

| Modelo | Tabla SQL | Dificultad | Estado |
|--------|-----------|------------|--------|
| SessionNote | session_notes | Media | ✅ Completo |
| Document | documents | Baja | ✅ Completo |
| Note | notes | Baja | ✅ Completo |
| VerificationDocument | verification_documents | Baja | ✅ Completo |

---

### 1.3 Modelos de Comunicación
**Prioridad: Media**

| Modelo | Tabla SQL | Dificultad | Estado |
|--------|-----------|------------|--------|
| Conversation | conversations | Media | ✅ Completo |
| Message | messages | Media | ✅ Completo |
| Notification | notifications | Baja | ✅ Completo |

**Archivos creados:**
- `backend/src/models/supabase/Conversation.js`
- `backend/src/models/supabase/Message.js`
- `backend/src/models/supabase/Notification.js`

---

### 1.4 Modelos de Pagos y Suscripciones
**Prioridad: Alta** (Si usas Stripe/pagos)

| Modelo | Tabla SQL | Dificultad | Estado |
|--------|-----------|------------|--------|
| Payment | payments | Media | ✅ Completo |
| Subscription | subscriptions | Baja | ✅ Completo |
| PricingPackage | pricing_packages | Baja | ✅ Completo |
| PlanAssignment | plan_assignments | Media | ✅ Completo |
| PayoutRequest | payout_requests | Baja | ✅ Completo |

**Archivos creados:**
- `backend/src/models/supabase/Payment.js`
- `backend/src/models/supabase/Subscription.js`
- `backend/src/models/supabase/PricingPackage.js`
- `backend/src/models/supabase/PlanAssignment.js`
- `backend/src/models/supabase/PayoutRequest.js`

---

### 1.5 Modelos de Terapia
**Prioridad: Media**

| Modelo | Tabla SQL | Dificultad | Estado |
|--------|-----------|------------|--------|
| TherapyPlan | therapy_plans | Baja | ✅ Completo |
| ClientPlanProgress | client_plan_progress | Media | ✅ Completo |
| Credentials | credentials | Baja | ✅ Completo |

**Archivos creados:**
- `backend/src/models/supabase/TherapyPlan.js`
- `backend/src/models/supabase/ClientPlanProgress.js`
- `backend/src/models/supabase/Credentials.js`

---

### 1.6 Modelos Miscelaneos
**Prioridad: Baja**

| Modelo | Tabla SQL | Dificultad | Estado |
|--------|-----------|------------|--------|
| Review | reviews | Baja | ✅ Completo |
| Favorite | favorites | Baja | ✅ Completo |
| Coupon | coupons | Baja | ✅ Completo |
| AuditLog | audit_logs | Baja | ✅ Completo |
| Webhook | webhooks | Baja | ✅ Completo |

**Archivos creados:**
- `backend/src/models/supabase/Review.js`
- `backend/src/models/supabase/Favorite.js`
- `backend/src/models/supabase/Coupon.js`
- `backend/src/models/supabase/AuditLog.js`
- `backend/src/models/supabase/Webhook.js`

---

## 📋 FASE 2: Actualización de Controladores

### 2.1 Controladores Core ✅ COMPLETADOS
**Prioridad: Alta**

| Controlador | Rutas Afectadas | Estado |
|-------------|-----------------|--------|
| authController.js | Login, register, password reset | ✅ Completado |
| userController.js | CRUD usuarios, perfil | ✅ Completado |
| clientController.js | CRUD clientes | ✅ Completado |
| bookingController.js | CRUD citas, calendario | ✅ Completado |

**Cambios realizados:**
1. ✅ Actualizados imports para usar `require('../models')` en lugar de rutas directas
2. ✅ Eliminadas llamadas `.select('+password')` (no necesarias en Supabase)
3. ✅ Eliminadas llamadas `.populate()` - reemplazadas por queries separadas
4. ✅ Actualizadas referencias de `._id` a soportar tanto `id` como `_id`
5. ✅ Reemplazadas agregaciones de MongoDB por queries de Supabase
6. ✅ Actualizado middleware `auth.js` para usar modelos de Supabase

**Archivos modificados:**
- `backend/src/models/index.js` - Ahora usa exclusivamente modelos Supabase
- `backend/src/controllers/authController.js` - Actualizado para Supabase
- `backend/src/controllers/userController.js` - Actualizado para Supabase
- `backend/src/controllers/clientController.js` - Actualizado para Supabase
- `backend/src/controllers/bookingController.js` - Actualizado para Supabase
- `backend/src/middleware/auth.js` - Actualizado para usar modelos Supabase

---

### 2.2 Controladores de Perfil ✅ COMPLETADOS
**Prioridad: Alta**

| Controlador | Estado |
|-------------|--------|
| professionalProfileController.js | ✅ Completado |
| ratesController.js | ✅ Completado |
| workLocationController.js | ✅ Completado |
| credentialsController.js | ✅ Completado |
| verificationController.js | ✅ Completado |

**Cambios realizados:**
1. ✅ Actualizados imports para usar `require('../models')`
2. ✅ Eliminadas llamadas `.populate()` - reemplazadas por queries separadas
3. ✅ Actualizadas referencias de `._id` a soportar tanto `id` como `_id`
4. ✅ Adaptadas agregaciones de MongoDB a queries de Supabase
5. ✅ Manejo de subdocumentos (education, experience) mediante arrays JSONB
6. ✅ Geolocalización mantenida con cálculo manual de distancia (Haversine)

---

### 2.3 Controladores de Documentación ✅ COMPLETADOS
**Prioridad: Media**

| Controlador | Estado |
|-------------|--------|
| sessionNoteController.js | ✅ Completado |
| documentController.js | ✅ Completado |
| noteController.js | ✅ Completado |

**Cambios realizados:**
1. ✅ Actualizados imports para usar `require('../models')`
2. ✅ Reemplazadas agregaciones de MongoDB por queries de Supabase
3. ✅ Eliminadas llamadas `.populate()` - reemplazadas por queries separadas
4. ✅ Actualizadas referencias de `._id` a `.id`
5. ✅ Uso de `supabase` client directamente para queries complejas
6. ✅ Manejo de campos JSONB (risk_assessment, metadata, reminders)
7. ✅ Validaciones actualizadas de `isMongoId()` a `isUUID()`

**Archivos modificados:**
- `backend/src/controllers/sessionNoteController.js` - Notas de sesión con búsqueda y estadísticas
- `backend/src/controllers/documentController.js` - Gestión de documentos con uploads
- `backend/src/controllers/noteController.js` - Nuevo controlador para notas generales
- `backend/src/routes/sessionNoteRoutes.js` - Rutas actualizadas
- `backend/src/routes/noteRoutes.js` - Rutas actualizadas  
- `backend/src/routes/documentRoutes.js` - Validaciones UUID actualizadas

---

### 2.4 Controladores de Comunicación ✅ COMPLETADOS
**Prioridad: Media**

| Controlador | Estado |
|-------------|--------|
| conversationController.js | ✅ Completado |
| messageController.js | ✅ Completado |
| notificationController.js | ✅ Completado |
| notificationSettingsController.js | ✅ Completado |

**Cambios realizados:**
1. ✅ Actualizados imports para usar `require('../models')`
2. ✅ Reemplazadas agregaciones de MongoDB por queries de Supabase
3. ✅ Eliminadas llamadas `.populate()` - reemplazadas por queries separadas
4. ✅ Actualizadas referencias de `._id` a `.id`
5. ✅ Uso de `supabase` client directamente para queries complejas
6. ✅ Manejo de campos JSONB (metadata, reactions)
7. ✅ Validaciones actualizadas de `isMongoId()` a `isUUID()`

**Archivos modificados:**
- `backend/src/controllers/conversationController.js` - Conversaciones entre terapeutas y clientes
- `backend/src/controllers/messageController.js` - Mensajes en conversaciones
- `backend/src/controllers/notificationController.js` - Notificaciones del sistema
- `backend/src/controllers/notificationSettingsController.js` - Configuración de notificaciones
- `backend/src/routes/chatRoutes.js` - Rutas de chat actualizadas
- `backend/src/routes/notificationRoutes.js` - Rutas de notificaciones actualizadas
- `backend/src/routes/notificationSettingsRoutes.js` - Validaciones actualizadas

---

### 2.5 Controladores de Pagos ✅ COMPLETADOS
**Prioridad: Media**

| Controlador | Estado |
|-------------|--------|
| paymentController.js | ✅ Completado |
| subscriptionController.js | ✅ Completado |
| stripeController.js | ✅ Completado |
| pricingPackageController.js | ✅ Completado |
| planAssignmentController.js | ✅ Completado |
| couponController.js | ✅ Completado |

**Cambios realizados:**
1. ✅ Actualizados imports para usar `require('../models')`
2. ✅ Reemplazadas agregaciones de MongoDB por queries de Supabase
3. ✅ Eliminadas llamadas `.populate()` - reemplazadas por queries separadas
4. ✅ Actualizadas referencias de `._id` a `.id`
5. ✅ Uso de `supabase` client directamente para queries complejas
6. ✅ Manejo de campos JSONB (analytics, testimonials, metadata)
7. ✅ Integración Stripe actualizada con modelo Payment de Supabase
8. ✅ Validaciones actualizadas de `isMongoId()` a `isUUID()`

**Archivos modificados:**
- `backend/src/controllers/paymentController.js` - Pagos, reembolsos, retiros
- `backend/src/controllers/stripeController.js` - Integración Stripe y webhooks
- `backend/src/controllers/subscriptionController.js` - Suscripciones y planes
- `backend/src/controllers/pricingPackageController.js` - Paquetes de precios
- `backend/src/controllers/planAssignmentController.js` - Asignación de planes
- `backend/src/controllers/couponController.js` - Cupones de descuento
- `backend/src/routes/paymentRoutes.js` - Validaciones UUID actualizadas
- `backend/src/routes/subscriptionRoutes.js` - Validaciones UUID actualizadas
- `backend/src/routes/couponRoutes.js` - Validaciones UUID actualizadas
- `backend/src/routes/planAssignmentRoutes.js` - Validaciones UUID actualizadas
- `backend/src/routes/pricingPackageRoutes.js` - Validaciones UUID actualizadas
- `backend/src/routes/stripeRoutes.js` - Sin cambios necesarios (usa Stripe IDs)

---

### 2.6 Controladores de Terapia ✅ COMPLETADOS
**Prioridad: Baja**

| Controlador | Estado |
|-------------|--------|
| therapyPlanController.js | ✅ Completado |
| clientPlanProgressController.js | ✅ Integrado en PlanAssignment |

**Nota:** El `clientPlanProgressController.js` no existe como archivo separado ya que la funcionalidad de seguimiento de progreso está integrada en el modelo `ClientPlanProgress` y se maneja a través de `planAssignmentController.js`.

**Cambios realizados:**
1. ✅ Actualizados imports para usar `require('../models')`
2. ✅ Reemplazadas agregaciones de MongoDB por queries de Supabase
3. ✅ Eliminadas llamadas `.populate()` - reemplazadas por queries separadas
4. ✅ Actualizadas referencias de `._id` a `.id`
5. ✅ Implementado versionado de planes mediante tabla `therapy_plan_versions`
6. ✅ Implementado compartir planes mediante tabla `therapy_plan_shares`
7. ✅ Cálculo de calendario de sesiones en JavaScript
8. ✅ Validaciones actualizadas de `isMongoId()` a `isUUID()`

**Archivos modificados:**
- `backend/src/controllers/therapyPlanController.js` - CRUD de planes, templates, sharing
- `backend/src/routes/therapyPlanRoutes.js` - Validaciones UUID actualizadas
- `backend/src/routes/planRoutes.js` - Validaciones UUID actualizadas

---

### 2.7 Controladores Miscelaneos ✅ COMPLETADOS
**Prioridad: Baja**

| Controlador | Estado |
|-------------|--------|
| reviewController.js | ✅ Completado |
| favoriteController.js | ✅ Completado |
| auditLogController.js | ✅ Completado |
| webhookController.js | ✅ Completado |
| dashboardController.js | ✅ Completado |

**Cambios realizados:**
1. ✅ Actualizados imports para usar `require('../models')`
2. ✅ Reemplazadas agregaciones de MongoDB por queries de Supabase
3. ✅ Eliminadas llamadas `.populate()` - reemplazadas por queries separadas
4. ✅ Actualizadas referencias de `._id` a `.id`
5. ✅ Manejo de campos JSONB (metadata, authentication, delivery_logs)
6. ✅ Webhook delivery implementado con axios y firma HMAC
7. ✅ Dashboard con estadísticas calculadas vía queries
8. ✅ Validaciones actualizadas de `isMongoId()` a `isUUID()`

**Archivos modificados:**
- `backend/src/controllers/reviewController.js` - Reseñas y valoraciones
- `backend/src/controllers/favoriteController.js` - Favoritos de clientes
- `backend/src/controllers/auditLogController.js` - Logs de auditoría
- `backend/src/controllers/webhookController.js` - Webhooks externos
- `backend/src/controllers/dashboardController.js` - Dashboard y estadísticas
- `backend/src/routes/reviewRoutes.js` - Validaciones UUID actualizadas
- `backend/src/routes/auditLogRoutes.js` - Validaciones UUID actualizadas
- `backend/src/routes/webhookRoutes.js` - Validaciones UUID actualizadas

---

## 📋 FASE 3: Actualización de Middleware ✅ COMPLETADA

### 3.1 Autenticación y Middleware Core
**Prioridad: Alta**

| Middleware | Cambios | Estado |
|------------|---------|--------|
| auth.js | Verificar JWT, buscar usuario en Supabase | ✅ Completado |
| authMiddleware.js | Re-export con compatibilidad | ✅ Completado |
| errorHandler.js | Errores Supabase/PostgreSQL + legacy MongoDB | ✅ Completado |
| validation.js | Validaciones UUID + alias MongoId | ✅ Completado |
| asyncHandler.js | Sin cambios necesarios | ✅ Completado |
| notFound.js | Sin cambios necesarios | ✅ Completado |

**Cambios realizados:**

1. **authMiddleware.js** ✅
   - Corrección de re-export (checkOwnership vs requireOwnership)
   - Exporta todos los middlewares de auth.js

2. **errorHandler.js** ✅
   - Agregados manejadores para errores PostgreSQL (códigos 23505, 23503, 23502, 23514)
   - Soporte para errores de Supabase (JWT, RLS)
   - Mantenido soporte legacy para MongoDB
   - AppError mejorado con campo `errors` para validaciones

3. **validation.js** ✅
   - `validateUUID` - Nueva validación para UUID v4
   - `validateMongoId` - Alias de validateUUID para compatibilidad
   - `validateBookingCreate` - Actualizado clientId a UUID
   - Middleware `handleValidationErrors` sin cambios

---

## 📋 FASE 4: Scripts y Utilidades ✅ COMPLETADA

### 4.1 Scripts de Migración
**Prioridad: Alta (si tienes datos)**

| Script | Descripción | Estado |
|--------|-------------|--------|
| migrate-to-supabase.js | Migrar datos MongoDB → Supabase | ✅ Completado |
| validate-migration.js | Verificar integridad de datos | ✅ Completado |
| rollback-to-mongodb.js | Plan de rollback | ✅ Completado |

**Archivos creados:**
- `backend/src/scripts/migrate-to-supabase.js` - Migración completa con batch processing
- `backend/src/scripts/validate-migration.js` - Validación de conteos y muestras
- `backend/src/scripts/rollback-to-mongodb.js` - Plan de rollback detallado

### Características de los Scripts:

1. **migrate-to-supabase.js** ✅
   - Soporte para `--dry-run` (simulación sin escritura)
   - Batch processing configurable (--batch-size)
   - Transformadores para 15+ tablas
   - Manejo de UUIDs
   - Skip registros existentes (--skip-existing)
   - Reporte detallado de progreso

2. **validate-migration.js** ✅
   - Comparación de conteos MongoDB vs Supabase
   - Validación profunda con muestras (--sample-size)
   - Reporte de diferencias
   - Guarda reporte JSON para análisis

3. **rollback-to-mongodb.js** ✅
   - Plan de rollback documentado (--plan-only)
   - Verificación de prerequisitos
   - Fases: pre-rollback, rollback, post-rollback
   - Confirmación interactiva requerida
   - Reporte de ejecución

## 📁 Archivos Creados en Fase 4

| Archivo | Descripción |
|---------|-------------|
| `backend/src/scripts/migrate-to-supabase.js` | Script completo de migración con 15+ transformadores |
| `backend/src/scripts/validate-migration.js` | Validación de integridad post-migración |
| `backend/src/scripts/rollback-to-mongodb.js` | Plan de rollback con confirmaciones |

### Uso de los Scripts

```bash
# Migrar datos (simulación)
node backend/src/scripts/migrate-to-supabase.js --dry-run --verbose

# Migrar datos (ejecución real)
node backend/src/scripts/migrate-to-supabase.js --skip-existing

# Validar migración
node backend/src/scripts/validate-migration.js --verbose --sample-size=200

# Ver plan de rollback
node backend/src/scripts/rollback-to-mongodb.js --plan-only
```

---

## 📁 Archivos Modificados en Fase 3

| Archivo | Descripción |
|---------|-------------|
| `backend/src/middleware/authMiddleware.js` | Re-export corregido con todos los middlewares |
| `backend/src/middleware/errorHandler.js` | Manejadores para errores PostgreSQL (23505, 23503, etc.) |
| `backend/src/middleware/validation.js` | validateUUID + alias validateMongoId para compatibilidad |

### Códigos de Error PostgreSQL Manejados

| Código | Descripción | Manejo |
|--------|-------------|--------|
| 23505 | Unique violation (duplicado) | 409 Conflict |
| 23503 | Foreign key violation | 400 Bad Request |
| 23502 | Not null violation | 400 Bad Request |
| 23514 | Check constraint violation | 400 Bad Request |

---

## 📋 FASE 5: Testing y Validación

### 5.1 Tests de Integración ✅ COMPLETADA
**Prioridad: Alta**

| Test | Descripción | Estado | Tests |
|------|-------------|--------|-------|
| Auth flow | Login, register, logout, refresh, forgot-password | ✅ Completado | 20/20 |
| CRUD Users | getProfile, updateProfile, updatePreferences, stats | ✅ Completado | 9/9 |
| CRUD Clients | Crear, listar, obtener, actualizar, eliminar, stats | ✅ Completado | 12/12 |
| CRUD Bookings | Crear, listar, upcoming, stats, actualizar, cancelar | ✅ Completado | 13/13 |
| Relaciones FK | Verificar FK y aislamiento de datos entre terapeutas | ✅ Completado | 22/22 |

**Total: 76/76 tests pasando ✅**

**Archivos creados:**
- `backend/src/tests/integration/auth.test.js`
- `backend/src/tests/integration/users.test.js`
- `backend/src/tests/integration/clients.test.js`
- `backend/src/tests/integration/bookings.test.js`
- `backend/src/tests/integration/relations.test.js`
- `backend/src/tests/helpers/testData.js`
- `backend/src/tests/globalSetup.js`
- `backend/src/tests/globalTeardown.js`
- `backend/src/tests/check-routes.js` (diagnóstico de rutas)

**Correcciones adicionales realizadas:**
- `backend/src/routes/notificationRoutes.js` — Eliminados métodos inexistentes
- `backend/src/routes/notificationSettingsRoutes.js` — Eliminados métodos inexistentes
- `backend/src/routes/credentialsRoutes.js` — Eliminados métodos inexistentes
- `backend/src/routes/ratesRoutes.js` — Eliminados métodos inexistentes
- `backend/src/routes/verificationRoutes.js` — Eliminados métodos inexistentes
- `backend/src/routes/workLocationRoutes.js` — Eliminados métodos inexistentes
- `backend/src/routes/clientPaymentRoutes.js` — Eliminado método inexistente

**Ejecutar tests:**
```bash
cd backend
npm test                    # Todos los tests
npm run test:auth           # Solo auth
npm run test:users          # Solo usuarios
npm run test:clients        # Solo clientes
npm run test:bookings       # Solo citas
npm run test:relations      # Solo relaciones FK
npm run test:verbose        # Con detalles
node src/tests/check-routes.js  # Diagnóstico de rutas
```

---

### 5.2 Tests de Performance
**Prioridad: Media**

- Comparar tiempos de respuesta vs MongoDB
- Identificar queries lentos
- Agregar índices si es necesario

---

### 5.3 Tests de Seguridad
**Prioridad: Alta**

- Verificar RLS policies funcionan
- Probar acceso no autorizado
- Validar que usuarios solo ven sus datos

---

## 📋 FASE 6: Optimizaciones

### 6.1 Índices Adicionales
**Prioridad: Media**

Analizar queries frecuentes y agregar índices:
```sql
CREATE INDEX idx_bookings_therapist_date_status ON bookings(therapist_id, date, status);
```

---

### 6.2 Edge Functions (Opcional)
**Prioridad: Baja**

Mover lógica compleja a Edge Functions de Supabase.

---

### 6.3 Caché
**Prioridad: Baja**

Implementar caché Redis para sesiones y datos frecuentes.

---

## 📋 FASE 7: Deploy y Producción

### 7.1 Preparación
**Prioridad: Alta**

- [ ] Backup de MongoDB
- [ ] Documentar proceso de rollback
- [ ] Configurar monitoreo

### 7.2 Deploy
**Prioridad: Alta**

- [ ] Crear proyecto de producción en Supabase
- [ ] Configurar variables de entorno en servidor
- [ ] Migrar datos de producción
- [ ] Verificar funcionamiento

### 7.3 Post-Deploy
**Prioridad: Media**

- [ ] Monitorear errores
- [ ] Verificar performance
- [ ] Configurar backups automáticos

---

## 🎯 Orden Recomendado de Implementación

### Semana 1: Modelos Core ✅
1. ProfessionalProfile
2. AvailabilitySlot
3. Absence
4. WorkLocation

### Semana 2: Documentación y Comunicación ✅
1. SessionNote
2. Document
3. Note
4. Notification

### Semana 3: Pagos y Suscripciones ✅
1. Payment
2. Subscription
3. PricingPackage
4. PlanAssignment

### Semana 4: Controladores Core ✅
1. Actualizar authController
2. Actualizar userController
3. Actualizar clientController
4. Actualizar bookingController

### Semana 5: Controladores de Perfil
1. Actualizar professionalProfileController
2. Actualizar ratesController
3. Actualizar workLocationController
4. Actualizar credentialsController

### Semana 6: Controladores Restantes
1. Controladores de documentación
2. Controladores de comunicación
3. Controladores de pagos

### Semana 7: Testing y Optimización
1. Tests de integración
2. Tests de performance
3. Optimizar queries lentos

---

## 📊 Progreso Total

| Fase | Estado | Progreso |
|------|--------|----------|
| Fase 0: Base | ✅ Completa | 100% |
| Fase 1: Modelos | ✅ Completa | 100% (30/30) |
| Fase 2: Controladores | ✅ Completa | 100% (28/28) |
| Fase 3: Middleware | ✅ Completa | 100% (6/6) |
| Fase 4: Scripts | ✅ Completa | 100% (3/3) |
| Fase 5: Testing | 🔄 En progreso | 33% (5.1 ✅) |
| Fase 6: Optimización | ⏳ Pendiente | 0% |
| Fase 7: Deploy | ⏳ Pendiente | 0% |

**Progreso Global: ~88%**

---

## 🆘 Decisiones Pendientes

1. **Mantener compatibilidad con MongoDB?**
   - ✅ Opción A: Eliminar código de MongoDB (más limpio) - **SELECCIONADA**
   - Opción B: Mantener dualidad (más flexible)

2. **Migrar datos históricos?**
   - Opción A: Migrar todo (más trabajo)
   - Opción B: Empezar desde cero (perder historial)

3. **Cuándo hacer el switch en producción?**
   - Opción A: Big bang (un día específico)
   - Opción B: Migración gradual (por features)

---

## 📁 Archivos Modificados en Fase 2.2

| Archivo | Descripción |
|---------|-------------|
| `backend/src/controllers/professionalProfileController.js` | Perfil profesional con educación/experiencia como arrays JSONB |
| `backend/src/controllers/ratesController.js` | Gestión de tarifas y precios |
| `backend/src/controllers/workLocationController.js` | Ubicaciones con geolocalización (Haversine) |
| `backend/src/controllers/credentialsController.js` | Credenciales API keys/tokens |
| `backend/src/controllers/verificationController.js` | Documentos de verificación de terapeutas |

## 📁 Archivos Modificados en Fase 2.3

| Archivo | Descripción |
|---------|-------------|
| `backend/src/controllers/sessionNoteController.js` | Notas de sesión con filtros, búsqueda y estadísticas |
| `backend/src/controllers/documentController.js` | Gestión de documentos con uploads y permisos |
| `backend/src/controllers/noteController.js` | Nuevo controlador para notas generales del terapeuta |
| `backend/src/routes/sessionNoteRoutes.js` | Rutas actualizadas para usar el nuevo controlador |
| `backend/src/routes/noteRoutes.js` | Rutas actualizadas para usar el nuevo controlador |
| `backend/src/routes/documentRoutes.js` | Validaciones actualizadas a UUID |

## 📁 Archivos Modificados en Fase 2.5

| Archivo | Descripción |
|---------|-------------|
| `backend/src/controllers/paymentController.js` | Pagos, reembolsos, solicitudes de retiro, balance |
| `backend/src/controllers/stripeController.js` | Integración Stripe, webhooks, confirmaciones de pago |
| `backend/src/controllers/subscriptionController.js` | Suscripciones, planes, límites de uso |
| `backend/src/controllers/pricingPackageController.js` | Paquetes de precios, promociones, testimonials |
| `backend/src/controllers/planAssignmentController.js` | Asignación de planes terapéuticos, milestones |
| `backend/src/controllers/couponController.js` | Cupones de descuento, validación, uso |
| `backend/src/routes/paymentRoutes.js` | Validaciones UUID para payments y payouts |
| `backend/src/routes/subscriptionRoutes.js` | Validaciones UUID para suscripciones |
| `backend/src/routes/couponRoutes.js` | Validaciones UUID para cupones |
| `backend/src/routes/planAssignmentRoutes.js` | Validaciones UUID para asignaciones |
| `backend/src/routes/pricingPackageRoutes.js` | Validaciones UUID para paquetes |

## 📁 Archivos Modificados en Fase 2.6

| Archivo | Descripción |
|---------|-------------|
| `backend/src/controllers/therapyPlanController.js` | Planes terapéuticos, templates, sharing, versionado |
| `backend/src/routes/therapyPlanRoutes.js` | Validaciones UUID para planes terapéuticos |
| `backend/src/routes/planRoutes.js` | Validaciones UUID para planes (ruta alternativa) |

**Nota sobre versionado:** Se implementa mediante tabla `therapy_plan_versions` en lugar de array embebido de MongoDB.

**Nota sobre sharing:** Se implementa mediante tabla `therapy_plan_shares` con permisos (view, edit, copy).

---

## 📝 Notas de Implementación Fase 2

### Patrones de Migración Aplicados

#### 1. Imports Actualizados
```javascript
// Antes (MongoDB)
const User = require('../models/User');

// Después (Supabase)
const { User } = require('../models');
```

#### 2. Queries de Búsqueda
```javascript
// Antes (MongoDB)
const user = await User.findOne({ email }).select('+password');

// Después (Supabase)
const user = await User.findOne({ email });
```

#### 3. Populate → Queries Separadas
```javascript
// Antes (MongoDB)
const user = await User.findById(id).populate('professionalProfile');

// Después (Supabase)
const user = await User.findById(id);
const profile = await ProfessionalProfile.findOne({ user_id: user.id });
```

#### 4. Agregaciones → Queries SQL
```javascript
// Antes (MongoDB)
const stats = await Model.aggregate([...]);

// Después (Supabase)
const { data, error } = await supabase
  .from('table')
  .select('column')
  .eq('filter', value);
```

#### 5. Compatibilidad ID
```javascript
// Soportar tanto id como _id
const userId = user.id || user._id;
```

---

## 📞 Siguientes Pasos

**FASE ACTUAL: 5 - Testing y Validación**

**En Progreso:**
- Tests de integración (Auth flow, CRUD Users, CRUD Clients, CRUD Bookings)
- Tests de performance (comparación MongoDB vs Supabase)
- Tests de seguridad (RLS policies, acceso no autorizado)

---

**¿Qué quieres hacer ahora?**

**Opción A:** Fase 5 - Testing y Validación 🔄
- Tests de integración
- Tests de performance
- Tests de seguridad

**Opción B:** Fase 6 - Optimizaciones
- Índices adicionales en PostgreSQL
- Edge Functions (opcional)
- Caché Redis (opcional)

**Opción C:** Fase 7 - Deploy y Producción
- Preparación de producción
- Configuración de monitoreo
- Backups automáticos

**Opción D:** Revisar Fases Completas
- Verificar todo el trabajo realizado

**¿Cuál prefieres?**
