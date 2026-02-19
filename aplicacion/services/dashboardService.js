import { MOCK_DASHBOARD } from './mockData';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Base API URL - should be configured based on environment
// const API_BASE_URL = 'http://localhost:5000/api'; // Backend running on port 5000

// Helper function to make API calls
const apiCall = async (endpoint, options = {}) => {
  // Mock implementation
  await new Promise(resolve => setTimeout(resolve, 500));
  return {};
};

// Get authentication token from AsyncStorage (matching LoginScreen.js implementation)
const getAuthToken = async () => {
  try {
    // Get token from AsyncStorage where LoginScreen stores it
    const token = await AsyncStorage.getItem('clientToken');
    return token;
  } catch (error) {
    console.error('Error getting auth token:', error);
    return null;
  }
};

// Dashboard API functions
export const dashboardService = {
  // Get client dashboard data
  getClientDashboard: async () => {
    await new Promise(resolve => setTimeout(resolve, 500));
    return {
      success: true,
      data: MOCK_DASHBOARD.client
    };
  },

  // Get therapist dashboard data
  getTherapistDashboard: async () => {
    await new Promise(resolve => setTimeout(resolve, 500));
    return {
      success: true,
      data: {} // Mock therapist dashboard if needed
    };
  },

  // Get dashboard stats
  getDashboardStats: async () => {
    await new Promise(resolve => setTimeout(resolve, 500));
    return {
      success: true,
      data: MOCK_DASHBOARD.stats
    };
  },
};

export default dashboardService;