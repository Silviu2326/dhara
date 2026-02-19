# Recomendaciones de Modelos para Dharaterapeutas

## Resumen Ejecutivo

Después de analizar todas las páginas de la aplicación Dharaterapeutas, he identificado las entidades de datos principales y sus relaciones. Esta aplicación para terapeutas profesionales requiere un conjunto robusto de modelos para manejar desde la gestión de clientes hasta pagos, documentos y planes terapéuticos.

## Modelos Principales

### 1. **User (Usuario/Terapeuta)**
**Páginas relacionadas:** Login, Dashboard, ProfessionalProfile, AccountSettings, Verification
```javascript
{
  id: String,
  email: String,
  password: String, // hasheado
  name: String,
  avatar: String, // URL de imagen
  banner: String, // URL de imagen de banner
  isVerified: Boolean,
  verificationStatus: Enum['pending', 'approved', 'rejected', 'not_submitted'],
  createdAt: Date,
  updatedAt: Date
}
```

### 2. **ProfessionalProfile (Perfil Profesional)**
**Páginas relacionadas:** ProfessionalProfile, Dashboard
```javascript
{
  id: String,
  userId: String, // FK a User
  about: Text,
  therapies: Array[String], // especialidades
  isAvailable: Boolean,
  videoPresentation: {
    url: String,
    title: String,
    description: String
  },
  stats: {
    totalSessions: Number,
    activeClients: Number,
    averageRating: Number,
    totalClients: Number,
    responseTime: Number, // en horas
    completionRate: Number, // porcentaje
    satisfactionRate: Number // porcentaje
  },
  createdAt: Date,
  updatedAt: Date
}
```

### 3. **Client (Cliente)**
**Páginas relacionadas:** Clients, Dashboard, Bookings, Chat, DocumentsMaterials, PlansSubscription
```javascript
{
  id: String,
  name: String,
  email: String,
  phone: String,
  avatar: String,
  status: Enum['active', 'inactive', 'demo'],
  age: Number,
  address: String,
  emergencyContact: {
    name: String,
    phone: String,
    relationship: String
  },
  notes: Text,
  tags: Array[String],
  createdAt: Date,
  lastSession: Date,
  sessionsCount: Number,
  rating: Number, // valoración promedio
  paymentsCount: Number,
  documentsCount: Number,
  messagesCount: Number,
  therapistId: String // FK a User
}
```

### 4. **Booking (Reserva/Cita)**
**Páginas relacionadas:** Bookings, Dashboard, Availability, PlansSubscription
```javascript
{
  id: String,
  date: Date,
  startTime: String, // formato HH:mm
  endTime: String,
  clientId: String, // FK a Client
  therapistId: String, // FK a User
  therapyType: String,
  therapyDuration: Number, // en minutos
  status: Enum['upcoming', 'pending', 'completed', 'cancelled', 'no_show'],
  amount: Number,
  currency: String,
  paymentStatus: Enum['paid', 'unpaid', 'refunded'],
  paymentMethod: String,
  location: String,
  notes: Text,
  meetingLink: String,
  sessionDocument: String, // archivo de sesión
  planId: String, // FK a TherapyPlan (opcional)
  createdAt: Date,
  updatedAt: Date
}
```

### 5. **AvailabilitySlot (Disponibilidad)**
**Páginas relacionadas:** Availability
```javascript
{
  id: String,
  title: String,
  startDate: Date,
  endDate: Date,
  startTime: String,
  endTime: String,
  repeat: Enum['none', 'daily', 'weekly', 'monthly'],
  color: String,
  type: Enum['availability', 'unavailable'],
  location: String, // FK a WorkLocation
  therapistId: String, // FK a User
  timezone: String,
  createdAt: Date
}
```

### 6. **Absence (Ausencia)**
**Páginas relacionadas:** Availability
```javascript
{
  id: String,
  title: String,
  startDate: Date,
  endDate: Date,
  allDay: Boolean,
  absenceType: Enum['vacation', 'sick_leave', 'conference', 'personal', 'other'],
  notes: Text,
  therapistId: String, // FK a User
  createdAt: Date
}
```

### 7. **Conversation (Conversación de Chat)**
**Páginas relacionadas:** Chat, Dashboard
```javascript
{
  id: String,
  clientId: String, // FK a Client
  therapistId: String, // FK a User
  lastMessage: {
    content: String,
    timestamp: Date,
    senderId: String,
    type: Enum['text', 'image', 'file', 'audio']
  },
  unreadCount: Number,
  status: Enum['active', 'archived'],
  createdAt: Date,
  updatedAt: Date
}
```

