import React from 'react';
import { TimelineItem } from './TimelineItem';
import { History, Calendar } from 'lucide-react';

export const AuditTimeline = ({ 
  events = [],
  className = '' 
}) => {
  if (events.length === 0) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <History className="mx-auto h-12 w-12 text-gray-400 mb-4" aria-hidden="true" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Sin historial de actividad
        </h3>
        <p className="text-gray-600">
          Una vez que envíes tus documentos, aquí aparecerá el historial de tu proceso de verificación.
        </p>
      </div>
    );
  }

  // Sort events by date (most recent first)
  const sortedEvents = [...events].sort((a, b) => new Date(b.date) - new Date(a.date));

  return (
    <div className={className}>
      {/* Header */}
      <div className="flex items-center space-x-2 mb-6">
        <Calendar className="h-5 w-5 text-gray-600" aria-hidden="true" />
        <h3 className="text-lg font-semibold text-gray-900">
          Historial de Verificación
        </h3>
        <span className="text-sm text-gray-500">
          ({events.length} evento{events.length !== 1 ? 's' : ''})
        </span>
      </div>

      {/* Timeline */}
      <div className="space-y-6">
        {sortedEvents.map((event, index) => (
          <TimelineItem
            key={event.id || index}
            event={event}
            isLast={index === sortedEvents.length - 1}
          />
        ))}
      </div>

      {/* Summary stats */}
      {events.length > 0 && (
        <div className="mt-8 bg-gray-50 rounded-lg p-4">
          <h4 className="text-sm font-medium text-gray-900 mb-3">
            Resumen del proceso
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Inicio del proceso:</span>
              <p className="font-medium text-gray-900">
                {new Date(Math.min(...events.map(e => new Date(e.date)))).toLocaleDateString('es-ES', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric'
                })}
              </p>
            </div>
            <div>
              <span className="text-gray-600">Última actividad:</span>
              <p className="font-medium text-gray-900">
                {new Date(Math.max(...events.map(e => new Date(e.date)))).toLocaleDateString('es-ES', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric'
                })}
              </p>
            </div>
            <div>
              <span className="text-gray-600">Total de eventos:</span>
              <p className="font-medium text-gray-900">
                {events.length}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};