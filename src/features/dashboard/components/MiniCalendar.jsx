import React, { useState } from 'react';
import { Card } from '../../../components/Card';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { format, startOfWeek, addDays, isSameDay, addWeeks, subWeeks } from 'date-fns';
import { es } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';

export const MiniCalendar = ({ appointments }) => {
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const navigate = useNavigate();

  // Datos de ejemplo de citas
  const defaultAppointments = [
    { date: new Date(), count: 3 },
    { date: addDays(new Date(), 1), count: 2 },
    { date: addDays(new Date(), 3), count: 1 },
    { date: addDays(new Date(), 5), count: 4 }
  ];

  const appointmentsData = appointments || defaultAppointments;

  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 }); // Lunes como primer día
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const getAppointmentCount = (date) => {
    const appointment = appointmentsData.find(apt => 
      isSameDay(new Date(apt.date), date)
    );
    return appointment ? appointment.count : 0;
  };

  const handleDateClick = (date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    navigate(`/reservas?date=${dateStr}`);
  };

  const handlePrevWeek = () => {
    setCurrentWeek(subWeeks(currentWeek, 1));
  };

  const handleNextWeek = () => {
    setCurrentWeek(addWeeks(currentWeek, 1));
  };

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base sm:text-lg font-semibold text-deep">Calendario Semanal</h2>
        <div className="flex items-center space-x-2">
          <button
            onClick={handlePrevWeek}
            className="p-1 hover:bg-gray-100 rounded"
            aria-label="Semana anterior"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="text-sm font-medium text-gray-600">
            {format(weekStart, 'MMM yyyy', { locale: es })}
          </span>
          <button
            onClick={handleNextWeek}
            className="p-1 hover:bg-gray-100 rounded"
            aria-label="Semana siguiente"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1">
        {/* Encabezados de días */}
        {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map((day, index) => (
          <div key={day} className="text-center text-xs font-medium text-gray-500 p-2">
            {day}
          </div>
        ))}
        
        {/* Días de la semana */}
        {weekDays.map((date) => {
          const appointmentCount = getAppointmentCount(date);
          const isToday = isSameDay(date, new Date());
          
          return (
            <button
              key={date.toISOString()}
              onClick={() => handleDateClick(date)}
              className={`
                relative p-2 text-sm rounded hover:bg-gray-50 transition-colors
                ${isToday ? 'bg-sage text-white hover:bg-sage/90' : 'text-gray-700'}
              `}
              aria-label={`${format(date, 'dd MMMM yyyy', { locale: es })}${appointmentCount > 0 ? `, ${appointmentCount} citas` : ''}`}
            >
              <span className="block">{format(date, 'd')}</span>
              {appointmentCount > 0 && (
                <div className={`
                  absolute bottom-1 left-1/2 transform -translate-x-1/2 
                  w-1.5 h-1.5 rounded-full
                  ${isToday ? 'bg-white' : 'bg-sage'}
                `} />
              )}
            </button>
          );
        })}
      </div>

      <div className="mt-3 text-xs text-gray-500 text-center">
        Haz clic en un día para ver las citas
      </div>
    </Card>
  );
};