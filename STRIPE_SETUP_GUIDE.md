# 💳 Guía de Configuración de Stripe

Esta guía te ayudará a configurar Stripe para procesar pagos en Dharaterapeutas.

## 📋 Requisitos Previos

- Cuenta de Stripe (gratis en https://stripe.com)
- Backend y frontend del proyecto instalados

---

## 1️⃣ Crear Cuenta en Stripe

### Paso 1: Registro

1. Ve a https://stripe.com
2. Click en "Sign up"
3. Completa el formulario de registro:
   - Email
   - Nombre completo
   - Contraseña
   - País
4. Verifica tu email

### Paso 2: Completar información de la cuenta

1. Inicia sesión en el Dashboard de Stripe
2. Ve a **Settings** > **Business settings**
3. Completa:
   - Nombre del negocio: `Dhara Dimensión Humana`
   - Tipo de negocio: `Healthcare`
   - Dirección
   - Datos fiscales

---

## 2️⃣ Obtener API Keys

### Claves de Desarrollo (Test Mode)

1. En el Dashboard, asegúrate de estar en **Test mode** (switch en la esquina superior derecha)
2. Ve a **Developers** > **API keys**
3. Copia las siguientes claves:
   - **Publishable key**: Comienza con `pk_test_...`
   - **Secret key**: Comienza con `sk_test_...` (click en "Reveal test key")

### Variables de Entorno

**Frontend** (`.env`):
```env
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_51...
```

**Backend** (`.env`):
```env
STRIPE_SECRET_KEY=sk_test_51...
```

---

## 3️⃣ Configurar Webhooks

Los webhooks permiten que Stripe notifique a tu backend sobre eventos de pago.

### Paso 1: Crear Webhook Endpoint

1. Ve a **Developers** > **Webhooks**
2. Click en "+ Add endpoint"
3. Completa:
   - **Endpoint URL**: `https://tudominio.com/api/payments/stripe/webhook`
   - Para desarrollo local, usa ngrok:
     ```bash
     ngrok http 5000
     ```
     URL sería: `https://xxxxx.ngrok.io/api/payments/stripe/webhook`

### Paso 2: Seleccionar Eventos

Selecciona los siguientes eventos:
- ✅ `payment_intent.succeeded`
- ✅ `payment_intent.payment_failed`
- ✅ `payment_intent.canceled`
- ✅ `charge.refunded`

### Paso 3: Obtener Webhook Secret

1. Después de crear el webhook, click en el endpoint
2. Copia el **Signing secret** (comienza con `whsec_...`)
3. Agrégalo al `.env` del backend:

```env
STRIPE_WEBHOOK_SECRET=whsec_...
```

---

## 4️⃣ Instalar Dependencias

### Backend
```bash
cd backend
npm install stripe
```

### Frontend
```bash
npm install @stripe/stripe-js @stripe/react-stripe-js
```

---

## 5️⃣ Probar la Integración

### Tarjetas de Prueba

Stripe proporciona tarjetas de prueba para el modo de desarrollo:

| Número | Resultado |
|--------|-----------|
| `4242 4242 4242 4242` | Pago exitoso |
| `4000 0000 0000 0002` | Pago declinado |
| `4000 0000 0000 9995` | Fondos insuficientes |
| `4000 0027 6000 3184` | Requiere autenticación 3D Secure |

**Datos adicionales para las pruebas:**
- Fecha de expiración: Cualquier fecha futura
- CVC: Cualquier 3 dígitos
- Código postal: Cualquier código

### Flujo de Prueba

1. **Iniciar backend**:
   ```bash
   cd backend
   npm run dev
   ```

2. **Iniciar frontend**:
   ```bash
   npm run dev
   ```

3. **Probar pago**:
   ```javascript
   import { StripePaymentModal } from './components/stripe/StripePaymentModal';

   // En tu componente
   const [showPaymentModal, setShowPaymentModal] = useState(false);

   <StripePaymentModal
     isOpen={showPaymentModal}
     onClose={() => setShowPaymentModal(false)}
     amount={50.00}
     clientId="client-id-here"
     bookingId="booking-id-here"
     description="Sesión de terapia - 1 hora"
     onSuccess={(data) => {
       console.log('Pago exitoso:', data);
     }}
     onError={(error) => {
       console.error('Error en pago:', error);
     }}
   />
   ```

4. **Usar tarjeta de prueba**:
   - Número: `4242 4242 4242 4242`
   - Fecha: `12/34`
   - CVC: `123`

5. **Verificar en Stripe Dashboard**:
   - Ve a **Payments** en el Dashboard
   - Deberías ver el pago de prueba

---

## 6️⃣ Arquitectura Implementada

### Backend

#### Servicio de Stripe (`backend/src/services/stripeService.js`)
- `createPaymentIntent()` - Crear intención de pago
- `confirmPayment()` - Confirmar pago procesado
- `createCustomer()` - Crear cliente en Stripe
- `createRefund()` - Procesar reembolso
- `createCheckoutSession()` - Crear sesión de checkout
- `constructWebhookEvent()` - Validar webhooks

#### Controlador (`backend/src/controllers/stripeController.js`)
- `createPaymentIntent` - POST `/api/payments/stripe/create-intent`
- `confirmPayment` - POST `/api/payments/stripe/confirm`
- `handleWebhook` - POST `/api/payments/stripe/webhook`
- `createRefund` - POST `/api/payments/stripe/refund`

### Frontend

#### Servicio (`src/services/api/stripeService.js`)
- Comunicación con endpoints del backend
- Manejo de errores
- Obtención de clave pública

#### Componentes
- `StripePaymentForm.jsx` - Formulario de pago con Stripe Elements
- `StripePaymentModal.jsx` - Modal completo de pago

---

## 7️⃣ Flujo de Pago

```
1. Usuario → Click "Pagar"
   ↓
2. Frontend → stripeService.createPaymentIntent()
   ↓
3. Backend → Crear Payment Intent en Stripe
   ↓
4. Backend → Guardar registro en MongoDB (status: pending)
   ↓
5. Backend → Retornar clientSecret
   ↓
6. Frontend → Mostrar StripePaymentModal
   ↓
7. Usuario → Ingresar datos de tarjeta
   ↓
8. Frontend → stripe.confirmPayment()
   ↓
9. Stripe → Procesar pago
   ↓
10. Stripe → Enviar webhook al backend
    ↓
11. Backend → Actualizar pago (status: completed)
    ↓
12. Backend → Actualizar reserva (paymentStatus: paid)
    ↓
13. Frontend → Confirmar con backend
    ↓
14. Frontend → Mostrar éxito al usuario
```

---

## 8️⃣ Seguridad

### Mejores Prácticas Implementadas

✅ **Claves secretas seguras**
- Secret key nunca expuesta al frontend
- Webhook secret para validar eventos

✅ **PCI Compliance**
- Datos de tarjeta nunca pasan por tu servidor
- Stripe Elements maneja la información sensible

✅ **Validación de webhooks**
- Firma verificada con webhook secret
- Eventos solo procesados si son auténticos

✅ **Manejo de errores**
- Reintentos automáticos
- Mensajes de error amigables

✅ **Logs de auditoría**
- Todos los eventos registrados
- Trazabilidad completa

---

## 9️⃣ Pasar a Producción

Cuando estés listo para pagos reales:

### Paso 1: Activar Cuenta

1. En el Dashboard, ve a **Settings** > **Business settings**
2. Completa toda la información requerida
3. Verifica tu identidad (puede requerir documentos)
4. Conecta una cuenta bancaria para recibir pagos

### Paso 2: Cambiar a Live Mode

1. Switch a **Live mode** en el Dashboard
2. Ve a **Developers** > **API keys**
3. Copia las claves de producción:
   - `pk_live_...`
   - `sk_live_...`

### Paso 3: Actualizar Variables de Entorno

**Producción** (`.env.production`):
```env
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...
```

### Paso 4: Configurar Webhook de Producción

1. Crea un nuevo webhook endpoint con tu URL de producción
2. Selecciona los mismos eventos
3. Actualiza el webhook secret:
```env
STRIPE_WEBHOOK_SECRET=whsec_... (nuevo secret de producción)
```

---

## 🔟 Tarifas de Stripe

### Europa
- **1.4% + €0.25** por transacción con tarjeta europea
- **2.9% + €0.25** por transacción con tarjeta no europea
- Sin cuotas mensuales
- Sin costos de configuración

### Reembolsos
- Se devuelven las tarifas de Stripe si se reembolsa dentro de 180 días

---

## 📊 Dashboard y Reportes

### Información Disponible

En el Dashboard de Stripe puedes ver:
- 💰 **Pagos**: Todos los pagos procesados
- 📈 **Balance**: Fondos disponibles y pendientes
- 👥 **Clientes**: Base de datos de clientes
- 🔄 **Reembolsos**: Historial de reembolsos
- 📊 **Reportes**: Análisis de ingresos
- 🔔 **Webhooks**: Logs de eventos enviados

---

## 🆘 Troubleshooting

### Error: "Invalid API key provided"
**Solución**: Verifica que la clave en `.env` esté correctamente copiada y que el servidor esté reiniciado.

### Error: "No such payment_intent"
**Solución**: El Payment Intent puede haber expirado (10 minutos). Crear uno nuevo.

### Webhook no se ejecuta
**Solución**:
1. Verifica que la URL del webhook sea accesible públicamente
2. Revisa los logs del webhook en Stripe Dashboard
3. Confirma que el webhook secret esté configurado

### Pago aparece como "Processing"
**Solución**: Algunos métodos de pago requieren tiempo adicional. El webhook notificará cuando se complete.

---

## 📚 Recursos Adicionales

- [Documentación oficial de Stripe](https://stripe.com/docs)
- [Testing Stripe](https://stripe.com/docs/testing)
- [Webhooks Guide](https://stripe.com/docs/webhooks)
- [Security Best Practices](https://stripe.com/docs/security)

---

## ✅ Checklist de Configuración

- [ ] Cuenta de Stripe creada
- [ ] API keys obtenidas y configuradas
- [ ] Webhook endpoint creado
- [ ] Webhook secret configurado
- [ ] Dependencias instaladas (backend y frontend)
- [ ] Test de pago exitoso
- [ ] Verificación de webhook funcionando
- [ ] (Producción) Cuenta activada
- [ ] (Producción) Claves de producción configuradas
- [ ] (Producción) Webhook de producción creado

---

**¡Listo!** Stripe está completamente configurado para procesar pagos. 💳
