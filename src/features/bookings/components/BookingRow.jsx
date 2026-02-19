import React, { useState } from 'react';
import { 
  MessageCircle, 
  RotateCcw, 
  X, 
  Video, 
  Eye, 
  MoreHorizontal,
  Calendar,
  Clock,
  User,
  Phone,
  Mail,
  MapPin
} from 'lucide-react';
import { StatusBadge } from './StatusBadge';

const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
};

const formatTime = (timeString) => {
  return timeString.slice(0, 5); // HH:MM format
};

const ActionButton = ({ icon: Icon, label, onClick, variant = 'default', disabled = false }) => {
  const variants = {
    default: 'text-gray-600 hover:text-gray-800 hover:bg-gray-100',
    primary: 'text-blue-600 hover:text-blue-800 hover:bg-blue-50',
    success: 'text-green-600 hover:text-green-800 hover:bg-green-50',
    warning: 'text-yellow-600 hover:text-yellow-800 hover:bg-yellow-50',
    danger: 'text-red-600 hover:text-red-800 hover:bg-red-50'
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      data-action-button="true"
      className={`
        p-2 rounded-md transition-colors duration-200
        ${disabled ? 'text-gray-400 cursor-not-allowed' : variants[variant]}
      `}
      title={label}
      aria-label={label}
    >
      <Icon className="h-4 w-4" />
    </button>
  );
};

