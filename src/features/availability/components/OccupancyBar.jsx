import React, { useState } from "react";
import {
  Calendar,
  Clock,
  Users,
  TrendingUp,
  TrendingDown,
  ChevronDown,
  ChevronUp,
  Info,
} from "lucide-react";

const DAYS_OF_WEEK = [
  { key: "monday", label: "Lun", fullLabel: "Lunes" },
  { key: "tuesday", label: "Mar", fullLabel: "Martes" },
  { key: "wednesday", label: "Mié", fullLabel: "Miércoles" },
  { key: "thursday", label: "Jue", fullLabel: "Jueves" },
  { key: "friday", label: "Vie", fullLabel: "Viernes" },
  { key: "saturday", label: "Sáb", fullLabel: "Sábado" },
  { key: "sunday", label: "Dom", fullLabel: "Domingo" },
];

const getOccupancyColor = (percentage) => {
  if (percentage >= 90) return "bg-red-500";
  if (percentage >= 75) return "bg-orange-500";
  if (percentage >= 50) return "bg-yellow-500";
  if (percentage >= 25) return "bg-green-500";
  return "bg-gray-300";
};

// Patrones para mejorar accesibilidad (color-blind friendly)
const getOccupancyPattern = (percentage) => {
  if (percentage >= 90) return "bg-gradient-to-t from-red-600 to-red-400";
  if (percentage >= 75) return "bg-gradient-to-t from-orange-600 to-orange-400";
  if (percentage >= 50) return "bg-gradient-to-t from-yellow-600 to-yellow-400";
  if (percentage >= 25) return "bg-gradient-to-t from-green-600 to-green-400";
  return "bg-gray-300";
};

const getOccupancySymbol = (percentage) => {
  if (percentage >= 90) return "▓▓▓"; // Muy ocupado
  if (percentage >= 75) return "▓▓░"; // Ocupado
  if (percentage >= 50) return "▓░░"; // Moderado
  if (percentage >= 25) return "░░░"; // Disponible
  return "   "; // Libre
};

const getOccupancyTextColor = (percentage) => {
  if (percentage >= 90) return "text-red-700";
  if (percentage >= 75) return "text-orange-700";
  if (percentage >= 50) return "text-yellow-700";
  if (percentage >= 25) return "text-green-700";
  return "text-gray-600";
};

const getOccupancyStatus = (percentage) => {
  if (percentage >= 90)
    return { label: "Muy ocupado", icon: TrendingUp, color: "text-red-600" };
  if (percentage >= 75)
    return { label: "Ocupado", icon: TrendingUp, color: "text-orange-600" };
  if (percentage >= 50)
    return { label: "Moderado", icon: Clock, color: "text-yellow-600" };
  if (percentage >= 25)
    return { label: "Disponible", icon: TrendingDown, color: "text-green-600" };
  return { label: "Libre", icon: TrendingDown, color: "text-gray-600" };
};

const DayOccupancyBar = ({ day, data, isToday = false }) => {
  const availableHours = data?.availableHours || 0;
  const bookedHours = data?.bookedHours || 0;
  const totalHours = availableHours + bookedHours;
  const occupancyPercentage =
    totalHours > 0 ? Math.round((bookedHours / totalHours) * 100) : 0;

  const status = getOccupancyStatus(occupancyPercentage);

  return (
    <div
      className={`
      flex flex-col items-center p-1.5 sm:p-2 rounded-lg transition-all duration-200 flex-1 min-w-[32px] sm:min-w-auto
      ${isToday ? "bg-blue-50 border-2 border-blue-200" : "bg-gray-50 hover:bg-gray-100"}
    `}
    >
      {/* Day label */}
      <div className="text-center mb-1">
        <div
          className={`
          text-[10px] sm:text-sm font-medium
          ${isToday ? "text-blue-700" : "text-gray-700"}
        `}
        >
          <span className="hidden sm:inline">{day.label}</span>
          <span className="sm:hidden">{day.label.charAt(0)}</span>
        </div>
        {isToday && (
          <div className="text-[8px] text-blue-600 font-medium">Hoy</div>
        )}
      </div>

      {/* Compact bar */}
      <div className="w-full">
        <div className="h-10 sm:h-16 bg-gray-200 rounded-md overflow-hidden relative">
          <div
            className={`absolute bottom-0 left-0 right-0 transition-all duration-500 ${getOccupancyPattern(occupancyPercentage)}`}
            style={{ height: `${occupancyPercentage}%` }}
          ></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <span
              className={`text-[10px] sm:text-xs font-bold ${occupancyPercentage > 50 ? "text-white" : "text-gray-700"}`}
            >
              {occupancyPercentage}%
            </span>
          </div>
        </div>
      </div>

      {/* Hours - hidden on very small screens */}
      <div className="text-[8px] sm:text-xs mt-1 text-gray-500 hidden xs:block">
        {bookedHours}/{totalHours}h
      </div>
    </div>
  );
};

