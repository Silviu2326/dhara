import { availabilityService } from '../../services/api/availabilityService';
import { bookingService } from '../../services/api/bookingService';
import { workLocationService } from '../../services/api/workLocationService';
import { apiClient } from '../../services/config/apiClient';

// API functions para gestión de disponibilidad de terapeutas
export const getAvailability = async (therapistId, options = {}) => {
  try {
    const {
      dateFrom = null,
      dateTo = null,
      locationId = null,
      includeRecurring = true,
      includeExceptions = true,
      timezone = 'Europe/Madrid',
      granularity = 'hour'
    } = options;

    const availability = await availabilityService.getAvailability(therapistId, {
      dateFrom,
      dateTo,
      locationId,
      includeRecurring,
      includeExceptions,
      timezone,
      granularity
    });

    return {
      schedule: availability.timeBlocks || [],
      exceptions: availability.exceptions || [],
      recurringPatterns: availability.recurringPatterns || [],
      total: availability.total || 0
    };
  } catch (error) {
    console.error('Error fetching availability:', error);

    // Si no hay therapistId válido o hay problemas de autenticación, no intentar cargar
    if (!therapistId || therapistId === 'current_therapistId' ||
        error.response?.status === 401 || error.response?.status === 403) {
      console.warn('Authentication issues or invalid therapist ID for availability');
      throw new Error('Authentication required to load availability');
    }

    throw error;
  }
};

export const updateAvailability = async (therapistId, schedule, options = {}) => {
  try {
    const {
      validateConflicts = true,
      syncExternal = false,
      createAuditLog = true
    } = options;

    // Preparar operaciones de actualización masiva
    const operations = schedule.map(slot => ({
      action: slot.action || 'create', // 'create', 'update', 'delete'
      data: slot
    }));

    const result = await availabilityService.bulkUpdateAvailability(therapistId, operations, {
      validateConflicts,
      syncExternal,
      createAuditLog
    });

    return {
      success: true,
      updated: result.successful || [],
      failed: result.failed || [],
      total: operations.length
    };
  } catch (error) {
    console.error('Error updating availability:', error);
    throw error;
  }
};

export const getBlockedTimes = async (therapistId, options = {}) => {
  try {
    const {
      dateFrom = null,
      dateTo = null,
      includeAppointments = true,
      includeExceptions = true
    } = options;

    // Obtener excepciones (ausencias, vacaciones, etc.)
    const exceptions = await availabilityService.getExceptions(therapistId, {
      dateFrom,
      dateTo,
      exceptionType: 'all',
      includeRecurring: true
    });

    let blockedTimes = (exceptions || []).map(exception => ({
      id: exception.id,
      startDate: exception.startDate || exception.date,
      endDate: exception.endDate || exception.date,
      startTime: exception.startTime,
      endTime: exception.endTime,
      allDay: exception.allDay,
      type: 'exception',
      reason: exception.exceptionType,
      title: exception.title || exception.reason
    }));

    // Incluir citas existentes como tiempo bloqueado
    if (includeAppointments) {
      const appointments = await bookingService.getAppointments({
        therapistId,
        dateFrom,
        dateTo,
        status: ['upcoming', 'pending', 'client_arrived'] // Use actual booking statuses
      });

      const appointmentBlocks = (appointments.appointments || []).map(appointment => {
        try {
          // Handle the actual booking structure with separate date and time fields
          const appointmentDate = appointment.date ? new Date(appointment.date).toISOString().split('T')[0] : null;

          if (!appointmentDate || !appointment.startTime) {
            console.warn('Invalid appointment data:', appointment);
            return null;
          }

          return {
            id: appointment.id || appointment._id,
            startDate: appointmentDate,
            endDate: appointmentDate,
            startTime: appointment.startTime,
            endTime: appointment.endTime || calculateEndTimeFromTime(appointment.startTime, appointment.therapyDuration || 60),
            allDay: false,
            type: 'appointment',
            reason: 'booked',
            title: `Cita - ${appointment.clientName || appointment.client?.name || 'Cliente'}`
          };
        } catch (error) {
          console.warn('Error processing appointment:', appointment, error);
          return null;
        }
      }).filter(Boolean); // Remove null entries

      blockedTimes = [...blockedTimes, ...appointmentBlocks];
    }

    return blockedTimes;
  } catch (error) {
    console.error('Error fetching blocked times:', error);

    // Si no hay therapistId válido, no intentar cargar
    if (!therapistId || therapistId === 'current_therapistId') {
      console.warn('No valid therapist ID provided for blocked times');
      throw new Error('Authentication required to load blocked times');
    }

    throw error;
  }
};

