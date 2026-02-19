# Fases de Implementación - Dharaterapeutas

> Plan estructurado para completar y validar la integración frontend-backend
> **Fecha de creación**: 2026-02-10

---

## 📋 FASE 1: Verificación y Testing Crítico

**Objetivo**: Validar que todo lo marcado como "completado" realmente funciona.

**Duración estimada**: 3-5 días

### Tareas Backend

| # | Tarea | Criterio de Aceptación | Prioridad |
|---|-------|------------------------|-----------|
| 1.1 | Verificar endpoints de autenticación | Login, register, refresh, logout funcionan sin errores | 🔴 Alta |
| 1.2 | Validar JWT en todas las rutas protegidas | Token expirado rechaza acceso; token válido permite acceso | 🔴 Alta |
| 1.3 | Revisar manejo de errores del backend | Errores devuelven JSON con `message` y `code` | 🟡 Media |
| 1.4 | Verificar CORS en producción | Frontend puede hacer peticiones desde dominio permitido | 🔴 Alta |
| 1.5 | Test de carga básico | Backend responde < 500ms con 10 requests concurrentes | 🟢 Baja |

### Tareas Frontend - Core

| # | Tarea | Criterio de Aceptación | Prioridad |
|---|-------|------------------------|-----------|
| 1.6 | Eliminar código mock restante | Buscar `[MOCK` en todo el codebase; debe haber 0 resultados | 🔴 Alta |
| 1.7 | Verificar interceptores HTTP | Token se añade automático a headers; 401 redirige a login | 🔴 Alta |
| 1.8 | Test: Login completo | Usuario puede loguear, token se guarda en localStorage | 🔴 Alta |
| 1.9 | Test: Persistencia de sesión | Recargar página mantiene sesión activa | 🔴 Alta |
| 1.10 | Test: Logout | Limpiar localStorage y redirigir a login | 🔴 Alta |

### Tareas Frontend - Dashboard

| # | Tarea | Criterio de Aceptación | Prioridad |
|---|-------|------------------------|-----------|
| 1.11 | Verificar estadísticas reales | Números coinciden con datos en MongoDB | 🔴 Alta |
| 1.12 | Test: Gráficos con datos | Charts renderizan sin crashear con arrays vacíos | 🟡 Media |
| 1.13 | Verificar caché de dashboard | TTL funciona; invalidate al crear nueva cita | 🟡 Media |

### Tareas Frontend - Citas (Bookings)

| # | Tarea | Criterio de Aceptación | Prioridad |
|---|-------|------------------------|-----------|
| 1.14 | **E2E: Crear nueva cita** | Cita aparece en lista y en MongoDB | 🔴 Alta |
| 1.15 | **E2E: Cancelar cita** | Estado cambia a 'cancelled'; motivo guardado | 🔴 Alta |
| 1.16 | **E2E: Reprogramar cita** | Fecha/hora actualizadas en DB | 🔴 Alta |
| 1.17 | Test: Vista calendario | Mes/semana/día muestran citas correctamente | 🟡 Media |
| 1.18 | Verificar recordatorios | Se programan correctamente (ver en consola/logs) | 🟢 Baja |

### Tareas Frontend - Clientes

| # | Tarea | Criterio de Aceptación | Prioridad |
|---|-------|------------------------|-----------|
| 1.19 | **E2E: Crear cliente** | Cliente aparece en lista y DB | 🔴 Alta |
| 1.20 | **E2E: Actualizar notas de cliente** | Notas persisten después de recargar | 🔴 Alta |
| 1.21 | **E2E: Eliminar cliente** | Cliente marcado como inactivo/eliminado | 🟡 Media |
| 1.22 | Test: Búsqueda de clientes | Buscar por nombre, email, teléfono funciona | 🟡 Media |

### Tareas Frontend - Perfil Profesional

| # | Tarea | Criterio de Aceptación | Prioridad |
|---|-------|------------------------|-----------|
| 1.23 | Verificar actualización de datos personales | Nombre, email, teléfono se guardan en DB | 🔴 Alta |
| 1.24 | Test: Subir foto de perfil | Imagen se procesa y guarda; preview funciona | 🟡 Media |
| 1.25 | Verificar especialidades | Array de especialidades se guarda correctamente | 🟡 Media |
| 1.26 | Test: Ubicaciones de trabajo | CRUD de ubicaciones funciona | 🟡 Media |

### Entregables Fase 1