const WeekSummary = ({ weekData, currentWeek }) => {
  const totalAvailable = weekData.reduce(
    (sum, day) => sum + (day?.availableHours || 0),
    0,
  );
  const totalBooked = weekData.reduce(
    (sum, day) => sum + (day?.bookedHours || 0),
    0,
  );
  const totalHours = totalAvailable + totalBooked;
  const averageOccupancy =
    totalHours > 0 ? Math.round((totalBooked / totalHours) * 100) : 0;

  const status = getOccupancyStatus(averageOccupancy);
  const StatusIcon = status.icon;

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3 gap-2">
        <h3 className="text-sm font-medium text-gray-900 flex items-center">
          <Calendar className="h-4 w-4 mr-2" />
          Resumen semanal
        </h3>
        <div className={`flex items-center space-x-1 ${status.color}`}>
          <StatusIcon className="h-4 w-4" />
          <span className="text-sm font-medium">{status.label}</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 sm:gap-4 text-center">
        <div>
          <div className="text-base sm:text-lg font-bold text-gray-900">
            {averageOccupancy}%
          </div>
          <div className="text-xs text-gray-600">Ocupación media</div>
        </div>
        <div>
          <div className="text-base sm:text-lg font-bold text-blue-600">
            {totalBooked}h
          </div>
          <div className="text-xs text-gray-600">Horas reservadas</div>
        </div>
        <div>
          <div className="text-base sm:text-lg font-bold text-green-600">
            {totalAvailable}h
          </div>
          <div className="text-xs text-gray-600">Horas disponibles</div>
        </div>
      </div>
    </div>
  );
};

const processBookingData = (appointments = [], availabilitySlots = []) => {
  // Initialize week data structure (Monday to Sunday)
  const weekData = Array(7)
    .fill(null)
    .map(() => ({
      availableHours: 0,
      bookedHours: 0,
    }));

  // Get current week date range
  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay() + 1); // Monday
  startOfWeek.setHours(0, 0, 0, 0);

  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6); // Sunday
  endOfWeek.setHours(23, 59, 59, 999);

  // Process availability slots for available hours
  availabilitySlots.forEach((slot) => {
    try {
      const slotDate = new Date(slot.startDate || slot.date);
      if (slotDate >= startOfWeek && slotDate <= endOfWeek) {
        const dayIndex = slotDate.getDay() === 0 ? 6 : slotDate.getDay() - 1; // Convert to Monday-first index

        // Calculate duration from times
        if (slot.startTime && slot.endTime) {
          const start = new Date(`1970-01-01T${slot.startTime}:00`);
          const end = new Date(`1970-01-01T${slot.endTime}:00`);
          const durationHours = (end - start) / (1000 * 60 * 60);

          if (durationHours > 0) {
            weekData[dayIndex].availableHours += durationHours;
          }
        } else if (slot.duration) {
          // Use duration if provided
          weekData[dayIndex].availableHours += slot.duration;
        }
      }
    } catch (error) {
      console.warn("Error processing availability slot:", slot, error);
    }
  });

  // Process appointments for booked hours
  appointments.forEach((appointment) => {
    try {
      const appointmentDate = new Date(
        appointment.dateTime || appointment.startDate || appointment.date,
      );
      if (appointmentDate >= startOfWeek && appointmentDate <= endOfWeek) {
        const dayIndex =
          appointmentDate.getDay() === 0 ? 6 : appointmentDate.getDay() - 1; // Convert to Monday-first index

        // Calculate duration
        let durationHours = 0;
        if (appointment.duration) {
          durationHours = appointment.duration;
        } else if (appointment.startTime && appointment.endTime) {
          const start = new Date(`1970-01-01T${appointment.startTime}:00`);
          const end = new Date(`1970-01-01T${appointment.endTime}:00`);
          durationHours = (end - start) / (1000 * 60 * 60);
        } else if (appointment.endDateTime) {
          const start = new Date(appointment.dateTime);
          const end = new Date(appointment.endDateTime);
          durationHours = (end - start) / (1000 * 60 * 60);
        } else {
          // Default to 1 hour if no duration info
          durationHours = 1;
        }

        if (durationHours > 0) {
          weekData[dayIndex].bookedHours += durationHours;
        }
      }
    } catch (error) {
      console.warn("Error processing appointment:", appointment, error);
    }
  });

  return weekData;
};

