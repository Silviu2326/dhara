import apiClient from '../config/apiClient';
import { ENDPOINTS } from '../config/endpoints';

class NoteService {
  // Get notes with filters
  async getNotes(filters = {}) {
    try {
      const params = {};

      if (filters.client_id) params.client_id = filters.client_id;
      if (filters.author_type) params.author_type = filters.author_type;
      if (filters.note_type) params.note_type = filters.note_type;
      if (filters.category) params.category = filters.category;
      if (filters.visibility) params.visibility = filters.visibility;
      if (filters.priority) params.priority = filters.priority;
      if (filters.status) params.status = filters.status;
      if (filters.is_emergency !== undefined) params.is_emergency = filters.is_emergency;
      if (filters.requires_response !== undefined) params.requires_response = filters.requires_response;
      if (filters.date_from) params.date_from = filters.date_from;
      if (filters.date_to) params.date_to = filters.date_to;
      if (filters.search) params.search = filters.search;
      if (filters.page) params.page = filters.page;
      if (filters.limit) params.limit = filters.limit;
      if (filters.sort_by) params.sort_by = filters.sort_by;
      if (filters.sort_order) params.sort_order = filters.sort_order;

      const response = await apiClient.get(ENDPOINTS.NOTES.LIST, { params });

      let notes = response.data?.data?.notes || response.data?.notes || response.data?.data || response.data || [];
      let pagination = response.data?.data?.pagination || response.data?.pagination || null;

      console.log('📝 Notes fetched:', {
        total: notes.length,
        pagination,
        filters,
        response: response.data
      });

      return {
        notes,
        pagination,
        success: true
      };
    } catch (error) {
      console.error('❌ Error fetching notes:', error);
      return {
        notes: [],
        pagination: null,
        success: false,
        error: error.response?.data?.message || error.message
      };
    }
  }

  // Get a specific note by ID
  async getNoteById(noteId) {
    try {
      const response = await apiClient.get(ENDPOINTS.NOTES.GET_BY_ID.replace(':id', noteId));

      const note = response.data?.data || response.data;

      console.log('📝 Note fetched by ID:', { noteId, note });

      return {
        note,
        success: true
      };
    } catch (error) {
      console.error('❌ Error fetching note by ID:', error);
      return {
        note: null,
        success: false,
        error: error.response?.data?.message || error.message
      };
    }
  }

  // Create a new note
  async createNote(noteData) {
    try {
      const response = await apiClient.post(ENDPOINTS.NOTES.CREATE, noteData);

      const note = response.data?.data || response.data;

      console.log('📝 Note created:', { noteData, note });

      return {
        note,
        success: true
      };
    } catch (error) {
      console.error('❌ Error creating note:', error);
      return {
        note: null,
        success: false,
        error: error.response?.data?.message || error.message,
        details: error.response?.data?.details || []
      };
    }
  }

  // Update an existing note
  async updateNote(noteId, noteData) {
    try {
      const response = await apiClient.put(ENDPOINTS.NOTES.UPDATE.replace(':id', noteId), noteData);

      const note = response.data?.data || response.data;

      console.log('📝 Note updated:', { noteId, noteData, note });

      return {
        note,
        success: true
      };
    } catch (error) {
      console.error('❌ Error updating note:', error);
      return {
        note: null,
        success: false,
        error: error.response?.data?.message || error.message,
        details: error.response?.data?.details || []
      };
    }
  }

  // Delete a note
  async deleteNote(noteId) {
    try {
      const response = await apiClient.delete(ENDPOINTS.NOTES.DELETE.replace(':id', noteId));

      console.log('📝 Note deleted:', { noteId });

      return {
        success: true,
        message: response.data?.message || 'Note deleted successfully'
      };
    } catch (error) {
      console.error('❌ Error deleting note:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message
      };
    }
  }

  // Add a response to a note
  async addResponse(noteId, responseData) {
    try {
      const response = await apiClient.post(
        ENDPOINTS.NOTES.ADD_RESPONSE.replace(':id', noteId),
        responseData
      );

      const note = response.data?.data || response.data;

      console.log('📝 Response added to note:', { noteId, responseData, note });

      return {
        note,
        success: true,
        message: response.data?.message || 'Response added successfully'
      };
    } catch (error) {
      console.error('❌ Error adding response to note:', error);
      return {
        note: null,
        success: false,
        error: error.response?.data?.message || error.message,
        details: error.response?.data?.details || []
      };
    }
  }

