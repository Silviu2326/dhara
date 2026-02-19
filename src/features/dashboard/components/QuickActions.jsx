import React, { useState } from 'react';
import { Card } from '../../../components/Card';
import { Button } from '../../../components/Button';
import { Clock, Plus, Send } from 'lucide-react';
import { AddAvailabilityModal } from './AddAvailabilityModal';
import { CreateAppointmentModal } from './CreateAppointmentModal';
import { BroadcastMessageModal } from './BroadcastMessageModal';

// Import services
import { availabilityService } from '../../../services/api/availabilityService';
import { bookingService } from '../../../services/api/bookingService';
import { notificationService } from '../../../services/api/notificationService';

export const QuickActions = ({ onDataRefresh }) => {
  const [modals, setModals] = useState({
    availability: false,
    appointment: false,
    broadcast: false
  });
  const [loading, setLoading] = useState({
    availability: false,
    appointment: false,
    broadcast: false
  });

  const openModal = (modalType) => {
    setModals(prev => ({ ...prev, [modalType]: true }));
  };

  const closeModal = (modalType) => {
    setModals(prev => ({ ...prev, [modalType]: false }));
  };

  const setModalLoading = (modalType, isLoading) => {
    setLoading(prev => ({ ...prev, [modalType]: isLoading }));
  };

  const handleSaveAvailability = async (data) => {
    try {
      setModalLoading('availability', true);

      const availabilityData = {
        date: data.date,
        startTime: data.startTime,
        endTime: data.endTime,
        type: data.type, // 'available' or 'blocked'
        reason: data.reason || null,
        isRecurring: data.isRecurring || false,
        recurringPattern: data.recurringPattern || null
      };

      await availabilityService.createAvailabilitySlot(availabilityData);

      closeModal('availability');
      onDataRefresh?.();

      // Mostrar mensaje de éxito
      alert(`Bloque ${data.type === 'available' ? 'de disponibilidad' : 'bloqueado'} añadido para ${data.date} de ${data.startTime} a ${data.endTime}`);
    } catch (error) {
      console.error('Error saving availability:', error);
      alert('Error al guardar la disponibilidad: ' + (error.message || 'Error desconocido'));
    } finally {
      setModalLoading('availability', false);
    }
  };

  const handleSaveAppointment = async (data) => {
    try {
      setModalLoading('appointment', true);

      const appointmentData = {
        clientId: data.clientId,
        date: data.date,
        startTime: data.startTime,
        endTime: data.endTime,
        type: data.type || 'therapy_session',
        notes: data.notes || '',
        location: data.location || 'office',
        priority: data.priority || 'normal'
      };

      await bookingService.createAppointment(appointmentData);

      closeModal('appointment');
      onDataRefresh?.();

      // Mostrar mensaje de éxito
      alert(`Cita creada para ${data.clientName} el ${data.date} a las ${data.startTime}`);
    } catch (error) {
      console.error('Error creating appointment:', error);
      alert('Error al crear la cita: ' + (error.message || 'Error desconocido'));
    } finally {
      setModalLoading('appointment', false);
    }
  };

  const handleSendBroadcast = async (data) => {
    try {
      setModalLoading('broadcast', true);

      const broadcastData = {
        message: data.message,
        subject: data.subject || '',
        recipients: data.recipients, // 'all', 'active_clients', etc.
        channels: {
          email: data.sendEmail || false,
          sms: data.sendSMS || false,
          push: data.sendPush || false
        },
        priority: data.priority || 'normal',
        scheduledAt: data.scheduledAt || null
      };

      await notificationService.sendBroadcast(broadcastData);

      closeModal('broadcast');

      // Mostrar mensaje de éxito
      const channels = [];
      if (data.sendEmail) channels.push('email');
      if (data.sendSMS) channels.push('SMS');
      if (data.sendPush) channels.push('notificación push');

      alert(`Mensaje enviado por ${channels.join(' y ')} a ${data.recipients}`);
    } catch (error) {
      console.error('Error sending broadcast:', error);
      alert('Error al enviar el mensaje: ' + (error.message || 'Error desconocido'));
    } finally {
      setModalLoading('broadcast', false);
    }
  };

  const actions = [
    {
      id: 'block-time',
      label: 'Añadir bloqueo horario',
      icon: Clock,
      color: 'bg-blue-500 hover:bg-blue-600',
      action: () => openModal('availability'),
      ariaLabel: 'Añadir bloqueo de horario en calendario'
    },
    {
      id: 'create-appointment',
      label: 'Crear cita manual',
      icon: Plus,
      color: 'bg-sage hover:bg-sage/90',
      action: () => openModal('appointment'),
      ariaLabel: 'Crear nueva cita manualmente'
    },
    {
      id: 'broadcast-message',
      label: 'Enviar mensaje broadcast',
      icon: Send,
      color: 'bg-purple-500 hover:bg-purple-600',
      action: () => openModal('broadcast'),
      ariaLabel: 'Enviar mensaje a múltiples clientes'
    }
  ];

  return (
    <Card>
      <h2 className="text-base sm:text-lg font-semibold text-deep mb-3 sm:mb-4">Acciones Rápidas</h2>
      
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        {actions.map((action) => {
          const Icon = action.icon;
          
          return (
            <Button
              key={action.id}
              onClick={action.action}
              className={`
                ${action.color} text-white p-2 sm:p-4 rounded-lg sm:rounded-xl 
                flex flex-col items-center justify-center space-y-1 sm:space-y-2 
                transition-all duration-200 transform hover:scale-105
                focus:ring-2 focus:ring-offset-2 focus:ring-sage
                h-full min-h-[80px] sm:min-h-[100px]
              `}
              aria-label={action.ariaLabel}
            >
              <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
              <span className="text-xs sm:text-sm font-medium text-center leading-tight">
                {action.label}
              </span>
            </Button>
          );
        })}
      </div>
      
      <div className="mt-4 text-xs text-gray-500 text-center">
        Accede rápidamente a las funciones más utilizadas
      </div>

      {/* Modales */}
      <AddAvailabilityModal
        isOpen={modals.availability}
        onClose={() => closeModal('availability')}
        onSave={handleSaveAvailability}
        loading={loading.availability}
      />

      <CreateAppointmentModal
        isOpen={modals.appointment}
        onClose={() => closeModal('appointment')}
        onSave={handleSaveAppointment}
        loading={loading.appointment}
      />

      <BroadcastMessageModal
        isOpen={modals.broadcast}
        onClose={() => closeModal('broadcast')}
        onSend={handleSendBroadcast}
        loading={loading.broadcast}
      />
    </Card>
  );
};