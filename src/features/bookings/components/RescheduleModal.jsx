import React, { useState, useEffect } from 'react';
import { 
  X, 
  Calendar, 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  Loader2,
  ChevronLeft,
  ChevronRight,
  Info
} from 'lucide-react';

const formatDate = (date) => {
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

const generateTimeSlots = (startHour = 8, endHour = 20, interval = 30) => {
  const slots = [];
  for (let hour = startHour; hour < endHour; hour++) {
    for (let minute = 0; minute < 60; minute += interval) {
      const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      slots.push(timeString);
    }
  }
  return slots;
};

const getDaysInMonth = (date) => {
  const year = date.getFullYear();
  const month = date.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startingDayOfWeek = firstDay.getDay();
  
  const days = [];
  
  // Add empty cells for days before the first day of the month
  for (let i = 0; i < startingDayOfWeek; i++) {
    days.push(null);
  }
  
  // Add all days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    days.push(new Date(year, month, day));
  }
  
  return days;
};

const CalendarGrid = ({ selectedDate, onDateSelect, availableSlots, currentDate }) => {
  const [viewDate, setViewDate] = useState(currentDate || new Date());
  const days = getDaysInMonth(viewDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const isDateAvailable = (date) => {
    if (!date) return false;
    const dateString = date.toISOString().split('T')[0];
    return availableSlots[dateString] && availableSlots[dateString].length > 0;
  };

  const isDatePast = (date) => {
    if (!date) return false;
    return date < today;
  };

  const isDateSelected = (date) => {
    if (!date || !selectedDate) return false;
    return date.toDateString() === selectedDate.toDateString();
  };

  const navigateMonth = (direction) => {
    setViewDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + direction);
      return newDate;
    });
  };

  return (
    <div className="space-y-4">
      {/* Month navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigateMonth(-1)}
          className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <h3 className="text-lg font-semibold text-gray-900">
          {viewDate.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
        </h3>
        <button
          onClick={() => navigateMonth(1)}
          className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Days of week header */}
      <div className="grid grid-cols-7 gap-1 text-center text-sm font-medium text-gray-500">
        {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map(day => (
          <div key={day} className="py-2">{day}</div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {days.map((date, index) => {
          if (!date) {
            return <div key={index} className="h-10" />;
          }

          const isPast = isDatePast(date);
          const isAvailable = isDateAvailable(date);
          const isSelected = isDateSelected(date);
          const isToday = date.toDateString() === today.toDateString();

          return (
            <button
              key={index}
              onClick={() => !isPast && isAvailable && onDateSelect(date)}
              disabled={isPast || !isAvailable}
              className={`
                h-10 w-10 rounded-md text-sm font-medium transition-colors
                ${isSelected 
                  ? 'bg-blue-600 text-white' 
                  : isToday
                  ? 'bg-blue-100 text-blue-600'
                  : isAvailable && !isPast
                  ? 'text-gray-900 hover:bg-gray-100'
                  : 'text-gray-400 cursor-not-allowed'
                }
                ${isAvailable && !isPast && !isSelected ? 'border border-green-200' : ''}
              `}
            >
              {date.getDate()}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center space-x-4 text-xs text-gray-500">
        <div className="flex items-center space-x-1">
          <div className="w-3 h-3 border border-green-200 rounded"></div>
          <span>Disponible</span>
        </div>
        <div className="flex items-center space-x-1">
          <div className="w-3 h-3 bg-blue-600 rounded"></div>
          <span>Seleccionado</span>
        </div>
        <div className="flex items-center space-x-1">
          <div className="w-3 h-3 bg-gray-300 rounded"></div>
          <span>No disponible</span>
        </div>
      </div>
    </div>
  );
};

const TimeSlotGrid = ({ selectedDate, selectedTime, onTimeSelect, availableSlots, isLoading }) => {
  const timeSlots = generateTimeSlots();
  const dateString = selectedDate?.toISOString().split('T')[0];
  const availableTimes = availableSlots[dateString] || [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
        <span className="ml-2 text-sm text-gray-600">Cargando horarios disponibles...</span>
      </div>
    );
  }

  if (!selectedDate) {
    return (
      <div className="text-center py-8 text-gray-500">
        <Calendar className="h-8 w-8 mx-auto mb-2" />
        <p>Selecciona una fecha para ver los horarios disponibles</p>
      </div>
    );
  }

  if (availableTimes.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <Clock className="h-8 w-8 mx-auto mb-2" />
        <p>No hay horarios disponibles para esta fecha</p>
        <p className="text-sm mt-1">Selecciona otra fecha</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h4 className="text-sm font-medium text-gray-900">
        Horarios disponibles para {formatDate(selectedDate)}
      </h4>
      
      <div className="grid grid-cols-3 gap-2 max-h-60 overflow-y-auto">
        {timeSlots.map(time => {
          const isAvailable = availableTimes.includes(time);
          const isSelected = selectedTime === time;
          
          return (
            <button
              key={time}
              onClick={() => isAvailable && onTimeSelect(time)}
              disabled={!isAvailable}
              className={`
                px-3 py-2 text-sm font-medium rounded-md transition-colors
                ${isSelected
                  ? 'bg-blue-600 text-white'
                  : isAvailable
                  ? 'bg-white text-gray-900 border border-gray-300 hover:bg-gray-50'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                }
              `}
            >
              {formatTime(time)}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export const RescheduleModal = ({ 
  booking, 
  isOpen, 
  onClose, 
  onConfirm,
  availableSlots = {},
  isLoading = false
}) => {
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen) {
      setSelectedDate(null);
      setSelectedTime(null);
      setError(null);
      setIsSubmitting(false);
    }
  }, [isOpen]);

  const handleConfirm = async () => {
    if (!selectedDate || !selectedTime) {
      setError('Por favor selecciona una fecha y hora');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await onConfirm({
        bookingId: booking.id,
        newDate: selectedDate.toISOString().split('T')[0],
        newTime: selectedTime,
        originalDate: booking.date,
        originalTime: booking.startTime
      });
      onClose();
    } catch (err) {
      setError(err.message || 'Error al reprogramar la cita');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen || !booking) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50" onClick={onClose} />
      
      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Reprogramar cita
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
              {/* Current appointment info */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-gray-900 mb-2">
                  Cita actual
                </h3>
                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  <div className="flex items-center space-x-1">
                    <Calendar className="h-4 w-4" />
                    <span>{formatDate(new Date(booking.date))}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Clock className="h-4 w-4" />
                    <span>{formatTime(booking.startTime)}</span>
                  </div>
                </div>
              </div>

              {/* New appointment selection */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-gray-900">
                  Seleccionar nueva fecha y hora
                </h3>
                
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Calendar */}
                  <div>
                    <CalendarGrid
                      selectedDate={selectedDate}
                      onDateSelect={setSelectedDate}
                      availableSlots={availableSlots}
                      currentDate={new Date()}
                    />
                  </div>
                  
                  {/* Time slots */}
                  <div>
                    <TimeSlotGrid
                      selectedDate={selectedDate}
                      selectedTime={selectedTime}
                      onTimeSelect={setSelectedTime}
                      availableSlots={availableSlots}
                      isLoading={isLoading}
                    />
                  </div>
                </div>
              </div>

              {/* Selected appointment summary */}
              {selectedDate && selectedTime && (
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex items-start space-x-2">
                    <CheckCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-medium text-blue-900">
                        Nueva cita programada
                      </h4>
                      <div className="text-sm text-blue-700 mt-1">
                        {formatDate(selectedDate)} a las {formatTime(selectedTime)}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Error message */}
              {error && (
                <div className="bg-red-50 p-4 rounded-lg">
                  <div className="flex items-start space-x-2">
                    <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-medium text-red-900">
                        Error
                      </h4>
                      <div className="text-sm text-red-700 mt-1">
                        {error}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Info message */}
              <div className="bg-yellow-50 p-4 rounded-lg">
                <div className="flex items-start space-x-2">
                  <Info className="h-5 w-5 text-yellow-600 mt-0.5" />
                  <div className="text-sm text-yellow-700">
                    <p className="font-medium">Información importante:</p>
                    <ul className="mt-1 list-disc list-inside space-y-1">
                      <li>Se enviará una notificación automática al cliente</li>
                      <li>La cita original será cancelada automáticamente</li>
                      <li>Los pagos realizados se mantendrán para la nueva fecha</li>
                    </ul>
                  </div>
                </div>
              </div>
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
              disabled={!selectedDate || !selectedTime || isSubmitting}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              <span>{isSubmitting ? 'Reprogramando...' : 'Confirmar reprogramación'}</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
};