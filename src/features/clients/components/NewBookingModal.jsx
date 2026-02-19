import React, { useState, useEffect } from 'react';
import { 
  CalendarIcon,
  ClockIcon,
  UserIcon,
  PhoneIcon,
  VideoCameraIcon,
  MapPinIcon,
  CurrencyEuroIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { Button } from '../../../components/Button';

const formatDate = (date) => {
  return date.toLocaleDateString('es-ES', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

const formatTime = (time) => {
  return time.substring(0, 5); // HH:MM
};

// Datos mock de terapias disponibles
const therapyTypes = [
  { id: 'individual', name: 'Terapia Individual', duration: 60, price: 80 },
  { id: 'couple', name: 'Terapia de Pareja', duration: 90, price: 120 },
  { id: 'family', name: 'Terapia Familiar', duration: 90, price: 100 },
  { id: 'group', name: 'Terapia Grupal', duration: 120, price: 60 },
  { id: 'consultation', name: 'Consulta Inicial', duration: 45, price: 60 }
];

// Generar slots de tiempo disponibles
const generateTimeSlots = (date) => {
  const slots = [];
  const startHour = 9;
  const endHour = 18;
  
  for (let hour = startHour; hour < endHour; hour++) {
    for (let minute of [0, 30]) {
      const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      const isAvailable = Math.random() > 0.3; // 70% de disponibilidad
      slots.push({ time, available: isAvailable });
    }
  }
  
  return slots;
};

const CalendarGrid = ({ selectedDate, onDateSelect, availableDates = [] }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  
  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    const days = [];
    
    // Días del mes anterior
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      const prevDate = new Date(year, month, -i);
      days.push({ date: prevDate, isCurrentMonth: false });
    }
    
    // Días del mes actual
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      days.push({ date, isCurrentMonth: true });
    }
    
    // Días del mes siguiente
    const remainingDays = 42 - days.length;
    for (let day = 1; day <= remainingDays; day++) {
      const nextDate = new Date(year, month + 1, day);
      days.push({ date: nextDate, isCurrentMonth: false });
    }
    
    return days;
  };
  
  const isDateAvailable = (date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date >= today;
  };
  
  const isDateSelected = (date) => {
    return selectedDate && 
           date.getDate() === selectedDate.getDate() &&
           date.getMonth() === selectedDate.getMonth() &&
           date.getFullYear() === selectedDate.getFullYear();
  };
  
  const days = getDaysInMonth(currentMonth);
  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];
  
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      {/* Header del calendario */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
          className="p-1 hover:bg-gray-100 rounded"
        >
          ←
        </button>
        
        <h3 className="font-semibold text-gray-900">
          {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
        </h3>
        
        <button
          onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
          className="p-1 hover:bg-gray-100 rounded"
        >
          →
        </button>
      </div>
      
      {/* Días de la semana */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map((day) => (
          <div key={day} className="text-center text-sm font-medium text-gray-500 py-2">
            {day}
          </div>
        ))}
      </div>
      
      {/* Días del mes */}
      <div className="grid grid-cols-7 gap-1">
        {days.map((day, index) => {
          const available = isDateAvailable(day.date);
          const selected = isDateSelected(day.date);
          
          return (
            <button
              key={index}
              onClick={() => available && day.isCurrentMonth && onDateSelect(day.date)}
              disabled={!available || !day.isCurrentMonth}
              className={`
                h-8 w-8 text-sm rounded transition-colors
                ${
                  selected
                    ? 'bg-primary text-white'
                    : day.isCurrentMonth
                    ? available
                      ? 'text-gray-900 hover:bg-gray-100'
                      : 'text-gray-400 cursor-not-allowed'
                    : 'text-gray-300'
                }
              `}
            >
              {day.date.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
};

const TimeSlotGrid = ({ selectedDate, selectedTime, onTimeSelect }) => {
  const [timeSlots, setTimeSlots] = useState([]);
  
  useEffect(() => {
    if (selectedDate) {
      setTimeSlots(generateTimeSlots(selectedDate));
    }
  }, [selectedDate]);
  
  if (!selectedDate) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
        <ClockIcon className="mx-auto h-8 w-8 text-gray-400 mb-2" />
        <p className="text-gray-500">Selecciona una fecha para ver los horarios disponibles</p>
      </div>
    );
  }
  
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <h4 className="font-medium text-gray-900 mb-3">
        Horarios para {formatDate(selectedDate)}
      </h4>
      
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-64 overflow-y-auto">
        {timeSlots.map((slot) => (
          <button
            key={slot.time}
            onClick={() => slot.available && onTimeSelect(slot.time)}
            disabled={!slot.available}
            className={`
              px-3 py-2 text-sm rounded border transition-colors
              ${
                selectedTime === slot.time
                  ? 'bg-primary text-white border-primary'
                  : slot.available
                  ? 'bg-white text-gray-700 border-gray-300 hover:border-primary hover:text-primary'
                  : 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
              }
            `}
          >
            {formatTime(slot.time)}
          </button>
        ))}
      </div>
    </div>
  );
};

export const NewBookingModal = ({ 
  isOpen, 
  onClose, 
  client,
  onCreateBooking
}) => {
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [selectedTherapy, setSelectedTherapy] = useState(null);
  const [sessionType, setSessionType] = useState('presencial'); // presencial, online
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  useEffect(() => {
    if (isOpen) {
      // Reset form when modal opens
      setSelectedDate(null);
      setSelectedTime(null);
      setSelectedTherapy(null);
      setSessionType('presencial');
      setNotes('');
    }
  }, [isOpen]);
  
  const handleSubmit = async () => {
    if (!selectedDate || !selectedTime || !selectedTherapy) {
      alert('Por favor completa todos los campos requeridos');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const bookingData = {
        clientId: client.id,
        date: selectedDate.toISOString().split('T')[0],
        time: selectedTime,
        therapyType: selectedTherapy.id,
        sessionType,
        notes: notes.trim(),
        duration: selectedTherapy.duration,
        price: selectedTherapy.price
      };
      
      await onCreateBooking(bookingData);
      onClose();
    } catch (error) {
      console.error('Error creating booking:', error);
      alert('Error al crear la cita. Por favor inténtalo de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (!isOpen) return null;
  
  const selectedTherapyData = therapyTypes.find(t => t.id === selectedTherapy?.id);
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Nueva cita</h2>
            <p className="text-sm text-gray-600">
              Programar cita para {client?.name}
            </p>
          </div>
          
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Columna izquierda: Selección de fecha y hora */}
            <div className="space-y-6">
              {/* Información del cliente */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-2">Cliente</h3>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-white font-medium">
                    {client?.name?.charAt(0)}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{client?.name}</p>
                    <p className="text-sm text-gray-600">{client?.email}</p>
                  </div>
                </div>
              </div>
              
              {/* Selección de fecha */}
              <div>
                <h3 className="font-medium text-gray-900 mb-3">Seleccionar fecha</h3>
                <CalendarGrid
                  selectedDate={selectedDate}
                  onDateSelect={setSelectedDate}
                />
              </div>
              
              {/* Selección de hora */}
              <div>
                <h3 className="font-medium text-gray-900 mb-3">Seleccionar hora</h3>
                <TimeSlotGrid
                  selectedDate={selectedDate}
                  selectedTime={selectedTime}
                  onTimeSelect={setSelectedTime}
                />
              </div>
            </div>
            
            {/* Columna derecha: Detalles de la cita */}
            <div className="space-y-6">
              {/* Tipo de terapia */}
              <div>
                <h3 className="font-medium text-gray-900 mb-3">Tipo de terapia</h3>
                <div className="space-y-2">
                  {therapyTypes.map((therapy) => (
                    <label
                      key={therapy.id}
                      className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer transition-colors ${
                        selectedTherapy?.id === therapy.id
                          ? 'border-primary bg-primary bg-opacity-5'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="radio"
                          name="therapy"
                          value={therapy.id}
                          checked={selectedTherapy?.id === therapy.id}
                          onChange={() => setSelectedTherapy(therapy)}
                          className="text-primary focus:ring-primary"
                        />
                        <div>
                          <p className="font-medium text-gray-900">{therapy.name}</p>
                          <p className="text-sm text-gray-600">{therapy.duration} min</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-gray-900">{therapy.price}€</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
              
              {/* Modalidad */}
              <div>
                <h3 className="font-medium text-gray-900 mb-3">Modalidad</h3>
                <div className="grid grid-cols-2 gap-3">
                  <label className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                    sessionType === 'presencial'
                      ? 'border-primary bg-primary bg-opacity-5'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}>
                    <input
                      type="radio"
                      name="sessionType"
                      value="presencial"
                      checked={sessionType === 'presencial'}
                      onChange={(e) => setSessionType(e.target.value)}
                      className="text-primary focus:ring-primary"
                    />
                    <MapPinIcon className="h-5 w-5 text-gray-600" />
                    <span className="font-medium text-gray-900">Presencial</span>
                  </label>
                  
                  <label className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                    sessionType === 'online'
                      ? 'border-primary bg-primary bg-opacity-5'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}>
                    <input
                      type="radio"
                      name="sessionType"
                      value="online"
                      checked={sessionType === 'online'}
                      onChange={(e) => setSessionType(e.target.value)}
                      className="text-primary focus:ring-primary"
                    />
                    <VideoCameraIcon className="h-5 w-5 text-gray-600" />
                    <span className="font-medium text-gray-900">Online</span>
                  </label>
                </div>
              </div>
              
              {/* Notas */}
              <div>
                <h3 className="font-medium text-gray-900 mb-3">Notas (opcional)</h3>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Añade cualquier información adicional sobre la cita..."
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary resize-none"
                />
              </div>
              
              {/* Resumen */}
              {selectedDate && selectedTime && selectedTherapyData && (
                <div className="bg-blue-50 rounded-lg p-4">
                  <h4 className="font-medium text-blue-900 mb-3">Resumen de la cita</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-blue-800">
                      <CalendarIcon className="h-4 w-4" />
                      <span>{formatDate(selectedDate)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-blue-800">
                      <ClockIcon className="h-4 w-4" />
                      <span>{formatTime(selectedTime)} ({selectedTherapyData.duration} min)</span>
                    </div>
                    <div className="flex items-center gap-2 text-blue-800">
                      <UserIcon className="h-4 w-4" />
                      <span>{selectedTherapyData.name}</span>
                    </div>
                    <div className="flex items-center gap-2 text-blue-800">
                      {sessionType === 'presencial' ? (
                        <MapPinIcon className="h-4 w-4" />
                      ) : (
                        <VideoCameraIcon className="h-4 w-4" />
                      )}
                      <span className="capitalize">{sessionType}</span>
                    </div>
                    <div className="flex items-center gap-2 text-blue-800 font-medium">
                      <CurrencyEuroIcon className="h-4 w-4" />
                      <span>{selectedTherapyData.price}€</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          
          <Button
            onClick={handleSubmit}
            disabled={!selectedDate || !selectedTime || !selectedTherapy || isSubmitting}
            loading={isSubmitting}
          >
            {isSubmitting ? 'Creando cita...' : 'Crear cita'}
          </Button>
        </div>
      </div>
    </div>
  );
};