- [ ] Reporte de bugs encontrados con screenshots/logs
- [ ] Lista de funcionalidades que NO funcionan como se documentó
- [ ] Cobertura de tests actualizada

---

## 📋 FASE 2: Completar Funcionalidades Pendientes

**Objetivo**: Implementar lo que falta o está incompleto.

**Duración estimada**: 5-7 días

### Tareas Backend

| # | Tarea | Criterio de Aceptación | Prioridad |
|---|-------|------------------------|-----------|
| 2.1 | Implementar validación de fechas | No permitir citas en horarios ocupados | 🔴 Alta |
| 2.2 | Agregar paginación a endpoints faltantes | `/clients`, `/bookings` soportan `page` y `limit` | 🟡 Media |
| 2.3 | Implementar búsqueda full-text | Endpoint `/search` funciona para clientes | 🟡 Media |
| 2.4 | Agregar soft delete | DELETE marca como `isDeleted: true` | 🟡 Media |
| 2.5 | Implementar rate limiting | Máximo 100 requests/minuto por IP | 🟢 Baja |

### Tareas Frontend - Configuración de Cuenta

| # | Tarea | Criterio de Aceptación | Prioridad |
|---|-------|------------------------|-----------|
| 2.6 | **E2E: Cambiar contraseña** | Validar contraseña actual; nueva debe funcionar | 🔴 Alta |
| 2.7 | Implementar preferencias de notificación | Checkboxes guardan estado en DB | 🟡 Media |
| 2.8 | Implementar eliminar cuenta | Modal de confirmación; datos marcados para borrado | 🟡 Media |

### Tareas Frontend - Verificación Profesional

| # | Tarea | Criterio de Aceptación | Prioridad |
|---|-------|------------------------|-----------|
| 2.9 | **E2E: Subir documentos** | PDF/imagen sube a servidor; progreso visible | 🔴 Alta |
| 2.10 | Mostrar estado de verificación | Badge con color según estado (pending/approved) | 🟡 Media |
| 2.11 | Lista de documentos subidos | Poder ver y descargar documentos propios | 🟡 Media |

### Tareas Frontend - Centro de Ayuda

| # | Tarea | Criterio de Aceptación | Prioridad |
|---|-------|------------------------|-----------|
| 2.12 | Conectar FAQs a API | Preguntas cargan desde `/api/support/faq` | 🟡 Media |
| 2.13 | Implementar creación de tickets | Formulario crea ticket; confirmación visible | 🟡 Media |
| 2.14 | Mostrar historial de tickets | Lista de tickets previos del usuario | 🟢 Baja |

### Tareas Frontend - Pagos

| # | Tarea | Criterio de Aceptación | Prioridad |
|---|-------|------------------------|-----------|
| 2.15 | Formulario registrar pago | Efectivo/tarjeta/transferencia guarda en DB | 🔴 Alta |
| 2.16 | Generar factura PDF | Botón descarga PDF con datos correctos | 🟡 Media |
| 2.17 | Implementar reembolso | Botón reembolso con confirmación y motivo | 🟡 Media |

### Tareas Frontend - Documentos

| # | Tarea | Criterio de Aceptación | Prioridad |
|---|-------|------------------------|-----------|
| 2.18 | Implementar upload de documentos | Drag & drop funciona; progreso visible | 🟡 Media |
| 2.19 | Lista de documentos | Cards con título, fecha, tipo, botón descargar | 🟡 Media |
| 2.20 | Compartir con cliente | Toggle para compartir; genera link temporal | 🟢 Baja |

### Entregables Fase 2

- [ ] Todas las funcionalidades de Fase 2 testeadas y funcionando
- [ ] Documentación actualizada de endpoints usados
- [ ] Screenshots de flujos completos

---

## 📋 FASE 3: Integraciones Externas

**Objetivo**: Configurar servicios externos que actualmente son opcionales.

**Duración estimada**: 4-6 días

### Tareas - Autenticación Social

| # | Tarea | Criterio de Aceptación | Prioridad |
|---|-------|------------------------|-----------|
| 3.1 | Configurar Google OAuth en Google Cloud | Credenciales válidas; redirect URI configurado | 🔴 Alta |
| 3.2 | Implementar login con Google en backend | Endpoint `/api/auth/google` funciona | 🔴 Alta |
| 3.3 | Implementar botón "Login con Google" en frontend | Popup funciona; usuario se crea/autentica | 🔴 Alta |
| 3.4 | (Opcional) Configurar Facebook Login | Similar a Google | 🟢 Baja |

### Tareas - Pagos (Stripe)

