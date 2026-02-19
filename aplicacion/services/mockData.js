export const MOCK_USER = {
  _id: 'mock-user-id-123',
  name: 'Juan Pérez',
  email: 'cliente@ejemplo.com',
  role: 'client',
  therapistId: 'mock-therapist-id-456',
  phone: '+52 55 1234 5678',
  status: 'active',
  dateOfBirth: '1990-01-01',
  emergencyContact: {
    name: 'María Pérez',
    phone: '+52 55 8765 4321',
    relation: 'Hermana'
  }
};

export const MOCK_THERAPIST = {
  _id: 'mock-therapist-id-456',
  name: 'Dra. Ana García',
  specialties: ['Ansiedad', 'Depresión', 'Terapia Cognitivo-Conductual'],
  rating: 4.8,
  email: 'ana.garcia@dharaterapeutas.com',
  phone: '+52 55 9988 7766',
  bio: 'Psicóloga clínica con más de 10 años de experiencia especializada en trastornos de ansiedad y depresión.',
  availability: {
    nextAvailable: '2023-10-25T10:00:00Z'
  },
  price: 60,
  imageUrl: 'https://randomuser.me/api/portraits/women/44.jpg'
};

export const MOCK_THERAPISTS_LIST = [
  MOCK_THERAPIST,
  {
    _id: 'mock-therapist-id-789',
    name: 'Dr. Carlos Ruiz',
    specialties: ['Pareja', 'Familia'],
    rating: 4.9,
    email: 'carlos.ruiz@dharaterapeutas.com',
    phone: '+52 55 1122 3344',
    bio: 'Especialista en terapia de pareja y dinámica familiar.',
    price: 70,
    imageUrl: 'https://randomuser.me/api/portraits/men/32.jpg'
  },
  {
    _id: 'mock-therapist-id-101',
    name: 'Lic. Sofia Lopez',
    specialties: ['Infantil', 'Adolescentes'],
    rating: 4.7,
    email: 'sofia.lopez@dharaterapeutas.com',
    phone: '+52 55 5566 7788',
    bio: 'Psicóloga infantil con enfoque lúdico.',
    price: 55,
    imageUrl: 'https://randomuser.me/api/portraits/women/68.jpg'
  }
];

export const MOCK_NOTIFICATIONS = [
  {
    _id: 'notif-1',
    title: 'Recordatorio de Cita',
    message: 'Tienes una cita mañana a las 10:00 AM con la Dra. Ana García.',
    type: 'appointment_reminder',
    read: false,
    createdAt: new Date(Date.now() - 86400000).toISOString() // 1 día atrás
  },
  {
    _id: 'notif-2',
    title: 'Nuevo Mensaje',
    message: 'La Dra. Ana García te ha enviado un mensaje.',
    type: 'message',
    read: true,
    createdAt: new Date(Date.now() - 172800000).toISOString() // 2 días atrás
  },
  {
    _id: 'notif-3',
    title: 'Pago Confirmado',
    message: 'Tu pago para la sesión del 20 de Octubre ha sido procesado exitosamente.',
    type: 'payment',
    read: true,
    createdAt: new Date(Date.now() - 259200000).toISOString() // 3 días atrás
  }
];

export const MOCK_DASHBOARD = {
  client: {
    dashboardCards: [
      { title: 'Próxima Cita', value: 'Mañana 10:00', color: '#8CA48F' },
      { title: 'Sesiones Completadas', value: '10', color: '#C9A2A6' },
      { title: 'Ejercicios Pendientes', value: '2', color: '#D58E6E' },
      { title: 'Días de Progreso', value: '45', color: '#A2B2C2' },
    ],
    nextAppointment: {
      date: new Date(Date.now() + 86400000).toISOString(), // Mañana
      therapistName: 'Dra. Ana García',
      type: 'Video Llamada'
    },
    recentActivity: [
      { id: 1, type: 'appointment', description: 'Sesión completada', date: '2023-10-20' },
      { id: 2, type: 'payment', description: 'Pago procesado', date: '2023-10-20' }
    ],
    progress: 75
  },
  stats: {
    totalSessions: 12,
    completedSessions: 10,
    upcomingSessions: 2,
    treatmentDuration: '3 meses',
    progressPercentage: 75
  }
};

export const MOCK_AVAILABILITY = {
  slots: [
    { time: '09:00', available: true },
    { time: '10:00', available: false }, // Ocupado
    { time: '11:00', available: true },
    { time: '12:00', available: true },
    { time: '13:00', available: false }, // Almuerzo
    { time: '15:00', available: true },
    { time: '16:00', available: true },
    { time: '17:00', available: true }
  ]
};

export const MOCK_PROGRESS = {
  totalSessions: 12,
  completedSessions: 10,
  progressPercentage: 75,
  treatmentDuration: '3 meses',
  goals: [
    { id: 1, title: 'Mejorar manejo de ansiedad', status: 'in_progress', progress: 60 },
    { id: 2, title: 'Establecer rutina de sueño', status: 'completed', progress: 100 },
    { id: 3, title: 'Expresión emocional', status: 'in_progress', progress: 40 }
  ],
  achievements: [
    { id: 1, title: 'Primer mes completado', date: '2023-08-15' },
    { id: 2, title: '5 sesiones consecutivas', date: '2023-09-20' }
  ]
};

export const MOCK_REVIEWS = [
  {
    _id: 'review-1',
    therapistId: 'mock-therapist-id-456',
    rating: 5,
    comment: 'Excelente terapeuta, muy empática.',
    createdAt: '2023-09-15T10:00:00Z',
    clientName: 'Juan P.'
  },
  {
    _id: 'review-2',
    therapistId: 'mock-therapist-id-456',
    rating: 4,
    comment: 'Me ayudó mucho con mi ansiedad.',
    createdAt: '2023-08-20T14:30:00Z',
    clientName: 'Maria G.'
  }
];

export const MOCK_PAYMENTS = [
  {
    _id: 'pay-1',
    amount: 60,
    status: 'completed',
    date: '2023-10-20T10:00:00Z',
    description: 'Sesión de Terapia Individual',
    method: 'Tarjeta terminada en 1234'
  },
  {
    _id: 'pay-2',
    amount: 60,
    status: 'completed',
    date: '2023-10-13T10:00:00Z',
    description: 'Sesión de Terapia Individual',
    method: 'Tarjeta terminada en 1234'
  }
];

export const MOCK_FAVORITES = [
  MOCK_THERAPIST
];

export const MOCK_DOCUMENTS = [
  {
    _id: 'doc-1',
    name: 'Guía de Relajación.pdf',
    type: 'pdf',
    size: '2.5 MB',
    uploadedAt: '2023-10-01T09:00:00Z'
  },
  {
    _id: 'doc-2',
    name: 'Registro de Emociones.xlsx',
    type: 'xlsx',
    size: '1.2 MB',
    uploadedAt: '2023-09-25T15:30:00Z'
  }
];

export const MOCK_APPOINTMENTS = [
  {
    _id: 'appt-1',
    therapistId: MOCK_THERAPIST._id,
    therapistName: MOCK_THERAPIST.name,
    date: new Date(Date.now() + 86400000).toISOString(), // Mañana
    status: 'scheduled',
    type: 'video',
    duration: 60
  },
  {
    _id: 'appt-2',
    therapistId: MOCK_THERAPIST._id,
    therapistName: MOCK_THERAPIST.name,
    date: new Date(Date.now() - 604800000).toISOString(), // Hace una semana
    status: 'completed',
    type: 'video',
    duration: 60
  }
];

