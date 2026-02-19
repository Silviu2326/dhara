import { apiMethods } from '../../services/config/apiClient';
import { ENDPOINTS } from '../../services/config/endpoints';

export const getFAQs = async (category = null) => {
  try {
    const params = category ? { category } : {};
    const response = await apiMethods.get(ENDPOINTS.SUPPORT.FAQ, { params });
    return { faqs: response.data || [] };
  } catch (error) {
    console.error('Error fetching FAQs:', error);
    throw error;
  }
};

export const searchHelp = async (query) => {
  try {
    const response = await apiMethods.get(ENDPOINTS.SUPPORT.KNOWLEDGE_BASE, {
      params: { q: query }
    });
    return { results: response.data || [] };
  } catch (error) {
    console.error('Error searching help articles:', error);
    throw error;
  }
};

export const searchKnowledgeBase = async (query) => {
  try {
    const response = await apiMethods.get(ENDPOINTS.SUPPORT.KNOWLEDGE_BASE, {
      params: { q: query }
    });
    return response.data || [];
  } catch (error) {
    console.error('Error searching knowledge base:', error);
    throw error;
  }
};

export const submitSupportTicket = async (ticketData) => {
  try {
    const response = await apiMethods.post(ENDPOINTS.SUPPORT.CREATE_TICKET, ticketData);
    return {
      ticketId: response.data.id || response.data.ticketId,
      success: true,
      ...response.data
    };
  } catch (error) {
    console.error('Error submitting support ticket:', error);
    throw error;
  }
};

export const createSupportTicket = async (ticketData) => {
  return submitSupportTicket(ticketData);
};

export const getSupportTickets = async () => {
  try {
    const response = await apiMethods.get(ENDPOINTS.SUPPORT.GET_TICKETS);
    return { tickets: response.data || [] };
  } catch (error) {
    console.error('Error fetching support tickets:', error);
    throw error;
  }
};