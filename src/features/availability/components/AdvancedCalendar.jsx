
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Card } from '../../../components/Card';
import { ChevronLeft, ChevronRight, Calendar, Clock, MapPin, User, Eye, Plus, Grip } from 'lucide-react';
import AppointmentModal from './AppointmentModal';

const DAYS_OF_WEEK = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

const ZOOM_LEVELS = [
  { id: '15min', label: '15 min', interval: 15 },
  { id: '30min', label: '30 min', interval: 30 },
  { id: '1hour', label: '1 hora', interval: 60 }
];

const EVENT_COLORS = {
  availability: 'bg-green-100 border-green-300 text-green-800',
  appointment: 'bg-blue-100 border-blue-300 text-blue-800',
  absence: 'bg-red-100 border-red-300 text-red-800',
  blocked: 'bg-gray-100 border-gray-300 text-gray-800'
};

export const AdvancedCalendar = ({
  view = 'week',
  events = [],
  selectedDate = new Date(),
  onDateChange,
  onEventClick,
  onEventDrop,
  onEventResize,
  onSlotSelect,
  onEventCreate,
  selectedSlots = [],
  onSelectedSlotsChange,
  timezone = 'Europe/Madrid',
  locations = [],
  loading = false,
  onAppointmentEdit,
  onAppointmentCancel,
  onAppointmentReschedule
}) => {
  const [currentDate, setCurrentDate] = useState(selectedDate);
  const [zoomLevel, setZoomLevel] = useState('30min');
  const [isDragging, setIsDragging] = useState(false);
  const [draggedEvent, setDraggedEvent] = useState(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isResizing, setIsResizing] = useState(false);
  const [viewMode, setViewMode] = useState(view);
  const [showMiniCalendar, setShowMiniCalendar] = useState(true);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [isAppointmentModalOpen, setIsAppointmentModalOpen] = useState(false);

  const calendarRef = useRef(null);
  const dragPreviewRef = useRef(null);

  const zoomConfig = ZOOM_LEVELS.find(z => z.id === zoomLevel);
  const timeSlots = generateTimeSlots(zoomConfig.interval);

  // Generate time slots based on zoom level
  function generateTimeSlots(interval) {
    const slots = [];
    for (let hour = 0; hour < 24; hour++) {
      for (let minute = 0; minute < 60; minute += interval) {
        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        slots.push({
          time: timeString,
          hour,
          minute,
          isHourMark: minute === 0
        });
      }
    }
    return slots;
  }

  // Get days to display based on view mode
  const getViewDays = useCallback(() => {
    const start = new Date(currentDate);
    
    if (viewMode === 'day') {
      return [start];
    } else if (viewMode === 'week') {
      const startOfWeek = new Date(start);
      startOfWeek.setDate(start.getDate() - start.getDay());
      const days = [];
      for (let i = 0; i < 7; i++) {
        const day = new Date(startOfWeek);
        day.setDate(startOfWeek.getDate() + i);
        days.push(day);
      }
      return days;
    } else if (viewMode === 'month') {
      const startOfMonth = new Date(start.getFullYear(), start.getMonth(), 1);
      const endOfMonth = new Date(start.getFullYear(), start.getMonth() + 1, 0);
      const startDate = new Date(startOfMonth);
      startDate.setDate(startDate.getDate() - startDate.getDay());
      
      const days = [];
      const currentDay = new Date(startDate);
      
      while (currentDay <= endOfMonth || days.length < 42) {
        days.push(new Date(currentDay));
        currentDay.setDate(currentDay.getDate() + 1);
        if (days.length >= 42) break;
      }
      return days;
    }
  }, [currentDate, viewMode]);

  const viewDays = getViewDays();

  // Navigation handlers
  const navigateDate = (direction) => {
    const newDate = new Date(currentDate);
    if (viewMode === 'day') {
      newDate.setDate(currentDate.getDate() + direction);
    } else if (viewMode === 'week') {
      newDate.setDate(currentDate.getDate() + (direction * 7));
    } else if (viewMode === 'month') {
      newDate.setMonth(currentDate.getMonth() + direction);
    }
    setCurrentDate(newDate);
    onDateChange?.(newDate);
  };

  // Event positioning helpers
  const getEventStyle = (event, day) => {
    if (viewMode === 'month') {
      return { height: '20px', marginBottom: '2px' };
    }

    const startTime = parseTime(event.startTime || '00:00');
    const endTime = parseTime(event.endTime || '23:59');
    const duration = endTime - startTime;
    const slotHeight = 40; // Height per time slot
    const slotsPerHour = 60 / zoomConfig.interval;

    // Calculate position based on start time
    const topPosition = (startTime / zoomConfig.interval) * slotHeight;
    const heightValue = Math.max((duration / zoomConfig.interval) * slotHeight - 2, slotHeight - 2);

    return {
      top: `${topPosition}px`,
      height: `${heightValue}px`,
      left: '2px',
      right: '2px',
      zIndex: 10
    };
  };

  const parseTime = (timeStr) => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
  };

  // Modal handlers
  const handleAppointmentClick = (appointment) => {
    setSelectedAppointment(appointment);
    setIsAppointmentModalOpen(true);

    // Call the existing onEventClick if provided
    if (onEventClick) {
      onEventClick(appointment);
    }
  };

  const handleCloseModal = () => {
    setIsAppointmentModalOpen(false);
    setSelectedAppointment(null);
  };

  const handleEditAppointment = (appointment) => {
    handleCloseModal();
    if (onAppointmentEdit) {
      onAppointmentEdit(appointment);
    }
  };

  const handleCancelAppointment = (appointment) => {
    handleCloseModal();
    if (onAppointmentCancel) {
      onAppointmentCancel(appointment);
    }
  };

  const handleRescheduleAppointment = (appointment) => {
    handleCloseModal();
    if (onAppointmentReschedule) {
      onAppointmentReschedule(appointment);
    }
  };

  // Drag and Drop handlers
  const handleMouseDown = (e, event) => {
    if (e.target.classList.contains('resize-handle')) return;
    
    setIsDragging(true);
    setDraggedEvent(event);
    
    const rect = e.currentTarget.getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
    
    e.preventDefault();
  };

  const handleMouseMove = useCallback((e) => {
    if (!isDragging || !draggedEvent) return;
    
    if (dragPreviewRef.current) {
      dragPreviewRef.current.style.left = `${e.clientX - dragOffset.x}px`;
      dragPreviewRef.current.style.top = `${e.clientY - dragOffset.y}px`;
    }
  }, [isDragging, draggedEvent, dragOffset]);

  const handleMouseUp = useCallback((e) => {
    if (!isDragging || !draggedEvent) return;

    const calendarRect = calendarRef.current?.getBoundingClientRect();
    if (!calendarRect) return;

    // Find the time column width
    const timeColumnWidth = 80; // 20rem = 80px
    const x = e.clientX - calendarRect.left - timeColumnWidth;
    const y = e.clientY - calendarRect.top - 48; // Account for header height

    // Calculate new date and time based on drop position
    const dayWidth = (calendarRect.width - timeColumnWidth) / viewDays.length;
    const dayIndex = Math.floor(x / dayWidth);
    const newDay = viewDays[dayIndex];

    if (newDay && viewMode !== 'month' && dayIndex >= 0 && dayIndex < viewDays.length) {
      const slotHeight = 40;
      const newTimeSlotIndex = Math.max(0, Math.floor(y / slotHeight));
      const newStartMinutes = newTimeSlotIndex * zoomConfig.interval;
      const newStartTime = `${Math.floor(newStartMinutes / 60).toString().padStart(2, '0')}:${(newStartMinutes % 60).toString().padStart(2, '0')}`;

      // Calculate end time based on original duration
      const originalStart = parseTime(draggedEvent.startTime || '00:00');
      const originalEnd = parseTime(draggedEvent.endTime || '01:00');
      const duration = originalEnd - originalStart;
      const newEndMinutes = newStartMinutes + duration;
      const newEndTime = `${Math.floor(newEndMinutes / 60).toString().padStart(2, '0')}:${(newEndMinutes % 60).toString().padStart(2, '0')}`;

      onEventDrop?.({
        event: draggedEvent,
        newDate: newDay.toISOString().split('T')[0],
        newStartTime,
        newEndTime
      });
    }

    setIsDragging(false);
    setDraggedEvent(null);
  }, [isDragging, draggedEvent, viewDays, viewMode, zoomConfig, onEventDrop]);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // Slot selection for creating new events
  const handleSlotClick = (day, timeSlot) => {
    if (viewMode === 'month') return;

    const slotInfo = {
      date: day.toISOString().split('T')[0],
      time: typeof timeSlot === 'string' ? timeSlot : timeSlot.time,
      duration: zoomConfig.interval,
      dayOfWeek: day.getDay(),
      timestamp: new Date(`${day.toISOString().split('T')[0]}T${typeof timeSlot === 'string' ? timeSlot : timeSlot.time}`)
    };

    onSlotSelect?.(slotInfo);
  };

  // Filter events for specific day
  const getEventsForDay = (day) => {
    const dayStr = day.toISOString().split('T')[0];
    return events.filter(event => {
      // Handle different date formats
      if (event.date) {
        const eventDate = typeof event.date === 'string' ? event.date : new Date(event.date).toISOString().split('T')[0];
        return eventDate === dayStr;
      }
      if (event.startDate) {
        const startDate = typeof event.startDate === 'string' ? event.startDate : new Date(event.startDate).toISOString().split('T')[0];
        const endDate = event.endDate ?
          (typeof event.endDate === 'string' ? event.endDate : new Date(event.endDate).toISOString().split('T')[0]) :
          startDate;
        return startDate <= dayStr && endDate >= dayStr;
      }
      return false;
    }).sort((a, b) => {
      // Sort events by start time
      const timeA = parseTime(a.startTime || '00:00');
      const timeB = parseTime(b.startTime || '00:00');
      return timeA - timeB;
    });
  };

  // Render mini calendar for navigation
  const renderMiniCalendar = () => {
    const today = new Date();
    const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const lastDay = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const days = [];
    const currentDay = new Date(startDate);
    
    for (let i = 0; i < 42; i++) {
      days.push(new Date(currentDay));
      currentDay.setDate(currentDay.getDate() + 1);
    }
    
    return (
      <Card>
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-900">
              {MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h3>
            <button
              onClick={() => setShowMiniCalendar(!showMiniCalendar)}
              className="text-gray-400 hover:text-gray-600"
            >
              <Eye className="h-4 w-4" />
            </button>
          </div>
          
          <div className="grid grid-cols-7 gap-1 text-xs">
            {DAYS_OF_WEEK.map(day => (
              <div key={day} className="text-center text-gray-500 py-1">
                {day}
              </div>
            ))}
            
            {days.map((day, index) => {
              const isToday = day.toDateString() === today.toDateString();
              const isCurrentMonth = day.getMonth() === currentDate.getMonth();
              const isSelected = day.toDateString() === currentDate.toDateString();
              
              return (
                <button
                  key={index}
                  onClick={() => {
                    setCurrentDate(day);
                    onDateChange?.(day);
                  }}
                  className={`h-8 w-8 text-xs rounded-md transition-colors ${
                    isSelected
                      ? 'bg-blue-600 text-white'
                      : isToday
                      ? 'bg-blue-100 text-blue-600'
                      : isCurrentMonth
                      ? 'text-gray-900 hover:bg-gray-100'
                      : 'text-gray-400 hover:bg-gray-50'
                  }`}
                >
                  {day.getDate()}
                </button>
              );
            })}
          </div>
        </div>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {/* Calendar Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-1">
            <button
              onClick={() => navigateDate(-1)}
              className="p-2 hover:bg-gray-100 rounded-md transition-colors"
              disabled={loading}
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            
            <h2 className="text-lg font-semibold text-gray-900 min-w-0">
              {viewMode === 'day' && currentDate.toLocaleDateString('es-ES', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
              {viewMode === 'week' && `Semana del ${viewDays[0]?.toLocaleDateString('es-ES')} al ${viewDays[6]?.toLocaleDateString('es-ES')}`}
              {viewMode === 'month' && `${MONTHS[currentDate.getMonth()]} ${currentDate.getFullYear()}`}
            </h2>
            
            <button
              onClick={() => navigateDate(1)}
              className="p-2 hover:bg-gray-100 rounded-md transition-colors"
              disabled={loading}
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
          
          <button
            onClick={() => {
              setCurrentDate(new Date());
              onDateChange?.(new Date());
            }}
            className="px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
          >
            Hoy
          </button>
        </div>
        
        <div className="flex items-center space-x-4">
          {/* View Mode Selector */}
          <div className="flex border border-gray-200 rounded-md">
            {['day', 'week', 'month'].map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-3 py-1 text-sm capitalize transition-colors ${
                  viewMode === mode
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                {mode === 'day' ? 'Día' : mode === 'week' ? 'Semana' : 'Mes'}
              </button>
            ))}
          </div>
          
          {/* Zoom Level (for day/week views) */}
          {viewMode !== 'month' && (
            <select
              value={zoomLevel}
              onChange={(e) => setZoomLevel(e.target.value)}
              className="px-3 py-1 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {ZOOM_LEVELS.map((level) => (
                <option key={level.id} value={level.id}>
                  {level.label}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      <div className="flex space-x-6">
        {/* Mini Calendar Sidebar */}
        {showMiniCalendar && (
          <div className="w-64 hidden lg:block">
            {renderMiniCalendar()}
          </div>
        )}
        
        {/* Main Calendar */}
        <div className="flex-1">
          <Card>
            <div
              ref={calendarRef}
              className="relative overflow-auto"
              style={{
                minHeight: viewMode === 'month' ? '600px' : '800px',
                maxHeight: viewMode === 'month' ? '600px' : '800px'
              }}
            >
              {viewMode === 'month' ? (
                // Month View
                <div className="grid grid-cols-7 h-full">
                  {DAYS_OF_WEEK.map(day => (
                    <div key={day} className="p-2 text-center text-sm font-medium text-gray-500 border-b border-gray-200">
                      {day}
                    </div>
                  ))}
                  
                  {viewDays.map((day, index) => {
                    const dayEvents = getEventsForDay(day);
                    const isCurrentMonth = day.getMonth() === currentDate.getMonth();
                    const isToday = day.toDateString() === new Date().toDateString();
                    
                    return (
                      <div
                        key={index}
                        className={`p-2 border-b border-r border-gray-200 min-h-[120px] ${
                          !isCurrentMonth ? 'bg-gray-50' : ''
                        } ${isToday ? 'bg-blue-50' : ''}`}
                        onClick={() => handleSlotClick(day, '09:00')}
                      >
                        <div className={`text-sm mb-1 ${
                          isToday ? 'font-bold text-blue-600' : 
                          isCurrentMonth ? 'text-gray-900' : 'text-gray-400'
                        }`}>
                          {day.getDate()}
                        </div>
                        
                        <div className="space-y-1">
                          {dayEvents.slice(0, 3).map((event, eventIndex) => (
                            <div
                              key={eventIndex}
                              className={`px-2 py-1 rounded text-xs truncate cursor-pointer ${EVENT_COLORS[event.type] || EVENT_COLORS.availability}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleAppointmentClick(event);
                              }}
                            >
                              {event.title}
                            </div>
                          ))}
                          {dayEvents.length > 3 && (
                            <div className="text-xs text-gray-500">
                              +{dayEvents.length - 3} más
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                // Week/Day View
                <div className="flex">
                  {/* Time Column - Fixed position */}
                  <div className="w-20 border-r border-gray-200 bg-gray-50 sticky left-0 z-20">
                    <div className="h-12 border-b border-gray-200 bg-white flex items-center justify-center text-xs text-gray-500 font-medium">
                      Hora
                    </div>
                    {timeSlots.map((slot, index) => (
                      <div
                        key={slot.time}
                        className={`h-10 px-1 text-xs flex items-start justify-end relative ${
                          slot.isHourMark
                            ? 'text-gray-700 font-medium border-b border-gray-200'
                            : 'text-gray-400 border-b border-gray-100'
                        }`}
                      >
                        {slot.isHourMark && (
                          <span className="absolute right-1 top-0 -mt-2 text-xs">{slot.time}</span>
                        )}
                      </div>
                    ))}
                  </div>
                  
                  {/* Days Columns */}
                  <div className="flex-1 min-w-0">
                    <div className="grid" style={{ gridTemplateColumns: `repeat(${viewDays.length}, 1fr)` }}>
                      {/* Day Headers */}
                      {viewDays.map((day, dayIndex) => {
                        const isToday = day.toDateString() === new Date().toDateString();
                        const isWeekend = day.getDay() === 0 || day.getDay() === 6;
                        return (
                          <div
                            key={dayIndex}
                            className={`p-3 text-center border-b border-r border-gray-200 min-w-0 ${
                              isToday ? 'bg-blue-50' : isWeekend ? 'bg-gray-25' : 'bg-white'
                            }`}
                          >
                            <div className={`text-xs font-medium ${
                              isWeekend ? 'text-gray-500' : 'text-gray-600'
                            }`}>
                              {day.toLocaleDateString('es-ES', { weekday: 'short' }).toUpperCase()}
                            </div>
                            <div className={`text-lg font-semibold ${
                              isToday ? 'text-blue-600' :
                              isWeekend ? 'text-gray-500' : 'text-gray-900'
                            }`}>
                              {day.getDate()}
                            </div>
                            <div className="text-xs text-gray-400">
                              {day.toLocaleDateString('es-ES', { month: 'short' })}
                            </div>
                          </div>
                        );
                      })}
                      
                      {/* Day Columns Container */}
                      {viewDays.map((day, dayIndex) => {
                        const dayEvents = getEventsForDay(day);
                        return (
                          <div key={dayIndex} className="relative">
                            {/* Time Slots for this day */}
                            {timeSlots.map((slot, timeIndex) => {
                              const slotTime = parseTime(slot.time);
                              const isHourMark = slot.isHourMark;

                              return (
                                <div
                                  key={`${timeIndex}-${dayIndex}`}
                                  className={`h-10 border-r border-gray-100 relative cursor-pointer hover:bg-blue-25 transition-colors ${
                                    isHourMark ? 'border-b border-gray-200' : 'border-b border-gray-100'
                                  }`}
                                  onClick={() => handleSlotClick(day, slot.time)}
                                  title={`${day.toLocaleDateString('es-ES')} ${slot.time}`}
                                >
                                </div>
                              );
                            })}

                            {/* Events positioned absolutely over the time grid */}
                            {dayEvents.map((event, eventIndex) => {
                              const eventStyle = getEventStyle(event, day);
                              return (
                                <div
                                  key={`event-${eventIndex}`}
                                  className={`absolute inset-x-1 rounded-md shadow-sm border cursor-grab active:cursor-grabbing transition-all hover:shadow-md ${EVENT_COLORS[event.type] || EVENT_COLORS.availability}`}
                                  style={eventStyle}
                                  onMouseDown={(e) => handleMouseDown(e, event)}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleAppointmentClick(event);
                                  }}
                                >
                                  <div className="p-1 h-full flex flex-col justify-between">
                                    <div className="flex items-start justify-between">
                                      <div className="flex-1 min-w-0">
                                        <div className="text-xs font-medium truncate">{event.title}</div>
                                        <div className="text-xs opacity-75">
                                          {event.startTime} - {event.endTime}
                                        </div>
                                      </div>
                                      <Grip className="h-3 w-3 opacity-50 ml-1 flex-shrink-0" />
                                    </div>
                                    {event.location && (
                                      <div className="flex items-center mt-1 opacity-75">
                                        <MapPin className="h-2 w-2 mr-1 flex-shrink-0" />
                                        <span className="text-xs truncate">{event.location}</span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
              
              {/* Drag Preview */}
              {isDragging && draggedEvent && (
                <div
                  ref={dragPreviewRef}
                  className="fixed z-50 pointer-events-none opacity-75"
                  style={{
                    width: '200px',
                    height: '60px'
                  }}
                >
                  <div className={`rounded px-2 py-1 text-xs font-medium ${EVENT_COLORS[draggedEvent.type] || EVENT_COLORS.availability}`}>
                    {draggedEvent.title}
                  </div>
                </div>
              )}
              
              {loading && (
                <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center">
                  <div className="text-gray-500">Cargando...</div>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* Appointment Details Modal */}
      <AppointmentModal
        appointment={selectedAppointment}
        isOpen={isAppointmentModalOpen}
        onClose={handleCloseModal}
        onEdit={handleEditAppointment}
        onCancel={handleCancelAppointment}
        onReschedule={handleRescheduleAppointment}
      />
    </div>
  );
};