export const createTimeBlock = async (therapistId, blockData, options = {}) => {
  try {
    const {
      validateConflicts = true,
      createAuditLog = true,
      syncExternal = false,
      notifyChanges = false
    } = options;

    const processedData = {
      therapistId,
      ...blockData,
      blockType: blockData.blockType || 'available'
    };

    const timeBlock = await availabilityService.createTimeBlock(processedData, {
      validateConflicts,
      createAuditLog,
      syncExternal,
      notifyChanges
    });

    return timeBlock;
  } catch (error) {
    console.error('Error creating time block:', error);
    throw error;
  }
};

export const updateTimeBlock = async (blockId, updates, options = {}) => {
  try {
    const {
      validateConflicts = true,
      updateRecurrence = 'this_only',
      syncExternal = false,
      createAuditLog = true,
      incrementVersion = true
    } = options;

    const updatedBlock = await availabilityService.updateTimeBlock(blockId, updates, {
      validateConflicts,
      updateRecurrence,
      syncExternal,
      createAuditLog,
      incrementVersion
    });

    return updatedBlock;
  } catch (error) {
    console.error('Error updating time block:', error);
    throw error;
  }
};

export const deleteTimeBlock = async (blockId, options = {}) => {
  try {
    const {
      deleteRecurrence = 'this_only',
      reason = 'user_request',
      syncExternal = false,
      createAuditLog = true
    } = options;

    const result = await availabilityService.deleteTimeBlock(blockId, {
      deleteRecurrence,
      reason,
      syncExternal,
      createAuditLog
    });

    return result;
  } catch (error) {
    console.error('Error deleting time block:', error);
    throw error;
  }
};

export const getAvailabilityByDateRange = async (therapistId, startDate, endDate, options = {}) => {
  try {
    const {
      timezone = 'Europe/Madrid',
      includeStats = true,
      includeConflicts = false
    } = options;

    const [availability, blockedTimes] = await Promise.all([
      getAvailability(therapistId, {
        dateFrom: startDate,
        dateTo: endDate,
        timezone
      }),
      getBlockedTimes(therapistId, {
        dateFrom: startDate,
        dateTo: endDate
      })
    ]);

    let stats = null;
    if (includeStats) {
      stats = await availabilityService.generateAvailabilityReport(therapistId, {
        dateFrom: startDate,
        dateTo: endDate,
        format: 'json',
        includeStatistics: true,
        includeUtilization: true,
        includeConflicts
      });
    }

    return {
      availability: availability.schedule,
      blockedTimes,
      exceptions: availability.exceptions,
      statistics: stats,
      dateRange: { startDate, endDate }
    };
  } catch (error) {
    console.error('Error fetching availability by date range:', error);
    throw error;
  }
};

export const createException = async (therapistId, exceptionData, options = {}) => {
  try {
    const {
      validateConflicts = true,
      createAuditLog = true,
      syncExternal = false
    } = options;

    const processedData = {
      therapistId,
      ...exceptionData
    };

    const exception = await availabilityService.createException(processedData, {
      validateConflicts,
      createAuditLog,
      syncExternal
    });

    return exception;
  } catch (error) {
    console.error('Error creating exception:', error);
    throw error;
  }
};

export const syncExternalCalendar = async (therapistId, calendarConfig, options = {}) => {
  try {
    const {
      syncDirection = 'bidirectional',
      conflictResolution = 'manual_review',
      syncHistoryDays = 30,
      syncFutureDays = 90
    } = options;

    const syncResult = await availabilityService.syncWithExternalCalendar(
      therapistId,
      calendarConfig,
      {
        syncDirection,
        conflictResolution,
        syncHistoryDays,
        syncFutureDays
      }
    );

    return syncResult;
  } catch (error) {
    console.error('Error syncing external calendar:', error);
    throw error;
  }
};

export const getExternalCalendarStatus = async (therapistId) => {
  try {
    const status = await availabilityService.getExternalCalendarStatus(therapistId);
    return status;
  } catch (error) {
    console.error('Error getting external calendar status:', error);

    // Si no hay therapistId válido, no intentar cargar
    if (!therapistId || therapistId === 'current_therapistId') {
      console.warn('No valid therapist ID provided for calendar status');
      throw new Error('Authentication required to load calendar status');
    }

    throw error;
  }
};

