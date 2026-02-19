import React from 'react';
import { CheckCircle, XCircle, Clock, Upload, Eye, MessageSquare } from 'lucide-react';

const getEventConfig = (type, status) => {
  const configs = {
    submitted: {
      icon: Upload,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      title: 'Documentos enviados',
      description: 'Se han enviado los documentos para verificación'
    },
    under_review: {
      icon: Eye,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100',
      title: 'En revisión',
      description: 'Los documentos están siendo revisados por el equipo'
    },
    approved: {
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      title: 'Verificación aprobada',
      description: 'La verificación ha sido aprobada exitosamente'
    },
    rejected: {
      icon: XCircle,
      color: 'text-red-600',
      bgColor: 'bg-red-100',
      title: 'Verificación rechazada',
      description: 'La verificación ha sido rechazada. Revisa los comentarios'
    },
    comment_added: {
      icon: MessageSquare,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
      title: 'Comentario agregado',
      description: 'Se han agregado comentarios del revisor'
    },
    resubmitted: {
      icon: Upload,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
      title: 'Documentos reenviados',
      description: 'Se han reenviado los documentos corregidos'
    }
  };
  
  return configs[type] || {
    icon: Clock,
    color: 'text-gray-600',
    bgColor: 'bg-gray-100',
    title: 'Evento',
    description: 'Actividad en el proceso de verificación'
  };
};

export const TimelineItem = ({ 
  event,
  isLast = false,
  className = '' 
}) => {
  const config = getEventConfig(event.type, event.status);
  const Icon = config.icon;

  return (
    <div className={`relative ${className}`}>
      {/* Timeline line */}
      {!isLast && (
        <div 
          className="absolute left-4 top-10 w-0.5 h-full bg-gray-200" 
          aria-hidden="true"
        />
      )}
      
      {/* Event content */}
      <div className="relative flex items-start space-x-3">
        {/* Icon */}
        <div className={`flex-shrink-0 w-8 h-8 rounded-full ${config.bgColor} flex items-center justify-center`}>
          <Icon className={`w-4 h-4 ${config.color}`} aria-hidden="true" />
        </div>
        
        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-gray-900">
              {event.title || config.title}
            </h4>
            <time 
              className="text-sm text-gray-500 whitespace-nowrap ml-4"
              dateTime={event.date}
            >
              {new Date(event.date).toLocaleDateString('es-ES', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </time>
          </div>
          
          <p className="text-sm text-gray-600 mt-1">
            {event.description || config.description}
          </p>
          
          {/* Additional details */}
          {event.details && (
            <div className="mt-2 text-xs text-gray-500">
              {Array.isArray(event.details) ? (
                <ul className="space-y-1">
                  {event.details.map((detail, index) => (
                    <li key={index}>• {detail}</li>
                  ))}
                </ul>
              ) : (
                <p>{event.details}</p>
              )}
            </div>
          )}
          
          {/* Reviewer info */}
          {event.reviewer && (
            <p className="text-xs text-gray-500 mt-1">
              Por: {event.reviewer}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};