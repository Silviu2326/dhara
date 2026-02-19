import { userService } from '../../services/api/userService';
import { authService } from '../../services/api/authService';

export const getAccountSettings = async () => {
  try {
    const profile = await userService.getProfile();
    return { settings: profile };
  } catch (error) {
    console.error('Error fetching account settings:', error);
    throw error;
  }
};

export const updateAccountSettings = async (settings) => {
  try {
    return await userService.updateProfile(settings);
  } catch (error) {
    console.error('Error updating account settings:', error);
    throw error;
  }
};

export const changePassword = async (currentPassword, newPassword) => {
  try {
    return await authService.changePassword({
      currentPassword,
      newPassword
    });
  } catch (error) {
    console.error('Error changing password:', error);
    throw error;
  }
};

export const deleteAccount = async (password) => {
  try {
    return await userService.deleteAccount({ password });
  } catch (error) {
    console.error('Error deleting account:', error);
    throw error;
  }
};

export const updateNotificationPreferences = async (preferences) => {
  try {
    return await userService.updatePreferences(preferences);
  } catch (error) {
    console.error('Error updating notification preferences:', error);
    throw error;
  }
};