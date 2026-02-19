import React from 'react';

const WEBHOOK_EVENTS = [
  {
    id: 'booking.created',
    name: 'Reserva creada',
    description: 'Se dispara cuando un cliente hace una nueva reserva'
  },
  {
    id: 'booking.updated',
    name: 'Reserva actualizada',
    description: 'Se dispara cuando se modifica una reserva existente'
  },
  {
    id: 'booking.cancelled',
    name: 'Reserva cancelada',
    description: 'Se dispara cuando se cancela una reserva'
  },
  {
    id: 'booking.completed',
    name: 'Reserva completada',
    description: 'Se dispara cuando se marca una reserva como completada'
  },
  {
    id: 'payment.succeeded',
    name: 'Pago exitoso',
    description: 'Se dispara cuando se procesa un pago correctamente'
  },
  {
    id: 'payment.failed',
    name: 'Pago fallido',
    description: 'Se dispara cuando falla un intento de pago'
  },
  {
    id: 'review.new',
    name: 'Nueva reseña',
    description: 'Se dispara cuando un cliente deja una nueva reseña'
  },
  {
    id: 'client.created',
    name: 'Cliente nuevo',
    description: 'Se dispara cuando se registra un nuevo cliente'
  }
];

export const EventCheckboxes = ({ selectedEvents, onChange, disabled }) => {
  const handleEventToggle = (eventId) => {
    if (disabled) return;
    
    const newSelectedEvents = selectedEvents.includes(eventId)
      ? selectedEvents.filter(id => id !== eventId)
      : [...selectedEvents, eventId];
    
    onChange(newSelectedEvents);
  };

  const handleSelectAll = () => {
    if (disabled) return;
    
    const allEventIds = WEBHOOK_EVENTS.map(event => event.id);
    onChange(selectedEvents.length === allEventIds.length ? [] : allEventIds);
  };

  const isAllSelected = selectedEvents.length === WEBHOOK_EVENTS.length;
  const isPartiallySelected = selectedEvents.length > 0 && selectedEvents.length < WEBHOOK_EVENTS.length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-gray-700">
          Eventos que disparan webhooks
        </label>
        
        <button
          onClick={handleSelectAll}
          disabled={disabled}
          className={`text-sm font-medium ${
            disabled 
              ? 'text-gray-400 cursor-not-allowed' 
              : 'text-blue-600 hover:text-blue-800'
          }`}
        >
          {isAllSelected ? 'Deseleccionar todos' : 'Seleccionar todos'}
        </button>
      </div>

      <div className="space-y-3">
        {WEBHOOK_EVENTS.map((event) => {
          const isSelected = selectedEvents.includes(event.id);
          
          return (
            <label 
              key={event.id} 
              className={`flex items-start space-x-3 p-3 rounded-lg border transition-colors ${
                disabled 
                  ? 'bg-gray-50 border-gray-200 cursor-not-allowed' 
                  : isSelected
                    ? 'bg-blue-50 border-blue-200 cursor-pointer hover:bg-blue-100'
                    : 'bg-white border-gray-200 cursor-pointer hover:bg-gray-50'
              }`}
            >
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => handleEventToggle(event.id)}
                disabled={disabled}
                className={`mt-1 h-4 w-4 rounded border-gray-300 ${
                  disabled 
                    ? 'text-gray-400' 
                    : 'text-blue-600 focus:ring-blue-500'
                }`}
              />
              
              <div className="flex-1 min-w-0">
                <div className={`text-sm font-medium ${
                  disabled ? 'text-gray-400' : 'text-gray-900'
                }`}>
                  {event.name}
                  <code className={`ml-2 px-2 py-0.5 rounded text-xs font-mono ${
                    disabled 
                      ? 'bg-gray-100 text-gray-400' 
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {event.id}
                  </code>
                </div>
                <div className={`text-xs mt-1 ${
                  disabled ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  {event.description}
                </div>
              </div>
            </label>
          );
        })}
      </div>

      <div className="text-xs text-gray-500">
        <strong>{selectedEvents.length}</strong> de <strong>{WEBHOOK_EVENTS.length}</strong> eventos seleccionados
      </div>
    </div>
  );
};