### 8. **Message (Mensaje)**
**Páginas relacionadas:** Chat
```javascript
{
  id: String,
  conversationId: String, // FK a Conversation
  senderId: String, // puede ser Client o User
  senderType: Enum['therapist', 'client'],
  content: Text,
  type: Enum['text', 'image', 'file', 'audio', 'mixed'],
  attachments: Array[{
    id: String,
    name: String,
    url: String,
    type: String,
    size: Number
  }],
  isRead: Boolean,
  timestamp: Date,
  editedAt: Date
}
```

### 9. **Payment (Pago)**
**Páginas relacionadas:** Payments, Dashboard, Bookings
```javascript
{
  id: String,
  amount: Number,
  currency: String,
  status: Enum['pending', 'completed', 'failed', 'refunded'],
  method: Enum['card', 'transfer', 'cash', 'other'],
  clientId: String, // FK a Client
  therapistId: String, // FK a User
  bookingId: String, // FK a Booking (opcional)
  description: String,
  invoiceUrl: String,
  transactionId: String, // ID del procesador de pagos
  fees: Number, // comisiones
  netAmount: Number, // cantidad neta recibida
  paymentDate: Date,
  refundReason: String,
  createdAt: Date
}
```

### 10. **PayoutRequest (Solicitud de Transferencia)**
**Páginas relacionadas:** Payments
```javascript
{
  id: String,
  therapistId: String, // FK a User
  amount: Number,
  currency: String,
  status: Enum['pending', 'processing', 'completed', 'failed'],
  bankAccount: {
    accountNumber: String,
    routingNumber: String,
    accountHolderName: String
  },
  requestDate: Date,
  processedDate: Date,
  fees: Number,
  createdAt: Date
}
```

### 11. **Review (Reseña)**
**Páginas relacionadas:** Reviews, Dashboard, ProfessionalProfile
```javascript
{
  id: String,
  clientId: String, // FK a Client
  therapistId: String, // FK a User
  bookingId: String, // FK a Booking (opcional)
  rating: Number, // 1-5
  title: String,
  comment: Text,
  response: Text, // respuesta del terapeuta
  responseDate: Date,
  isPublic: Boolean,
  isVerified: Boolean,
  tags: Array[String],
  createdAt: Date,
  updatedAt: Date
}
```

### 12. **Notification (Notificación)**
**Páginas relacionadas:** Notifications, Dashboard
```javascript
{
  id: String,
  userId: String, // FK a User
  type: Enum['appointment', 'message', 'document', 'payment', 'system'],
  title: String,
  summary: Text,
  data: Object, // datos específicos del tipo
  isRead: Boolean,
  source: String,
  priority: Enum['low', 'medium', 'high', 'critical'],
  actionUrl: String,
  expiresAt: Date,
  createdAt: Date
}
```

### 13. **Document (Documento)**
**Páginas relacionadas:** DocumentsMaterials, Verification
```javascript
{
  id: String,
  title: String,
  filename: String,
  originalName: String,
  type: Enum['pdf', 'image', 'audio', 'video', 'doc', 'other'],
  mimeType: String,
  size: Number,
  url: String,
  clientId: String, // FK a Client (opcional, null para documentos generales)
  therapistId: String, // FK a User
  session: String, // referencia a sesión
  tags: Array[String],
  isShared: Boolean,
  downloadCount: Number,
  createdAt: Date,
  updatedAt: Date
}
```

### 14. **VerificationDocument (Documento de Verificación)**
**Páginas relacionadas:** Verification
```javascript
{
  id: String,
  therapistId: String, // FK a User
  type: Enum['diploma', 'license', 'insurance', 'certificate', 'other'],
  name: String,
  filename: String,
  url: String,
  status: Enum['pending', 'approved', 'rejected'],
  reviewerComment: Text,
  reviewDate: Date,
  reviewerId: String, // FK a revisor
  uploadDate: Date,
  expiryDate: Date
}
```

### 15. **TherapyPlan (Plan Terapéutico)**
**Páginas relacionadas:** PlansSubscription, Bookings
```javascript
{
  id: String,
  name: String,
  type: Enum['ansiedad', 'depresion', 'pareja', 'trauma', 'adicciones', 'other'],
  description: Text,
  duration: Number, // semanas
  sessionsPerWeek: Number,
  totalSessions: Number,
  status: Enum['draft', 'active', 'archived'],
  objectives: Array[String],
  techniques: Array[String],
  homework: Array[String],
  therapistId: String, // FK a User
  assignedClientsCount: Number,
  createdAt: Date,
  updatedAt: Date
}
```

