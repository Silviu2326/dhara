import React, { useState, useRef } from 'react';
import { Card } from '../../../components/Card';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon,
  Clock,
  User,
  MapPin,
  Plus,
  Edit3,
  Trash2,
  MoreHorizontal
} from 'lucide-react';

const InteractiveCalendar = ({ 
  bookings = [], 
  onBookingClick, 
  onBookingUpdate, 
  onBookingCreate, 
  onBookingDelete,
  view = 'week', // 'month', 'week', 'day'
  selectedDate = new Date()
}) => {
  const [currentDate, setCurrentDate] = useState(selectedDate);
  const [currentView, setCurrentView] = useState(view);
  const [draggedBooking, setDraggedBooking] = useState(null);
  const [draggedOver, setDraggedOver] = useState(null);
  const [showQuickCreate, setShowQuickCreate] = useState(false);
  const [quickCreateSlot, setQuickCreateSlot] = useState(null);
  
  const dragRef = useRef(null);

  // Navigation functions
  const navigatePrevious = () => {
    const newDate = new Date(currentDate);
    if (currentView === 'month') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else if (currentView === 'week') {
      newDate.setDate(newDate.getDate() - 7);
    } else if (currentView === 'day') {
      newDate.setDate(newDate.getDate() - 1);
    }
    setCurrentDate(newDate);
  };

  const navigateNext = () => {
    const newDate = new Date(currentDate);
    if (currentView === 'month') {
      newDate.setMonth(newDate.getMonth() + 1);
    } else if (currentView === 'week') {
      newDate.setDate(newDate.getDate() + 7);
    } else if (currentView === 'day') {
      newDate.setDate(newDate.getDate() + 1);
    }
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Get dates for current view
  const getViewDates = () => {
    const dates = [];
    
    if (currentView === 'day') {
      dates.push(new Date(currentDate));
    } else if (currentView === 'week') {
      const startOfWeek = new Date(currentDate);
      const dayOfWeek = startOfWeek.getDay();
      const diff = startOfWeek.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1); // Start from Monday
      startOfWeek.setDate(diff);
      
      for (let i = 0; i < 7; i++) {
        const date = new Date(startOfWeek);
        date.setDate(startOfWeek.getDate() + i);
        dates.push(date);
      }
    } else if (currentView === 'month') {
      const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
      
      // Start from the first Monday before or on the first day of the month
      const startDate = new Date(startOfMonth);
      const firstDayOfWeek = startDate.getDay();
      startDate.setDate(startDate.getDate() - (firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1));
      
      // Generate 42 days (6 weeks) to cover the entire month view
      for (let i = 0; i < 42; i++) {
        const date = new Date(startDate);
        date.setDate(startDate.getDate() + i);
        dates.push(date);
      }
    }
    
    return dates;
  };

  // Get bookings for a specific date
  const getBookingsForDate = (date) => {
    const dateStr = date.toISOString().split('T')[0];
    return bookings.filter(booking => booking.date === dateStr);
  };

  // Time slots for day/week view (8 AM to 8 PM)
  const timeSlots = Array.from({ length: 12 }, (_, i) => {
    const hour = 8 + i;
    return `${hour.toString().padStart(2, '0')}:00`;
  });

  // Drag and drop handlers
  const handleDragStart = (e, booking) => {
    setDraggedBooking(booking);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', e.target.outerHTML);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDragEnter = (e, date, time = null) => {
    e.preventDefault();
    setDraggedOver({ date, time });
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDraggedOver(null);
  };

  const handleDrop = (e, targetDate, targetTime = null) => {
    e.preventDefault();
    setDraggedOver(null);
    
    if (!draggedBooking) return;

    const newDate = targetDate.toISOString().split('T')[0];
    const newTime = targetTime || draggedBooking.startTime;

    // Calculate end time based on duration
    const [startHour, startMinute] = newTime.split(':').map(Number);
    const [origStartHour, origStartMinute] = draggedBooking.startTime.split(':').map(Number);
    const [origEndHour, origEndMinute] = draggedBooking.endTime.split(':').map(Number);
    
    const duration = (origEndHour * 60 + origEndMinute) - (origStartHour * 60 + origStartMinute);
    const endTotalMinutes = (startHour * 60 + startMinute) + duration;
    const endHour = Math.floor(endTotalMinutes / 60);
    const endMinute = endTotalMinutes % 60;
    const newEndTime = `${endHour.toString().padStart(2, '0')}:${endMinute.toString().padStart(2, '0')}`;

    // Update booking
    onBookingUpdate({
      ...draggedBooking,
      date: newDate,
      startTime: newTime,
      endTime: newEndTime
    });

    setDraggedBooking(null);
  };

  // Quick create handlers
  const handleSlotDoubleClick = (date, time) => {
    setQuickCreateSlot({ 
      date: date.toISOString().split('T')[0], 
      time: time || '09:00' 
    });
    setShowQuickCreate(true);
  };

  const handleQuickCreate = (bookingData) => {
    const newBooking = {
      ...bookingData,
      date: quickCreateSlot.date,
      startTime: quickCreateSlot.time,
      id: `BK${Date.now()}`,
      status: 'upcoming',
      createdAt: new Date().toISOString()
    };
    
    onBookingCreate(newBooking);
    setShowQuickCreate(false);
    setQuickCreateSlot(null);
  };

  // Format functions
  const formatDate = (date) => {
    return date.toLocaleDateString('es-ES', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const formatMonth = () => {
    return currentDate.toLocaleDateString('es-ES', { 
      month: 'long', 
      year: 'numeric' 
    });
  };

  const getStatusColor = (status) => {
    const colors = {
      upcoming: 'bg-blue-500',
      completed: 'bg-green-500',
      cancelled: 'bg-red-500',
      no_show: 'bg-yellow-500',
      pending: 'bg-gray-500'
    };
    return colors[status] || 'bg-gray-500';
  };

  // Render booking item
  const BookingItem = ({ booking, isSmall = false }) => (
    <div
      draggable
      onDragStart={(e) => handleDragStart(e, booking)}
      onClick={() => onBookingClick(booking)}
      className={`
        ${getStatusColor(booking.status)} text-white text-xs p-1 mb-1 rounded cursor-pointer
        hover:opacity-80 transition-opacity
        ${isSmall ? 'text-xs' : 'text-sm'}
      `}
    >
      <div className="flex items-center justify-between">
        <span className="truncate">
          {booking.startTime} - {booking.clientName}
        </span>
        {!isSmall && (
          <MoreHorizontal className="h-3 w-3 opacity-70" />
        )}
      </div>
      {!isSmall && (
        <div className="text-xs opacity-75 truncate">
          {booking.therapyType}
        </div>
      )}
    </div>
  );

  // Render month view
  const renderMonthView = () => {
    const dates = getViewDates();
    const weekDays = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

    return (
      <div className="grid grid-cols-7 gap-1">
        {/* Week headers */}
        {weekDays.map(day => (
          <div key={day} className="p-2 text-center text-sm font-medium text-gray-500 border-b">
            {day}
          </div>
        ))}
        
        {/* Calendar days */}
        {dates.map((date, index) => {
          const dayBookings = getBookingsForDate(date);
          const isCurrentMonth = date.getMonth() === currentDate.getMonth();
          const isToday = date.toDateString() === new Date().toDateString();
          const isDraggedOver = draggedOver?.date?.toDateString() === date.toDateString();

          return (
            <div
              key={index}
              className={`
                min-h-[100px] p-1 border border-gray-200 
                ${isCurrentMonth ? 'bg-white' : 'bg-gray-50'} 
                ${isToday ? 'bg-blue-50 border-blue-300' : ''} 
                ${isDraggedOver ? 'bg-green-50 border-green-300' : ''}
                hover:bg-gray-50 transition-colors
              `}
              onDragOver={handleDragOver}
              onDragEnter={(e) => handleDragEnter(e, date)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, date)}
              onDoubleClick={() => handleSlotDoubleClick(date)}
            >
              <div className={`text-sm ${isCurrentMonth ? 'text-gray-900' : 'text-gray-400'} ${isToday ? 'font-bold' : ''}`}>
                {date.getDate()}
              </div>
              <div className="mt-1 space-y-1">
                {dayBookings.slice(0, 3).map(booking => (
                  <BookingItem key={booking.id} booking={booking} isSmall />
                ))}
                {dayBookings.length > 3 && (
                  <div className="text-xs text-gray-500 text-center">
                    +{dayBookings.length - 3} más
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // Render week view
  const renderWeekView = () => {
    const dates = getViewDates();

    return (
      <div className="flex">
        {/* Time column */}
        <div className="w-20 flex-shrink-0">
          <div className="h-12 border-b border-gray-200"></div>
          {timeSlots.map(time => (
            <div key={time} className="h-16 border-b border-gray-200 p-1 text-xs text-gray-500">
              {time}
            </div>
          ))}
        </div>

        {/* Days columns */}
        {dates.map((date, dateIndex) => {
          const dayBookings = getBookingsForDate(date);
          const isToday = date.toDateString() === new Date().toDateString();

          return (
            <div key={dateIndex} className="flex-1 border-l border-gray-200">
              {/* Date header */}
              <div className={`h-12 p-2 text-center border-b border-gray-200 ${isToday ? 'bg-blue-50' : ''}`}>
                <div className="text-sm font-medium">{formatDate(date)}</div>
              </div>

              {/* Time slots */}
              {timeSlots.map((time, timeIndex) => {
                const slotBookings = dayBookings.filter(booking => {
                  const bookingHour = parseInt(booking.startTime.split(':')[0]);
                  const slotHour = parseInt(time.split(':')[0]);
                  return bookingHour === slotHour;
                });
                
                const isDraggedOver = draggedOver?.date?.toDateString() === date.toDateString() && 
                                    draggedOver?.time === time;

                return (
                  <div
                    key={timeIndex}
                    className={`h-16 border-b border-gray-100 p-1 relative ${isDraggedOver ? 'bg-green-50' : ''}`}
                    onDragOver={handleDragOver}
                    onDragEnter={(e) => handleDragEnter(e, date, time)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, date, time)}
                    onDoubleClick={() => handleSlotDoubleClick(date, time)}
                  >
                    {slotBookings.map(booking => (
                      <BookingItem key={booking.id} booking={booking} />
                    ))}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    );
  };

  // Render day view
  const renderDayView = () => {
    const date = currentDate;
    const dayBookings = getBookingsForDate(date);
    const isToday = date.toDateString() === new Date().toDateString();

    return (
      <div className="flex">
        {/* Time column */}
        <div className="w-20 flex-shrink-0">
          <div className={`h-16 p-2 border-b border-gray-200 ${isToday ? 'bg-blue-50' : ''}`}>
            <div className="text-lg font-semibold">{formatDate(date)}</div>
          </div>
          {timeSlots.map(time => (
            <div key={time} className="h-20 border-b border-gray-200 p-2 text-sm text-gray-500">
              {time}
            </div>
          ))}
        </div>

        {/* Main content */}
        <div className="flex-1 border-l border-gray-200">
          <div className="h-16 border-b border-gray-200"></div>
          {timeSlots.map((time, timeIndex) => {
            const slotBookings = dayBookings.filter(booking => {
              const bookingHour = parseInt(booking.startTime.split(':')[0]);
              const slotHour = parseInt(time.split(':')[0]);
              return bookingHour === slotHour;
            });
            
            const isDraggedOver = draggedOver?.time === time;

            return (
              <div
                key={timeIndex}
                className={`h-20 border-b border-gray-100 p-2 ${isDraggedOver ? 'bg-green-50' : ''}`}
                onDragOver={handleDragOver}
                onDragEnter={(e) => handleDragEnter(e, date, time)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, date, time)}
                onDoubleClick={() => handleSlotDoubleClick(date, time)}
              >
                {slotBookings.map(booking => (
                  <BookingItem key={booking.id} booking={booking} />
                ))}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <Card>
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <h3 className="text-xl font-semibold text-gray-900">
              {currentView === 'month' ? formatMonth() : 
               currentView === 'week' ? `Semana del ${formatDate(getViewDates()[0])}` :
               formatDate(currentDate)}
            </h3>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={navigatePrevious}
                className="p-2 hover:bg-gray-100 rounded-md"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                onClick={goToToday}
                className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Hoy
              </button>
              <button
                onClick={navigateNext}
                className="p-2 hover:bg-gray-100 rounded-md"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* View selector */}
          <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
            {[
              { key: 'month', label: 'Mes' },
              { key: 'week', label: 'Semana' },
              { key: 'day', label: 'Día' }
            ].map(viewOption => (
              <button
                key={viewOption.key}
                onClick={() => setCurrentView(viewOption.key)}
                className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                  currentView === viewOption.key
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {viewOption.label}
              </button>
            ))}
          </div>
        </div>

        {/* Calendar content */}
        <div className="overflow-auto">
          {currentView === 'month' && renderMonthView()}
          {currentView === 'week' && renderWeekView()}
          {currentView === 'day' && renderDayView()}
        </div>

        {/* Legend */}
        <div className="flex items-center space-x-4 mt-4 text-xs text-gray-600">
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-blue-500 rounded"></div>
            <span>Próximas</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-green-500 rounded"></div>
            <span>Completadas</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-red-500 rounded"></div>
            <span>Canceladas</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-yellow-500 rounded"></div>
            <span>No asistió</span>
          </div>
        </div>

        <div className="mt-2 text-xs text-gray-500">
          💡 Arrastra las citas para reprogramarlas • Doble-click en un hueco libre para crear una nueva cita
        </div>
      </div>

      {/* Quick Create Modal */}
      {showQuickCreate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <h3 className="text-lg font-semibold mb-4">Nueva Cita Rápida</h3>
            <QuickCreateForm
              slot={quickCreateSlot}
              onSubmit={handleQuickCreate}
              onCancel={() => {
                setShowQuickCreate(false);
                setQuickCreateSlot(null);
              }}
            />
          </div>
        </div>
      )}
    </Card>
  );
};

// Quick create form component
const QuickCreateForm = ({ slot, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    clientName: '',
    clientEmail: '',
    clientPhone: '',
    therapyType: 'Terapia Individual',
    duration: 60,
    notes: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const [hour, minute] = slot.time.split(':').map(Number);
    const endTotalMinutes = (hour * 60 + minute) + formData.duration;
    const endHour = Math.floor(endTotalMinutes / 60);
    const endMinute = endTotalMinutes % 60;
    const endTime = `${endHour.toString().padStart(2, '0')}:${endMinute.toString().padStart(2, '0')}`;

    onSubmit({
      ...formData,
      endTime,
      amount: formData.therapyType === 'Terapia de Pareja' ? 120 : 80,
      currency: 'EUR',
      paymentStatus: 'unpaid'
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Cliente *
        </label>
        <input
          type="text"
          required
          value={formData.clientName}
          onChange={(e) => setFormData(prev => ({ ...prev, clientName: e.target.value }))}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Nombre del cliente"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email
          </label>
          <input
            type="email"
            value={formData.clientEmail}
            onChange={(e) => setFormData(prev => ({ ...prev, clientEmail: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Teléfono
          </label>
          <input
            type="tel"
            value={formData.clientPhone}
            onChange={(e) => setFormData(prev => ({ ...prev, clientPhone: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Tipo de Terapia
        </label>
        <select
          value={formData.therapyType}
          onChange={(e) => setFormData(prev => ({ ...prev, therapyType: e.target.value }))}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option>Terapia Individual</option>
          <option>Terapia de Pareja</option>
          <option>Terapia Familiar</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Duración (minutos)
        </label>
        <select
          value={formData.duration}
          onChange={(e) => setFormData(prev => ({ ...prev, duration: parseInt(e.target.value) }))}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value={30}>30 minutos</option>
          <option value={45}>45 minutos</option>
          <option value={60}>60 minutos</option>
          <option value={90}>90 minutos</option>
        </select>
      </div>

      <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-md">
        <p><strong>Fecha:</strong> {slot?.date}</p>
        <p><strong>Hora:</strong> {slot?.time}</p>
      </div>

      <div className="flex justify-end space-x-3">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
        >
          Cancelar
        </button>
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Crear Cita
        </button>
      </div>
    </form>
  );
};

export { InteractiveCalendar };