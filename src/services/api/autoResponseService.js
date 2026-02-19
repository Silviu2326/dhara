import { apiClient } from "../config/apiClient";
import { ENDPOINTS } from "../config/endpoints";

class AutoResponseService {
  async getAutoResponses() {
    try {
      const response = await apiClient.get(ENDPOINTS.AUTO_RESPONSES.GET);
      return response.data;
    } catch (error) {
      console.error("Error fetching auto responses:", error);
      throw error;
    }
  }

  async updateAutoResponse(rating, message) {
    try {
      const response = await apiClient.put(ENDPOINTS.AUTO_RESPONSES.UPDATE, {
        rating,
        message,
      });
      return response.data;
    } catch (error) {
      console.error("Error updating auto response:", error);
      throw error;
    }
  }

  async resetAutoResponse(rating) {
    try {
      const endpoint = ENDPOINTS.AUTO_RESPONSES.RESET.replace(
        ":rating",
        rating,
      );
      const response = await apiClient.post(endpoint);
      return response.data;
    } catch (error) {
      console.error("Error resetting auto response:", error);
      throw error;
    }
  }

  async resetAllAutoResponses() {
    try {
      const response = await apiClient.post(ENDPOINTS.AUTO_RESPONSES.RESET_ALL);
      return response.data;
    } catch (error) {
      console.error("Error resetting all auto responses:", error);
      throw error;
    }
  }
}

export const autoResponseService = new AutoResponseService();
