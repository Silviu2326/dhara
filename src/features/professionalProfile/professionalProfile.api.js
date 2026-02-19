import { professionalProfileService } from '../../services/api/professionalProfileService';
import { userService } from '../../services/api/userService';

/**
 * API functions for professional profile management
 */

export const getProfile = async () => {
  try {
    return await professionalProfileService.getProfile();
  } catch (error) {
    console.error('Error fetching profile:', error);
    throw error;
  }
};

export const updateProfile = async (profileData) => {
  try {
    return await professionalProfileService.updateProfile(profileData);
  } catch (error) {
    console.error('Error updating profile:', error);
    throw error;
  }
};

export const uploadProfileImage = async (imageFile) => {
  try {
    // Esta función debería usar un servicio de upload de archivos
    // Por ahora retornamos un placeholder
    const formData = new FormData();
    formData.append('image', imageFile);

    // Usar userService para actualizar avatar o professionalProfileService para banner
    const response = await userService.uploadAvatar(formData);
    return { imageUrl: response.imageUrl };
  } catch (error) {
    console.error('Error uploading image:', error);
    throw error;
  }
};

export const toggleProfileVisibility = async (isPublished) => {
  try {
    return await professionalProfileService.toggleProfileVisibility(isPublished);
  } catch (error) {
    console.error('Error toggling profile visibility:', error);
    throw error;
  }
};

export const getAvailableSpecialties = async () => {
  try {
    return await professionalProfileService.getAvailableSpecialties();
  } catch (error) {
    console.error('Error fetching specialties:', error);
    throw error;
  }
};