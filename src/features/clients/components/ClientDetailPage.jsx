import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeftIcon,
  PencilIcon,
  CalendarIcon,
  DocumentArrowUpIcon,
  TrashIcon,
  ChatBubbleLeftIcon
} from '@heroicons/react/24/outline';
import { Card } from '../../../components/Card';
import { Button } from '../../../components/Button';
import { ClientTabs } from './ClientTabs';
import { NewBookingModal } from './NewBookingModal';
import { UploadDocModal } from './UploadDocModal';
import { DeleteClientDialog } from './DeleteClientDialog';
import { PaymentDetailsModal } from './PaymentDetailsModal';
import CreateNoteModal from './CreateNoteModal';
import { bookingService } from '../../../services/api/bookingService';
import { paymentService } from '../../../services/api/paymentService';
import { reviewService } from '../../../services/api/reviewService';
import { sessionNoteService } from '../../../services/api/sessionNoteService';
import noteService from '../../../services/api/noteService';

// Mock data - en una aplicación real vendría de una API
const mockClientDetails = {
  id: 'CL001',
  name: 'Ana García López',
  email: 'ana.garcia@email.com',
  phone: '+34 666 123 456',
  avatar: null,
  status: 'active',
  lastSession: '2024-01-15T10:00:00Z',
  sessionsCount: 12,
  rating: 4.8,
  tags: ['Ansiedad', 'Terapia Individual'],
  createdAt: '2023-06-15T09:00:00Z',
  age: 32,
  address: 'Calle Mayor 123, Madrid',
  emergencyContact: {
    name: 'Carlos García',
    phone: '+34 666 789 012',
    relationship: 'Esposo'
  },
  notes: 'Cliente muy colaborativa, progreso excelente en manejo de ansiedad.',
  paymentsCount: 12,
  documentsCount: 5,
  messagesCount: 28,
  sessions: [
    {
      id: 'S001',
      date: '2024-01-15T10:00:00Z',
      duration: 60,
      type: 'Individual',
      status: 'completed',
      notes: 'Sesión muy productiva, trabajamos técnicas de respiración'
    },
    {
      id: 'S002',
      date: '2024-01-08T10:00:00Z',
      duration: 60,
      type: 'Individual',
      status: 'completed',
      notes: 'Revisión de tareas y nuevas estrategias de afrontamiento'
    }
  ],
  payments: [
    {
      id: 'P001',
      date: '2024-01-15T10:00:00Z',
      amount: 60,
      method: 'card',
      status: 'paid',
      description: 'Sesión individual - Enero 2024'
    }
  ],
  reviews: [
    {
      id: 'R001',
      date: '2024-01-15T10:00:00Z',
      rating: 5,
      comment: 'Excelente profesional, me ha ayudado mucho con mi ansiedad'
    }
  ]
};