const ActionsDropdown = ({ booking, onReschedule, onCancel, onStartChat, onJoinMeet }) => {
  const [isOpen, setIsOpen] = useState(false);
  const canReschedule = ['upcoming', 'pending'].includes(booking.status);
  const canCancel = ['upcoming', 'pending'].includes(booking.status);
  const canChat = true; // Always available
  const canJoinMeet = booking.status === 'upcoming' && booking.meetingLink;

  const actions = [
    {
      icon: Eye,
      label: 'Ver detalles',
      onClick: () => {}, // Handled by row click
      show: true
    },
    {
      icon: MessageCircle,
      label: 'Iniciar chat',
      onClick: onStartChat,
      show: canChat,
      variant: 'primary'
    },
    {
      icon: Video,
      label: 'Unirse a videollamada',
      onClick: onJoinMeet,
      show: canJoinMeet,
      variant: 'success'
    },
    {
      icon: RotateCcw,
      label: 'Reprogramar',
      onClick: onReschedule,
      show: canReschedule,
      variant: 'warning'
    },
    {
      icon: X,
      label: 'Cancelar',
      onClick: onCancel,
      show: canCancel,
      variant: 'danger'
    }
  ].filter(action => action.show);

  return (
    <div className="relative" data-action-button="true">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md transition-colors"
        aria-label="Más acciones"
      >
        <MoreHorizontal className="h-4 w-4" />
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          ></div>
          
          {/* Dropdown menu */}
          <div className="absolute right-0 mt-1 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-20">
            <div className="py-1">
              {actions.map((action, index) => (
                <button
                  key={index}
                  onClick={() => {
                    action.onClick();
                    setIsOpen(false);
                  }}
                  className={`
                    w-full flex items-center space-x-2 px-3 py-2 text-sm text-left
                    hover:bg-gray-50 transition-colors
                    ${action.variant === 'danger' ? 'text-red-600 hover:bg-red-50' : 'text-gray-700'}
                  `}
                >
                  <action.icon className="h-4 w-4" />
                  <span>{action.label}</span>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

// Desktop table row view
const DesktopRow = ({ 
  booking, 
  isSelected, 
  isHovered, 
  onMouseEnter, 
  onMouseLeave, 
  onClick,
  onReschedule,
  onCancel,
  onStartChat,
  onJoinMeet
}) => {
  const canReschedule = ['upcoming', 'pending'].includes(booking.status);
  const canCancel = ['upcoming', 'pending'].includes(booking.status);
  const canChat = true;
  const canJoinMeet = booking.status === 'upcoming' && booking.meetingLink;

  return (
    <tr
      className={`
        cursor-pointer transition-colors duration-200
        ${isSelected ? 'bg-blue-50 border-blue-200' : ''}
        ${isHovered ? 'bg-gray-50' : ''}
        hover:bg-gray-50
      `}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onClick={onClick}
    >
      {/* Date */}
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center space-x-2">
          <Calendar className="h-4 w-4 text-gray-400" />
          <div>
            <div className="text-sm font-medium text-gray-900">
              {formatDate(booking.date)}
            </div>
            <div className="text-xs text-gray-500">
              {new Date(booking.date).toLocaleDateString('es-ES', { weekday: 'short' })}
            </div>
          </div>
        </div>
      </td>

      {/* Time */}
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center space-x-2">
          <Clock className="h-4 w-4 text-gray-400" />
          <div>
            <div className="text-sm font-medium text-gray-900">
              {formatTime(booking.startTime)}
            </div>
            <div className="text-xs text-gray-500">
              {booking.duration || '60'} min
            </div>
          </div>
        </div>
      </td>

      {/* Client */}
      <td className="px-6 py-4">
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0">
            {booking.clientAvatar ? (
              <img 
                className="h-8 w-8 rounded-full" 
                src={booking.clientAvatar} 
                alt={booking.clientName}
              />
            ) : (
              <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                <User className="h-4 w-4 text-gray-500" />
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-medium text-gray-900 truncate">
              {booking.clientName}
            </div>
            <div className="text-xs text-gray-500 truncate">
              {booking.clientEmail || booking.clientPhone}
            </div>
          </div>
        </div>
      </td>

      {/* Therapy */}
      <td className="px-6 py-4">
        <div>
          <div className="text-sm font-medium text-gray-900">
            {booking.therapyType}
          </div>
          {booking.therapyDuration && (
            <div className="text-xs text-gray-500">
              {booking.therapyDuration} min
            </div>
          )}
        </div>
      </td>

      {/* Status */}
      <td className="px-6 py-4 whitespace-nowrap">
        <StatusBadge status={booking.status} />
      </td>

      {/* Actions */}
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center space-x-1">
          {canChat && (
            <ActionButton
              icon={MessageCircle}
              label="Iniciar chat"
              onClick={onStartChat}
              variant="primary"
            />
          )}
          {canJoinMeet && (
            <ActionButton
              icon={Video}
              label="Unirse a videollamada"
              onClick={onJoinMeet}
              variant="success"
            />
          )}
          <ActionsDropdown
            booking={booking}
            onReschedule={onReschedule}
            onCancel={onCancel}
            onStartChat={onStartChat}
            onJoinMeet={onJoinMeet}
          />
        </div>
      </td>
    </tr>
  );
};

// Mobile card view
const MobileCard = ({ 
  booking, 
  isSelected, 
  onClick,
  onReschedule,
  onCancel,
  onStartChat,
  onJoinMeet
}) => {
  return (
    <div
      className={`
        p-4 cursor-pointer transition-colors duration-200
        ${isSelected ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''}
        hover:bg-gray-50
      `}
      onClick={onClick}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-3">
          {booking.clientAvatar ? (
            <img 
              className="h-10 w-10 rounded-full" 
              src={booking.clientAvatar} 
              alt={booking.clientName}
            />
          ) : (
            <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
              <User className="h-5 w-5 text-gray-500" />
            </div>
          )}
          <div>
            <div className="text-sm font-medium text-gray-900">
              {booking.clientName}
            </div>
            <div className="text-xs text-gray-500">
              {booking.therapyType}
            </div>
          </div>
        </div>
        <StatusBadge status={booking.status} size="sm" />
      </div>

      {/* Details */}
      <div className="grid grid-cols-2 gap-3 mb-3 text-sm">
        <div className="flex items-center space-x-2">
          <Calendar className="h-4 w-4 text-gray-400" />
          <span className="text-gray-600">{formatDate(booking.date)}</span>
        </div>
        <div className="flex items-center space-x-2">
          <Clock className="h-4 w-4 text-gray-400" />
          <span className="text-gray-600">{formatTime(booking.startTime)}</span>
        </div>
        {booking.clientPhone && (
          <div className="flex items-center space-x-2">
            <Phone className="h-4 w-4 text-gray-400" />
            <span className="text-gray-600 text-xs">{booking.clientPhone}</span>
          </div>
        )}
        {booking.clientEmail && (
          <div className="flex items-center space-x-2">
            <Mail className="h-4 w-4 text-gray-400" />
            <span className="text-gray-600 text-xs truncate">{booking.clientEmail}</span>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between pt-3 border-t border-gray-200">
        <div className="text-xs text-gray-500">
          ID: {booking.id}
        </div>
        <div className="flex items-center space-x-1">
          <ActionsDropdown
            booking={booking}
            onReschedule={onReschedule}
            onCancel={onCancel}
            onStartChat={onStartChat}
            onJoinMeet={onJoinMeet}
          />
        </div>
      </div>
    </div>
  );
};

export const BookingRow = ({ 
  booking,
  viewMode = 'desktop',
  isSelected = false,
  isHovered = false,
  onMouseEnter,
  onMouseLeave,
  onClick,
  onReschedule,
  onCancel,
  onStartChat,
  onJoinMeet
}) => {
  if (viewMode === 'mobile') {
    return (
      <MobileCard
        booking={booking}
        isSelected={isSelected}
        onClick={onClick}
        onReschedule={onReschedule}
        onCancel={onCancel}
        onStartChat={onStartChat}
        onJoinMeet={onJoinMeet}
      />
    );
  }

  return (
    <DesktopRow
      booking={booking}
      isSelected={isSelected}
      isHovered={isHovered}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onClick={onClick}
      onReschedule={onReschedule}
      onCancel={onCancel}
      onStartChat={onStartChat}
      onJoinMeet={onJoinMeet}
    />
  );
};