### 16. **PlanAssignment (Asignación de Plan)**
**Páginas relacionadas:** PlansSubscription
```javascript
{
  id: String,
  planId: String, // FK a TherapyPlan
  clientId: String, // FK a Client
  therapistId: String, // FK a User
  startDate: Date,
  endDate: Date,
  status: Enum['active', 'completed', 'cancelled', 'paused'],
  progress: {
    completedSessions: Number,
    completedObjectives: Array[String],
    notes: Text
  },
  assignedAt: Date,
  completedAt: Date
}
```

### 17. **WorkLocation (Ubicación de Trabajo)**
**Páginas relacionadas:** ProfessionalProfile, Availability
```javascript
{
  id: String,
  therapistId: String, // FK a User
  name: String,
  address: String,
  city: String,
  postalCode: String,
  phone: String,
  email: String,
  isPrimary: Boolean,
  schedule: {
    monday: { enabled: Boolean, start: String, end: String },
    tuesday: { enabled: Boolean, start: String, end: String },
    wednesday: { enabled: Boolean, start: String, end: String },
    thursday: { enabled: Boolean, start: String, end: String },
    friday: { enabled: Boolean, start: String, end: String },
    saturday: { enabled: Boolean, start: String, end: String },
    sunday: { enabled: Boolean, start: String, end: String }
  },
  createdAt: Date
}
```

### 18. **Credentials (Credenciales)**
**Páginas relacionadas:** ProfessionalProfile
```javascript
{
  id: String,
  therapistId: String, // FK a User
  title: String,
  institution: String,
  year: String,
  description: Text,
  documentUrl: String,
  isVerified: Boolean,
  createdAt: Date
}
```

### 19. **Rates (Tarifas)**
**Páginas relacionadas:** ProfessionalProfile, Bookings, Payments
```javascript
{
  id: String,
  therapistId: String, // FK a User
  sessionPrice: Number,
  followUpPrice: Number,
  packagePrice: Number,
  coupleSessionPrice: Number,
  currency: String,
  isActive: Boolean,
  validFrom: Date,
  validUntil: Date,
  createdAt: Date
}
```

### 20. **PricingPackage (Paquetes de Precios)**
**Páginas relacionadas:** ProfessionalProfile
```javascript
{
  id: String,
  therapistId: String, // FK a User
  name: String,
  description: Text,
  sessions: Number,
  originalPrice: Number,
  discountedPrice: Number,
  validityDays: Number,
  isActive: Boolean,
  features: Array[String],
  createdAt: Date
}
```

### 21. **Coupon (Cupón de Descuento)**
**Páginas relacionadas:** ProfessionalProfile, Payments
```javascript
{
  id: String,
  therapistId: String, // FK a User
  code: String,
  description: String,
  discountType: Enum['percentage', 'fixed'],
  discountValue: Number,
  minAmount: Number,
  maxUses: Number,
  usedCount: Number,
  validFrom: Date,
  validUntil: Date,
  isActive: Boolean,
  applicableServices: Array[String],
  createdAt: Date
}
```

### 22. **Subscription (Suscripción)**
**Páginas relacionadas:** AccountSettings, PlansSubscription
```javascript
{
  id: String,
  therapistId: String, // FK a User
  plan: Enum['basic', 'professional', 'premium'],
  status: Enum['active', 'cancelled', 'suspended', 'expired'],
  startDate: Date,
  endDate: Date,
  renewalDate: Date,
  amount: Number,
  currency: String,
  paymentMethod: String,
  features: Array[String],
  limits: {
    maxClients: Number,
    maxStorage: Number, // en bytes
    maxSessions: Number
  },
  createdAt: Date,
  updatedAt: Date
}
```

### 23. **Integration (Integración)**
**Páginas relacionadas:** Integrations
```javascript
{
  id: String,
  therapistId: String, // FK a User
  provider: Enum['google_calendar', 'outlook', 'zoom', 'whatsapp', 'stripe'],
  status: Enum['connected', 'disconnected', 'error'],
  config: Object, // configuración específica del proveedor
  credentials: Object, // tokens y claves (encriptado)
  lastSync: Date,
  syncErrors: Array[String],
  isActive: Boolean,
  connectedAt: Date,
  updatedAt: Date
}
```

### 24. **Webhook (Webhook)**
**Páginas relacionadas:** Integrations
```javascript
{
  id: String,
  therapistId: String, // FK a User
  url: String,
  events: Array[String], // eventos que activan el webhook
  isActive: Boolean,
  secret: String, // para verificar la firma
  lastTriggered: Date,
  successCount: Number,
  errorCount: Number,
  createdAt: Date
}
```

