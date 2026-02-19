import React, { useState, useEffect } from 'react';
import {
  X,
  User,
  Calendar,
  Clock,
  MapPin,
  Phone,
  Mail,
  FileText,
  ExternalLink,
  MessageCircle,
  Video,
  RotateCcw,
  XCircle,
  CheckCircle2,
  Edit3,
  DollarSign,
  CreditCard,
  AlertTriangle,
  Info
} from 'lucide-react';
import { StatusBadge } from './StatusBadge';

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

const ActionButton = ({
  icon: Icon,
  label,
  onClick,
  variant = 'default',
  size = 'md',
  disabled = false,
  fullWidth = false
}) => {
  const variants = {
    default: 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50',
    primary: 'bg-blue-600 text-white border-blue-600 hover:bg-blue-700',
    success: 'bg-green-600 text-white border-green-600 hover:bg-green-700',
    warning: 'bg-yellow-600 text-white border-yellow-600 hover:bg-yellow-700',
    danger: 'bg-red-600 text-white border-red-600 hover:bg-red-700',
    outline: 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base'
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        inline-flex items-center justify-center space-x-2 border rounded-md font-medium
        transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        ${fullWidth ? 'w-full' : ''}
        ${sizes[size]}
        ${variants[variant]}
      `}
    >
      {Icon && <Icon className="h-4 w-4" />}
      <span>{label}</span>
    </button>
  );
};

const InfoRow = ({ icon: Icon, label, value, action }) => {
  return (
    <div className="flex items-start space-x-3 py-2">
      <Icon className="h-5 w-5 text-gray-400 mt-0.5" />
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-gray-500">{label}</div>
        <div className="text-sm text-gray-900 break-words">{value}</div>
      </div>
      {action && (
        <div className="flex-shrink-0">
          {action}
        </div>
      )}
    </div>
  );
};

const NotesSection = ({ notes, onEdit }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const maxLength = 150;
  const shouldTruncate = notes && notes.length > maxLength;
  const displayNotes = shouldTruncate && !isExpanded
    ? notes.slice(0, maxLength) + '...'
    : notes;

  if (!notes) {
    return (
      <div className="text-sm text-gray-500 italic">
        No hay notas para esta cita
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="text-sm text-gray-900 whitespace-pre-wrap">
        {displayNotes}
      </div>
      {shouldTruncate && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-sm text-blue-600 hover:text-blue-800"
        >
          {isExpanded ? 'Ver menos' : 'Ver más'}
        </button>
      )}
      {onEdit && (
        <button
          onClick={onEdit}
          className="inline-flex items-center space-x-1 text-sm text-gray-600 hover:text-gray-800"
        >
          <Edit3 className="h-3 w-3" />
          <span>Editar notas</span>
        </button>
      )}
    </div>
  );
};

const PaymentInfo = ({ booking, onMarkPaid }) => {
  const paymentStatus = booking.paymentStatus || 'unpaid';
  const amount = booking.amount || 0;
  const currency = booking.currency || 'EUR';
  const [showPaymentOptions, setShowPaymentOptions] = useState(false);

  const paymentConfig = {
    paid: { icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-50' },
    unpaid: { icon: AlertTriangle, color: 'text-orange-600', bg: 'bg-orange-50' },
    refunded: { icon: RotateCcw, color: 'text-red-600', bg: 'bg-red-50' },
    pending: { icon: Clock, color: 'text-yellow-600', bg: 'bg-yellow-50' }
  };

  const config = paymentConfig[paymentStatus] || paymentConfig.unpaid;
  const Icon = config.icon;

  const handlePayment = (method) => {
    if (onMarkPaid) {
      onMarkPaid(booking.id, method);
      setShowPaymentOptions(false);
    }
  };

  return (
    <div className={`p-3 rounded-lg ${config.bg}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Icon className={`h-4 w-4 ${config.color}`} />
          <span className={`text-sm font-medium ${config.color}`}>
            {paymentStatus === 'paid' && 'Pagado'}
            {paymentStatus === 'unpaid' && 'Pendiente de pago'}
            {paymentStatus === 'refunded' && 'Reembolsado'}
            {paymentStatus === 'pending' && 'Procesando pago'}
          </span>
        </div>
        <div className="text-sm font-semibold text-gray-900">
          {amount.toFixed(2)} {currency}
        </div>
      </div>
      {booking.paymentMethod && (
        <div className="mt-2 text-xs text-gray-600">
          Método: {booking.paymentMethod}
        </div>
      )}
      
      {paymentStatus === 'unpaid' && (
        <div className="mt-3">
          {!showPaymentOptions ? (
            <button
              onClick={() => setShowPaymentOptions(true)}
              className="w-full flex items-center justify-center px-3 py-1.5 border border-green-600 text-green-600 rounded-md text-sm font-medium hover:bg-green-50 transition-colors"
            >
              <DollarSign className="h-4 w-4 mr-1.5" />
              Marcar como cobrado hoy
            </button>
          ) : (
            <div className="space-y-2">
              <div className="text-xs font-medium text-gray-700 mb-1">Selecciona método de pago:</div>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => handlePayment('Efectivo')}
                  className="px-2 py-1.5 bg-white border border-gray-300 rounded text-xs font-medium text-gray-700 hover:bg-gray-50"
                >
                  Efectivo
                </button>
                <button
                  onClick={() => handlePayment('Tarjeta')}
                  className="px-2 py-1.5 bg-white border border-gray-300 rounded text-xs font-medium text-gray-700 hover:bg-gray-50"
                >
                  Tarjeta
                </button>
                <button
                  onClick={() => handlePayment('Bizum')}
                  className="px-2 py-1.5 bg-white border border-gray-300 rounded text-xs font-medium text-gray-700 hover:bg-gray-50"
                >
                  Bizum
                </button>
              </div>
              <button
                onClick={() => setShowPaymentOptions(false)}
                className="w-full text-xs text-gray-500 hover:text-gray-700 mt-1"
              >
                Cancelar
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export const BookingDetailDrawer = ({
  booking,
  isOpen,
  onClose,
  onReschedule,
  onCancel,
  onStartChat,
  onJoinMeet,
  onMarkCompleted,
  onGenerateJustificante,
  onEditNotes,
  onViewClient,
  onViewSession,
  onMarkPaid
}) => {
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsClosing(false);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
      setIsClosing(false);
    }, 300);
  };

  if (!isOpen && !isClosing) return null;
  if (!booking) return null;

  const canReschedule = ['upcoming', 'pending', 'confirmed'].includes(booking.status);
  const canCancel = ['upcoming', 'pending', 'confirmed'].includes(booking.status);
  const canMarkCompleted = ['upcoming', 'confirmed'].includes(booking.status);
  const canJoinMeet = ['upcoming', 'confirmed'].includes(booking.status) && booking.meetingLink;

  return (
    <>
      {/* Backdrop */}
      <div
        className={`
          fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity duration-300
          ${isOpen && !isClosing ? 'opacity-100' : 'opacity-0'}
        `}
        onClick={handleClose}
      />

      {/* Drawer */}
      <div
        className={`
          fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-xl z-50
          transform transition-transform duration-300 ease-in-out
          ${isOpen && !isClosing ? 'translate-x-0' : 'translate-x-full'}
          md:max-w-lg lg:max-w-xl
        `}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <h2 className="text-lg font-semibold text-gray-900">
                Detallses de la cita
              </h2>
              <StatusBadge status={booking.status} size="sm" />
            </div>
            <button
              onClick={handleClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md"
              aria-label="Cerrar"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-4 space-y-6">
              {/* Client Info */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium text-gray-900">Información del cliente</h3>
                  {onViewClient && (
                    <button
                      onClick={() => onViewClient(booking.clientId)}
                      className="text-sm text-blue-600 hover:text-blue-800 flex items-center space-x-1"
                    >
                      <ExternalLink className="h-3 w-3" />
                      <span>Ver ficha</span>
                    </button>
                  )}
                </div>

                <div className="flex items-center space-x-3">
                  {booking.clientAvatar ? (
                    <img
                      className="h-12 w-12 rounded-full"
                      src={booking.clientAvatar}
                      alt={booking.clientName}
                    />
                  ) : (
                    <div className="h-12 w-12 rounded-full bg-gray-200 flex items-center justify-center">
                      <User className="h-6 w-6 text-gray-500" />
                    </div>
                  )}
                  <div>
                    <div className="text-base font-medium text-gray-900">
                      {booking.clientName}
                    </div>
                    <div className="text-sm text-gray-500">
                      Cliente desde {booking.clientSince || '2024'}
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  {booking.clientEmail && (
                    <InfoRow
                      icon={Mail}
                      label="Email"
                      value={booking.clientEmail}
                      action={
                        <a
                          href={`mailto:${booking.clientEmail}`}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      }
                    />
                  )}
                  {booking.clientPhone && (
                    <InfoRow
                      icon={Phone}
                      label="Teléfono"
                      value={booking.clientPhone}
                      action={
                        <a
                          href={`tel:${booking.clientPhone}`}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      }
                    />
                  )}
                  {booking.clientAddress && (
                    <InfoRow
                      icon={MapPin}
                      label="Dirección"
                      value={booking.clientAddress}
                    />
                  )}
                </div>
              </div>

              {/* Appointment Info */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-gray-900">Información de la cita</h3>

                <div className="space-y-2">
                  <InfoRow
                    icon={Calendar}
                    label="Fecha"
                    value={formatDate(booking.date)}
                  />
                  <InfoRow
                    icon={Clock}
                    label="Hora"
                    value={`${formatTime(booking.startTime)} - ${formatTime(booking.endTime || '00:00')}`}
                  />
                  <InfoRow
                    icon={FileText}
                    label="Tipo de terapia"
                    value={booking.therapyType}
                  />
                  {booking.location && (
                    <InfoRow
                      icon={MapPin}
                      label="Ubicación"
                      value={booking.location}
                    />
                  )}
                </div>
              </div>

              {/* Payment Info */}
              {booking.amount && (
                <div className="space-y-4">
                  <h3 className="text-sm font-medium text-gray-900">Información de pago</h3>
                  <PaymentInfo booking={booking} onMarkPaid={onMarkPaid} />
                </div>
              )}

              {/* Notes */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-gray-900">Notas de la cita</h3>
                <NotesSection
                  notes={booking.notes}
                  onEdit={onEditNotes ? () => onEditNotes(booking) : null}
                />
              </div>

              {/* Session Document */}
              {booking.sessionDocument && (
                <div className="space-y-4">
                  <h3 className="text-sm font-medium text-gray-900">Documento de sesión</h3>
                  <button
                    onClick={() => onViewSession && onViewSession(booking.sessionDocument)}
                    className="flex items-center space-x-2 text-blue-600 hover:text-blue-800"
                  >
                    <FileText className="h-4 w-4" />
                    <span>Ver documento de sesión</span>
                    <ExternalLink className="h-3 w-3" />
                  </button>
                </div>
              )}

              {/* Additional Info */}
              {(booking.createdAt || booking.id) && (
                <div className="space-y-2 pt-4 border-t border-gray-200">
                  <div className="text-xs text-gray-500">
                    ID de reserva: {booking.id}
                  </div>
                  {booking.createdAt && (
                    <div className="text-xs text-gray-500">
                      Creada: {new Date(booking.createdAt).toLocaleDateString('es-ES')}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="p-4 border-t border-gray-200 space-y-3">
            {/* Primary Actions */}
            <div className="grid grid-cols-2 gap-3">
              <ActionButton
                icon={MessageCircle}
                label="Chat"
                onClick={() => onStartChat && onStartChat(booking)}
                variant="outline"
                fullWidth
              />
              {canJoinMeet && (
                <ActionButton
                  icon={Video}
                  label="Videollamada"
                  onClick={() => onJoinMeet && onJoinMeet(booking)}
                  variant="success"
                  fullWidth
                />
              )}
            </div>

            {/* Secondary Actions */}
            <div className="space-y-2">
              {canMarkCompleted && (
                <ActionButton
                  icon={CheckCircle2}
                  label="Marcar como completada"
                  onClick={() => onMarkCompleted && onMarkCompleted(booking)}
                  variant="primary"
                  fullWidth
                />
              )}

              {booking.status === 'completed' && (
                <ActionButton
                  icon={FileText}
                  label="Generar Justificante"
                  onClick={() => onGenerateJustificante && onGenerateJustificante(booking)}
                  variant="outline"
                  fullWidth
                />
              )}

              <div className="grid grid-cols-2 gap-3">
                {canReschedule && (
                  <ActionButton
                    icon={RotateCcw}
                    label="Reprogramar"
                    onClick={() => onReschedule && onReschedule(booking)}
                    variant="warning"
                    fullWidth
                  />
                )}
                {canCancel && (
                  <ActionButton
                    icon={XCircle}
                    label="Cancelar"
                    onClick={() => onCancel && onCancel(booking)}
                    variant="danger"
                    fullWidth
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};