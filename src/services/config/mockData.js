
// Datos falsos para simular la API

export const MOCK_DATA = {
  currentUser: {
    id: 'user_123',
    email: 'terapeuta@ejemplo.com',
    firstName: 'Ana',
    lastName: 'García',
    role: 'therapist',
    profileImage: 'https://i.pravatar.cc/150?u=user_123',
    status: 'active',
    verificationStatus: 'verified',
    createdAt: '2024-01-01T10:00:00Z'
  },
  professionalProfile: {
    id: 'prof_123',
    userId: 'user_123',
    title: 'Psicóloga Clínica',
    bio: 'Especialista en terapia cognitivo-conductual con 10 años de experiencia.',
    specialties: ['Ansiedad', 'Depresión', 'Estrés'],
    languages: ['Español', 'Inglés'],
    education: [
      {
        institution: 'Universidad Nacional',
        degree: 'Licenciatura en Psicología',
        year: 2015
      }
    ],
    hourlyRate: 60,
    currency: 'USD'
  },
  clients: [
    {
      id: 'client_1',
      firstName: 'Juan',
      lastName: 'Pérez',
      email: 'juan.perez@email.com',
      phone: '+1234567890',
      status: 'active',
      tags: ['ansiedad', 'nuevo'],
      nextAppointment: '2024-05-20T10:00:00Z',
      lastAppointment: '2024-05-10T10:00:00Z',
      totalSessions: 5,
      avatar: 'https://i.pravatar.cc/150?u=client_1'
    },
    {
      id: 'client_2',
      firstName: 'María',
      lastName: 'López',
      email: 'maria.lopez@email.com',
      phone: '+1234567891',
      status: 'active',
      tags: ['depresión'],
      nextAppointment: null,
      lastAppointment: '2024-05-12T15:00:00Z',
      totalSessions: 12,
      avatar: 'https://i.pravatar.cc/150?u=client_2'
    },
    {
      id: 'client_3',
      firstName: 'Carlos',
      lastName: 'Ruiz',
      email: 'carlos.ruiz@email.com',
      phone: '+1234567892',
      status: 'inactive',
      tags: [],
      nextAppointment: null,
      lastAppointment: '2024-04-01T09:00:00Z',
      totalSessions: 3,
      avatar: 'https://i.pravatar.cc/150?u=client_3'
    }
  ],
  bookings: [
    {
      id: 'booking_1',
      therapistId: 'user_123',
      clientId: 'client_1',
      clientName: 'Juan Pérez',
      dateTime: new Date(Date.now() + 86400000).toISOString(), // Mañana
      duration: 60,
      status: 'scheduled',
      type: 'therapy_session',
      location: 'Consultorio Principal',
      notes: 'Sesión de seguimiento'
    },
    {
      id: 'booking_2',
      therapistId: 'user_123',
      clientId: 'client_2',
      clientName: 'María López',
      dateTime: new Date(Date.now() - 86400000).toISOString(), // Ayer
      duration: 60,
      status: 'completed',
      type: 'therapy_session',
      location: 'Online',
      notes: 'Primera sesión exitosa'
    },
     {
      id: 'booking_3',
      therapistId: 'user_123',
      clientId: 'client_1',
      clientName: 'Juan Pérez',
      dateTime: new Date(Date.now() + 172800000).toISOString(), // Pasado mañana
      duration: 60,
      status: 'scheduled',
      type: 'therapy_session',
      location: 'Consultorio Principal',
      notes: ''
    }
  ],
  statistics: {
    totalClients: 15,
    activeClients: 12,
    totalSessions: 145,
    monthlyRevenue: 2500,
    upcomingAppointments: 5
  },
  availability: {
      slots: [], // To be populated if needed
      exceptions: []
  },
  reviews: [
      {
          id: 'review_1',
          author: 'Cliente Anónimo',
          rating: 5,
          comment: 'Excelente profesional, muy empática.',
          date: '2024-05-01',
          response: null,
          hasResponse: false
      },
      {
          id: 'review_2',
          author: 'María L.',
          rating: 4,
          comment: 'Muy buena sesión.',
          date: '2024-04-20',
          response: 'Gracias María!',
          hasResponse: true
      }
  ],
  payments: [
      {
          id: 'pay_1',
          amount: 60,
          status: 'completed',
          date: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          clientId: 'client_1'
      },
      {
          id: 'pay_2',
          amount: 60,
          status: 'completed',
          date: new Date(Date.now() - 86400000).toISOString(),
          createdAt: new Date(Date.now() - 86400000).toISOString(),
          clientId: 'client_2'
      }
  ],
  chats: [
      {
          id: 'chat_1',
          clientId: 'client_1',
          unreadCount: 2,
          lastMessage: 'Hola, tengo una duda sobre...'
      }
  ],
  documents: [
      {
          id: 'doc_1',
          name: 'Consentimiento Informado',
          status: 'pending',
          clientName: 'Juan Pérez',
          type: 'legal'
      }
  ],
  subscription: {
      id: 'sub_1',
      planName: 'Profesional',
      status: 'active',
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
  },
  rates: [
      {
          id: 'rate_1',
          serviceType: 'individual_therapy',
          amount: 60,
          currency: 'USD',
          duration: 60,
          name: 'Terapia Individual'
      },
      {
          id: 'rate_2',
          serviceType: 'couple_therapy',
          amount: 80,
          currency: 'USD',
          duration: 90,
          name: 'Terapia de Pareja'
      }
  ],
  pricingPackages: [
      {
          id: 'pkg_1',
          name: 'Pack Inicial',
          type: 'therapy_session_bundle',
          price: 200,
          currency: 'USD',
          sessionCount: 4,
          status: 'active'
      },
      {
          id: 'pkg_2',
          name: 'Pack Intensivo',
          type: 'therapy_session_bundle',
          price: 450,
          currency: 'USD',
          sessionCount: 10,
          status: 'active'
      }
  ]
};

// Helpers para simular latencia y errores
export const mockDelay = (ms = 500) => new Promise(resolve => setTimeout(resolve, ms));

export const mockResponse = async (data, status = 200) => {
    await mockDelay();
    if (status >= 400) {
        throw { response: { status, data } };
    }
    return { data, status };
};