| # | Tarea | Criterio de Aceptación | Prioridad |
|---|-------|------------------------|-----------|
| 3.5 | Crear cuenta Stripe y obtener API keys | Claves en `.env` del backend | 🔴 Alta |
| 3.6 | Implementar endpoint de pago con Stripe | `/api/payments/stripe` crea payment intent | 🔴 Alta |
| 3.7 | Implementar Stripe Elements en frontend | Formulario de tarjeta seguro | 🔴 Alta |
| 3.8 | Webhook para confirmar pago | Endpoint recibe eventos de Stripe | 🟡 Media |
| 3.9 | Manejar estados de pago | Éxito, fallo, pendiente mostrados al usuario | 🟡 Media |

### Tareas - Almacenamiento (AWS S3)

| # | Tarea | Criterio de Aceptación | Prioridad |
|---|-------|------------------------|-----------|
| 3.10 | Crear bucket S3 y credenciales IAM | Bucket privado; usuario con permisos mínimos | 🟡 Media |
| 3.11 | Implementar upload a S3 en backend | Presigned URLs para subida directa | 🟡 Media |
| 3.12 | Migrar documentos existentes a S3 | Script de migración funciona | 🟢 Baja |
| 3.13 | (Opcional) CloudFront para distribución | CDN configurado | 🟢 Baja |

### Tareas - Notificaciones SMS

| # | Tarea | Criterio de Aceptación | Prioridad |
|---|-------|------------------------|-----------|
| 3.14 | Configurar Twilio | Account SID y Auth Token en `.env` | 🟡 Media |
| 3.15 | Implementar envío de SMS en backend | Endpoint `/api/sms/send` funciona | 🟡 Media |
| 3.16 | SMS de recordatorio de cita | Se envía 24h antes automáticamente | 🟢 Baja |

### Tareas - Email Transaccional

| # | Tarea | Criterio de Aceptación | Prioridad |
|---|-------|------------------------|-----------|
| 3.17 | Configurar SendGrid/AWS SES | API key válida | 🟡 Media |
| 3.18 | Implementar templates de email | Confirmación de cita, registro, etc. | 🟡 Media |
| 3.19 | Enviar emails en eventos relevantes | Registro, nueva cita, cancelación | 🟡 Media |

### Entregables Fase 3

- [ ] Guía de configuración de integraciones externas
- [ ] Variables de entorno documentadas
- [ ] Test de cada integración funcionando

---

## 📋 FASE 4: Optimización y Preparación para Producción

**Objetivo**: Performance, seguridad y monitoreo.

**Duración estimada**: 5-7 días

### Tareas - Performance

| # | Tarea | Criterio de Aceptación | Prioridad |
|---|-------|------------------------|-----------|
| 4.1 | Implementar lazy loading de rutas | Code splitting por feature | 🟡 Media |
| 4.2 | Optimizar bundle size | Analizar con `npm run build`; < 500KB initial | 🟡 Media |
| 4.3 | Agregar service worker | App funciona offline para datos cacheados | 🟢 Baja |
| 4.4 | Optimizar imágenes | WebP con fallback; lazy loading | 🟡 Media |
| 4.5 | Implementar virtual scrolling | Listas grandes (>100 items) no laggean | 🟢 Baja |

### Tareas - Seguridad

| # | Tarea | Criterio de Aceptación | Prioridad |
|---|-------|------------------------|-----------|
| 4.6 | Audit de dependencias | `npm audit` sin vulnerabilidades críticas | 🔴 Alta |
| 4.7 | Implementar CSP headers | Content-Security-Policy configurado | 🔴 Alta |
| 4.8 | Sanitizar inputs | XSS prevención en todos los formularios | 🔴 Alta |
| 4.9 | Rate limiting en frontend | Prevenir spam de botones | 🟡 Media |
| 4.10 | Revisar exposición de datos | No enviar datos sensibles innecesarios | 🔴 Alta |
| 4.11 | HTTPS obligatorio | Redirigir HTTP a HTTPS | 🔴 Alta |

### Tareas - Monitoreo

| # | Tarea | Criterio de Aceptación | Prioridad |
|---|-------|------------------------|-----------|
| 4.12 | Configurar Sentry | Errores reportados automáticamente | 🟡 Media |
| 4.13 | Implementar logging estructurado | Logs con contexto en backend | 🟡 Media |
| 4.14 | Dashboard de métricas | Tiempo de respuesta, tasa de error | 🟢 Baja |
| 4.15 | Analytics de uso | Google Analytics o Mixpanel | 🟢 Baja |

