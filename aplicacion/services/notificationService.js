import { Platform } from 'react-native';
import { MOCK_NOTIFICATIONS } from './mockData';
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

export const notificationService = {
  // Get client notifications
  async getClientNotifications(limit = 10, page = 1) {
    try {
      await new Promise(resolve => setTimeout(resolve, 500)); // Simulate delay
      
      const unreadCount = MOCK_NOTIFICATIONS.filter(n => !n.read).length;

      return {
        success: true,
        data: {
          notifications: MOCK_NOTIFICATIONS,
          unreadCount: unreadCount,
          totalCount: MOCK_NOTIFICATIONS.length
        }
      };
    } catch (error) {
      console.error('Error getting client notifications:', error);
      return {
        success: true,  // Return success but empty data to avoid UI errors
        error: error.message,
        data: {
          notifications: [],
          unreadCount: 0,
          totalCount: 0
        }
      };
    }
  },

  // Mark notification as read
  async markAsRead(notificationId) {
    try {
      await new Promise(resolve => setTimeout(resolve, 300)); // Simulate delay
      
      // In a real app we would update the mock data here, but for now just return success
      return {
        success: true,
        message: 'Notificación marcada como leída'
      };
    } catch (error) {
      console.error('Error marking notification as read:', error);
      return {
        success: false,
        error: error.message
      };
    }
  },

  // Mark all notifications as read
  async markAllAsRead() {
    try {
      await new Promise(resolve => setTimeout(resolve, 300)); // Simulate delay

      return {
        success: true,
        message: 'Todas las notificaciones marcadas como leídas'
      };
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      return {
        success: false,
        error: error.message
      };
    }
  },

  // Get unread notifications count
  async getUnreadCount() {
    try {
      await new Promise(resolve => setTimeout(resolve, 300)); // Simulate delay
      
      const unreadCount = MOCK_NOTIFICATIONS.filter(n => !n.read).length;

      return {
        success: true,
        count: unreadCount
      };
    } catch (error) {
      console.error('Error getting unread count:', error);
      return {
        success: true,  // Return success but count 0 to avoid UI errors
        error: error.message,
        count: 0
      };
    }
  }
};