  // Get emergency notes (therapists only)
  async getEmergencyNotes() {
    try {
      const response = await apiClient.get(ENDPOINTS.NOTES.EMERGENCY);

      let notes = response.data?.data || response.data || [];

      console.log('🚨 Emergency notes fetched:', { total: notes.length });

      return {
        notes,
        success: true
      };
    } catch (error) {
      console.error('❌ Error fetching emergency notes:', error);
      return {
        notes: [],
        success: false,
        error: error.response?.data?.message || error.message
      };
    }
  }

  // Get notes that require response
  async getPendingResponses() {
    try {
      const response = await apiClient.get(ENDPOINTS.NOTES.PENDING_RESPONSES);

      let notes = response.data?.data || response.data || [];

      console.log('⏳ Pending response notes fetched:', { total: notes.length });

      return {
        notes,
        success: true
      };
    } catch (error) {
      console.error('❌ Error fetching pending response notes:', error);
      return {
        notes: [],
        success: false,
        error: error.response?.data?.message || error.message
      };
    }
  }

  // Hide a note from current user
  async hideNote(noteId, reason = 'Hidden by user') {
    try {
      const response = await apiClient.put(
        ENDPOINTS.NOTES.HIDE.replace(':id', noteId),
        { reason }
      );

      console.log('👁️ Note hidden:', { noteId, reason });

      return {
        success: true,
        message: response.data?.message || 'Note hidden successfully'
      };
    } catch (error) {
      console.error('❌ Error hiding note:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message
      };
    }
  }

  // Get notes for a specific client (convenience method)
  async getClientNotes(clientId, filters = {}) {
    return this.getNotes({
      ...filters,
      client_id: clientId
    });
  }

  // Get notes by author type (convenience method)
  async getNotesByAuthorType(authorType, filters = {}) {
    return this.getNotes({
      ...filters,
      author_type: authorType
    });
  }

  // Get notes by category (convenience method)
  async getNotesByCategory(category, filters = {}) {
    return this.getNotes({
      ...filters,
      category: category
    });
  }

  // Search notes (convenience method)
  async searchNotes(searchTerm, filters = {}) {
    return this.getNotes({
      ...filters,
      search: searchTerm
    });
  }

  // Get note types (utility method)
  getNoteTypes() {
    return [
      { value: 'general', label: 'General' },
      { value: 'progress', label: 'Progress' },
      { value: 'concern', label: 'Concern' },
      { value: 'achievement', label: 'Achievement' },
      { value: 'reminder', label: 'Reminder' },
      { value: 'homework', label: 'Homework' },
      { value: 'reflection', label: 'Reflection' },
      { value: 'goal', label: 'Goal' },
      { value: 'question', label: 'Question' },
      { value: 'feedback', label: 'Feedback' }
    ];
  }

  // Get note categories (utility method)
  getNoteCategories() {
    return [
      { value: 'therapy', label: 'Therapy' },
      { value: 'personal', label: 'Personal' },
      { value: 'medication', label: 'Medication' },
      { value: 'lifestyle', label: 'Lifestyle' },
      { value: 'relationships', label: 'Relationships' },
      { value: 'work', label: 'Work' },
      { value: 'family', label: 'Family' },
      { value: 'emotions', label: 'Emotions' },
      { value: 'symptoms', label: 'Symptoms' },
      { value: 'goals', label: 'Goals' },
      { value: 'other', label: 'Other' }
    ];
  }

  // Get visibility options (utility method)
  getVisibilityOptions() {
    return [
      { value: 'private', label: 'Private (Only me)' },
      { value: 'therapist_only', label: 'Therapist only' },
      { value: 'client_only', label: 'Client only' },
      { value: 'shared', label: 'Shared (Both)' },
      { value: 'restricted', label: 'Restricted' }
    ];
  }

  // Get priority options (utility method)
  getPriorityOptions() {
    return [
      { value: 'low', label: 'Low' },
      { value: 'normal', label: 'Normal' },
      { value: 'high', label: 'High' },
      { value: 'urgent', label: 'Urgent' }
    ];
  }

  // Get status options (utility method)
  getStatusOptions() {
    return [
      { value: 'active', label: 'Active' },
      { value: 'completed', label: 'Completed' },
      { value: 'archived', label: 'Archived' },
      { value: 'draft', label: 'Draft' }
    ];
  }
}

const noteService = new NoteService();
export default noteService;