export const OccupancyBar = ({
  weekData = [],
  appointments = [],
  availabilitySlots = [],
  currentWeek = null,
  loading = false,
  showSummary = true,
  className = "",
}) => {
  const [showLegend, setShowLegend] = useState(false);

  // Process real data from bookings and availability
  let displayData = weekData;

  // If no weekData provided but we have appointments/availability, process them
  if (
    weekData.length === 0 &&
    (appointments.length > 0 || availabilitySlots.length > 0)
  ) {
    displayData = processBookingData(appointments, availabilitySlots);
  }

  // Fallback to mock data only if no real data is available
  if (displayData.length === 0) {
    const mockWeekData = [
      { availableHours: 2, bookedHours: 6 },
      { availableHours: 5, bookedHours: 8 },
      { availableHours: 1, bookedHours: 9 },
      { availableHours: 7, bookedHours: 4 },
      { availableHours: 3, bookedHours: 9 },
      { availableHours: 5, bookedHours: 2 },
      { availableHours: 6, bookedHours: 1 },
    ];
    displayData = mockWeekData;
  }
  const today = new Date().getDay();
  const todayIndex = today === 0 ? 6 : today - 1;

  if (loading) {
    return (
      <div className={`space-y-3 sm:space-y-4 ${className}`}>
        <div className="flex justify-between items-center gap-1 sm:gap-2">
          {DAYS_OF_WEEK.map((day) => (
            <div
              key={day.key}
              className="flex-1 flex flex-col items-center p-2"
            >
              <div className="h-3 w-6 sm:w-8 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-10 sm:h-16 w-full bg-gray-200 rounded animate-pulse mt-1"></div>
              <div className="h-2 w-8 sm:w-12 bg-gray-200 rounded animate-pulse mt-1"></div>
            </div>
          ))}
        </div>
        {showSummary && (
          <div className="h-16 sm:h-24 bg-gray-200 rounded-lg animate-pulse"></div>
        )}
      </div>
    );
  }

  return (
    <div className={`space-y-3 sm:space-y-4 ${className}`}>
      {/* Week occupancy bars */}
      <div className="bg-white border border-gray-200 rounded-lg p-2 sm:p-4 shadow-sm">
        <div className="flex items-center justify-between mb-2 sm:mb-4">
          <h3 className="text-xs sm:text-sm font-medium text-gray-900 flex items-center gap-1 sm:gap-2">
            <Users className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Ocupación semanal</span>
            <span className="sm:hidden">Ocupación</span>
          </h3>
          <div className="text-[10px] sm:text-xs text-gray-500">
            {currentWeek || "Esta semana"}
          </div>
        </div>

        {/* Compact day bars */}
        <div className="flex justify-between items-stretch gap-1 sm:gap-2">
          {DAYS_OF_WEEK.map((day, index) => (
            <DayOccupancyBar
              key={day.key}
              day={day}
              data={displayData[index]}
              isToday={index === todayIndex}
            />
          ))}
        </div>

        {/* Collapsible Legend - Mobile */}
        <div className="mt-2 sm:hidden">
          <button
            onClick={() => setShowLegend(!showLegend)}
            className="flex items-center gap-1 text-[10px] text-gray-500 w-full justify-center py-1"
          >
            <Info className="h-3 w-3" />
            {showLegend ? "Ocultar" : "Ver"} leyenda
            {showLegend ? (
              <ChevronUp className="h-3 w-3" />
            ) : (
              <ChevronDown className="h-3 w-3" />
            )}
          </button>

          {showLegend && (
            <div className="pt-2 border-t border-gray-100">
              <div className="flex flex-wrap justify-center gap-x-3 gap-y-1 text-[10px] text-gray-600">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-gray-300 rounded"></div>
                  <span>0-24%</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-green-400 rounded"></div>
                  <span>25-49%</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-yellow-400 rounded"></div>
                  <span>50-74%</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-orange-400 rounded"></div>
                  <span>75-89%</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-red-400 rounded"></div>
                  <span>90-100%</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Desktop Legend - always visible */}
        <div className="hidden sm:block mt-4 pt-3 border-t border-gray-200">
          <div className="flex flex-wrap items-center justify-center gap-3 text-xs text-gray-600">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 bg-gray-300 rounded"></div>
              <span>Libre (0-24%)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 bg-gradient-to-t from-green-600 to-green-400 rounded"></div>
              <span>Disponible (25-49%)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 bg-gradient-to-t from-yellow-600 to-yellow-400 rounded"></div>
              <span>Moderado (50-74%)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 bg-gradient-to-t from-orange-600 to-orange-400 rounded"></div>
              <span>Ocupado (75-89%)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 bg-gradient-to-t from-red-600 to-red-400 rounded"></div>
              <span>Muy ocupado (90-100%)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Week summary */}
      {showSummary && (
        <WeekSummary weekData={displayData} currentWeek={currentWeek} />
      )}
    </div>
  );
};
