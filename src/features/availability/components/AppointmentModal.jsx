import React from 'react';
import { X, Calendar, Clock, MapPin, User, Phone, Mail, CreditCard, FileText, Edit, Trash2 } from 'lucide-react';

const AppointmentModal = ({ appointment, isOpen, onClose, onEdit, onCancel, onReschedule }) => {
  if (!isOpen || !appointment) return null;

  const formatDate = (date) => {
    if (!date) return 'No definida';
    const dateObj = new Date(date);
    return dateObj.toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (time) => {
    if (!time) return 'No definida';
    return time;
  };

  const getStatusColor = (status) => {
    const colors = {
      upcoming: 'bg-blue-100 text-blue-800 border-blue-200',
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      completed: 'bg-green-100 text-green-800 border-green-200',
      cancelled: 'bg-red-100 text-red-800 border-red-200',
      no_show: 'bg-gray-100 text-gray-800 border-gray-200',
      client_arrived: 'bg-purple-100 text-purple-800 border-purple-200'
    };
    return colors[status] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getStatusLabel = (status) => {
    const labels = {
      upcoming: 'Próxima',
      pending: 'Pendiente',
      completed: 'Completada',
      cancelled: 'Cancelada',
      no_show: 'No asistió',
      client_arrived: 'Cliente llegó'
    };
    return labels[status] || status;
  };

  const getPaymentStatusColor = (paymentStatus) => {
    const colors = {
      paid: 'bg-green-100 text-green-800',
      unpaid: 'bg-red-100 text-red-800',
      partial: 'bg-yellow-100 text-yellow-800',
      refunded: 'bg-gray-100 text-gray-800'
    };
    return colors[paymentStatus] || 'bg-gray-100 text-gray-800';
  };

  const getPaymentStatusLabel = (paymentStatus) => {
    const labels = {
      paid: 'Pagado',
      unpaid: 'Pendiente de pago',
      partial: 'Pago parcial',
      refunded: 'Reembolsado'
    };
    return labels[paymentStatus] || paymentStatus;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <Calendar className="h-6 w-6 text-blue-600" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Detalles de la Cita</h2>
              <p className="text-sm text-gray-500">
                {appointment.therapyType || 'Sesión de terapia'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Status */}
          <div className="flex items-center justify-between">
            <span
              className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(appointment.status)}`}
            >
              {getStatusLabel(appointment.status)}
            </span>
            {appointment.paymentStatus && (
              <span
                className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getPaymentStatusColor(appointment.paymentStatus)}`}
              >
                <CreditCard className="h-4 w-4 mr-1" />
                {getPaymentStatusLabel(appointment.paymentStatus)}
              </span>
            )}
          </div>

          {/* Date and Time */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center space-x-3">
              <Calendar className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm font-medium text-gray-900">Fecha</p>
                <p className="text-sm text-gray-600">{formatDate(appointment.date || appointment.startDate)}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Clock className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm font-medium text-gray-900">Horario</p>
                <p className="text-sm text-gray-600">
                  {formatTime(appointment.startTime)} - {formatTime(appointment.endTime)}
                  {appointment.therapyDuration && (
                    <span className="text-gray-400 ml-1">({appointment.therapyDuration} min)</span>
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* Location */}
          {appointment.location && (
            <div className="flex items-center space-x-3">
              <MapPin className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm font-medium text-gray-900">Ubicación</p>
                <p className="text-sm text-gray-600">{appointment.location}</p>
                {appointment.meetingLink && (
                  <a
                    href={appointment.meetingLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-700 text-sm underline"
                  >
                    Unirse a la videollamada
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Client Information */}
          <div className="border-t border-gray-200 pt-4">
            <h3 className="text-lg font-medium text-gray-900 mb-3">Información del Cliente</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center space-x-3">
                <User className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Nombre</p>
                  <p className="text-sm text-gray-600">
                    {appointment.clientName || appointment.client?.name || 'No especificado'}
                  </p>
                </div>
              </div>
              {appointment.client?.phone && (
                <div className="flex items-center space-x-3">
                  <Phone className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Teléfono</p>
                    <a
                      href={`tel:${appointment.client.phone}`}
                      className="text-sm text-blue-600 hover:text-blue-700"
                    >
                      {appointment.client.phone}
                    </a>
                  </div>
                </div>
              )}
              {appointment.client?.email && (
                <div className="flex items-center space-x-3">
                  <Mail className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Email</p>
                    <a
                      href={`mailto:${appointment.client.email}`}
                      className="text-sm text-blue-600 hover:text-blue-700"
                    >
                      {appointment.client.email}
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Payment Information */}
          {appointment.amount && (
            <div className="border-t border-gray-200 pt-4">
              <h3 className="text-lg font-medium text-gray-900 mb-3">Información de Pago</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center space-x-3">
                  <CreditCard className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Importe</p>
                    <p className="text-sm text-gray-600">
                      {appointment.amount}€ {appointment.currency && appointment.currency !== 'EUR' && `(${appointment.currency})`}
                    </p>
                  </div>
                </div>
                {appointment.paymentMethod && (
                  <div className="flex items-center space-x-3">
                    <CreditCard className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Método de pago</p>
                      <p className="text-sm text-gray-600 capitalize">{appointment.paymentMethod}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Notes */}
          {appointment.notes && (
            <div className="border-t border-gray-200 pt-4">
              <div className="flex items-start space-x-3">
                <FileText className="h-5 w-5 text-gray-400 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">Notas</p>
                  <p className="text-sm text-gray-600 mt-1 whitespace-pre-wrap">{appointment.notes}</p>
                </div>
              </div>
            </div>
          )}

          {/* Cancellation Information */}
          {appointment.status === 'cancelled' && appointment.cancellationReason && (
            <div className="border-t border-gray-200 pt-4">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h4 className="text-sm font-medium text-red-800 mb-2">Motivo de cancelación</h4>
                <p className="text-sm text-red-700">{appointment.cancellationReason}</p>
                {appointment.cancelledAt && (
                  <p className="text-xs text-red-600 mt-1">
                    Cancelada el {new Date(appointment.cancelledAt).toLocaleString('es-ES')}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Cerrar
          </button>

          {appointment.status === 'upcoming' && onReschedule && (
            <button
              onClick={() => onReschedule(appointment)}
              className="px-4 py-2 text-sm font-medium text-blue-700 bg-blue-100 border border-blue-300 rounded-md hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              <Calendar className="h-4 w-4 mr-1 inline" />
              Reprogramar
            </button>
          )}

          {onEdit && (
            <button
              onClick={() => onEdit(appointment)}
              className="px-4 py-2 text-sm font-medium text-blue-700 bg-blue-100 border border-blue-300 rounded-md hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              <Edit className="h-4 w-4 mr-1 inline" />
              Editar
            </button>
          )}

          {(appointment.status === 'upcoming' || appointment.status === 'pending') && onCancel && (
            <button
              onClick={() => onCancel(appointment)}
              className="px-4 py-2 text-sm font-medium text-red-700 bg-red-100 border border-red-300 rounded-md hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
            >
              <Trash2 className="h-4 w-4 mr-1 inline" />
              Cancelar
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default AppointmentModal;