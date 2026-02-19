# Integración Stripe - Registro de Terapeutas

## Resumen

Sistema completo de registro para terapeutas con:
- **3 meses de prueba gratuita** (trial)
- **Verificación de tarjeta requerida** (para cobros futuros)
- **Integración con Stripe** para suscripciones

## Productos creados en Stripe

| Producto | ID | Precio | ID de Precio |
|----------|-----|--------|--------------|
| Dhara Terapeuta - Plan Avanzado | `prod_TzA7wDocFsRLtp` | 38,99€/mes | `price_1T1BngECp38q24a3IczRTdHW` |

## Flujo de registro

```
Usuario hace clic en "Soy Profesional" en el modal
    ↓
Redirige a /registro-terapeuta
    ↓
Formulario en 3 pasos:
  - Paso 1: Datos personales
  - Paso 2: Información profesional  
  - Paso 3: Plan y pago
    ↓
Crea usuario en Supabase Auth
    ↓
Llama a POST /api/terapeutas/suscribir
    ↓
Backend crea sesión de Checkout en Stripe con trial
    ↓
Redirige a Stripe Checkout
    ↓
Usuario introduce tarjeta (sin cargo)
    ↓
Stripe redirige a /registro-exitoso?session_id=xxx
    ↓
Frontend verifica el registro con el backend
    ↓
¡Registro completo!
```

## Archivos creados/modificados

### Frontend
| Archivo | Descripción |
|---------|-------------|
| `src/landing/RegistroTerapeuta.tsx` | Formulario de registro en 3 pasos |
| `src/landing/RegistroExitoso.tsx` | Página de confirmación post-registro |
| `src/landing/UneteModal.tsx` | Modificado para redirigir profesionales |
| `src/app/router.jsx` | Añadidas rutas `/registro-terapeuta` y `/registro-exitoso` |

### Backend
| Archivo | Descripción |
|---------|-------------|
| `backend/src/controllers/therapistRegistrationController.js` | Controlador del registro |
| `backend/src/routes/therapistRegistrationRoutes.js` | Rutas `/api/terapeutas/*` |
| `backend/src/services/stripeService.js` | Métodos añadidos: `createSubscriptionCheckout`, `getCheckoutSession`, `getSubscription` |
| `backend/src/controllers/stripeController.js` | Webhook actualizado para manejar eventos de suscripción |
| `backend/src/app.js` | Registradas nuevas rutas |
| `backend/src/models/User.js` | Añadidos campos: `stripeCustomerId`, `stripeSubscriptionId`, `subscriptionStatus` |

## Variables de entorno necesarias

```env
# Backend (.env)
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PLAN_AVANZADO_PRICE_ID=price_1T1BngECp38q24a3IczRTdHW
FRONTEND_URL=https://dharadimensionhumana.es

# Frontend (.env)
VITE_API_URL=https://api.dhara.com
```

## Endpoints de la API

### POST /api/terapeutas/suscribir
Crea una sesión de checkout en Stripe con trial.

**Request:**
```json
{
  "email": "terapeuta@ejemplo.com",
  "nombre": "María García",
  "userId": "uuid-del-usuario",
  "trialDays": 90
}
```

**Response:**
```json
{
  "success": true,
  "message": "Sesión de checkout creada correctamente",
  "data": {
    "url": "https://checkout.stripe.com/c/pay/...",
    "sessionId": "cs_test_...",
    "customerId": "cus_..."
  }
}
```

### GET /api/terapeutas/verificar-registro?session_id=xxx
Verifica el estado del registro después del checkout.

**Response:**
```json
{
  "success": true,
  "data": {
    "status": "complete",
    "paymentStatus": "paid",
    "subscriptionId": "sub_..."
  }
}
```

## Webhooks de Stripe

El endpoint `/api/payments/stripe/webhook` maneja estos eventos:

| Evento | Acción |
|--------|--------|
| `checkout.session.completed` | Crea/actualiza suscripción en BD |
| `invoice.paid` | Marca suscripción como activa |
| `invoice.payment_failed` | Marca como `past_due` |
| `customer.subscription.updated` | Actualiza estado de suscripción |
| `customer.subscription.deleted` | Marca como cancelada |

## URLs de la aplicación

| Ruta | Descripción |
|------|-------------|
| `/` | Landing page |
| `/registro-terapeuta` | Formulario de registro |
| `/registro-exitoso` | Confirmación post-registro |
| `/login` | Inicio de sesión |

## Notas importantes

1. **El trial se configura en el backend** usando `trial_period_days: 90`
2. **La tarjeta se solicita en Stripe Checkout**, no la guardamos nosotros
3. **Después del trial**, se cobran 38,99€ automáticamente cada mes
4. **Sin permanencia**: el usuario puede cancelar en cualquier momento
5. **El plan usado en BD es `professional`** (equivalente al Plan Avanzado de 38,99€)

## Pruebas

Para probar el flujo completo:

1. Ve a la landing page
2. Haz clic en "Únete Hoy"
3. Selecciona "Soy Profesional"
4. Completa el formulario de registro
5. En Stripe Checkout usa la tarjeta de prueba: `4242 4242 4242 4242`
6. Cualquier fecha futura, cualquier CVC
7. Deberías ser redirigido a `/registro-exitoso`
