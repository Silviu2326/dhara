import React, { useState, useEffect } from 'react';
import { 
  X, 
  AlertTriangle, 
  Info, 
  Clock, 
  DollarSign, 
  CheckCircle,
  Loader2,
  Calendar,
  User
} from 'lucide-react';

const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('es-ES', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

const formatTime = (timeString) => {
  return timeString.slice(0, 5); // HH:MM format
};

const calculateHoursUntilAppointment = (date, time) => {
  const appointmentDateTime = new Date(`${date}T${time}`);
  const now = new Date();
  const diffMs = appointmentDateTime.getTime() - now.getTime();
  return Math.max(0, diffMs / (1000 * 60 * 60)); // Convert to hours
};

const getCancellationPolicy = (hoursUntil) => {
  if (hoursUntil >= 48) {
    return {
      type: 'full_refund',
      title: 'Reembolso completo',
      description: 'Cancelación con más de 48 horas de anticipación',
      refundPercentage: 100,
      fee: 0,
      color: 'green'
    };
  } else if (hoursUntil >= 24) {
    return {
      type: 'partial_refund',
      title: 'Reembolso parcial',
      description: 'Cancelación entre 24-48 horas de anticipación',
      refundPercentage: 50,
      fee: 0,
      color: 'yellow'
    };
  } else if (hoursUntil >= 2) {
    return {
      type: 'fee_applied',
      title: 'Cargo por cancelación tardía',
      description: 'Cancelación con menos de 24 horas de anticipación',
      refundPercentage: 25,
      fee: 25,
      color: 'orange'
    };
  } else {
    return {
      type: 'no_refund',
      title: 'Sin reembolso',
      description: 'Cancelación con menos de 2 horas de anticipación',
      refundPercentage: 0,
      fee: 100,
      color: 'red'
    };
  }
};

const cancellationReasons = [
  { value: 'client_request', label: 'Solicitud del cliente' },
  { value: 'illness', label: 'Enfermedad' },
  { value: 'emergency', label: 'Emergencia' },
  { value: 'schedule_conflict', label: 'Conflicto de horario' },
  { value: 'weather', label: 'Condiciones climáticas' },
  { value: 'transportation', label: 'Problemas de transporte' },
  { value: 'personal_reasons', label: 'Motivos personales' },
  { value: 'no_show', label: 'No se presentó' },
  { value: 'other', label: 'Otro motivo' }
];

const PolicyCard = ({ policy, amount, currency = 'EUR' }) => {
  const colorClasses = {
    green: 'bg-green-50 border-green-200 text-green-800',
    yellow: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    orange: 'bg-orange-50 border-orange-200 text-orange-800',
    red: 'bg-red-50 border-red-200 text-red-800'
  };

  const iconColorClasses = {
    green: 'text-green-600',
    yellow: 'text-yellow-600',
    orange: 'text-orange-600',
    red: 'text-red-600'
  };

  const refundAmount = (amount * policy.refundPercentage) / 100;
  const feeAmount = (amount * policy.fee) / 100;

  return (
    <div className={`p-4 border rounded-lg ${colorClasses[policy.color]}`}>
      <div className="flex items-start space-x-3">
        <div className={`mt-0.5 ${iconColorClasses[policy.color]}`}>
          {policy.type === 'full_refund' && <CheckCircle className="h-5 w-5" />}
          {policy.type === 'partial_refund' && <Info className="h-5 w-5" />}
          {policy.type === 'fee_applied' && <AlertTriangle className="h-5 w-5" />}
          {policy.type === 'no_refund' && <X className="h-5 w-5" />}
        </div>
        <div className="flex-1">
          <h4 className="font-medium">{policy.title}</h4>
          <p className="text-sm mt-1">{policy.description}</p>
          
          <div className="mt-3 space-y-1 text-sm">
            {policy.refundPercentage > 0 && (
              <div className="flex items-center justify-between">
                <span>Reembolso ({policy.refundPercentage}%):</span>
                <span className="font-medium">{refundAmount.toFixed(2)} {currency}</span>
              </div>
            )}
            {policy.fee > 0 && (
              <div className="flex items-center justify-between">
                <span>Cargo por cancelación:</span>
                <span className="font-medium">{feeAmount.toFixed(2)} {currency}</span>
              </div>
            )}
            <div className="flex items-center justify-between border-t border-current border-opacity-20 pt-1">
              <span className="font-medium">Total a recibir:</span>
              <span className="font-bold">{refundAmount.toFixed(2)} {currency}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const CancelModal = ({ 
  booking, 
  isOpen, 
  onClose, 
  onConfirm,
  isLoading = false
}) => {
  const [selectedReason, setSelectedReason] = useState('');
  const [customReason, setCustomReason] = useState('');
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [notifyClient, setNotifyClient] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen) {
      setSelectedReason('');
      setCustomReason('');
      setAdditionalNotes('');
      setNotifyClient(true);
      setError(null);
      setIsSubmitting(false);
    }
  }, [isOpen]);

  const handleConfirm = async () => {
    if (!selectedReason) {
      setError('Por favor selecciona un motivo de cancelación');
      return;
    }

    if (selectedReason === 'other' && !customReason.trim()) {
      setError('Por favor especifica el motivo de cancelación');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const reason = selectedReason === 'other' ? customReason : 
        cancellationReasons.find(r => r.value === selectedReason)?.label;

      await onConfirm({
        bookingId: booking.id,
        reason,
        additionalNotes,
        notifyClient,
        policy: cancellationPolicy
      });
      onClose();
    } catch (err) {
      setError(err.message || 'Error al cancelar la cita');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen || !booking) return null;

  const hoursUntil = calculateHoursUntilAppointment(booking.date, booking.startTime);
  const cancellationPolicy = getCancellationPolicy(hoursUntil);
  const amount = booking.amount || 0;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50" onClick={onClose} />
      
      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Cancelar cita
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                {booking.clientName} - {booking.therapyType}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
            <div className="space-y-6">
              {/* Appointment info */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-gray-900 mb-3">
                  Detalles de la cita
                </h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <span>{formatDate(booking.date)}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-gray-400" />
                    <span>{formatTime(booking.startTime)}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <User className="h-4 w-4 text-gray-400" />
                    <span>{booking.clientName}</span>
                  </div>
                  {amount > 0 && (
                    <div className="flex items-center space-x-2">
                      <DollarSign className="h-4 w-4 text-gray-400" />
                      <span>{amount.toFixed(2)} {booking.currency || 'EUR'}</span>
                    </div>
                  )}
                </div>
                
                <div className="mt-3 text-xs text-gray-600">
                  Tiempo hasta la cita: {hoursUntil.toFixed(1)} horas
                </div>
              </div>

              {/* Cancellation policy */}
              {amount > 0 && (
                <div className="space-y-3">
                  <h3 className="text-sm font-medium text-gray-900">
                    Política de cancelación
                  </h3>
                  <PolicyCard 
                    policy={cancellationPolicy} 
                    amount={amount} 
                    currency={booking.currency}
                  />
                </div>
              )}

              {/* Cancellation reason */}
              <div className="space-y-3">
                <label className="text-sm font-medium text-gray-900">
                  Motivo de cancelación *
                </label>
                <select
                  value={selectedReason}
                  onChange={(e) => setSelectedReason(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Selecciona un motivo</option>
                  {cancellationReasons.map(reason => (
                    <option key={reason.value} value={reason.value}>
                      {reason.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Custom reason */}
              {selectedReason === 'other' && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-900">
                    Especifica el motivo *
                  </label>
                  <input
                    type="text"
                    value={customReason}
                    onChange={(e) => setCustomReason(e.target.value)}
                    placeholder="Describe el motivo de cancelación"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              )}

              {/* Additional notes */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-900">
                  Notas adicionales (opcional)
                </label>
                <textarea
                  value={additionalNotes}
                  onChange={(e) => setAdditionalNotes(e.target.value)}
                  placeholder="Información adicional sobre la cancelación..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Notification option */}
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="notifyClient"
                  checked={notifyClient}
                  onChange={(e) => setNotifyClient(e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="notifyClient" className="text-sm text-gray-700">
                  Notificar al cliente por email y SMS
                </label>
              </div>

              {/* Warning */}
              <div className="bg-red-50 p-4 rounded-lg">
                <div className="flex items-start space-x-2">
                  <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
                  <div className="text-sm text-red-700">
                    <p className="font-medium">Atención:</p>
                    <ul className="mt-1 list-disc list-inside space-y-1">
                      <li>Esta acción no se puede deshacer</li>
                      <li>Se liberará el horario para otros clientes</li>
                      {notifyClient && <li>Se enviará notificación automática al cliente</li>}
                      {amount > 0 && cancellationPolicy.refundPercentage > 0 && (
                        <li>El reembolso se procesará en 3-5 días hábiles</li>
                      )}
                    </ul>
                  </div>
                </div>
              </div>

              {/* Error message */}
              {error && (
                <div className="bg-red-50 p-4 rounded-lg">
                  <div className="flex items-start space-x-2">
                    <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
                    <div className="text-sm text-red-700">
                      <p className="font-medium">Error</p>
                      <p className="mt-1">{error}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
            <button
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              onClick={handleConfirm}
              disabled={!selectedReason || (selectedReason === 'other' && !customReason.trim()) || isSubmitting}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              <span>{isSubmitting ? 'Cancelando...' : 'Confirmar cancelación'}</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
};