import React, { useState, useEffect } from "react";
import { Card } from "../../components/Card";
import { ViewTabs } from "./components/ViewTabs";
import { AvailabilityCalendar } from "./components/AvailabilityCalendar";
import { SidebarActions } from "./components/SidebarActions";
import { SlotModal } from "./components/SlotModal";
import { AbsenceModal } from "./components/AbsenceModal";
import { SyncModal } from "./components/SyncModal";
import { OccupancyBar } from "./components/OccupancyBar";
import { QuickConfigView } from "./components/QuickConfigView";
import { AdvancedCalendar } from "./components/AdvancedCalendar";
import {
  AlertTriangle,
  Loader,
  Settings,
  Calendar,
  Zap,
  Menu,
  X,
} from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { bookingService } from "../../services/api/bookingService";

import {
  getAvailability,
  updateAvailability,
  getBlockedTimes,
  createTimeBlock,
  updateTimeBlock,
  deleteTimeBlock,
  getAvailabilityByDateRange,
  createException,
  syncExternalCalendar,
  getExternalCalendarStatus,
  checkTimeBlockConflicts,
  getWorkLocations,
  exportAvailabilityCalendar,
  getAvailabilitySlots,
  createAvailabilitySlot,
  updateAvailabilitySlot,
  deleteAvailabilitySlot,
  getOccupancyAnalysis,
  getCalendarEvents,
} from "./availability.api.js";

