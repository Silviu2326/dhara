import React, { useState, useEffect } from 'react';
import { Card } from '../../../components/Card';
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  User, 
  MessageSquare,
  Phone,
  Calendar,
  ArrowRight,
  Bell,
  UserCheck,
  Timer,
  AlertCircle
} from 'lucide-react';

// Enhanced booking statuses
export const BOOKING_STATES = {
  // Pre-session states
  SCHEDULED: { 
    key: 'scheduled', 
    label: 'Programada', 
    color: 'bg-blue-500', 
    icon: Calendar,
    description: 'Cita creada y programada'
  },
  CONFIRMED_CLIENT: { 
    key: 'confirmed_client', 
    label: 'Confirmada por Cliente', 
    color: 'bg-blue-600', 
    icon: UserCheck,
    description: 'Cliente ha confirmado su asistencia'
  },
  REMINDER_SENT: { 
    key: 'reminder_sent', 
    label: 'Recordatorio Enviado', 
    color: 'bg-indigo-500', 
    icon: Bell,
    description: 'Recordatorio enviado al cliente'
  },
  
  // Day-of states
  UPCOMING: { 
    key: 'upcoming', 
    label: 'Próxima', 
    color: 'bg-green-500', 
    icon: Clock,
    description: 'Cita es hoy o está próxima'
  },
  CLIENT_ARRIVED: { 
    key: 'client_arrived', 
    label: 'Cliente Llegó', 
    color: 'bg-green-600', 
    icon: User,
    description: 'Cliente ha llegado y está en sala de espera'
  },
  IN_SESSION: { 
    key: 'in_session', 
    label: 'En Sesión', 
    color: 'bg-purple-600', 
    icon: MessageSquare,
    description: 'Sesión en curso'
  },
  RUNNING_LATE: { 
    key: 'running_late', 
    label: 'Retrasado', 
    color: 'bg-yellow-500', 
    icon: Timer,
    description: 'Cliente llega tarde'
  },
  
  // Completion states
  COMPLETED: { 
    key: 'completed', 
    label: 'Completada', 
    color: 'bg-green-700', 
    icon: CheckCircle,
    description: 'Sesión completada exitosamente'
  },
  NO_SHOW: { 
    key: 'no_show', 
    label: 'No Asistió', 
    color: 'bg-orange-500', 
    icon: AlertTriangle,
    description: 'Cliente no se presentó'
  },
  CANCELLED: { 
    key: 'cancelled', 
    label: 'Cancelada', 
    color: 'bg-red-500', 
    icon: XCircle,
    description: 'Cita cancelada'
  },
  
  // Special states
  RESCHEDULED: { 
    key: 'rescheduled', 
    label: 'Reprogramada', 
    color: 'bg-blue-400', 
    icon: ArrowRight,
    description: 'Cita ha sido reprogramada'
  }
};

// State transition rules
const STATE_TRANSITIONS = {
  scheduled: ['confirmed_client', 'reminder_sent', 'cancelled', 'rescheduled'],
  confirmed_client: ['reminder_sent', 'upcoming', 'cancelled', 'rescheduled'],
  reminder_sent: ['upcoming', 'cancelled', 'rescheduled'],
  upcoming: ['client_arrived', 'running_late', 'in_session', 'no_show', 'cancelled'],
  client_arrived: ['in_session', 'running_late'],
  running_late: ['in_session', 'no_show'],
  in_session: ['completed'],
  completed: [], // Final state
  no_show: [], // Final state
  cancelled: [], // Final state
  rescheduled: ['scheduled'] // Creates new booking
};

