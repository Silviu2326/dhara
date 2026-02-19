import React from 'react';
import { Clock, FileText, CreditCard, AlertTriangle } from 'lucide-react';

const getAlertIcon = (type) => {
  switch (type) {
    case 'appointment':
      return Clock;
    case 'document':
      return FileText;
    case 'subscription':
      return CreditCard;
    default:
      return AlertTriangle;
  }
};

const getAlertIconLabel = (type) => {
  switch (type) {
    case 'appointment':
      return 'Icono de cita';
    case 'document':
      return 'Icono de documento';
    case 'subscription':
      return 'Icono de suscripción';
    default:
      return 'Icono de alerta';
  }
};

const getAlertColor = (priority) => {
  switch (priority) {
    case 'high':
      return 'text-red-600 bg-red-50 border-red-200';
    case 'medium':
      return 'text-orange-600 bg-orange-50 border-orange-200';
    case 'low':
    default:
      return 'text-blue-600 bg-blue-50 border-blue-200';
  }
};

export const AlertItem = ({ alert, onClick }) => {
  const Icon = getAlertIcon(alert.type);
  const iconLabel = getAlertIconLabel(alert.type);
  const colorClasses = getAlertColor(alert.priority);

  return (
    <div 
      className={`flex items-start sm:items-center p-2 sm:p-3 border rounded-lg cursor-pointer hover:shadow-sm transition-shadow ${colorClasses}`}
      onClick={() => onClick && onClick(alert)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick && onClick(alert);
        }
      }}
      aria-label={`Alerta de prioridad ${alert.priority}: ${alert.message}. ${alert.time || ''}`}
    >
      <Icon 
        className="h-5 w-5 mr-2 sm:mr-3 flex-shrink-0 mt-0.5 sm:mt-0" 
        aria-label={iconLabel}
        role="img"
      />
      <div className="flex-1 min-w-0">
        <p className="text-xs sm:text-sm font-medium leading-tight">{alert.message}</p>
        {alert.time && (
          <p className="text-xs opacity-75 mt-0.5 sm:mt-1 truncate">{alert.time}</p>
        )}
      </div>
    </div>
  );
};