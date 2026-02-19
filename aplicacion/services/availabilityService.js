import { Platform } from 'react-native';
import { MOCK_AVAILABILITY } from './mockData';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const availabilityService = {
  // Get therapist availability for a date range
  async getTherapistAvailability(therapistId, startDate, endDate, sessionDuration = 60) {
    try {
      await new Promise(resolve => setTimeout(resolve, 500)); // Simulate delay
      
      // Return mock availability
      return {
        success: true,
        data: MOCK_AVAILABILITY.slots.map(slot => ({
          ...slot,
          date: startDate // Just assigning the start date for simplicity in this mock
        }))
      };
    } catch (error) {
      console.error('Error getting therapist availability:', error);
      return {
        success: false,
        error: error.message
      };
    }
  },

  // Get available slots for a specific date
  async getAvailableSlotsForDate(therapistId, date, sessionDuration = 60) {
    try {
      await new Promise(resolve => setTimeout(resolve, 500)); // Simulate delay

      return {
        success: true,
        data: MOCK_AVAILABILITY.slots
      };
    } catch (error) {
      console.error('Error getting available slots:', error);
      return {
        success: false,
        error: error.message,
        data: {
          isAvailable: false,
          slots: []
        }
      };
    }
  },

  // Check if a specific time slot is available
  async checkSlotAvailability(therapistId, date, startTime, endTime) {
    try {
      await new Promise(resolve => setTimeout(resolve, 300)); // Simulate delay

      const slot = MOCK_AVAILABILITY.slots.find(s => s.time === startTime);
      const isAvailable = slot ? slot.available : true;

      return {
        success: true,
        available: isAvailable,
        reason: isAvailable ? null : 'Slot ocupado'
      };
    } catch (error) {
      console.error('Error checking slot availability:', error);
      return {
        success: false,
        available: false,
        error: error.message
      };
    }
  },

  // Get therapist's general schedule
  async getTherapistSchedule(therapistId) {
    try {
      await new Promise(resolve => setTimeout(resolve, 500)); // Simulate delay

      return {
        success: true,
        data: {
          weekDays: [1, 2, 3, 4, 5], // Mon-Fri
          workingHours: { start: '09:00', end: '18:00' }
        }
      };
    } catch (error) {
      console.error('Error getting therapist schedule:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
};