const IntelligentStatusSystem = ({
  bookings,
  onStatusChange,
  onSendReminder,
  onClientCheckIn,
  realTimeUpdates = true
}) => {
  const [statusUpdates, setStatusUpdates] = useState([]);
  const [autoTransitions, setAutoTransitions] = useState(true);
  const [notifications, setNotifications] = useState([]);

  // Helper function to get status info from database status
  const getStatusInfo = (status) => {
    const statusMap = {
      'upcoming': BOOKING_STATES.UPCOMING,
      'pending': BOOKING_STATES.SCHEDULED,
      'completed': BOOKING_STATES.COMPLETED,
      'cancelled': BOOKING_STATES.CANCELLED,
      'no_show': BOOKING_STATES.NO_SHOW,
      'client_arrived': BOOKING_STATES.CLIENT_ARRIVED,
      'in_session': BOOKING_STATES.IN_SESSION,
      'running_late': BOOKING_STATES.RUNNING_LATE,
      'scheduled': BOOKING_STATES.SCHEDULED,
      'confirmed_client': BOOKING_STATES.CONFIRMED_CLIENT,
      'reminder_sent': BOOKING_STATES.REMINDER_SENT
    };

    return statusMap[status] || {
      key: status,
      label: status.charAt(0).toUpperCase() + status.slice(1),
      color: 'bg-gray-500',
      icon: AlertCircle,
      description: `Estado: ${status}`
    };
  };

  // Debug: Log bookings data
  useEffect(() => {
    console.log('🔍 IntelligentStatusSystem - Received bookings:', bookings);
    console.log('🔍 IntelligentStatusSystem - Bookings count:', bookings?.length);
    console.log('🔍 IntelligentStatusSystem - First booking:', bookings?.[0]);
    console.log('🔍 IntelligentStatusSystem - Status breakdown:',
      bookings?.reduce((acc, b) => {
        acc[b.status] = (acc[b.status] || 0) + 1;
        return acc;
      }, {})
    );
  }, [bookings]);

  // Auto-update booking statuses based on time
  useEffect(() => {
    if (!autoTransitions) return;

    const updateStatuses = () => {
      const now = new Date();
      const currentTime = now.toTimeString().slice(0, 5);
      const currentDate = now.toISOString().split('T')[0];

      bookings.forEach(booking => {
        const bookingDateTime = new Date(`${booking.date}T${booking.startTime}`);
        const bookingEndDateTime = new Date(`${booking.date}T${booking.endTime}`);
        const timeDiff = bookingDateTime.getTime() - now.getTime();
        const hoursDiff = timeDiff / (1000 * 60 * 60);

        // Auto-transition logic
        let newStatus = booking.status;

        // Transition to 'upcoming' if booking is within next 24 hours
        if (hoursDiff <= 24 && hoursDiff > 0 && booking.status === 'scheduled') {
          newStatus = 'upcoming';
        }

        // Transition to 'running_late' if client hasn't arrived 10 minutes after start time
        if (now > bookingDateTime && now < bookingEndDateTime && booking.status === 'upcoming') {
          const minutesLate = (now.getTime() - bookingDateTime.getTime()) / (1000 * 60);
          if (minutesLate > 10) {
            newStatus = 'running_late';
          }
        }

        // Transition to 'no_show' if booking time has passed and no other status
        if (now > bookingEndDateTime && ['upcoming', 'running_late'].includes(booking.status)) {
          newStatus = 'no_show';
        }

        // Apply status change if different
        if (newStatus !== booking.status) {
          onStatusChange(booking.id, newStatus, 'Actualización automática');
          addNotification(`Cita ${booking.id} actualizada a: ${getStatusInfo(newStatus).label}`);
        }
      });
    };

    // Update every minute
    const interval = setInterval(updateStatuses, 60000);
    updateStatuses(); // Run immediately

    return () => clearInterval(interval);
  }, [bookings, autoTransitions, onStatusChange]);

  // Add notification
  const addNotification = (message, type = 'info') => {
    const notification = {
      id: Date.now(),
      message,
      type,
      timestamp: new Date()
    };
    
    setNotifications(prev => [notification, ...prev.slice(0, 4)]); // Keep last 5
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== notification.id));
    }, 5000);
  };

  // Get next possible states for a booking
  const getNextStates = (currentState) => {
    return STATE_TRANSITIONS[currentState] || [];
  };

  // Get bookings by status
  const getBookingsByStatus = (status) => {
    return bookings.filter(booking => booking.status === status);
  };

  // Quick actions for different states
  const getQuickActions = (booking) => {
    const actions = [];
    
    switch (booking.status) {
      case 'scheduled':
        actions.push(
          {
            label: 'Enviar Recordatorio',
            action: () => handleSendReminder(booking),
            icon: Bell,
            color: 'bg-blue-500'
          },
          {
            label: 'Confirmar con Cliente',
            action: () => handleStatusChange(booking.id, 'confirmed_client'),
            icon: UserCheck,
            color: 'bg-green-500'
          }
        );
        break;
        
      case 'upcoming':
        actions.push(
          {
            label: 'Cliente Llegó',
            action: () => handleStatusChange(booking.id, 'client_arrived'),
            icon: User,
            color: 'bg-green-600'
          },
          {
            label: 'Llamar Cliente',
            action: () => handleCall(booking),
            icon: Phone,
            color: 'bg-blue-500'
          }
        );
        break;
        
      case 'client_arrived':
        actions.push(
          {
            label: 'Iniciar Sesión',
            action: () => handleStatusChange(booking.id, 'in_session'),
            icon: MessageSquare,
            color: 'bg-purple-600'
          }
        );
        break;
        
      case 'in_session':
        actions.push(
          {
            label: 'Completar Sesión',
            action: () => handleStatusChange(booking.id, 'completed'),
            icon: CheckCircle,
            color: 'bg-green-700'
          }
        );
        break;
    }
    
    return actions;
  };

  // Handle status change
  const handleStatusChange = (bookingId, newStatus, reason = '') => {
    const booking = bookings.find(b => b.id === bookingId);
    if (!booking) return;

    const validTransitions = getNextStates(booking.status);
    if (!validTransitions.includes(newStatus)) {
      addNotification(`Transición no válida de ${booking.status} a ${newStatus}`, 'error');
      return;
    }

    onStatusChange(bookingId, newStatus, reason);
    
    const statusLabel = getStatusInfo(newStatus).label;
    addNotification(`${booking.clientName}: ${statusLabel}`, 'success');
    
    // Log the transition
    setStatusUpdates(prev => [...prev, {
      id: Date.now(),
      bookingId,
      from: booking.status,
      to: newStatus,
      reason,
      timestamp: new Date(),
      clientName: booking.clientName
    }]);
  };

  // Handle send reminder
  const handleSendReminder = async (booking) => {
    try {
      await onSendReminder(booking);
      handleStatusChange(booking.id, 'reminder_sent', 'Recordatorio enviado');
    } catch (error) {
      addNotification('Error al enviar recordatorio', 'error');
    }
  };

  // Handle client check-in
  const handleClientCheckIn = (bookingId) => {
    onClientCheckIn(bookingId);
    handleStatusChange(bookingId, 'client_arrived', 'Cliente llegó');
  };

  // Handle call
  const handleCall = (booking) => {
    if (booking.clientPhone) {
      window.open(`tel:${booking.clientPhone}`, '_self');
      addNotification(`Llamando a ${booking.clientName}...`, 'info');
    } else {
      addNotification('No hay número de teléfono disponible', 'warning');
    }
  };

  // Status summary
  const getStatusSummary = () => {
    const summary = {};
    Object.values(BOOKING_STATES).forEach(state => {
      summary[state.key] = getBookingsByStatus(state.key).length;
    });
    return summary;
  };

  const statusSummary = getStatusSummary();

  return (
    <div className="space-y-6">
      {/* Notifications */}
      {notifications.length > 0 && (
        <div className="fixed top-4 right-4 z-50 space-y-2">
          {notifications.map(notification => (
            <div
              key={notification.id}
              className={`p-3 rounded-lg shadow-lg text-white transition-all duration-300 ${
                notification.type === 'error' ? 'bg-red-500' :
                notification.type === 'warning' ? 'bg-yellow-500' :
                notification.type === 'success' ? 'bg-green-500' :
                'bg-blue-500'
              }`}
            >
              {notification.message}
            </div>
          ))}
        </div>
      )}

      {/* Status Overview */}
      <Card>
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Estado de Citas en Tiempo Real</h3>
            <div className="flex items-center space-x-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={autoTransitions}
                  onChange={(e) => setAutoTransitions(e.target.checked)}
                  className="mr-2"
                />
                <span className="text-sm text-gray-600">Transiciones Automáticas</span>
              </label>
            </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {Object.values(BOOKING_STATES).map(state => {
              const count = statusSummary[state.key] || 0;
              const IconComponent = state.icon;
              
              return (
                <div key={state.key} className="text-center">
                  <div className={`${state.color} text-white p-3 rounded-lg mb-2`}>
                    <IconComponent className="h-6 w-6 mx-auto mb-1" />
                    <div className="text-2xl font-bold">{count}</div>
                  </div>
                  <div className="text-xs text-gray-600">{state.label}</div>
                </div>
              );
            })}
          </div>
        </div>
      </Card>

      {/* Active Sessions */}
      {getBookingsByStatus('in_session').length > 0 && (
        <Card>
          <div className="p-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">
              <MessageSquare className="h-5 w-5 inline mr-2" />
              Sesiones Activas
            </h4>
            <div className="space-y-3">
              {getBookingsByStatus('in_session').map(booking => (
                <div key={booking.id} className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                  <div>
                    <div className="font-medium">{booking.clientName}</div>
                    <div className="text-sm text-gray-600">
                      {booking.startTime} - {booking.endTime} • {booking.therapyType}
                    </div>
                  </div>
                  <button
                    onClick={() => handleStatusChange(booking.id, 'completed')}
                    className="px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700"
                  >
                    Completar
                  </button>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* Clients Arrived */}
      {getBookingsByStatus('client_arrived').length > 0 && (
        <Card>
          <div className="p-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">
              <User className="h-5 w-5 inline mr-2" />
              Clientes en Espera
            </h4>
            <div className="space-y-3">
              {getBookingsByStatus('client_arrived').map(booking => (
                <div key={booking.id} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <div>
                    <div className="font-medium">{booking.clientName}</div>
                    <div className="text-sm text-gray-600">
                      Cita: {booking.startTime} • Llegó hace {getWaitingTime(booking)} min
                    </div>
                  </div>
                  <button
                    onClick={() => handleStatusChange(booking.id, 'in_session')}
                    className="px-3 py-1 bg-purple-600 text-white rounded-md hover:bg-purple-700"
                  >
                    Iniciar Sesión
                  </button>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* Upcoming Today */}
      {getBookingsByStatus('upcoming').filter(b => b.date === new Date().toISOString().split('T')[0]).length > 0 && (
        <Card>
          <div className="p-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">
              <Clock className="h-5 w-5 inline mr-2" />
              Próximas Citas de Hoy
            </h4>
            <div className="space-y-3">
              {getBookingsByStatus('upcoming')
                .filter(b => b.date === new Date().toISOString().split('T')[0])
                .map(booking => {
                  const actions = getQuickActions(booking);
                  return (
                    <div key={booking.id} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                      <div>
                        <div className="font-medium">{booking.clientName}</div>
                        <div className="text-sm text-gray-600">
                          {booking.startTime} - {booking.endTime} • {booking.therapyType}
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        {actions.map((action, index) => {
                          const ActionIcon = action.icon;
                          return (
                            <button
                              key={index}
                              onClick={action.action}
                              className={`px-3 py-1 ${action.color} text-white rounded-md hover:opacity-90 text-sm flex items-center`}
                              title={action.label}
                            >
                              <ActionIcon className="h-4 w-4 mr-1" />
                              {action.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </Card>
      )}

      {/* Recent Status Changes */}
      {statusUpdates.length > 0 && (
        <Card>
          <div className="p-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">
              <Activity className="h-5 w-5 inline mr-2" />
              Cambios de Estado Recientes
            </h4>
            <div className="space-y-2">
              {statusUpdates.slice(0, 5).map(update => (
                <div key={update.id} className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm">
                  <div>
                    <span className="font-medium">{update.clientName}</span>
                    <span className="text-gray-600 ml-2">
                      {getStatusInfo(update.from).label} → {getStatusInfo(update.to).label}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500">
                    {update.timestamp.toLocaleTimeString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

// Helper function to calculate waiting time
const getWaitingTime = (booking) => {
  const now = new Date();
  const arrivalTime = new Date(); // This should come from the actual arrival timestamp
  return Math.floor((now - arrivalTime) / (1000 * 60));
};

export { IntelligentStatusSystem };