### 25. **NotificationSettings (Configuración de Notificaciones)**
**Páginas relacionadas:** Notifications
```javascript
{
  id: String,
  therapistId: String, // FK a User
  email: {
    appointments: Boolean,
    messages: Boolean,
    payments: Boolean,
    reminders: Boolean
  },
  push: {
    appointments: Boolean,
    messages: Boolean,
    payments: Boolean,
    reminders: Boolean
  },
  sms: {
    appointments: Boolean,
    urgentMessages: Boolean
  },
  frequency: Enum['immediate', 'hourly', 'daily'],
  quietHours: {
    enabled: Boolean,
    start: String,
    end: String
  },
  updatedAt: Date
}
```

### 26. **AuditLog (Registro de Auditoría)**
**Páginas relacionadas:** Verification, AccountSettings
```javascript
{
  id: String,
  userId: String, // FK a User
  action: String,
  resource: String,
  resourceId: String,
  oldValues: Object,
  newValues: Object,
  metadata: Object,
  ipAddress: String,
  userAgent: String,
  timestamp: Date
}
```

## Modelos de Relación

### 27. **ClientPlanProgress (Progreso del Cliente en el Plan)**
```javascript
{
  id: String,
  clientId: String, // FK a Client
  planId: String, // FK a TherapyPlan
  objective: String,
  status: Enum['not_started', 'in_progress', 'completed'],
  notes: Text,
  completedAt: Date,
  updatedAt: Date
}
```

### 28. **SessionNote (Notas de Sesión)**
```javascript
{
  id: String,
  bookingId: String, // FK a Booking
  therapistId: String, // FK a User
  clientId: String, // FK a Client
  notes: Text,
  objectives: Array[String],
  homework: Array[String],
  nextSteps: Text,
  mood: Enum['very_poor', 'poor', 'fair', 'good', 'excellent'],
  progress: Enum['no_progress', 'minimal', 'moderate', 'significant', 'excellent'],
  isConfidential: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

## Relaciones Principales

1. **User** ↔ **Client** (One-to-Many): Un terapeuta tiene muchos clientes
2. **User** ↔ **Booking** (One-to-Many): Un terapeuta tiene muchas reservas
3. **Client** ↔ **Booking** (One-to-Many): Un cliente tiene muchas reservas
4. **User** ↔ **TherapyPlan** (One-to-Many): Un terapeuta crea muchos planes
5. **Client** ↔ **PlanAssignment** (One-to-Many): Un cliente puede tener múltiples asignaciones de planes
6. **TherapyPlan** ↔ **PlanAssignment** (One-to-Many): Un plan puede ser asignado a múltiples clientes
7. **Client** ↔ **Conversation** (One-to-One): Cada cliente tiene una conversación con el terapeuta
8. **Conversation** ↔ **Message** (One-to-Many): Una conversación tiene muchos mensajes
9. **Client** ↔ **Review** (One-to-Many): Un cliente puede dejar múltiples reseñas
10. **User** ↔ **Document** (One-to-Many): Un terapeuta puede subir muchos documentos

## Consideraciones de Implementación

### Índices Recomendados
- `User.email` (único)
- `Client.therapistId + Client.status`
- `Booking.therapistId + Booking.date`
- `Booking.clientId + Booking.status`
- `Message.conversationId + Message.timestamp`
- `Payment.therapistId + Payment.status`
- `Notification.userId + Notification.isRead`
- `Document.therapistId + Document.type`

### Validaciones Importantes
- **Email único** para User y Client
- **Horarios de disponibilidad** no deben solaparse
- **Fechas de citas** deben estar dentro de la disponibilidad
- **Pagos** deben tener cliente y terapeuta válidos
- **Documentos** deben tener tamaño máximo controlado
- **Planes terapéuticos** deben tener objetivos y duración válidos

### Seguridad y Privacidad
- **Encriptación** de datos sensibles (documentos médicos, notas de sesión)
- **Control de acceso** basado en roles (terapeuta solo ve sus datos)
- **Logs de auditoría** para cambios críticos
- **Retención de datos** según normativas de protección de datos

### Optimizaciones de Rendimiento
- **Paginación** para listas largas (clientes, mensajes, notificaciones)
- **Caché** para datos frecuentemente accedidos (estadísticas del dashboard)
- **Agregaciones** pre-calculadas para métricas complejas
- **Archivado** de datos antiguos (conversaciones, notificaciones)

## Conclusión

Este conjunto de modelos proporciona una base sólida para la aplicación Dharaterapeutas, cubriendo todas las funcionalidades identificadas en las páginas analizadas. Los modelos están diseñados para ser escalables, seguros y eficientes, con relaciones claras que facilitan consultas complejas y mantienen la integridad de los datos.

La estructura modular permite agregar nuevas funcionalidades sin afectar los modelos existentes, y la separación de responsabilidades facilita el mantenimiento y la evolución del sistema.