### Tareas - Testing Automatizado

| # | Tarea | Criterio de Aceptación | Prioridad |
|---|-------|------------------------|-----------|
| 4.16 | Tests unitarios críticos | Auth, Booking, Client services | 🔴 Alta |
| 4.17 | Tests de integración | API endpoints principales | 🔴 Alta |
| 4.18 | Tests E2E con Playwright | Flujos críticos automatizados | 🟡 Media |
| 4.19 | Cobertura mínima 70% | Reporte de cobertura generado | 🟡 Media |

### Tareas - Documentación

| # | Tarea | Criterio de Aceptación | Prioridad |
|---|-------|------------------------|-----------|
| 4.20 | Actualizar README | Instrucciones claras de instalación | 🟡 Media |
| 4.21 | Documentar API | Swagger/OpenAPI de endpoints | 🟡 Media |
| 4.22 | Guía de despliegue | Pasos para deploy en producción | 🔴 Alta |
| 4.23 | Runbook de troubleshooting | Soluciones a problemas comunes | 🟢 Baja |

### Entregables Fase 4

- [ ] Checklist de seguridad completado
- [ ] Reporte de performance (Lighthouse > 80)
- [ ] Documentación completa actualizada
- [ ] CI/CD pipeline funcionando

---

## 📋 FASE 5: Lanzamiento y Post-Lanzamiento

**Objetivo**: Deploy y monitoreo inicial en producción.

**Duración estimada**: 2-3 días

### Tareas Pre-Deploy

| # | Tarea | Criterio de Aceptación | Prioridad |
|---|-------|------------------------|-----------|
| 5.1 | Backup de base de datos | MongoDB dump guardado | 🔴 Alta |
| 5.2 | Verificar variables de entorno | Todas las prod env vars configuradas | 🔴 Alta |
| 5.3 | Test en ambiente de staging | Smoke tests pasan | 🔴 Alta |
| 5.4 | Configurar dominio y SSL | HTTPS funcionando | 🔴 Alta |

### Tareas Deploy

| # | Tarea | Criterio de Aceptación | Prioridad |
|---|-------|------------------------|-----------|
| 5.5 | Deploy backend | API accesible y saludable | 🔴 Alta |
| 5.6 | Deploy frontend | App carga sin errores | 🔴 Alta |
| 5.7 | Verificar conexión frontend-backend | Peticiones exitosas | 🔴 Alta |

### Tareas Post-Deploy

| # | Tarea | Criterio de Aceptación | Prioridad |
|---|-------|------------------------|-----------|
| 5.8 | Monitoreo activo 24h | Dashboard de errores revisado cada 4h | 🔴 Alta |
| 5.9 | Verificar métricas críticas | Login, bookings, payments funcionan | 🔴 Alta |
| 5.10 | Comunicar a usuarios | Email/notificación de nueva versión | 🟢 Baja |

### Entregables Fase 5

- [ ] App en producción funcionando
- [ ] Documentación de deploy
- [ ] Plan de rollback preparado

---

## 📊 Resumen de Prioridades

```
🔴 Alta: Bloqueante para producción - Debe completarse antes del lanzamiento
🟡 Media: Importante pero no bloqueante - Puede hacerse post-lanzamiento
🟢 Baja: Mejora/nice-to-have - Planificar para futuras iteraciones
```

| Fase | Tareas 🔴 | Tareas 🟡 | Tareas 🟢 | Estimación |
|------|-----------|-----------|-----------|------------|
| 1 - Verificación | 11 | 7 | 1 | 3-5 días |
| 2 - Funcionalidades | 3 | 13 | 2 | 5-7 días |
| 3 - Integraciones | 5 | 6 | 3 | 4-6 días |
| 4 - Optimización | 5 | 9 | 6 | 5-7 días |
| 5 - Lanzamiento | 7 | 0 | 1 | 2-3 días |
| **Total** | **31** | **35** | **13** | **19-28 días** |

---

## 🎯 Próximos Pasos Inmediatos

1. **Hoy**: Comenzar con tareas 1.1 a 1.5 (verificación backend)
2. **Mañana**: Tareas 1.6 a 1.10 (verificación frontend core)
3. **Día 3**: Tareas 1.11 a 1.26 (E2E testing crítico)

**Nota**: Si se encuentran bugs en Fase 1, documentarlos y decidir si se arreglan inmediatamente o se mueven a Fase 2.

---

**Última actualización**: 2026-02-10
**Versión**: 1.0