export const resolveCalendarConflicts = async (therapistId, conflicts, resolutions, options = {}) => {
  try {
    const { createAuditLog = true } = options;

    const result = await availabilityService.resolveConflicts(
      therapistId,
      conflicts,
      resolutions,
      { createAuditLog }
    );

    return result;
  } catch (error) {
    console.error('Error resolving calendar conflicts:', error);
    throw error;
  }
};

export const checkTimeBlockConflicts = async (therapistId, startTime, endTime, locationId = null, excludeBlockId = null) => {
  try {
    const conflicts = await availabilityService.checkTimeBlockConflicts(
      therapistId,
      startTime,
      endTime,
      locationId,
      excludeBlockId
    );

    return conflicts;
  } catch (error) {
    console.error('Error checking time block conflicts:', error);
    throw error;
  }
};

export const checkExistingAppointments = async (therapistId, date, startTime = null, endTime = null) => {
  try {
    const appointments = await availabilityService.checkExistingAppointments(
      therapistId,
      date,
      startTime,
      endTime
    );

    return appointments;
  } catch (error) {
    console.error('Error checking existing appointments:', error);
    throw error;
  }
};

export const getWorkLocations = async (therapistId, options = {}) => {
  try {
    const {
      status = 'active',
      includeSchedule = false,
      includeStatistics = false
    } = options;

    const locationsResponse = await workLocationService.getLocationsByTherapist(therapistId, {
      status,
      includeSchedule,
      includeStatistics,
      decryptSensitiveData: true
    });

    // Manejar diferentes formatos de respuesta
    if (locationsResponse?.locations) {
      return locationsResponse.locations;
    } else if (Array.isArray(locationsResponse)) {
      return locationsResponse;
    } else {
      return [];
    }
  } catch (error) {
    console.error('Error fetching work locations:', error);

    // Si no hay therapistId válido, no intentar cargar
    if (!therapistId || therapistId === 'current_therapistId') {
      console.warn('No valid therapist ID provided for work locations');
      throw new Error('Authentication required to load work locations');
    }

    throw error;
  }
};

export const exportAvailabilityCalendar = async (therapistId, format, options = {}) => {
  try {
    const {
      dateFrom = null,
      dateTo = null,
      includePrivateInfo = false,
      timezone = 'Europe/Madrid'
    } = options;

    const calendarData = await bookingService.exportCalendar(therapistId, format, {
      dateFrom,
      dateTo,
      includePrivateInfo,
      timezone
    });

    return calendarData;
  } catch (error) {
    console.error('Error exporting calendar:', error);
    throw error;
  }
};

// Función helper para calcular hora de fin
const calculateEndTime = (startDateTime, durationMinutes) => {
  const start = new Date(startDateTime);
  const end = new Date(start.getTime() + durationMinutes * 60 * 1000);
  return end.toTimeString().substring(0, 5);
};

// Función helper para calcular hora de fin desde hora de inicio (HH:mm)
const calculateEndTimeFromTime = (startTime, durationMinutes) => {
  if (!startTime || typeof startTime !== 'string') {
    return '00:00';
  }

  const [hours, minutes] = startTime.split(':').map(Number);

  if (isNaN(hours) || isNaN(minutes)) {
    return '00:00';
  }

  const totalMinutes = hours * 60 + minutes + durationMinutes;
  const endHours = Math.floor(totalMinutes / 60) % 24;
  const endMinutes = totalMinutes % 60;

  return `${endHours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`;
};

// Direct backend API functions for availability slots
export const getAvailabilitySlots = async (therapistId, options = {}) => {
  try {
    const {
      startDate = null,
      endDate = null,
      type = 'all',
      location = 'all',
      isActive = 'true',
      page = 1,
      limit = 50
    } = options;

    console.log('🔍 Fetching availability slots from time blocks API:', { therapistId, startDate, endDate });

    // Use the new time blocks endpoint
    const response = await availabilityService.getTimeBlocksByTherapist(therapistId, {
      startDate,
      endDate
    });

    console.log('✅ Time blocks response:', response);

    // Handle response from API - should be direct array
    let slots = [];
    
    if (Array.isArray(response)) {
      slots = response;
      console.log('✅ API returned array of slots:', slots.length);
    } else if (response && typeof response === 'object') {
      // Try to extract slots from response
      slots = response.data || response.slots || [];
      console.log('⚠️ API returned object, extracted slots:', slots.length);
    } else {
      console.warn('⚠️ Unexpected API response:', response);
      slots = [];
    }

    console.log('🎯 Final slots count:', slots.length);
    if (slots.length > 0) {
      console.log('📋 First slot:', slots[0]);
    }

    return {
      slots,
      success: true
    };
  } catch (error) {
    console.error('❌ Error fetching availability slots:', error);

    // Return empty data on error to avoid breaking the UI
    return {
      slots: [],
      pagination: {},
      success: false,
      error: error.message
    };
  }
};

