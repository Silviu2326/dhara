import React, { useState, useCallback } from "react";
import {
  Calendar,
  Clock,
  Users,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { checkTimeBlockConflicts } from "../availability.api.js";

// Mock calendar component since react-big-calendar would need installation
const MockCalendarGrid = ({
  view,
  events,
  availabilityMap,
  onSelectSlot,
  onSelectEvent,
  onEventDrop,
  timezone,
}) => {
  console.log("📊📊📊 MockCalendarGrid RECEIVED 📊📊📊");
  console.log("events array:", events);
  console.log("events count:", events.length);
  console.log("view mode:", view);
  console.log("timezone:", timezone);

  if (events && events.length > 0) {
    console.log("🎉 EVENTS RECEIVED BY CALENDAR GRID!");
    events.forEach((event, index) => {
      console.log(`Event ${index + 1}:`, {
        id: event.id,
        title: event.title,
        day: event.day,
        hour: event.hour,
        type: event.type,
        color: event.color,
      });
    });
  } else {
    console.log("❌ NO EVENTS RECEIVED BY CALENDAR GRID!");
  }
  const [draggedEvent, setDraggedEvent] = useState(null);
  const [dragOver, setDragOver] = useState(null);
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionStart, setSelectionStart] = useState(null);
  const [selectionEnd, setSelectionEnd] = useState(null);
  const [selectedSlots, setSelectedSlots] = useState([]);

  const hours = Array.from({ length: 24 }, (_, i) => i);
  const isMobile = typeof window !== "undefined" && window.innerWidth < 640;
  const displayHours = isMobile
    ? Array.from({ length: 12 }, (_, i) => i + 8)
    : hours;

  const days =
    view === "week"
      ? ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"]
      : Array.from({ length: 30 }, (_, i) => i + 1);

  // Mobile abbreviations
  const dayAbbr = ["L", "M", "X", "J", "V", "S", "D"];

  const handleDragStart = (event, eventData) => {
    setDraggedEvent(eventData);
    event.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (event, slot) => {
    event.preventDefault();
    setDragOver(slot);
  };

  const handleDrop = (event, slot) => {
    event.preventDefault();
    if (draggedEvent) {
      onEventDrop?.(draggedEvent, slot);
    }
    setDraggedEvent(null);
    setDragOver(null);
  };

  const handleMouseDown = (slot) => {
    setIsSelecting(true);
    setSelectionStart(slot);
    setSelectionEnd(slot);
    setSelectedSlots([slot]);
  };

  const handleMouseEnter = (slot) => {
    if (isSelecting && selectionStart) {
      setSelectionEnd(slot);
      // Calculate all slots in selection rectangle
      const startDay = Math.min(selectionStart.day, slot.day);
      const endDay = Math.max(selectionStart.day, slot.day);
      const startHour = Math.min(selectionStart.hour, slot.hour);
      const endHour = Math.max(selectionStart.hour, slot.hour);

      const newSelectedSlots = [];
      for (let day = startDay; day <= endDay; day++) {
        for (let hour = startHour; hour <= endHour; hour++) {
          newSelectedSlots.push({ day, hour, slotId: `${day}-${hour}` });
        }
      }
      setSelectedSlots(newSelectedSlots);
    }
  };

  const handleMouseUp = () => {
    if (isSelecting && selectedSlots.length > 0) {
      // Create availability slot from selection
      onSelectSlot?.({
        type: "multi-slot",
        slots: selectedSlots,
        startSlot: selectionStart,
        endSlot: selectionEnd,
      });
    }
    setIsSelecting(false);
    setSelectionStart(null);
    setSelectionEnd(null);
    setSelectedSlots([]);
  };

  const isSlotSelected = (slot) => {
    return selectedSlots.some(
      (s) => s.day === slot.day && s.hour === slot.hour,
    );
  };

  const getEventStyle = (event) => {
    switch (event.type) {
      case "appointment":
        return "bg-deep text-white border-deep";
      case "availability":
        // Use slot color if available
        if (event.color) {
          const colorMap = {
            blue: "bg-blue-100 border-2 border-blue-500 text-blue-700 hover:bg-blue-200 cursor-pointer",
            green:
              "bg-green-100 border-2 border-green-500 text-green-700 hover:bg-green-200 cursor-pointer",
            yellow:
              "bg-yellow-100 border-2 border-yellow-500 text-yellow-700 hover:bg-yellow-200 cursor-pointer",
            red: "bg-red-100 border-2 border-red-500 text-red-700 hover:bg-red-200 cursor-pointer",
            purple:
              "bg-purple-100 border-2 border-purple-500 text-purple-700 hover:bg-purple-200 cursor-pointer",
            orange:
              "bg-orange-100 border-2 border-orange-500 text-orange-700 hover:bg-orange-200 cursor-pointer",
            sage: "bg-emerald-100 border-2 border-emerald-500 text-emerald-700 hover:bg-emerald-200 cursor-pointer",
          };
          return (
            colorMap[event.color] ||
            "bg-emerald-100 border-2 border-emerald-500 text-emerald-700 hover:bg-emerald-200 cursor-pointer"
          );
        }
        return "bg-emerald-100 border-2 border-emerald-500 text-emerald-700 hover:bg-emerald-200 cursor-pointer";
      case "absence":
        return "bg-gray-400 text-white border-gray-400";
      default:
        return "bg-blue-500 text-white border-blue-500";
    }
  };

  const renderWeekView = () => (
    <div className="overflow-x-auto">
      <div className="min-w-[600px] sm:min-w-0 grid grid-cols-8 gap-px sm:gap-1">
        {/* Header */}
        <div className="sticky left-0 z-20 bg-white border-b border-r border-gray-200 p-1 sm:p-2 text-[10px] sm:text-xs font-medium text-gray-500">
          <span className="hidden sm:inline">Hora</span>
          <span className="sm:hidden">Hr</span>
        </div>
        {days.map((day, idx) => (
          <div
            key={day}
            className="sticky top-0 z-10 bg-white border-b border-gray-200 p-1 sm:p-2 text-[10px] sm:text-xs font-medium text-center text-gray-700"
          >
            {dayAbbr[idx]}
          </div>
        ))}

        {/* Time slots */}
        {displayHours.map((hour) => (
          <React.Fragment key={hour}>
            <div className="sticky left-0 z-10 bg-gray-50 border-r border-gray-200 p-1 sm:p-2 text-[10px] sm:text-xs text-gray-500 text-right sm:text-center">
              {hour.toString().padStart(2, "0")}:00
            </div>
            {days.map((day, dayIndex) => {
              const slotId = `${dayIndex}-${hour}`;

              // Get availability info for this cell (for background)
              const availabilityKey = `${dayIndex}-${hour}`;
              const availabilitySlots =
                availabilityMap.get(availabilityKey) || [];
              const hasAvailability = availabilitySlots.length > 0;

              // Get appointments for this cell (for events on top)
              const slotEvents = events.filter(
                (e) => e.day === dayIndex && e.hour === hour,
              );

              const currentSlot = { day: dayIndex, hour, slotId };
              const isSelected = isSlotSelected(currentSlot);

              // Determine background color based on availability
              let backgroundClass = "bg-white";
              let borderClass = "border-gray-100 sm:border-gray-200";

              if (hasAvailability) {
                const primarySlot = availabilitySlots[0];
                switch (primarySlot.color) {
                  case "yellow":
                    backgroundClass = "bg-yellow-50";
                    borderClass = "border-yellow-200";
                    break;
                  case "blue":
                    backgroundClass = "bg-blue-50";
                    borderClass = "border-blue-200";
                    break;
                  case "red":
                    backgroundClass = "bg-red-50";
                    borderClass = "border-red-200";
                    break;
                  case "purple":
                    backgroundClass = "bg-purple-50";
                    borderClass = "border-purple-200";
                    break;
                  case "orange":
                    backgroundClass = "bg-orange-50";
                    borderClass = "border-orange-200";
                    break;
                  default:
                    backgroundClass = "bg-green-50";
                    borderClass = "border-green-200";
                }
              }

              return (
                <div
                  key={slotId}
                  className={`
                    border ${borderClass} p-0.5 sm:p-1 min-h-[28px] sm:min-h-[40px] cursor-pointer select-none relative
                    ${backgroundClass}
                    hover:brightness-95 transition-all duration-150
                    ${dragOver === slotId ? "ring-2 ring-blue-300" : ""}
                    ${isSelected ? "ring-2 ring-sage border-sage" : ""}
                  `}
                  title={
                    hasAvailability
                      ? `Disponible: ${availabilitySlots.map((s) => s.title).join(", ")}`
                      : "No disponible"
                  }
                  onClick={() =>
                    !isSelecting &&
                    onSelectSlot?.({ day: dayIndex, hour, slotId })
                  }
                  onMouseDown={() => handleMouseDown(currentSlot)}
                  onMouseEnter={() => handleMouseEnter(currentSlot)}
                  onMouseUp={handleMouseUp}
                  onDragOver={(e) => handleDragOver(e, slotId)}
                  onDrop={(e) => handleDrop(e, { day: dayIndex, hour, slotId })}
                >
                  {/* Events - compact on mobile */}
                  {slotEvents.slice(0, isMobile ? 1 : 3).map((event, index) => (
                    <div
                      key={index}
                      draggable={event.type !== "availability"}
                      onDragStart={(e) => handleDragStart(e, event)}
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectEvent?.(event);
                      }}
                      className={`
                        text-[8px] sm:text-xs p-0.5 sm:p-1 rounded mb-0.5 border relative z-10 group
                        ${getEventStyle(event)}
                        ${event.type === "availability" ? "cursor-pointer" : "cursor-move"}
                      `}
                    >
                      <span className="truncate block font-medium">
                        {event.title}
                      </span>
                    </div>
                  ))}
                  {slotEvents.length > (isMobile ? 1 : 3) && (
                    <div className="text-[8px] text-gray-500">
                      +{slotEvents.length - (isMobile ? 1 : 3)}
                    </div>
                  )}
                </div>
              );
            })}
          </React.Fragment>
        ))}
      </div>
    </div>
  );

  const renderMonthView = () => (
    <div className="overflow-x-auto">
      <div className="min-w-[400px] sm:min-w-0 grid grid-cols-7 gap-px sm:gap-1">
        {/* Days of week header - compact on mobile */}
        {["L", "M", "X", "J", "V", "S", "D"].map((day) => (
          <div
            key={day}
            className="p-1 sm:p-2 text-[10px] sm:text-sm font-medium text-gray-500 border-b bg-gray-50 text-center"
          >
            <span className="hidden sm:inline">
              {day === "L"
                ? "Lunes"
                : day === "M"
                  ? "Martes"
                  : day === "X"
                    ? "Miércoles"
                    : day === "J"
                      ? "Jueves"
                      : day === "V"
                        ? "Viernes"
                        : day === "S"
                          ? "Sábado"
                          : "Domingo"}
            </span>
            <span className="sm:hidden">{day}</span>
          </div>
        ))}

        {/* Calendar days - compact cells on mobile */}
        {Array.from({ length: 35 }, (_, i) => {
          const dayEvents = events.filter((e) => e.day === i % 7);
          const hasAvailability = dayEvents.some(
            (e) => e.type === "availability",
          );
          const hasAppointments = dayEvents.some(
            (e) => e.type === "appointment",
          );
          const hasAbsences = dayEvents.some((e) => e.type === "absence");

          return (
            <div
              key={i}
              className={`
                border border-gray-100 sm:border-gray-200 p-1 sm:p-2 min-h-[50px] sm:min-h-[80px] cursor-pointer
                hover:bg-gray-50 transition-colors duration-150 bg-white
                ${hasAbsences ? "bg-gray-100" : ""}
              `}
              onClick={() => onSelectSlot?.({ day: i % 7, date: i })}
            >
              <div className="text-xs sm:text-sm text-gray-700 mb-1 font-medium">
                {(i % 30) + 1}
              </div>
              <div className="flex flex-wrap gap-0.5 sm:space-y-1">
                {hasAvailability && (
                  <div className="w-2 h-2 sm:w-full sm:h-1 bg-emerald-400 rounded-sm sm:rounded"></div>
                )}
                {hasAppointments && (
                  <div className="w-2 h-2 sm:w-full sm:h-1 bg-blue-600 rounded-sm sm:rounded"></div>
                )}
                {hasAbsences && (
                  <div className="w-2 h-2 sm:w-full sm:h-1 bg-gray-400 rounded-sm sm:rounded"></div>
                )}
              </div>
              {dayEvents.length > 0 && (
                <div className="text-[8px] sm:text-xs text-gray-500 mt-0.5 sm:mt-1">
                  {dayEvents.length}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );

  // Add global mouse up event listener
  React.useEffect(() => {
    const handleGlobalMouseUp = () => {
      if (isSelecting) {
        handleMouseUp();
      }
    };

    document.addEventListener("mouseup", handleGlobalMouseUp);
    return () => document.removeEventListener("mouseup", handleGlobalMouseUp);
  }, [isSelecting]);

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      {view === "week" ? renderWeekView() : renderMonthView()}

      {/* Selection instructions */}
      {isSelecting && (
        <div className="absolute top-2 left-2 bg-sage text-white px-3 py-1 rounded-md text-sm font-medium shadow-lg z-10">
          Arrastra para seleccionar múltiples bloques
        </div>
      )}
    </div>
  );
};

// Helper function to transform backend slots into calendar events
const transformSlotsToEvents = (
  slots = [],
  appointments = [],
  currentWeek = null,
) => {
  const events = [];

  console.log("🔄 Transforming slots to events:", {
    slotsCount: slots.length,
    appointmentsCount: appointments.length,
    firstSlot: slots[0],
    currentWeek,
  });

  // Debug: Check what day is September 22, 2025
  const testDate = new Date("2025-09-22T00:00:00.000Z");
  console.log(
    `🗓️ September 22, 2025 is: Day ${testDate.getDay()} (${["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][testDate.getDay()]})`,
  );
  console.log(
    `🗓️ This converts to calendar day index: ${testDate.getDay() === 0 ? 6 : testDate.getDay() - 1} (0=Monday, 6=Sunday)`,
  );

  // Also check the current week to see if there's a week mismatch
  const now = new Date();
  const currentWeekStart = new Date(now);
  currentWeekStart.setDate(now.getDate() - now.getDay() + 1);
  console.log(`📅 Current week starts: ${currentWeekStart.toISOString()}`);
  console.log(
    `📅 September 22, 2025 week difference: ${Math.floor((testDate - currentWeekStart) / (7 * 24 * 60 * 60 * 1000))} weeks`,
  );

  // Transform availability slots
  slots.forEach((slot) => {
    try {
      // Handle various date formats
      let slotDate;
      if (slot.startDate) {
        slotDate = new Date(slot.startDate);
      } else if (slot.date) {
        slotDate = new Date(slot.date);
      } else {
        console.warn("No valid date found in slot:", slot);
        return;
      }

      console.log(`🔍 Processing slot: ${slot.title || "Unnamed slot"}`);
      console.log(
        `📅 Slot date: ${slot.startDate || slot.date} -> ${slotDate}`,
      );
      console.log(
        `📅 Day of week: ${slotDate.getDay()} (0=Sunday, 1=Monday...)`,
      );

      const dayOfWeek = slotDate.getDay();
      const dayIndex = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Convert to Monday-first index

      console.log(
        `📅 Converted to calendar day index: ${dayIndex} (0=Monday, 6=Sunday)`,
      );

      // Parse start and end times - handle various formats
      let startHour, startMin, endHour, endMin;
      if (slot.startTime && slot.endTime) {
        [startHour, startMin] = slot.startTime.split(":").map(Number);
        [endHour, endMin] = slot.endTime.split(":").map(Number);
      } else {
        // Fallback for slots without time - default to morning hours
        startHour = 9;
        startMin = 0;
        endHour = 10;
        endMin = 0;
        console.log("🚨 No time info found, using default 9:00-10:00");
      }

      // Calculate duration in hours (including minutes)
      const totalStartMinutes = startHour * 60 + startMin;
      const totalEndMinutes = endHour * 60 + endMin;
      const durationHours = Math.ceil(
        (totalEndMinutes - totalStartMinutes) / 60,
      );

      // Create events for each hour of the slot (simplified for display)
      const newEvent = {
        id: slot.id || slot._id,
        type: "availability",
        title: slot.title,
        subtitle: `${slot.location}`,
        day: dayIndex,
        hour: startHour,
        startTime: slot.startTime,
        endTime: slot.endTime,
        location: slot.location,
        color: slot.color || "sage",
        duration: durationHours,
        durationMinutes: slot.durationMinutes,
        data: slot,
      };

      events.push(newEvent);

      console.log(`✅ Added slot event:`, newEvent);
      console.log(`🎯🎯🎯 SLOT EVENT DETAILS 🎯🎯🎯`);
      console.log(`Title: ${newEvent.title}`);
      console.log(`Day: ${newEvent.day} (should be 0-6, Monday=0)`);
      console.log(`Hour: ${newEvent.hour} (should be 0-23)`);
      console.log(`Color: ${newEvent.color}`);
      console.log(`Original slot date: ${slot.startDate}`);
      console.log(`Calculated slotDate: ${slotDate}`);
      console.log(`Original day of week: ${dayOfWeek} (0=Sunday)`);
      console.log(`Converted day index: ${dayIndex} (0=Monday)`);

      // CRITICAL: Force create a simple test event that should definitely show
      if (events.length === 1) {
        // Only for first slot to avoid duplicates
        const forceTestEvent = {
          id: "FORCE-TEST-EVENT",
          type: "availability",
          title: "🚨 FORCE TEST EVENT 🚨",
          subtitle: "This should ALWAYS show",
          day: 0, // Monday
          hour: 9, // 9 AM
          color: "red",
          startTime: "09:00",
          endTime: "10:00",
        };
        events.push(forceTestEvent);
        console.log(`🚨 ADDED FORCE TEST EVENT:`, forceTestEvent);
      }
    } catch (error) {
      console.warn("❌ Error transforming slot to event:", slot, error);
    }
  });

  // Transform appointments
  appointments.forEach((appointment) => {
    try {
      const appointmentDate = new Date(
        appointment.date || appointment.dateTime,
      );
      const dayOfWeek = appointmentDate.getDay();
      const dayIndex = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

      if (appointment.startTime) {
        const startHour = parseInt(appointment.startTime.split(":")[0]);

        events.push({
          id: appointment.id || appointment._id,
          type: "appointment",
          title: `Cita - ${appointment.clientName || "Cliente"}`,
          subtitle: appointment.therapyType || "Terapia",
          day: dayIndex,
          hour: startHour,
          startTime: appointment.startTime,
          endTime: appointment.endTime,
          status: appointment.status,
          data: appointment,
        });

        console.log(
          `🩺 Added appointment: ${appointment.clientName || "Cliente"} on day ${dayIndex} at ${startHour}:00`,
        );
      }
    } catch (error) {
      console.warn(
        "Error transforming appointment to event:",
        appointment,
        error,
      );
    }
  });

  console.log("✅ Total transformed events:", events.length);
  return events;
};

export const AvailabilityCalendar = ({
  view = "week",
  onViewChange,
  events = [],
  availabilitySlots = [],
  appointments = [],
  selectedDate = new Date(),
  onDateChange,
  onSelectSlot,
  onSelectEvent,
  onEventDrop,
  timezone = "Europe/Madrid",
  loading = false,
  className = "",
  therapistId = "current_therapistId",
}) => {
  console.log("🚀🚀🚀 AvailabilityCalendar RENDERED 🚀🚀🚀");
  console.log("===================================================");
  console.log("📋 ALL PROPS RECEIVED:");
  console.log("view:", view);
  console.log("loading:", loading);
  console.log("therapistId:", therapistId);
  console.log("timezone:", timezone);
  console.log("className:", className);
  console.log("onSelectSlot:", typeof onSelectSlot);
  console.log("onSelectEvent:", typeof onSelectEvent);
  console.log("onEventDrop:", typeof onEventDrop);

  console.log("📊 EVENTS PROP:");
  console.log("events:", events);
  console.log("events length:", events?.length || 0);
  console.log("events type:", typeof events);
  console.log("events is array:", Array.isArray(events));
  if (events && events.length > 0) {
    console.log("First event:", events[0]);
  }

  console.log("🎯🎯🎯 AVAILABILITY SLOTS (MOST IMPORTANT) 🎯🎯🎯");
  console.log("availabilitySlots:", availabilitySlots);
  console.log("availabilitySlots length:", availabilitySlots?.length || 0);
  console.log("availabilitySlots type:", typeof availabilitySlots);
  console.log("availabilitySlots is array:", Array.isArray(availabilitySlots));
  console.log(
    "availabilitySlots empty?",
    !availabilitySlots || availabilitySlots.length === 0,
  );

  if (availabilitySlots && availabilitySlots.length > 0) {
    console.log("🔍 DETAILED SLOT ANALYSIS:");
    availabilitySlots.forEach((slot, index) => {
      console.log(`Slot ${index + 1}:`, {
        id: slot.id || slot._id,
        title: slot.title,
        startDate: slot.startDate,
        startTime: slot.startTime,
        endTime: slot.endTime,
        location: slot.location,
        color: slot.color,
      });
    });
  } else {
    console.log("❌ NO AVAILABILITY SLOTS RECEIVED!");
  }

  console.log("👥 APPOINTMENTS PROP:");
  console.log("appointments:", appointments);
  console.log("appointments length:", appointments?.length || 0);
  console.log("appointments type:", typeof appointments);
  console.log("appointments is array:", Array.isArray(appointments));

  console.log("===================================================");

  const [selectedSlot, setSelectedSlot] = useState(null);
  const [conflicts, setConflicts] = useState([]);
  const [checkingConflicts, setCheckingConflicts] = useState(false);

  // Navigation functions
  const navigateDate = (direction) => {
    const newDate = new Date(selectedDate);

    if (view === "week") {
      newDate.setDate(newDate.getDate() + (direction === "next" ? 7 : -7));
    } else if (view === "month") {
      newDate.setMonth(newDate.getMonth() + (direction === "next" ? 1 : -1));
    }

    onDateChange?.(newDate);
  };

  const getDateRangeText = () => {
    const date = new Date(selectedDate);

    if (view === "week") {
      const startOfWeek = new Date(date);
      const dayOfWeek = startOfWeek.getDay();
      const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // Monday as first day
      startOfWeek.setDate(startOfWeek.getDate() + diff);

      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(endOfWeek.getDate() + 6);

      return `Semana del ${startOfWeek.getDate()} al ${endOfWeek.getDate()} de ${startOfWeek.toLocaleDateString("es-ES", { month: "long", year: "numeric" })}`;
    } else {
      return date.toLocaleDateString("es-ES", {
        month: "long",
        year: "numeric",
      });
    }
  };

  // Separate availability slots from appointments for different rendering
  const { availabilityMap, allEvents } = React.useMemo(() => {
    console.log("🔥🔥🔥 PROCESSING CALENDAR DATA 🔥🔥🔥");
    console.log("📥 Props events received:", events);
    console.log("📥 availabilitySlots for processing:", availabilitySlots);
    console.log("📥 appointments for processing:", appointments);

    // Create availability map (for cell backgrounds)
    const availabilityMap = new Map();

    // Process availability slots for background
    availabilitySlots.forEach((slot) => {
      try {
        const slotDate = new Date(slot.startDate);
        const dayOfWeek = slotDate.getDay();
        const dayIndex = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Convert to Monday-first

        if (slot.startTime && slot.endTime) {
          const [startHour, startMin] = slot.startTime.split(":").map(Number);
          const [endHour, endMin] = slot.endTime.split(":").map(Number);

          console.log(
            `🟡 Processing slot "${slot.title}" from ${slot.startTime} to ${slot.endTime} (color: ${slot.color})`,
          );

          // Mark all hours in this slot as available
          // For partial hours (like 08:00-08:45), still mark the hour as available
          const hoursToMark = [];

          if (startMin === 0 && endMin === 0) {
            // Full hours only
            for (let hour = startHour; hour < endHour; hour++) {
              hoursToMark.push(hour);
            }
          } else {
            // Include partial hours
            for (let hour = startHour; hour <= endHour; hour++) {
              hoursToMark.push(hour);
            }
            // Remove the end hour if it's exactly at the minute boundary
            if (
              endMin === 0 &&
              hoursToMark[hoursToMark.length - 1] === endHour
            ) {
              hoursToMark.pop();
            }
          }

          hoursToMark.forEach((hour) => {
            const key = `${dayIndex}-${hour}`;
            if (!availabilityMap.has(key)) {
              availabilityMap.set(key, []);
            }
            availabilityMap.get(key).push({
              id: slot.id,
              title: slot.title,
              location: slot.location,
              color: slot.color || "green",
              startTime: slot.startTime,
              endTime: slot.endTime,
            });

            console.log(
              `📍 Marked hour ${hour}:00 as available for slot "${slot.title}" (key: ${key}, color: ${slot.color})`,
            );
          });
        }

        console.log(
          `✅ Added availability slot "${slot.title}" to background map`,
        );
      } catch (error) {
        console.warn("❌ Error processing availability slot:", slot, error);
      }
    });

    // Process availability slots as events (to show on calendar)
    const slotEvents = [];

    availabilitySlots.forEach((slot) => {
      try {
        const slotDate = new Date(slot.startDate);
        const dayOfWeek = slotDate.getDay();
        const dayIndex = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

        if (slot.startTime) {
          const startHour = parseInt(slot.startTime.split(":")[0]);

          slotEvents.push({
            id: slot.id || slot._id,
            type: "availability",
            title: slot.title || "Disponible",
            subtitle: slot.location || "",
            day: dayIndex,
            hour: startHour,
            startTime: slot.startTime,
            endTime: slot.endTime,
            color: slot.color || "sage",
            data: slot,
          });

          console.log(
            `✅ Added availability slot "${slot.title}" as event on day ${dayIndex} at ${startHour}:00`,
          );
        }
      } catch (error) {
        console.warn(
          "❌ Error processing availability slot as event:",
          slot,
          error,
        );
      }
    });

    // Process appointments as events (to show on top)
    const appointmentEvents = [];

    appointments.forEach((appointment) => {
      try {
        const appointmentDate = new Date(
          appointment.date || appointment.dateTime,
        );
        const dayOfWeek = appointmentDate.getDay();
        const dayIndex = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

        if (appointment.startTime) {
          const startHour = parseInt(appointment.startTime.split(":")[0]);

          appointmentEvents.push({
            id: appointment.id || appointment._id,
            type: "appointment",
            title: `${appointment.clientName || "Cliente"}`,
            subtitle: appointment.therapyType || "Cita",
            day: dayIndex,
            hour: startHour,
            startTime: appointment.startTime,
            endTime: appointment.endTime,
            status: appointment.status,
            data: appointment,
          });

          console.log(
            `✅ Added appointment "${appointment.clientName}" as event`,
          );
        }
      } catch (error) {
        console.warn("❌ Error processing appointment:", appointment, error);
      }
    });

    // Add test appointment for visibility
    appointmentEvents.push({
      id: "test-appointment",
      type: "appointment",
      title: "Cita Test",
      subtitle: "Paciente Ejemplo",
      day: 0, // Monday
      hour: 10, // 10 AM
      color: "blue",
    });

    // Combine slot events and appointment events
    // Appointments should be rendered after slots so they appear on top
    const allEvents = [...slotEvents, ...appointmentEvents];

    console.log("🎯 PROCESSING COMPLETE:");
    console.log(
      `📍 Availability slots in map: ${availabilityMap.size} time slots`,
    );
    console.log(`🟢 Slot events: ${slotEvents.length} events`);
    console.log(`👥 Appointment events: ${appointmentEvents.length} events`);
    console.log(`📊 Total events: ${allEvents.length} events`);

    return { availabilityMap, allEvents };
  }, [events, availabilitySlots, appointments]);

  const handleSelectSlot = useCallback(
    (slot) => {
      setSelectedSlot(slot);
      onSelectSlot?.(slot);
    },
    [onSelectSlot],
  );

  const handleSelectEvent = useCallback(
    (event) => {
      onSelectEvent?.(event);
    },
    [onSelectEvent],
  );

  const handleEventDrop = useCallback(
    async (event, newSlot) => {
      setCheckingConflicts(true);
      try {
        // Calculate new time based on slot
        const newStartTime = `${newSlot.hour.toString().padStart(2, "0")}:00`;
        const eventDuration = calculateEventDuration(
          event.startTime,
          event.endTime,
        );
        const newEndTime = calculateEndTime(newStartTime, eventDuration);

        // Check for conflicts using real API
        const conflictCheck = await checkTimeBlockConflicts(
          therapistId,
          newStartTime,
          newEndTime,
          event.location,
          event.id,
        );

        if (conflictCheck.hasConflicts) {
          setConflicts([
            ...conflicts,
            {
              event,
              conflicts: conflictCheck.conflicts,
              newSlot,
            },
          ]);
          return;
        }

        // No conflicts, proceed with drop
        onEventDrop?.(event, {
          ...newSlot,
          newStartTime,
          newEndTime,
        });
      } catch (error) {
        console.error("Error checking conflicts:", error);
        // Fallback to simple conflict check
        const conflictingEvents = appointmentEvents.filter(
          (e) =>
            e.id !== event.id &&
            e.day === newSlot.day &&
            e.hour === newSlot.hour &&
            e.type === "appointment",
        );

        if (conflictingEvents.length > 0) {
          setConflicts([
            ...conflicts,
            { event, conflicts: conflictingEvents, newSlot },
          ]);
          return;
        }

        onEventDrop?.(event, newSlot);
      } finally {
        setCheckingConflicts(false);
      }
    },
    [allEvents, conflicts, onEventDrop, therapistId],
  );

  // Helper function to calculate event duration in minutes
  const calculateEventDuration = (startTime, endTime) => {
    const start = new Date(`1970-01-01T${startTime}:00`);
    const end = new Date(`1970-01-01T${endTime}:00`);
    return (end - start) / (1000 * 60);
  };

  // Helper function to calculate end time
  const calculateEndTime = (startTime, durationMinutes) => {
    const start = new Date(`1970-01-01T${startTime}:00`);
    const end = new Date(start.getTime() + durationMinutes * 60 * 1000);
    return end.toTimeString().slice(0, 5);
  };

  if (loading) {
    return (
      <div
        className={`bg-white border border-gray-200 rounded-lg p-8 ${className}`}
      >
        <div className="flex items-center justify-center space-x-2">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-sage"></div>
          <span className="text-gray-600">Cargando calendario...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Calendar Navigation Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          {/* Navigation Controls */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => navigateDate("prev")}
              className="p-2 hover:bg-gray-100 rounded-md transition-colors"
              title={`${view === "week" ? "Semana" : "Mes"} anterior`}
            >
              <ChevronLeft className="h-4 w-4 text-gray-600" />
            </button>

            <div className="px-3 py-1 bg-gray-50 rounded-md min-w-[200px] text-center">
              <span className="text-sm font-medium text-gray-900">
                {getDateRangeText()}
              </span>
            </div>

            <button
              onClick={() => navigateDate("next")}
              className="p-2 hover:bg-gray-100 rounded-md transition-colors"
              title={`${view === "week" ? "Semana" : "Mes"} siguiente`}
            >
              <ChevronRight className="h-4 w-4 text-gray-600" />
            </button>
          </div>

          {/* View Selector */}
          <div className="flex items-center space-x-1 bg-gray-100 rounded-md p-1">
            <button
              onClick={() => onViewChange?.("week")}
              className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                view === "week"
                  ? "bg-white text-blue-700 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Semana
            </button>
            <button
              onClick={() => onViewChange?.("month")}
              className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                view === "month"
                  ? "bg-white text-blue-700 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Mes
            </button>
          </div>

          {/* Quick Date Actions */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => onDateChange?.(new Date())}
              className="px-3 py-1 text-xs bg-blue-50 text-blue-700 rounded-md hover:bg-blue-100 transition-colors"
            >
              Hoy
            </button>
          </div>
        </div>

        {/* Calendar Legend */}
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-blue-600 text-white rounded border text-center leading-3 font-bold text-[8px]">
              C
            </div>
            <span className="text-gray-600">Citas</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-emerald-100 border-2 border-emerald-500 rounded relative">
              <div className="absolute top-0 right-0 w-1 h-1 bg-emerald-400 rounded-full"></div>
            </div>
            <span className="text-gray-600">
              Disponible (click para editar)
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-white border border-gray-200 rounded"></div>
            <span className="text-gray-600">No disponible</span>
          </div>
        </div>
      </div>

      {/* Checking conflicts indicator */}
      {checkingConflicts && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="flex items-center space-x-2 text-blue-800">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            <span className="text-sm font-medium">
              Verificando conflictos de horario...
            </span>
          </div>
        </div>
      )}

      {/* Conflicts Alert */}
      {conflicts.length > 0 && !checkingConflicts && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-red-800">
              <AlertCircle className="h-4 w-4" />
              <div>
                <span className="text-sm font-medium">
                  Conflicto detectado: No se puede mover el evento porque se
                  solapa con horarios existentes.
                </span>
                <p className="text-xs text-red-600 mt-1">
                  {conflicts[conflicts.length - 1].conflicts?.length || 1}{" "}
                  conflicto(s) encontrado(s)
                </p>
              </div>
            </div>
            <button
              onClick={() => setConflicts([])}
              className="text-red-600 hover:text-red-800 text-sm"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}

      {/* Calendar Grid */}
      <MockCalendarGrid
        view={view}
        events={allEvents}
        availabilityMap={availabilityMap}
        onSelectSlot={handleSelectSlot}
        onSelectEvent={handleSelectEvent}
        onEventDrop={handleEventDrop}
        timezone={timezone}
      />

      {/* Calendar Info */}
      <div className="text-xs text-gray-500 space-y-1">
        <div className="flex items-center space-x-2">
          <Calendar className="h-3 w-3" />
          <span>
            Haz clic en una celda para crear un bloque de disponibilidad
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <Users className="h-3 w-3" />
          <span>
            Mantén presionado y arrastra para seleccionar múltiples bloques
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <Clock className="h-3 w-3" />
          <span>
            Arrastra los bloques existentes para reorganizar tu horario
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <Clock className="h-3 w-3" />
          <span>Zona horaria: {timezone}</span>
        </div>
      </div>
    </div>
  );
};
