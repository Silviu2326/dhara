import { clientService } from '../../services/api/clientService';

export const getClients = async (filters = {}) => {
  try {
    const result = await clientService.getClients(filters);
    return {
      clients: result.clients || [],
      pagination: result.pagination,
      total: result.pagination?.total || 0
    };
  } catch (error) {
    console.error('Error fetching clients:', error);
    throw error;
  }
};

export const getClientById = async (clientId) => {
  try {
    const client = await clientService.getClient(clientId, {
      includeStatistics: true,
      includeHistory: false
    });
    return { client };
  } catch (error) {
    console.error('Error fetching client:', error);
    throw error;
  }
};

export const updateClientNotes = async (clientId, notes) => {
  try {
    return await clientService.updateClient(clientId, { notes });
  } catch (error) {
    console.error('Error updating client notes:', error);
    throw error;
  }
};

export const getClientHistory = async (clientId) => {
  try {
    const result = await clientService.getClientHistory(clientId);
    return {
      sessions: result.history || [],
      pagination: result.pagination
    };
  } catch (error) {
    console.error('Error fetching client history:', error);
    throw error;
  }
};