export const createAvailabilitySlot = async (slotData) => {
  try {
    console.log('🔄 Creating availability slot:', slotData);

    const response = await apiClient.post('/availability/slots', slotData);

    console.log('✅ Created availability slot:', response.data);

    return {
      slot: response.data?.data,
      success: true,
      message: response.data?.message || 'Slot created successfully'
    };
  } catch (error) {
    console.error('❌ Error creating availability slot:', error);
    throw error;
  }
};

export const updateAvailabilitySlot = async (slotId, updates) => {
  try {
    console.log('🔄 Updating availability slot:', { slotId, updates });

    const response = await apiClient.put(`/availability/slots/${slotId}`, updates);

    console.log('✅ Updated availability slot:', response.data);

    return {
      slot: response.data?.data,
      success: true,
      message: response.data?.message || 'Slot updated successfully'
    };
  } catch (error) {
    console.error('❌ Error updating availability slot:', error);
    throw error;
  }
};

export const deleteAvailabilitySlot = async (slotId) => {
  try {
    console.log('🔄 Deleting availability slot:', slotId);

    const response = await apiClient.delete(`/availability/slots/${slotId}`);

    console.log('✅ Deleted availability slot:', response.data);

    return {
      success: true,
      message: response.data?.message || 'Slot deleted successfully'
    };
  } catch (error) {
    console.error('❌ Error deleting availability slot:', error);
    throw error;
  }
};

export const getOccupancyAnalysis = async (therapistId, options = {}) => {
  try {
    const {
      startDate = null,
      endDate = null
    } = options;

    const params = {
      startDate,
      endDate
    };

    // Remove null values
    Object.keys(params).forEach(key => {
      if (params[key] === null || params[key] === undefined) {
        delete params[key];
      }
    });

    console.log('🔍 Fetching occupancy analysis:', { therapistId, params });

    const response = await apiClient.get('/availability/analysis/occupancy', { params });

    console.log('✅ Occupancy analysis response:', response.data);

    // CRITICAL FIX: Handle different response structures from the API
    let occupancyData = {};

    if (Array.isArray(response.data)) {
      // Handle array response (unlikely for occupancy but just in case)
      occupancyData = response.data[0] || {};
      console.log('🔧 API returned array for occupancy');
    } else if (response.data?.totalAvailableHours !== undefined) {
      // Direct structure - API returns occupancy data directly
      occupancyData = response.data;
      console.log('🔧 API returned direct occupancy structure');
    } else if (response.data?.data && response.data.data.totalAvailableHours !== undefined) {
      // Nested data structure
      occupancyData = response.data.data;
      console.log('🔧 API returned nested occupancy structure');
    } else {
      console.warn('⚠️ Unexpected occupancy API response structure:', response.data);
      occupancyData = {};
    }

    console.log('🎯 Final processed occupancy data:', occupancyData);

    return {
      data: occupancyData,
      success: true,
      // Also return the data directly for easier access
      totalAvailableHours: occupancyData.totalAvailableHours,
      totalBookedHours: occupancyData.totalBookedHours,
      occupancyRate: occupancyData.occupancyRate,
      totalSlots: occupancyData.totalSlots,
      period: occupancyData.period
    };
  } catch (error) {
    console.error('❌ Error fetching occupancy analysis:', error);

    // Return mock data on error
    return {
      data: {
        totalAvailableHours: 0,
        totalBookedHours: 0,
        occupancyRate: 0,
        totalSlots: 0,
        totalBookings: 0
      },
      success: false,
      error: error.message
    };
  }
};

export const getCalendarEvents = async (therapistId, options = {}) => {
  try {
    const {
      startDate = null,
      endDate = null,
      view = 'week'
    } = options;

    const params = {
      startDate,
      endDate,
      view
    };

    // Remove null values
    Object.keys(params).forEach(key => {
      if (params[key] === null || params[key] === undefined) {
        delete params[key];
      }
    });

    console.log('🔍 Fetching calendar events:', { therapistId, params });

    const response = await apiClient.get('/availability/calendar/events', { params });

    console.log('✅ Calendar events response:', response.data);

    return {
      events: response.data?.data || [],
      success: true
    };
  } catch (error) {
    console.error('❌ Error fetching calendar events:', error);

    // Return empty events on error
    return {
      events: [],
      success: false,
      error: error.message
    };
  }
};