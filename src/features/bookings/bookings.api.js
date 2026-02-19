import { bookingService } from '../../services/api/bookingService';

export const getBookings = async (filters = {}) => {
  try {
    const result = await bookingService.getAppointments(filters);
    return {
      bookings: result.appointments || [],
      pagination: result.pagination,
      total: result.pagination?.total || 0
    };
  } catch (error) {
    console.error('Error fetching bookings:', error);
    throw error;
  }
};

export const confirmBooking = async (bookingId) => {
  try {
    return await bookingService.updateAppointment(bookingId, {
      status: 'confirmed'
    });
  } catch (error) {
    console.error('Error confirming booking:', error);
    throw error;
  }
};

export const cancelBooking = async (bookingId, reason) => {
  try {
    return await bookingService.cancelAppointment(bookingId, { reason });
  } catch (error) {
    console.error('Error cancelling booking:', error);
    throw error;
  }
};

export const rescheduleBooking = async (bookingId, newDateTime) => {
  try {
    return await bookingService.updateAppointment(bookingId, {
      dateTime: newDateTime
    });
  } catch (error) {
    console.error('Error rescheduling booking:', error);
    throw error;
  }
};