export const Availability = () => {
  // Authentication
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const therapistId = user?.id || user?._id || user?.userId;

  // State management
  const [currentView, setCurrentView] = useState("week");
  const [selectedTimezone, setSelectedTimezone] = useState("Europe/Madrid");
  const [availabilitySlots, setAvailabilitySlots] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [absences, setAbsences] = useState([]);
  const [weekOccupancy, setWeekOccupancy] = useState([]);
  const [locations, setLocations] = useState([]);

  // UI State
  const [activeTab, setActiveTab] = useState("calendar"); // 'calendar', 'quick-config'
  const [useAdvancedCalendar, setUseAdvancedCalendar] = useState(false); // Changed to false to use the fixed AvailabilityCalendar

  // Modal states
  const [isSlotModalOpen, setIsSlotModalOpen] = useState(false);
  const [isAbsenceModalOpen, setIsAbsenceModalOpen] = useState(false);
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [editingSlot, setEditingSlot] = useState(null);
  const [editingAbsence, setEditingAbsence] = useState(null);
  const [selectedSlots, setSelectedSlots] = useState([]);

  // Loading and error states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [syncStatus, setSyncStatus] = useState("disconnected");

  // Calendar state
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [calendarEvents, setCalendarEvents] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Load initial data only when authenticated and therapistId is available
  useEffect(() => {
    if (!authLoading && isAuthenticated && therapistId) {
      loadAvailabilityData();
      loadWorkLocations();
      loadExternalCalendarStatus();
    }
  }, [authLoading, isAuthenticated, therapistId]);

  // Load availability data for current week
  const loadAvailabilityData = async () => {
    setLoading(true);
    try {
      // Use current date for real-time data
      const now = new Date();
      const startDate = new Date(now);
      startDate.setDate(now.getDate() - now.getDay() + 1); // Monday of current week
      const endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 6); // Sunday of current week

      // Fallback: For testing with September 2025 data if no current data
      // const startDate = new Date('2025-09-22T00:00:00.000Z');
      // startDate.setDate(startDate.getDate() - startDate.getDay() + 1);
      // const endDate = new Date(startDate);
      // endDate.setDate(endDate.getDate() + 6);

      const dateRange = {
        startDate: startDate.toISOString().split("T")[0],
        endDate: endDate.toISOString().split("T")[0],
      };

      console.log(
        "🔄 Loading availability data for therapist:",
        therapistId,
        "Date range:",
        dateRange,
      );
      console.log("📅 Current date calculations:");
      console.log("📅 Start of week (startDate):", startDate);
      console.log("📅 End of week (endDate):", endDate);
      console.log("📅 Today:", new Date());

      // Extend range to cover 3 months for better UX
      const extendedStart = new Date(now);
      extendedStart.setMonth(now.getMonth() - 1);
      const extendedEnd = new Date(now);
      extendedEnd.setMonth(now.getMonth() + 3);

      const [slotsResponse, occupancyResponse, bookingData, calendarEvents] =
        await Promise.all([
          // Get real availability slots from backend for current date range
          getAvailabilitySlots(therapistId, {
            startDate: extendedStart.toISOString().split("T")[0],
            endDate: extendedEnd.toISOString().split("T")[0],
            isActive: "true",
          }).catch((err) => {
            console.warn("Could not load availability slots:", err);
            return { slots: [], success: false };
          }),

          // Get occupancy analysis
          getOccupancyAnalysis(therapistId, dateRange).catch((err) => {
            console.warn("Could not load occupancy analysis:", err);
            return { data: {}, success: false };
          }),

          // Get booking appointments with current date range
          bookingService
            .getAppointments({
              therapistId: therapistId,
              dateFrom: extendedStart.toISOString().split("T")[0],
              dateTo: extendedEnd.toISOString().split("T")[0],
              status: "all",
            })
            .catch((err) => {
              console.warn("Could not load booking data:", err);
              return { appointments: [] };
            }),

          // Get calendar events with current date range
          getCalendarEvents(therapistId, {
            startDate: extendedStart.toISOString().split("T")[0],
            endDate: extendedEnd.toISOString().split("T")[0],
            view: "week",
          }).catch((err) => {
            console.warn("Could not load calendar events:", err);
            return { events: [], success: false };
          }),
        ]);

      console.log("📊 Loaded data:", {
        slots: slotsResponse.slots?.length || slotsResponse?.length || 0,
        appointments: bookingData.appointments?.length || 0,
        events: calendarEvents.events?.length || 0,
        occupancy: occupancyResponse.data,
      });

      // Try to find where the slots actually are
      let actualSlots = [];

      // getAvailabilitySlots returns { slots: [...], success: true }
      if (
        slotsResponse &&
        slotsResponse.slots &&
        Array.isArray(slotsResponse.slots)
      ) {
        actualSlots = slotsResponse.slots;
        console.log(
          "📍 Found slots at slotsResponse.slots:",
          actualSlots.length,
        );
      } else if (Array.isArray(slotsResponse)) {
        actualSlots = slotsResponse;
        console.log("📍 Found slots at root level (direct array from API)");
      } else if (
        slotsResponse &&
        slotsResponse.slots &&
        Array.isArray(slotsResponse.slots)
      ) {
        actualSlots = slotsResponse.slots;
        console.log("📍 Found slots at slotsResponse.slots");
      } else if (
        slotsResponse &&
        slotsResponse.data &&
        Array.isArray(slotsResponse.data)
      ) {
        actualSlots = slotsResponse.data;
        console.log("📍 Found slots at slotsResponse.data");
      } else if (
        slotsResponse &&
        slotsResponse.response &&
        Array.isArray(slotsResponse.response)
      ) {
        actualSlots = slotsResponse.response;
        console.log("📍 Found slots at slotsResponse.response");
      } else {
        // EMERGENCY FIX: Check if it's nested in any other common patterns
        console.log("❌ Could not find slots anywhere!");
        console.log("Available properties:", Object.keys(slotsResponse || {}));
        console.log("slotsResponse type:", typeof slotsResponse);
        console.log("Full slotsResponse:", slotsResponse);

        // Try to extract from any nested structure
        if (slotsResponse && typeof slotsResponse === "object") {
          const possibleArrayKeys = Object.keys(slotsResponse).filter((key) =>
            Array.isArray(slotsResponse[key]),
          );
          console.log("Found array properties:", possibleArrayKeys);

          if (possibleArrayKeys.length > 0) {
            actualSlots = slotsResponse[possibleArrayKeys[0]];
            console.log(
              `🔧 Emergency fix: Using ${possibleArrayKeys[0]} array`,
            );
          }
        }
      }

      console.log("📥 Setting availabilitySlots state to:", actualSlots);
      console.log("📥 Slots count:", actualSlots.length);
      setAvailabilitySlots(actualSlots);

      // Set appointments from booking service
      setAppointments(bookingData.appointments || []);

      // Set absences/exceptions from calendar events
      const absenceEvents =
        calendarEvents.events?.filter((event) => event.type === "absence") ||
        [];
      setAbsences(absenceEvents);

      // Generate week occupancy data using API response or generate from actual data
      console.log("🔍 Processing occupancy data:", occupancyResponse);
      console.log("🔍 Occupancy response data:", occupancyResponse.data);
      console.log(
        "🔍 Occupancy response keys:",
        Object.keys(occupancyResponse || {}),
      );
      console.log(
        "🔍 Occupancy data keys:",
        Object.keys(occupancyResponse?.data || {}),
      );
      console.log(
        "🔍 Occupancy has totalAvailableHours?",
        !!occupancyResponse?.totalAvailableHours,
      );
      console.log(
        "🔍 Occupancy.data has totalAvailableHours?",
        !!occupancyResponse?.data?.totalAvailableHours,
      );

      // Check if we have API occupancy data in different possible structures
      let apiOccupancyData = null;

      if (
        occupancyResponse &&
        occupancyResponse.totalAvailableHours !== undefined
      ) {
        // Direct structure
        apiOccupancyData = occupancyResponse;
        console.log("📍 Found API occupancy data in direct structure");
      } else if (
        occupancyResponse.data &&
        occupancyResponse.data.totalAvailableHours !== undefined
      ) {
        // Nested structure
        apiOccupancyData = occupancyResponse.data;
        console.log("📍 Found API occupancy data in nested structure");
      }

      console.log("🔍 Final apiOccupancyData:", apiOccupancyData);

      if (apiOccupancyData) {
        // Use API occupancy data
        console.log("✅ Using API occupancy data:", apiOccupancyData);
        setWeekOccupancy([
          {
            totalAvailableHours: apiOccupancyData.totalAvailableHours,
            totalBookedHours: apiOccupancyData.totalBookedHours,
            occupancyRate: apiOccupancyData.occupancyRate,
            totalSlots: apiOccupancyData.totalSlots,
            period: apiOccupancyData.period,
          },
        ]);
      } else {
        // Generate occupancy from actual slots and appointments data
        console.log("✅ Generating occupancy from actual data");
        console.log("Available slots for generation:", actualSlots.length);
        console.log(
          "Available appointments for generation:",
          bookingData.appointments?.length || 0,
        );

        const generatedOccupancy = generateWeekOccupancyFromData(
          actualSlots || [],
          bookingData.appointments || [],
        );
        console.log("🔧 Generated occupancy data:", generatedOccupancy);
        setWeekOccupancy(generatedOccupancy);
      }

      setError(null);
    } catch (err) {
      console.error("❌ Error loading availability data:", err);
      setError("Error al cargar los datos de disponibilidad");
    } finally {
      setLoading(false);
    }
  };

  // Helper function to generate week occupancy from slots and appointments
  const generateWeekOccupancyFromData = (slots, appointments) => {
    // Defensive: ensure both parameters are arrays
    const safeSlots = Array.isArray(slots) ? slots : [];
    const safeAppointments = Array.isArray(appointments) ? appointments : [];

    const weekDays = Array(7)
      .fill(null)
      .map(() => ({
        availableHours: 0,
        bookedHours: 0,
      }));

    // Process availability slots
    safeSlots.forEach((slot) => {
      try {
        const slotDate = new Date(slot.startDate);
        const dayIndex = slotDate.getDay() === 0 ? 6 : slotDate.getDay() - 1; // Convert to Monday-first index

        if (slot.startTime && slot.endTime) {
          const durationHours = slot.durationMinutes
            ? slot.durationMinutes / 60
            : calculateHoursDifference(slot.startTime, slot.endTime);

          if (durationHours > 0) {
            weekDays[dayIndex].availableHours += durationHours;
          }
        }
      } catch (error) {
        console.warn("Error processing availability slot:", slot, error);
      }
    });

    // Process appointments
    safeAppointments.forEach((appointment) => {
      try {
        const appointmentDate = new Date(
          appointment.date || appointment.dateTime,
        );
        const dayIndex =
          appointmentDate.getDay() === 0 ? 6 : appointmentDate.getDay() - 1;

        const durationHours = appointment.therapyDuration
          ? appointment.therapyDuration / 60
          : 1;

        if (durationHours > 0) {
          weekDays[dayIndex].bookedHours += durationHours;
        }
      } catch (error) {
        console.warn("Error processing appointment:", appointment, error);
      }
    });

    return weekDays;
  };

  // Helper function to calculate hours difference between two time strings
  const calculateHoursDifference = (startTime, endTime) => {
    try {
      const start = new Date(`1970-01-01T${startTime}:00`);
      const end = new Date(`1970-01-01T${endTime}:00`);
      return (end - start) / (1000 * 60 * 60);
    } catch (error) {
      console.warn("Error calculating hours difference:", {
        startTime,
        endTime,
        error,
      });
      return 0;
    }
  };

  const loadWorkLocations = async () => {
    try {
      const workLocations = await getWorkLocations(therapistId, {
        status: "active",
        includeSchedule: false,
      });
      setLocations(workLocations);
    } catch (err) {
      console.error("Error loading work locations:", err);
    }
  };

  const loadExternalCalendarStatus = async () => {
    try {
      const status = await getExternalCalendarStatus(therapistId);
      setSyncStatus(status?.status || "disconnected");
    } catch (err) {
      console.error("Error loading calendar status:", err);
      setSyncStatus("disconnected"); // Fallback en caso de error
    }
  };

  // Combine all events for calendar display
  useEffect(() => {
    const events = [
      ...availabilitySlots.map((slot) => ({ ...slot, type: "availability" })),
      ...appointments.map((apt) => ({ ...apt, type: "appointment" })),
      ...absences.map((abs) => ({ ...abs, type: "absence" })),
    ];
    setCalendarEvents(events);
  }, [availabilitySlots, appointments, absences]);

  // Update data when date changes
  useEffect(() => {
    loadAvailabilityData();
  }, [selectedDate]);

  // Handlers
  const handleViewChange = (view) => {
    setCurrentView(view);
  };

  const handleTimezoneChange = (timezone) => {
    setSelectedTimezone(timezone);
  };

  const handleCreateSlot = () => {
    setEditingSlot(null);
    setIsSlotModalOpen(true);
  };

  const handleEditSlot = (slot) => {
    setEditingSlot(slot);
    setIsSlotModalOpen(true);
  };

  const handleCreateAbsence = () => {
    setEditingAbsence(null);
    setIsAbsenceModalOpen(true);
  };

  const handleEditAbsence = (absence) => {
    setEditingAbsence(absence);
    setIsAbsenceModalOpen(true);
  };

  const handleSaveSlot = async (slotData) => {
    setLoading(true);
    try {
      let result;

      if (editingSlot && editingSlot.id) {
        // Update existing slot
        result = await updateTimeBlock(editingSlot.id, slotData, {
          validateConflicts: true,
          syncExternal: syncStatus === "connected",
        });
        setAvailabilitySlots((prev) =>
          prev.map((slot) => (slot.id === editingSlot.id ? result : slot)),
        );
      } else {
        // Create new slot
        result = await createTimeBlock(therapistId, slotData, {
          validateConflicts: true,
          syncExternal: syncStatus === "connected",
        });
        setAvailabilitySlots((prev) => [...prev, result]);
      }

      setIsSlotModalOpen(false);
      setEditingSlot(null);
      setError(null);
    } catch (err) {
      console.error("Error saving time block:", err);
      setError(err.message || "Error al guardar el bloque de disponibilidad");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAbsence = async (absenceData) => {
    setLoading(true);
    try {
      let result;

      if (editingAbsence && editingAbsence.id) {
        // Update existing absence
        result = await updateTimeBlock(editingAbsence.id, absenceData, {
          validateConflicts: true,
          syncExternal: syncStatus === "connected",
        });
        setAbsences((prev) =>
          prev.map((absence) =>
            absence.id === editingAbsence.id ? result : absence,
          ),
        );
      } else {
        // Create new absence/exception
        result = await createException(therapistId, absenceData, {
          validateConflicts: true,
          syncExternal: syncStatus === "connected",
        });
        setAbsences((prev) => [...prev, result]);
      }

      setIsAbsenceModalOpen(false);
      setEditingAbsence(null);
      setError(null);
    } catch (err) {
      console.error("Error saving absence:", err);
      setError(err.message || "Error al guardar la ausencia");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenSyncModal = () => {
    setIsSyncModalOpen(true);
  };

  const handleSyncSettings = async (syncData) => {
    setLoading(true);
    try {
      const result = await syncExternalCalendar(therapistId, syncData, {
        syncDirection: "bidirectional",
        conflictResolution: "manual_review",
      });

      if (result.success) {
        setSyncStatus("connected");
        // Reload data to reflect sync changes
        await loadAvailabilityData();
      }

      setIsSyncModalOpen(false);
      setError(null);
    } catch (err) {
      console.error("Error configuring sync:", err);
      setError(err.message || "Error al configurar la sincronización");
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLastWeek = async () => {
    setLoading(true);
    try {
      const operations = availabilitySlots.map((slot) => {
        const newStartDate = new Date(
          new Date(slot.startDate).getTime() + 7 * 24 * 60 * 60 * 1000,
        );
        const newEndDate = new Date(
          new Date(slot.endDate).getTime() + 7 * 24 * 60 * 60 * 1000,
        );

        return {
          action: "create",
          data: {
            ...slot,
            startDate: newStartDate.toISOString().split("T")[0],
            endDate: newEndDate.toISOString().split("T")[0],
          },
        };
      });

      const result = await updateAvailability(therapistId, operations, {
        validateConflicts: true,
        syncExternal: syncStatus === "connected",
      });

      if (result.success) {
        // Reload data to get the new slots with proper IDs
        await loadAvailabilityData();
      }

      setError(null);
    } catch (err) {
      console.error("Error copying last week:", err);
      setError(err.message || "Error al copiar la semana anterior");
    } finally {
      setLoading(false);
    }
  };

  const handleSyncGoogle = async () => {
    setLoading(true);
    try {
      if (syncStatus === "connected") {
        // Disconnect sync
        setSyncStatus("disconnected");
      } else {
        // Try to connect and sync
        const syncConfig = {
          provider: "google",
          credentials: {}, // This would be handled by OAuth flow
          settings: {
            syncDirection: "bidirectional",
            conflictResolution: "manual_review",
          },
        };

        const result = await syncExternalCalendar(therapistId, syncConfig);

        if (result.success) {
          setSyncStatus("connected");
          await loadAvailabilityData();
        }
      }

      setError(null);
    } catch (err) {
      console.error("Error syncing with Google Calendar:", err);
      setError(err.message || "Error al sincronizar con Google Calendar");
    } finally {
      setLoading(false);
    }
  };

  const handleCalendarEventClick = (event) => {
    if (event.type === "availability") {
      // Pass the full slot data (stored in event.data) for editing
      const slotData = event.data || event;
      handleEditSlot(slotData);
    } else if (event.type === "absence") {
      // Pass the full absence data for editing
      const absenceData = event.data || event;
      handleEditAbsence(absenceData);
    }
  };

  const handleCalendarSlotSelect = (slotInfo) => {
    // Create new availability slot from calendar selection
    const newSlot = {
      startDate: slotInfo.date || slotInfo.start?.toISOString().split("T")[0],
      endDate: slotInfo.date || slotInfo.end?.toISOString().split("T")[0],
      startTime: slotInfo.time || slotInfo.start?.toTimeString().slice(0, 5),
      endTime: slotInfo.time || slotInfo.end?.toTimeString().slice(0, 5),
      timezone: selectedTimezone,
    };
    setEditingSlot(newSlot);
    setIsSlotModalOpen(true);
  };

  // New handlers for advanced features
  const handleApplyTemplate = async (templateData) => {
    setLoading(true);
    try {
      const { template, dateRange, location } = templateData;
      const newSlots = generateSlotsFromTemplate(template, dateRange, location);
      setAvailabilitySlots((prev) => [...prev, ...newSlots]);
      setError(null);
    } catch (err) {
      setError("Error al aplicar la plantilla");
    } finally {
      setLoading(false);
    }
  };

  const handleBulkAction = async (actionData) => {
    setLoading(true);
    try {
      const { action, selectedSlots, data } = actionData;

      switch (action) {
        case "duplicate_week":
          handleCopyLastWeek();
          break;
        case "duplicate_month":
          // Duplicate selected slots for next month
          const duplicatedSlots = selectedSlots
            .map((slotId) => {
              const slot = availabilitySlots.find((s) => s.id === slotId);
              if (!slot) return null;
              return {
                ...slot,
                id: `slot_${Date.now()}_${Math.random()}`,
                startDate: new Date(
                  new Date(slot.startDate).setMonth(
                    new Date(slot.startDate).getMonth() + 1,
                  ),
                )
                  .toISOString()
                  .split("T")[0],
                endDate: new Date(
                  new Date(slot.endDate).setMonth(
                    new Date(slot.endDate).getMonth() + 1,
                  ),
                )
                  .toISOString()
                  .split("T")[0],
              };
            })
            .filter(Boolean);
          setAvailabilitySlots((prev) => [...prev, ...duplicatedSlots]);
          break;
        case "delete_selected":
          setAvailabilitySlots((prev) =>
            prev.filter((slot) => !selectedSlots.includes(slot.id)),
          );
          break;
        case "bulk_update":
          setAvailabilitySlots((prev) =>
            prev.map((slot) => {
              if (!selectedSlots.includes(slot.id)) return slot;
              const updates = {};
              if (data.location) updates.location = data.location;
              if (data.timeAdjustment.start)
                updates.startTime = data.timeAdjustment.start;
              if (data.timeAdjustment.end)
                updates.endTime = data.timeAdjustment.end;
              return { ...slot, ...updates };
            }),
          );
          break;
      }

      setSelectedSlots([]);
      setError(null);
    } catch (err) {
      setError("Error al realizar la operación en lote");
    } finally {
      setLoading(false);
    }
  };

  const handleEventDrop = async (dropData) => {
    setLoading(true);
    try {
      const { event, newDate, newStartTime } = dropData;
      const duration = calculateDuration(event.startTime, event.endTime);
      const newEndTime = calculateEndTime(newStartTime, duration);

      if (event.type === "availability") {
        setAvailabilitySlots((prev) =>
          prev.map((slot) =>
            slot.id === event.id
              ? {
                  ...slot,
                  startDate: newDate,
                  endDate: newDate,
                  startTime: newStartTime,
                  endTime: newEndTime,
                }
              : slot,
          ),
        );
      }
      setError(null);
    } catch (err) {
      setError("Error al mover el evento");
    } finally {
      setLoading(false);
    }
  };

  // Helper functions
  const generateSlotsFromTemplate = (template, dateRange, locationId) => {
    const slots = [];
    const startDate = new Date(dateRange.start);
    const endDate = new Date(dateRange.end);

    for (
      let date = new Date(startDate);
      date <= endDate;
      date.setDate(date.getDate() + 1)
    ) {
      const dayName = date.toLocaleDateString("en-US", {
        weekday: "lowercase",
      });
      if (template.pattern.days.includes(dayName)) {
        slots.push({
          id: `template_${Date.now()}_${Math.random()}`,
          title: template.name,
          startDate: date.toISOString().split("T")[0],
          endDate: date.toISOString().split("T")[0],
          startTime: template.pattern.startTime,
          endTime: template.pattern.endTime,
          location: locationId,
          type: "availability",
          color: "blue",
        });
      }
    }

    return slots;
  };

  const calculateDuration = (startTime, endTime) => {
    const start = new Date(`1970-01-01T${startTime}:00`);
    const end = new Date(`1970-01-01T${endTime}:00`);
    return (end - start) / (1000 * 60); // minutes
  };

  const calculateEndTime = (startTime, durationMinutes) => {
    const start = new Date(`1970-01-01T${startTime}:00`);
    const end = new Date(start.getTime() + durationMinutes * 60 * 1000);
    return end.toTimeString().slice(0, 5);
  };

  // Show loading while checking authentication
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  // Show login prompt if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-orange-500" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Autenticación requerida
          </h2>
          <p className="text-gray-600 mb-4">
            Necesitas iniciar sesión para acceder a la gestión de
            disponibilidad.
          </p>
          <button
            onClick={() => (window.location.href = "/login")}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Iniciar sesión
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        {/* Main header row */}
        <div className="px-3 py-3 sm:px-6 sm:py-4">
          <div className="flex items-center justify-between">
            {/* Title */}
            <div className="flex-1 min-w-0">
              <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 truncate">
                Disponibilidad
              </h1>
              <p className="text-xs sm:text-sm text-gray-600 hidden xs:block">
                Configura tu calendario
              </p>
            </div>

            {/* Mobile controls - compact buttons */}
            <div className="flex items-center gap-2 sm:hidden">
              {activeTab === "calendar" && (
                <>
                  {/* Quick view toggle for mobile */}
                  <button
                    onClick={() =>
                      setCurrentView(currentView === "week" ? "month" : "week")
                    }
                    className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md"
                    aria-label="Cambiar vista"
                  >
                    {currentView === "week" ? (
                      <Calendar className="h-5 w-5" />
                    ) : (
                      <svg
                        className="h-5 w-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                    )}
                  </button>
                  {/* Advanced toggle compact */}
                  <button
                    onClick={() => setUseAdvancedCalendar(!useAdvancedCalendar)}
                    className={`p-2 rounded-md ${
                      useAdvancedCalendar
                        ? "bg-blue-100 text-blue-600"
                        : "text-gray-600 hover:bg-gray-100"
                    }`}
                    aria-label="Calendario avanzado"
                  >
                    <svg
                      className="h-5 w-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
                      />
                    </svg>
                  </button>
                  {/* Menu toggle */}
                  <button
                    onClick={() => setSidebarOpen(!sidebarOpen)}
                    className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md"
                    aria-label={sidebarOpen ? "Cerrar menú" : "Abrir menú"}
                  >
                    {sidebarOpen ? (
                      <X className="h-5 w-5" />
                    ) : (
                      <Menu className="h-5 w-5" />
                    )}
                  </button>
                </>
              )}
            </div>

            {/* Desktop controls */}
            <div className="hidden sm:flex items-center gap-3">
              {/* Tab navigation */}
              <div className="flex border border-gray-200 rounded-md">
                <button
                  onClick={() => setActiveTab("calendar")}
                  className={`px-4 py-2 text-sm font-medium flex items-center space-x-2 transition-colors ${
                    activeTab === "calendar"
                      ? "bg-blue-600 text-white"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  <Calendar className="h-4 w-4" />
                  <span>Calendario</span>
                </button>
                <button
                  onClick={() => setActiveTab("quick-config")}
                  className={`px-4 py-2 text-sm font-medium flex items-center space-x-2 transition-colors ${
                    activeTab === "quick-config"
                      ? "bg-blue-600 text-white"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  <Zap className="h-4 w-4" />
                  <span>Configuración Rápida</span>
                </button>
              </div>

              {/* Advanced calendar toggle */}
              {activeTab === "calendar" && (
                <div className="flex items-center space-x-2">
                  <label className="text-sm text-gray-600">Avanzado:</label>
                  <button
                    onClick={() => setUseAdvancedCalendar(!useAdvancedCalendar)}
                    className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      useAdvancedCalendar ? "bg-blue-600" : "bg-gray-200"
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        useAdvancedCalendar ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>
              )}

              {/* View tabs */}
              {activeTab === "calendar" && (
                <ViewTabs
                  currentView={currentView}
                  onViewChange={handleViewChange}
                  selectedTimezone={selectedTimezone}
                  onTimezoneChange={handleTimezoneChange}
                />
              )}
            </div>
          </div>
        </div>

        {/* Mobile tab bar - visible only on small screens */}
        <div className="sm:hidden border-t border-gray-100">
          <div className="flex">
            <button
              onClick={() => setActiveTab("calendar")}
              className={`flex-1 py-3 text-xs font-medium flex items-center justify-center space-x-1 transition-colors ${
                activeTab === "calendar"
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <Calendar className="h-4 w-4" />
              <span>Calendario</span>
            </button>
            <button
              onClick={() => setActiveTab("quick-config")}
              className={`flex-1 py-3 text-xs font-medium flex items-center justify-center space-x-1 transition-colors ${
                activeTab === "quick-config"
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <Zap className="h-4 w-4" />
              <span>Rápida</span>
            </button>
          </div>
        </div>
      </div>

      {/* Error display */}
      {error && (
        <div className="mx-4 sm:mx-6 mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
          <div className="flex items-center">
            <AlertTriangle className="h-5 w-5 text-red-600 mr-2 flex-shrink-0" />
            <span className="text-red-800 text-sm">{error}</span>
            <button
              onClick={() => setError(null)}
              className="ml-auto text-red-600 hover:text-red-800 text-xl leading-none"
              aria-label="Cerrar error"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="p-4 sm:p-6">
        {activeTab === "quick-config" ? (
          /* Quick Configuration View */
          <QuickConfigView
            onApplyTemplate={handleApplyTemplate}
            onBulkAction={handleBulkAction}
            selectedSlots={selectedSlots}
            locations={locations}
            loading={loading}
          />
        ) : (
          /* Calendar View */
          <div className="flex flex-col lg:flex-row gap-4 lg:gap-6">
            {/* Sidebar - Desktop: static, Mobile: drawer */}
            <div
              className={`
              ${sidebarOpen ? "fixed inset-0 z-40 lg:relative lg:inset-auto lg:z-auto" : "hidden lg:block"}
              lg:block
            `}
            >
              {/* Mobile overlay */}
              {sidebarOpen && (
                <div
                  className="fixed inset-0 bg-black/50 backdrop-blur-sm lg:hidden"
                  onClick={() => setSidebarOpen(false)}
                />
              )}
              <div
                className={`
                ${sidebarOpen ? "absolute right-0 top-0 h-full w-[85vw] max-w-[320px] lg:relative lg:w-full" : "w-full"}
              `}
              >
                <SidebarActions
                  onCreateSlot={handleCreateSlot}
                  onCreateAbsence={handleCreateAbsence}
                  onCopyLastWeek={handleCopyLastWeek}
                  onSyncGoogle={handleSyncGoogle}
                  onOpenSyncModal={handleOpenSyncModal}
                  syncStatus={syncStatus}
                  loading={loading}
                  availabilitySlots={availabilitySlots}
                  appointments={appointments}
                  absences={absences}
                  isDrawer={sidebarOpen}
                  onClose={() => setSidebarOpen(false)}
                />
              </div>
            </div>

            {/* Main calendar area */}
            <div className="flex-1 space-y-4 lg:space-y-6 min-w-0">
              {/* Calendar */}
              {useAdvancedCalendar ? (
                <AdvancedCalendar
                  view={currentView}
                  events={calendarEvents}
                  selectedDate={selectedDate}
                  onDateChange={setSelectedDate}
                  onEventClick={handleCalendarEventClick}
                  onEventDrop={handleEventDrop}
                  onSlotSelect={handleCalendarSlotSelect}
                  selectedSlots={selectedSlots}
                  onSelectedSlotsChange={setSelectedSlots}
                  timezone={selectedTimezone}
                  locations={locations}
                  loading={loading}
                />
              ) : (
                <Card>
                  <div className="p-6">
                    {(() => {
                      console.log("🎯 PASSING DATA TO AvailabilityCalendar:");
                      console.log(
                        "  availabilitySlots state:",
                        availabilitySlots,
                      );
                      console.log("  appointments state:", appointments);
                      console.log("  calendarEvents:", calendarEvents);
                      console.log("  currentView:", currentView);
                      console.log("  loading:", loading);
                      console.log("  therapistId:", therapistId);
                      return null;
                    })()}
                    <AvailabilityCalendar
                      view={currentView}
                      onViewChange={handleViewChange}
                      events={calendarEvents}
                      availabilitySlots={availabilitySlots}
                      appointments={appointments}
                      selectedDate={selectedDate}
                      onDateChange={setSelectedDate}
                      onSelectEvent={handleCalendarEventClick}
                      onSlotSelect={handleCalendarSlotSelect}
                      selectedSlots={selectedSlots}
                      onSelectedSlotsChange={setSelectedSlots}
                      timezone={selectedTimezone}
                      loading={loading}
                      therapistId={therapistId}
                    />
                  </div>
                </Card>
              )}

              {/* Occupancy bars */}
              <OccupancyBar
                weekData={weekOccupancy}
                appointments={appointments}
                availabilitySlots={availabilitySlots}
                currentWeek="15-21 Enero 2024"
                loading={loading}
                showSummary={true}
              />
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <SlotModal
        isOpen={isSlotModalOpen}
        onClose={() => {
          setIsSlotModalOpen(false);
          setEditingSlot(null);
          setSelectedSlots([]);
        }}
        onSave={handleSaveSlot}
        slot={editingSlot}
        selectedSlots={selectedSlots}
        mode={
          editingSlot ? "edit" : selectedSlots.length > 1 ? "bulk" : "create"
        }
        existingSlots={availabilitySlots}
        existingAppointments={appointments}
        defaultTimezone={selectedTimezone}
        loading={loading}
        workLocations={locations}
        therapistId={therapistId}
      />

      <AbsenceModal
        isOpen={isAbsenceModalOpen}
        onClose={() => {
          setIsAbsenceModalOpen(false);
          setEditingAbsence(null);
        }}
        onSave={handleSaveAbsence}
        absence={editingAbsence}
        mode={editingAbsence ? "edit" : "create"}
        existingAppointments={appointments}
        defaultTimezone={selectedTimezone}
        loading={loading}
        therapistId={therapistId}
      />

      <SyncModal
        isOpen={isSyncModalOpen}
        onClose={() => setIsSyncModalOpen(false)}
        onConnect={handleSyncSettings}
        onDisconnect={handleSyncGoogle}
        connections={{ google: syncStatus }}
        loading={loading}
        therapistId={therapistId}
      />

      {/* Loading overlay */}
      {loading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 flex items-center space-x-3">
            <Loader className="h-6 w-6 animate-spin text-blue-600" />
            <span className="text-gray-900">Procesando...</span>
          </div>
        </div>
      )}
    </div>
  );
};