export const ClientDetailPage = () => {
  const { clientId } = useParams();
  const navigate = useNavigate();
  const [client, setClient] = useState(null);
  const [activeTab, setActiveTab] = useState('profile');
  const [isLoading, setIsLoading] = useState(true);

  // Modal states
  const [isNewBookingModalOpen, setIsNewBookingModalOpen] = useState(false);
  const [isUploadDocModalOpen, setIsUploadDocModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isPaymentDetailsModalOpen, setIsPaymentDetailsModalOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [isCreateNoteModalOpen, setIsCreateNoteModalOpen] = useState(false);

  // Booking states
  const [appointments, setAppointments] = useState([]);
  const [isLoadingAppointments, setIsLoadingAppointments] = useState(false);
  const [appointmentStats, setAppointmentStats] = useState(null);

  // Payment states
  const [payments, setPayments] = useState([]);
  const [isLoadingPayments, setIsLoadingPayments] = useState(false);
  const [paymentStats, setPaymentStats] = useState(null);

  // Review states
  const [reviews, setReviews] = useState([]);
  const [isLoadingReviews, setIsLoadingReviews] = useState(false);
  const [reviewStats, setReviewStats] = useState({
    totalReviews: 0,
    averageRating: 0,
    ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    lastReview: null
  });

  // Session notes states
  const [sessionNotes, setSessionNotes] = useState([]);
  const [isLoadingNotes, setIsLoadingNotes] = useState(false);
  const [notesStats, setNotesStats] = useState({
    totalNotes: 0,
    averageWellnessScore: 0,
    lastNote: null,
    progressTrend: 'stable'
  });

  // Client notes states (new Note model)
  const [clientNotes, setClientNotes] = useState([]);
  const [isLoadingClientNotes, setIsLoadingClientNotes] = useState(false);
  const [clientNotesStats, setClientNotesStats] = useState({
    totalNotes: 0,
    therapistNotes: 0,
    clientNotes: 0,
    emergencyNotes: 0,
    pendingResponses: 0,
    lastNote: null
  });

  // Función para cargar las citas del cliente
  const loadClientAppointments = async (clientId) => {
    setIsLoadingAppointments(true);
    try {
      console.log('🔄 Loading appointments for client:', clientId);

      // Obtener todas las citas del cliente
      const appointmentsResponse = await bookingService.getAppointments({
        clientId: clientId,
        limit: 50, // Obtener las últimas 50 citas
        sortBy: 'dateTime',
        sortOrder: 'desc'
      });

      console.log('📅 Appointments loaded:', appointmentsResponse);

      setAppointments(appointmentsResponse.appointments || []);

      // Calcular estadísticas básicas
      const completedAppointments = appointmentsResponse.appointments?.filter(apt =>
        apt.status === 'completed'
      ) || [];

      const lastSession = completedAppointments.length > 0 ?
        new Date(completedAppointments[0].date).toISOString() : null;

      setAppointmentStats({
        totalSessions: completedAppointments.length,
        lastSession: lastSession,
        upcomingSessions: appointmentsResponse.appointments?.filter(apt =>
          apt.status === 'upcoming' || apt.status === 'confirmed'
        ).length || 0
      });

    } catch (error) {
      console.error('Error loading client appointments:', error);
      // En caso de error, usar datos vacíos
      setAppointments([]);
      setAppointmentStats({
        totalSessions: 0,
        lastSession: null,
        upcomingSessions: 0
      });
    } finally {
      setIsLoadingAppointments(false);
    }
  };

  // Función para cargar los pagos del cliente
  const loadClientPayments = async (clientId) => {
    setIsLoadingPayments(true);
    try {
      console.log('💳 Loading payments for client:', clientId);

      // Obtener todos los pagos del cliente
      const paymentsResponse = await paymentService.getPayments({
        payerId: clientId,
        limit: 50, // Obtener los últimos 50 pagos
        sortBy: 'createdAt',
        sortOrder: 'desc'
      });

      console.log('💰 Payments loaded:', paymentsResponse);

      setPayments(paymentsResponse.payments || []);

      // Calcular estadísticas básicas de pagos
      const completedPayments = paymentsResponse.payments?.filter(payment =>
        payment.status === 'completed' || payment.status === 'paid'
      ) || [];

      const totalAmount = completedPayments.reduce((sum, payment) => sum + (payment.amount || 0), 0);
      const pendingPayments = paymentsResponse.payments?.filter(payment =>
        payment.status === 'pending' || payment.status === 'processing'
      ) || [];

      setPaymentStats({
        totalPayments: completedPayments.length,
        totalAmount: totalAmount,
        pendingPayments: pendingPayments.length,
        lastPayment: completedPayments.length > 0 ?
          new Date(completedPayments[0].createdAt || completedPayments[0].date).toISOString() : null
      });

    } catch (error) {
      console.error('Error loading client payments:', error);
      // En caso de error, usar datos vacíos
      setPayments([]);
      setPaymentStats({
        totalPayments: 0,
        totalAmount: 0,
        pendingPayments: 0,
        lastPayment: null
      });
    } finally {
      setIsLoadingPayments(false);
    }
  };

  useEffect(() => {
    // Simular carga de datos del cliente
    const loadClient = async () => {
      setIsLoading(true);
      try {
        // En una aplicación real, aquí haríamos una llamada a la API
        await new Promise(resolve => setTimeout(resolve, 500));

        // Cargar datos del cliente (por ahora mock)
        const clientData = { ...mockClientDetails };
        setClient(clientData);

        // Cargar citas del cliente usando el servicio real
        await loadClientAppointments(clientId);

        // Cargar pagos del cliente usando el servicio real
        await loadClientPayments(clientId);

        // Cargar reviews del cliente usando el servicio real
        await loadClientReviews(clientId);

        // Cargar notas de sesión del cliente usando el servicio real
        await loadClientSessionNotes(clientId);

        // Cargar notas del cliente usando el nuevo modelo Note
        await loadClientNotes(clientId);

      } catch (error) {
        console.error('Error loading client:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadClient();
  }, [clientId]);

  const handleBack = () => {
    navigate('/app/clientes');
  };

  const handleEditClient = () => {
    // Implementar edición del cliente
    console.log('Edit client:', client.id);
  };

  const handleNewBooking = () => {
    setIsNewBookingModalOpen(true);
  };

  const refreshAppointments = async () => {
    if (client?.id) {
      await loadClientAppointments(client.id);
    }
  };

  const refreshPayments = async () => {
    if (client?.id) {
      await loadClientPayments(client.id);
    }
  };

  // Función para cargar las reviews del cliente
  const loadClientReviews = async (clientId) => {
    setIsLoadingReviews(true);
    try {
      console.log('🔄 Loading reviews for client:', clientId);

      const response = await reviewService.getReviews({
        reviewerId: clientId  // Reviews escritas POR el cliente
      });

      console.log('✅ Reviews API response:', response);

      // Extraer reviews del response
      let clientReviews = [];
      if (response && response.success) {
        clientReviews = response.data?.reviews || response.data || [];
      } else if (Array.isArray(response)) {
        clientReviews = response;
      }

      console.log('📊 Processed reviews:', clientReviews);

      setReviews(clientReviews);

      // Calcular estadísticas
      if (clientReviews.length > 0) {
        const averageRating = reviewService.calculateAverageRating(clientReviews);
        const ratingDistribution = reviewService.getRatingDistribution(clientReviews);
        const lastReview = clientReviews
          .sort((a, b) => new Date(b.createdAt || b.date) - new Date(a.createdAt || a.date))[0];

        setReviewStats({
          totalReviews: clientReviews.length,
          averageRating,
          ratingDistribution,
          lastReview
        });
      } else {
        setReviewStats({
          totalReviews: 0,
          averageRating: 0,
          ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
          lastReview: null
        });
      }

    } catch (error) {
      console.error('❌ Error loading client reviews:', error);
      setReviews([]);
      setReviewStats({
        totalReviews: 0,
        averageRating: 0,
        ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
        lastReview: null
      });
    } finally {
      setIsLoadingReviews(false);
    }
  };

  const refreshReviews = async () => {
    if (client?.id) {
      await loadClientReviews(client.id);
    }
  };

  // Función para cargar las notas de sesión del cliente
  const loadClientSessionNotes = async (clientId) => {
    setIsLoadingNotes(true);
    try {
      console.log('📝 Loading session notes for client:', clientId);

      // Usar el endpoint específico de cliente para mejor rendimiento
      const response = await sessionNoteService.getSessionNotes({
        client_id: clientId
      });

      console.log('✅ Session notes API response:', response);

      // Extraer notas del response
      let clientNotes = [];
      if (response && response.notes) {
        // Respuesta directa con notes
        clientNotes = response.notes;
      } else if (response && response.success) {
        // Respuesta con estructura success/data
        clientNotes = response.data?.notes || response.data || [];
      } else if (response && response.data && response.data.notes) {
        // Respuesta anidada
        clientNotes = response.data.notes;
      } else if (Array.isArray(response)) {
        // Array directo
        clientNotes = response;
      }

      console.log('📊 Processed session notes:', clientNotes);

      setSessionNotes(clientNotes);

      // Calcular estadísticas
      if (clientNotes.length > 0) {
        const totalNotes = clientNotes.length;
        const wellnessScores = clientNotes
          .filter(note => note.wellnessScore)
          .map(note => note.wellnessScore);

        const averageWellnessScore = wellnessScores.length > 0
          ? Math.round(wellnessScores.reduce((sum, score) => sum + score, 0) / wellnessScores.length)
          : 0;

        const lastNote = clientNotes
          .sort((a, b) => new Date(b.createdAt || b.date) - new Date(a.createdAt || a.date))[0];

        // Calcular tendencia de progreso
        let progressTrend = 'stable';
        if (wellnessScores.length >= 2) {
          const recentScores = wellnessScores.slice(-3); // Últimas 3 sesiones
          const first = recentScores[0];
          const last = recentScores[recentScores.length - 1];

          if (last > first + 10) progressTrend = 'improving';
          else if (last < first - 10) progressTrend = 'declining';
        }

        setNotesStats({
          totalNotes,
          averageWellnessScore,
          lastNote,
          progressTrend
        });
      } else {
        setNotesStats({
          totalNotes: 0,
          averageWellnessScore: 0,
          lastNote: null,
          progressTrend: 'stable'
        });
      }

    } catch (error) {
      console.error('❌ Error loading client session notes:', error);
      setSessionNotes([]);
      setNotesStats({
        totalNotes: 0,
        averageWellnessScore: 0,
        lastNote: null,
        progressTrend: 'stable'
      });
    } finally {
      setIsLoadingNotes(false);
    }
  };

  const refreshNotes = async () => {
    if (client?.id) {
      await loadClientSessionNotes(client.id);
    }
  };

  // Función para cargar las notas del cliente usando el nuevo modelo Note
  const loadClientNotes = async (clientId) => {
    setIsLoadingClientNotes(true);
    try {
      console.log('📝 Loading client notes for client:', clientId);

      // Obtener todas las notas relacionadas con este cliente
      const response = await noteService.getClientNotes(clientId, {
        limit: 50,
        sort_by: 'createdAt',
        sort_order: 'desc'
      });

      console.log('✅ Client notes API response:', response);

      if (response.success) {
        const notes = response.notes || [];
        setClientNotes(notes);

        // Calcular estadísticas de las notas
        const therapistNotes = notes.filter(note => note.authorType === 'therapist').length;
        const clientNotesCount = notes.filter(note => note.authorType === 'client').length;
        const emergencyNotes = notes.filter(note => note.isEmergency).length;
        const pendingResponses = notes.filter(note => note.requiresResponse).length;

        const lastNote = notes.length > 0 ?
          notes.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0] : null;

        setClientNotesStats({
          totalNotes: notes.length,
          therapistNotes,
          clientNotes: clientNotesCount,
          emergencyNotes,
          pendingResponses,
          lastNote
        });
      } else {
        console.warn('⚠️ Failed to load client notes:', response.error);
        setClientNotes([]);
        setClientNotesStats({
          totalNotes: 0,
          therapistNotes: 0,
          clientNotes: 0,
          emergencyNotes: 0,
          pendingResponses: 0,
          lastNote: null
        });
      }

    } catch (error) {
      console.error('❌ Error loading client notes:', error);
      setClientNotes([]);
      setClientNotesStats({
        totalNotes: 0,
        therapistNotes: 0,
        clientNotes: 0,
        emergencyNotes: 0,
        pendingResponses: 0,
        lastNote: null
      });
    } finally {
      setIsLoadingClientNotes(false);
    }
  };

  const refreshClientNotes = async () => {
    if (client?.id) {
      await loadClientNotes(client.id);
    }
  };

  // Función para determinar quién creó la cita
  const getAppointmentCreator = (appointment) => {
    // Si la cita tiene información del creador
    if (appointment.createdBy) {
      return {
        type: appointment.createdBy.role === 'therapist' ? 'therapist' : 'client',
        name: appointment.createdBy.name,
        id: appointment.createdBy.id
      };
    }

    // Si no tiene createdBy, inferir por otros campos
    if (appointment.requestedBy) {
      return {
        type: appointment.requestedBy === 'client' ? 'client' : 'therapist',
        name: appointment.requestedBy === 'client' ? client?.name : 'Terapeuta',
        id: appointment.requestedBy === 'client' ? client?.id : appointment.therapistId
      };
    }

    // Si la cita fue creada por el sistema o importada
    if (appointment.source === 'system' || appointment.source === 'import') {
      return {
        type: 'system',
        name: 'Sistema',
        id: null
      };
    }

    // Por defecto, asumir que fue creada por el terapeuta
    return {
      type: 'therapist',
      name: 'Terapeuta',
      id: appointment.therapistId
    };
  };

  // Función para obtener el icono y color del creador
  const getCreatorDisplay = (creator) => {
    switch (creator.type) {
      case 'therapist':
        return {
          icon: '👨‍⚕️',
          color: 'text-blue-600 bg-blue-50',
          label: 'Creada por terapeuta',
          shortLabel: 'Terapeuta'
        };
      case 'client':
        return {
          icon: '👤',
          color: 'text-green-600 bg-green-50',
          label: 'Creada por cliente',
          shortLabel: 'Cliente'
        };
      case 'system':
        return {
          icon: '🤖',
          color: 'text-gray-600 bg-gray-50',
          label: 'Creada por sistema',
          shortLabel: 'Sistema'
        };
      default:
        return {
          icon: '❓',
          color: 'text-gray-600 bg-gray-50',
          label: 'Origen desconocido',
          shortLabel: 'Desconocido'
        };
    }
  };

  const refreshAllData = async () => {
    if (client?.id) {
      await Promise.all([
        loadClientAppointments(client.id),
        loadClientPayments(client.id),
        loadClientReviews(client.id),
        loadClientSessionNotes(client.id),
        loadClientNotes(client.id)
      ]);
    }
  };

  // Funciones para manejar pagos
  const handleViewPaymentDetails = (payment) => {
    console.log('Viewing payment details:', payment);
    setSelectedPayment(payment);
    setIsPaymentDetailsModalOpen(true);
  };

  const handleDownloadInvoice = (payment) => {
    console.log('Downloading invoice for payment:', payment.id);
    // Aquí podrías descargar la factura o abrir en nueva ventana
    if (payment.invoiceUrl) {
      window.open(payment.invoiceUrl, '_blank');
    } else {
      alert('Factura no disponible para este pago');
    }
  };

  const handleUploadDoc = () => {
    setIsUploadDocModalOpen(true);
  };

  const handleDeleteClient = () => {
    setIsDeleteDialogOpen(true);
  };

  const handleStartChat = () => {
    // Navegar a la página de chat con el cliente
    navigate(`/chat?clientId=${client.id}&clientName=${encodeURIComponent(client.name)}`);
  };


  const handleCreateBooking = async (bookingData) => {
    try {
      console.log('Creating booking:', bookingData);

      // Preparar datos para la API
      const appointmentData = {
        clientId: client.id,
        therapistId: bookingData.therapistId || '68ce20c17931a40b74af366a', // ID del terapeuta de prueba
        date: bookingData.date,
        startTime: bookingData.startTime,
        endTime: bookingData.endTime,
        therapyType: bookingData.type || 'Terapia Individual',
        therapyDuration: bookingData.duration || 60,
        amount: bookingData.amount || 60,
        location: bookingData.location || 'Online',
        notes: bookingData.notes || '',
        status: 'upcoming'
      };

      // Crear la cita usando el servicio
      const newAppointment = await bookingService.createAppointment(appointmentData, {
        sendConfirmation: true,
        createReminders: true
      });

      console.log('✅ Appointment created:', newAppointment);

      // Recargar las citas y potencialmente pagos del cliente
      await refreshAllData();

      alert('Cita creada exitosamente');
      setIsNewBookingModalOpen(false);

    } catch (error) {
      console.error('Error creating booking:', error);
      alert('Error al crear la cita. Por favor, inténtelo de nuevo.');
    }
  };

  const handleUploadDocuments = async (uploadData) => {
    console.log('Uploading documents:', uploadData);
    alert('Documentos subidos exitosamente');
    setIsUploadDocModalOpen(false);
  };

  const handleConfirmDeleteClient = async (clientId) => {
    console.log('Deleting client:', clientId);
    alert('Cliente eliminado exitosamente');
    setIsDeleteDialogOpen(false);
    navigate('/app/clientes');
  };

  const handleDownloadClientData = async (clientId) => {
    console.log('Downloading client data:', clientId);
    // Simular descarga
    const link = document.createElement('a');
    link.href = '#';
    link.download = `cliente_${clientId}_datos.zip`;
    link.click();
  };

  // Funciones para manejar notas del cliente
  const handleCreateNote = () => {
    console.log('Creating new note for client:', client.id);
    setIsCreateNoteModalOpen(true);
  };

  const handleNoteCreated = async (newNote) => {
    console.log('✅ Note created successfully:', newNote);
    // Refresh the client notes
    await refreshClientNotes();
    // Show success message
    alert(`Nota "${newNote.title}" creada exitosamente`);
  };

  const handleViewNote = (note) => {
    console.log('Viewing note:', note);
    // TODO: Abrir modal para ver detalles de la nota
    alert(`Ver nota: ${note.title}`);
  };

  const handleAddResponse = (note) => {
    console.log('Adding response to note:', note);
    // TODO: Abrir modal para responder a la nota
    alert(`Responder a nota: ${note.title}`);
  };

  const handleRefreshNotes = async () => {
    await refreshClientNotes();
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-32 bg-gray-200 rounded mb-6"></div>
          <div className="h-96 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Cliente no encontrado</h2>
        <p className="text-gray-600 mb-4">El cliente solicitado no existe o no tienes permisos para verlo.</p>
        <Button onClick={handleBack}>Volver a clientes</Button>
      </div>
    );
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      case 'demo': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'active': return 'Activo';
      case 'inactive': return 'Inactivo';
      case 'demo': return 'Demo';
      default: return status;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={handleBack}
            className="flex items-center gap-2"
          >
            <ArrowLeftIcon className="h-4 w-4" />
            Volver
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{client.name}</h1>
            <p className="text-sm text-gray-600">ID: {client.id}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleStartChat}
            className="flex items-center gap-2"
          >
            <ChatBubbleLeftIcon className="h-4 w-4" />
            Chat
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleNewBooking}
            className="flex items-center gap-2"
          >
            <CalendarIcon className="h-4 w-4" />
            Nueva cita
          </Button>
        </div>
      </div>

      {/* Client Summary Card */}
      <Card>
        <div className="p-6">
          <div className="flex items-start gap-6">
            {/* Avatar */}
            <div className="flex-shrink-0">
              {client.avatar ? (
                <img 
                  className="h-20 w-20 rounded-full object-cover" 
                  src={client.avatar} 
                  alt={client.name} 
                />
              ) : (
                <div className="h-20 w-20 rounded-full bg-gray-300 flex items-center justify-center">
                  <span className="text-2xl font-medium text-gray-700">
                    {client.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                  </span>
                </div>
              )}
            </div>

            {/* Client Info */}
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h2 className="text-xl font-semibold text-gray-900">{client.name}</h2>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(client.status)}`}>
                  {getStatusLabel(client.status)}
                </span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Email:</span>
                  <p className="font-medium">{client.email}</p>
                </div>
                <div>
                  <span className="text-gray-500">Teléfono:</span>
                  <p className="font-medium">{client.phone}</p>
                </div>
                <div>
                  <span className="text-gray-500">Última sesión:</span>
                  <p className="font-medium">
                    {isLoadingAppointments ? (
                      <span className="text-gray-400">Cargando...</span>
                    ) : appointmentStats?.lastSession ? (
                      new Date(appointmentStats.lastSession).toLocaleDateString('es-ES')
                    ) : (
                      'Sin sesiones'
                    )}
                  </p>
                </div>
                <div>
                  <span className="text-gray-500">Total sesiones:</span>
                  <p className="font-medium">
                    {isLoadingAppointments ? (
                      <span className="text-gray-400">...</span>
                    ) : (
                      appointmentStats?.totalSessions || 0
                    )}
                  </p>
                </div>
                <div>
                  <span className="text-gray-500">Total pagado:</span>
                  <p className="font-medium">
                    {isLoadingPayments ? (
                      <span className="text-gray-400">Cargando...</span>
                    ) : (
                      `€${paymentStats?.totalAmount?.toFixed(2) || '0.00'}`
                    )}
                  </p>
                </div>
              </div>

              {/* Tags */}
              {client.tags && client.tags.length > 0 && (
                <div className="mt-3">
                  <div className="flex flex-wrap gap-2">
                    {client.tags.map((tag, index) => (
                      <span 
                        key={index}
                        className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-md"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleEditClient}
                className="flex items-center gap-2"
              >
                <PencilIcon className="h-4 w-4" />
                Editar
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleUploadDoc}
                className="flex items-center gap-2"
              >
                <DocumentArrowUpIcon className="h-4 w-4" />
                Subir doc
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDeleteClient}
                className="flex items-center gap-2 text-red-600 hover:text-red-700"
              >
                <TrashIcon className="h-4 w-4" />
                Eliminar
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Client Tabs */}
      <Card>
        <ClientTabs
          client={{
            ...client,
            // Sobrescribir con datos reales de las citas
            sessions: appointments.map(apt => {
              const creator = getAppointmentCreator(apt);
              const creatorDisplay = getCreatorDisplay(creator);
              return {
                id: apt.id,
                date: apt.date,
                duration: apt.therapyDuration || 60,
                type: apt.therapyType || 'Individual',
                status: apt.status,
                notes: apt.notes || `Sesión de ${apt.therapyType || 'terapia'}`,
                // Información del creador
                creator: creator,
                creatorDisplay: creatorDisplay,
                createdBy: creator.name,
                createdByType: creator.type
              };
            }),
            // Agregar datos reales de pagos
            payments: payments.map(payment => ({
              id: payment.id,
              date: payment.date || payment.createdAt,
              amount: payment.amount,
              method: payment.paymentMethod || 'card',
              status: payment.status,
              description: payment.description || `Pago de ${payment.amount}€`,
              invoiceNumber: payment.invoiceNumber || payment.id,
              currency: payment.currency || 'EUR'
            })),
            // Agregar datos reales de reviews
            reviews: reviews.map(review => ({
              id: review.id,
              rating: review.rating,
              comment: review.comment,
              date: review.createdAt || review.date,
              type: review.type,
              status: review.status,
              therapistName: review.therapistName || review.revieweeName,
              sessionId: review.sessionId
            })),
            // Agregar datos reales de notas de sesión
            notes: sessionNotes.map(note => ({
              id: note._id || note.id,
              bookingId: note.bookingId,
              date: note.createdAt || note.date,
              content: note.notes,
              mood: note.mood,
              progress: note.progress,
              wellnessScore: note.wellnessScore,
              objectives: note.objectives || [],
              homework: note.homework || [],
              nextSteps: note.nextSteps,
              sessionType: note.sessionType,
              tags: note.tags || [],
              riskAssessment: note.riskAssessment,
              clinicalMeasures: note.clinicalMeasures
            })),
            // Agregar datos reales de notas del cliente (nuevo modelo Note)
            clientNotes: clientNotes.map(note => ({
              id: note._id || note.id,
              title: note.title,
              content: note.content,
              authorType: note.authorType,
              authorId: note.authorId,
              noteType: note.noteType,
              category: note.category,
              visibility: note.visibility,
              priority: note.priority,
              status: note.status,
              isEmergency: note.isEmergency,
              requiresResponse: note.requiresResponse,
              tags: note.tags || [],
              date: note.createdAt || note.updatedAt,
              responses: note.responses || [],
              responseCount: note.responseCount || 0,
              hasUnreadResponses: note.hasUnreadResponses || false
            })),
            // Actualizar contadores con datos reales
            sessionsCount: appointmentStats?.totalSessions || 0,
            lastSession: appointmentStats?.lastSession,
            paymentsCount: paymentStats?.totalPayments || 0,
            totalPaid: paymentStats?.totalAmount || 0,
            reviewsCount: reviewStats?.totalReviews || 0,
            averageRating: reviewStats?.averageRating || 0,
            lastReview: reviewStats?.lastReview,
            notesCount: notesStats?.totalNotes || 0,
            averageWellnessScore: notesStats?.averageWellnessScore || 0,
            lastNote: notesStats?.lastNote,
            progressTrend: notesStats?.progressTrend || 'stable',
            // Estadísticas de notas del cliente (nuevo modelo)
            clientNotesCount: clientNotesStats?.totalNotes || 0,
            therapistNotesCount: clientNotesStats?.therapistNotes || 0,
            clientOwnNotesCount: clientNotesStats?.clientNotes || 0,
            emergencyNotesCount: clientNotesStats?.emergencyNotes || 0,
            pendingResponsesCount: clientNotesStats?.pendingResponses || 0,
            lastClientNote: clientNotesStats?.lastNote,
            isLoadingClientNotes
          }}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          onEditClient={handleEditClient}
          onNewBooking={handleNewBooking}
          onUploadDocument={handleUploadDoc}
          onDeleteClient={handleDeleteClient}
          onViewPaymentDetails={handleViewPaymentDetails}
          onDownloadInvoice={handleDownloadInvoice}
          onCreateNote={handleCreateNote}
          onViewNote={handleViewNote}
          onAddResponse={handleAddResponse}
          onRefreshNotes={handleRefreshNotes}
        />
      </Card>

      {/* Modals */}
      <NewBookingModal
        isOpen={isNewBookingModalOpen}
        onClose={() => setIsNewBookingModalOpen(false)}
        client={client}
        onCreateBooking={handleCreateBooking}
      />

      <UploadDocModal
        isOpen={isUploadDocModalOpen}
        onClose={() => setIsUploadDocModalOpen(false)}
        client={client}
        onUpload={handleUploadDocuments}
      />

      <DeleteClientDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        client={client}
        onDelete={handleConfirmDeleteClient}
        onDownloadData={handleDownloadClientData}
      />

      <PaymentDetailsModal
        isOpen={isPaymentDetailsModalOpen}
        onClose={() => {
          setIsPaymentDetailsModalOpen(false);
          setSelectedPayment(null);
        }}
        payment={selectedPayment}
        onDownloadInvoice={handleDownloadInvoice}
      />

      <CreateNoteModal
        isOpen={isCreateNoteModalOpen}
        onClose={() => setIsCreateNoteModalOpen(false)}
        client={client}
        onNoteCreated={handleNoteCreated}
      />
    </div>
  );
};