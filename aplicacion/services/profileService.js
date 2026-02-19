import { Platform } from 'react-native';
import { MOCK_USER, MOCK_THERAPIST, MOCK_PROGRESS } from './mockData';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Get stored token
const getToken = async () => {
  try {
    return await AsyncStorage.getItem('token');
  } catch (error) {
    console.error('Error getting token:', error);
    return null;
  }
};

export const profileService = {
  // Get client profile data
  async getClientProfile() {
    try {
      await new Promise(resolve => setTimeout(resolve, 500)); // Simulate delay

      return {
        success: true,
        data: {
          user: MOCK_USER,
          stats: {
            totalSessions: MOCK_PROGRESS.totalSessions,
            completedSessions: MOCK_PROGRESS.completedSessions,
            upcomingSessions: 2,
            treatmentDuration: MOCK_PROGRESS.treatmentDuration,
            progressPercentage: MOCK_PROGRESS.progressPercentage
          },
          therapist: MOCK_THERAPIST,
          treatmentPlan: {
            diagnosis: 'Trastorno de Ansiedad Generalizada',
            startDate: '2023-07-15',
            goals: MOCK_PROGRESS.goals
          },
          recentActivity: [
            { id: 1, type: 'appointment', description: 'Sesión completada', date: '2023-10-20' },
            { id: 2, type: 'payment', description: 'Pago procesado', date: '2023-10-20' }
          ]
        }
      };
    } catch (error) {
      console.error('Error getting client profile:', error);
      return {
        success: false,
        error: error.message,
        data: {
          // Fallback data
          user: MOCK_USER,
          stats: {
            totalSessions: 0,
            completedSessions: 0,
            upcomingSessions: 0,
            treatmentDuration: '0 días',
            progressPercentage: 0
          },
          therapist: {
            name: 'Sin asignar',
            specialties: [],
            rating: 0
          },
          treatmentPlan: null,
          recentActivity: []
        }
      };
    }
  },

  // Update client profile
  async updateClientProfile(profileData) {
    try {
      await new Promise(resolve => setTimeout(resolve, 500)); // Simulate delay

      return {
        success: true,
        data: {
          ...MOCK_USER,
          ...profileData
        }
      };
    } catch (error) {
      console.error('Error updating profile:', error);
      return {
        success: false,
        error: error.message
      };
    }
  },

  // Get client progress data
  async getClientProgress() {
    try {
      await new Promise(resolve => setTimeout(resolve, 500)); // Simulate delay

      return {
        success: true,
        data: MOCK_PROGRESS
      };
    } catch (error) {
      console.error('Error getting client progress:', error);
      return {
        success: false,
        error: error.message,
        data: {
          totalSessions: 0,
          completedSessions: 0,
          progressPercentage: 0,
          treatmentDuration: '0 días',
          goals: [],
          achievements: []
        }
      };
    }
  }
};