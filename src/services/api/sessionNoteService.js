import { apiClient } from '../config/apiClient';
import { ENDPOINTS } from '../config/endpoints';
import { logger } from '../utils/logger';
import { cache } from '../utils/cache';
import { errorHandler } from '../utils/errorHandler';
import { privacy } from '../utils/privacy';
import { security } from '../utils/security';

class SessionNoteService {
  constructor() {
    this.baseEndpoint = 'session-notes';
    this.cachePrefix = 'session_note_';
    this.cacheTags = ['sessions', 'notes', 'therapy'];
    this.defaultCacheTTL = 300;
    this.isInitialized = false;

    this.noteTypes = {
      GENERAL: 'general',
      ASSESSMENT: 'assessment',
      INTERVENTION: 'intervention',
      PROGRESS: 'progress',
      HOMEWORK: 'homework',
      CRISIS: 'crisis',
      TERMINATION: 'termination'
    };

    this.moodLevels = {
      VERY_LOW: 1,
      LOW: 2,
      NEUTRAL: 3,
      GOOD: 4,
      VERY_GOOD: 5
    };

    this.confidentialityLevels = {
      LOW: 'low',
      MEDIUM: 'medium',
      HIGH: 'high',
      RESTRICTED: 'restricted'
    };

    this.sessionOutcomes = {
      POSITIVE: 'positive',
      NEUTRAL: 'neutral',
      CHALLENGING: 'challenging',
      BREAKTHROUGH: 'breakthrough',
      SETBACK: 'setback'
    };
  }

  async initialize() {
    if (this.isInitialized) return;

    try {
      logger.info('Initializing SessionNoteService');
      this.isInitialized = true;
    } catch (error) {
      logger.error('Failed to initialize SessionNoteService', error);
      throw error;
    }
  }

  async createSessionNote(noteData, options = {}) {
    try {
      const {
        encryptSensitiveData = true,
        validatePrivacy = true,
        createAuditLog = true,
        confidentialityLevel = this.confidentialityLevels.HIGH,
        requireConsent = true
      } = options;

      logger.info('Creating session note', {
        clientId: noteData.clientId,
        sessionId: noteData.sessionId,
        noteType: noteData.type,
        confidentialityLevel
      });

      if (requireConsent && noteData.clientId) {
        const consentValidation = privacy.validateConsentToken(
          noteData.consentToken,
          ['therapy', 'session_notes', 'data_processing']
        );

        if (!consentValidation.isValid) {
          throw errorHandler.createAuthError(
            'Valid consent required for session notes',
            consentValidation
          );
        }
      }

      let processedData = {
        ...noteData,
        confidentialityLevel,
        createdAt: new Date().toISOString(),
        noteId: security.generateSecureId('note_'),
        lastModifiedAt: new Date().toISOString(),
        version: 1
      };

      if (validatePrivacy) {
        const privacyValidation = privacy.validatePrivacyCompliance(processedData, {
          requireEncryption: encryptSensitiveData,
          validateDataMinimization: true,
          allowSensitiveFields: ['notes', 'observations', 'interventions']
        });

        if (!privacyValidation.isCompliant) {
          throw errorHandler.createValidationError(
            'Privacy compliance validation failed',
            privacyValidation.violations
          );
        }
      }

      if (encryptSensitiveData) {
        const encryptionKey = await privacy.generateEncryptionKey(
          noteData.clientId,
          processedData.noteId
        );

        processedData = await privacy.encryptSensitiveData(processedData, encryptionKey);
        processedData._encryptionKeyId = processedData.noteId;
      }

      const sanitizedData = privacy.sanitizeForLogging(processedData);
      logger.info('Creating session note with sanitized data', { data: sanitizedData });

      const response = await apiClient.post(
        ENDPOINTS.sessionNotes.create,
        processedData
      );

      const note = response.data;

      this.invalidateCache(['sessions', 'notes'], noteData.clientId);

      if (createAuditLog) {
        logger.auditEvent('session_note_created', {
          entityType: 'session_note',
          entityId: note.id,
          clientId: noteData.clientId,
          sessionId: noteData.sessionId,
          action: 'create',
          confidentialityLevel,
          timestamp: new Date().toISOString()
        });
      }

      privacy.logDataAccess(
        noteData.clientId,
        'session_note',
        'create',
        {
          noteId: note.id,
          sessionId: noteData.sessionId,
          confidentialityLevel
        }
      );

      logger.info('Session note created successfully', {
        noteId: note.id,
        clientId: noteData.clientId
      });

      return note;
    } catch (error) {
      logger.error('Failed to create session note', error);
      throw errorHandler.handle(error);
    }
  }

  async getSessionNote(noteId, options = {}) {
    try {
      const {
        decryptSensitiveData = true,
        validateAccess = true,
        requiredPurposes = ['therapy', 'session_notes'],
        includeHistory = false
      } = options;

      const cacheKey = `${this.cachePrefix}${noteId}`;
      let note = cache.get(cacheKey);

      if (!note) {
        logger.info('Fetching session note from API', { noteId });

        const params = {
          include_history: includeHistory
        };

        const response = await apiClient.get(
          ENDPOINTS.sessionNotes.getById.replace(':id', noteId),
          { params }
        );

        note = response.data;
        cache.set(cacheKey, note, this.defaultCacheTTL, this.cacheTags);
      }

      if (validateAccess && note.consentToken) {
        const consentValidation = privacy.validateConsentToken(
          note.consentToken,
          requiredPurposes
        );

        if (!consentValidation.isValid) {
          throw errorHandler.createAuthError(
            'Access denied: consent validation failed',
            consentValidation
          );
        }
      }

      if (decryptSensitiveData && note._encryptionKeyId) {
        try {
          const encryptionKey = await privacy.generateEncryptionKey(
            note.clientId,
            note._encryptionKeyId
          );
          note = await privacy.decryptSensitiveData(note, encryptionKey);
        } catch (decryptError) {
          logger.warn('Failed to decrypt session note data', {
            noteId,
            error: decryptError.message
          });
        }
      }

      privacy.logDataAccess(
        note.clientId,
        'session_note',
        'read',
        {
          noteId,
          sessionId: note.sessionId,
          confidentialityLevel: note.confidentialityLevel
        }
      );

      return note;
    } catch (error) {
      logger.error('Failed to get session note', { noteId, error });
      throw errorHandler.handle(error);
    }
  }

  async updateSessionNote(noteId, updates, options = {}) {
    try {
      const {
        encryptSensitiveData = true,
        validatePrivacy = true,
        createAuditLog = true,
        incrementVersion = true
      } = options;

      logger.info('Updating session note', {
        noteId,
        updateKeys: Object.keys(updates)
      });

      const currentNote = await this.getSessionNote(noteId, { decryptSensitiveData: false });

      let processedUpdates = { ...updates };

      if (incrementVersion) {
        processedUpdates.version = (currentNote.version || 1) + 1;
        processedUpdates.lastModifiedAt = new Date().toISOString();
      }

      if (validatePrivacy) {
        const privacyValidation = privacy.validatePrivacyCompliance(processedUpdates, {
          requireEncryption: encryptSensitiveData,
          validateDataMinimization: true,
          allowSensitiveFields: ['notes', 'observations', 'interventions']
        });

        if (!privacyValidation.isCompliant) {
          throw errorHandler.createValidationError(
            'Privacy compliance validation failed',
            privacyValidation.violations
          );
        }
      }

      if (encryptSensitiveData) {
        const encryptionKey = await privacy.generateEncryptionKey(
          currentNote.clientId,
          currentNote._encryptionKeyId || noteId
        );

        processedUpdates = await privacy.encryptSensitiveData(processedUpdates, encryptionKey);
      }

      if (createAuditLog) {
        const auditData = {
          entityType: 'session_note',
          entityId: noteId,
          action: 'update',
          changes: processedUpdates,
          previousData: privacy.sanitizeForLogging(currentNote),
          timestamp: new Date().toISOString(),
          clientId: currentNote.clientId,
          sessionId: currentNote.sessionId
        };

        logger.auditEvent('session_note_updated', auditData);
      }

      const response = await apiClient.put(
        ENDPOINTS.sessionNotes.update.replace(':id', noteId),
        processedUpdates
      );

      const updatedNote = response.data;

      this.invalidateCache(['sessions', 'notes'], currentNote.clientId);

      privacy.logDataAccess(
        currentNote.clientId,
        'session_note',
        'update',
        {
          noteId,
          sessionId: currentNote.sessionId,
          changes: Object.keys(updates)
        }
      );

      logger.info('Session note updated successfully', { noteId });

      return updatedNote;
    } catch (error) {
      logger.error('Failed to update session note', { noteId, error });
      throw errorHandler.handle(error);
    }
  }

  async deleteSessionNote(noteId, options = {}) {
    try {
      const {
        secureDelete = true,
        createAuditLog = true,
        reason = 'user_request',
        retentionPeriod = 0
      } = options;

      logger.warn('Deleting session note', { noteId, secureDelete, reason });

      const note = await this.getSessionNote(noteId, { decryptSensitiveData: false });

      if (createAuditLog) {
        logger.auditEvent('session_note_deletion', {
          entityType: 'session_note',
          entityId: noteId,
          action: 'delete',
          reason,
          retentionPeriod,
          timestamp: new Date().toISOString(),
          clientId: note.clientId,
          sessionId: note.sessionId
        });
      }

      if (secureDelete) {
        await privacy.secureDataDeletion(noteId, 'session_note', note.clientId);
      }

      const response = await apiClient.delete(
        ENDPOINTS.sessionNotes.delete.replace(':id', noteId),
        { data: { reason, retention_period: retentionPeriod } }
      );

      this.invalidateCache(['sessions', 'notes'], note.clientId);

      privacy.logDataAccess(
        note.clientId,
        'session_note',
        'delete',
        {
          noteId,
          sessionId: note.sessionId,
          reason
        }
      );

      logger.info('Session note deleted successfully', { noteId });

      return {
        success: true,
        noteId,
        deletedAt: new Date().toISOString(),
        reason
      };
    } catch (error) {
      logger.error('Failed to delete session note', { noteId, error });
      throw errorHandler.handle(error);
    }
  }

  async getSessionNotes(filters = {}, options = {}) {
    try {
      const {
        clientId = null,
        sessionId = null,
        noteType = null,
        dateFrom = null,
        dateTo = null,
        page = 1,
        limit = 20,
        sortBy = 'createdAt',
        sortOrder = 'desc',
        confidentialityLevel = null,
        decryptSensitiveData = false,
        searchTerm = ''
      } = { ...filters, ...options };

      const params = {
        client_id: clientId,
        session_id: sessionId,
        note_type: noteType,
        date_from: dateFrom,
        date_to: dateTo,
        page,
        limit,
        sort_by: sortBy,
        sort_order: sortOrder,
        confidentiality_level: confidentialityLevel,
        search: searchTerm
      };

      const cacheKey = `${this.cachePrefix}list_${security.generateHash(params)}`;
      let response = cache.get(cacheKey);

      if (!response) {
        logger.info('Fetching session notes from API', { filters: params });

        response = await apiClient.get(ENDPOINTS.SESSION_NOTES.LIST, { params });
        cache.set(cacheKey, response.data, this.defaultCacheTTL, this.cacheTags);
      } else {
        response = { data: response };
      }

      let notes = response.data.notes || response.data;

      if (decryptSensitiveData) {
        notes = await Promise.all(
          notes.map(async (note) => {
            if (note._encryptionKeyId) {
              try {
                const encryptionKey = await privacy.generateEncryptionKey(
                  note.clientId,
                  note._encryptionKeyId
                );
                return await privacy.decryptSensitiveData(note, encryptionKey);
              } catch (error) {
                logger.warn('Failed to decrypt session note data', {
                  noteId: note.id,
                  error: error.message
                });
                return note;
              }
            }
            return note;
          })
        );
      }

      logger.info('Session notes retrieved successfully', {
        count: notes.length,
        page,
        hasMore: response.data.hasMore
      });

      return {
        notes,
        pagination: {
          page,
          limit,
          total: response.data.total || notes.length,
          hasMore: response.data.hasMore || false
        },
        filters: params
      };
    } catch (error) {
      logger.error('Failed to get session notes', { filters, error });
      throw errorHandler.handle(error);
    }
  }

  async recordMoodEvaluation(noteId, moodData, options = {}) {
    try {
      const {
        encryptSensitiveData = true,
        createProgressEntry = true
      } = options;

      logger.info('Recording mood evaluation', {
        noteId,
        moodLevel: moodData.level,
        hasNotes: !!moodData.notes
      });

      let processedData = {
        noteId,
        ...moodData,
        recordedAt: new Date().toISOString(),
        evaluationId: security.generateSecureId('mood_')
      };

      if (encryptSensitiveData && moodData.notes) {
        const encryptionKey = await privacy.generateEncryptionKey(
          'system',
          processedData.evaluationId
        );

        processedData = await privacy.encryptSensitiveData(processedData, encryptionKey);
        processedData._encryptionKeyId = processedData.evaluationId;
      }

      const response = await apiClient.post(
        ENDPOINTS.sessionNotes.recordMoodEvaluation.replace(':noteId', noteId),
        processedData
      );

      const evaluation = response.data;

      this.invalidateCache(['sessions', 'notes'], null);

      logger.auditEvent('mood_evaluation_recorded', {
        entityType: 'mood_evaluation',
        entityId: evaluation.id,
        noteId,
        action: 'record',
        moodLevel: moodData.level,
        timestamp: new Date().toISOString()
      });

      logger.info('Mood evaluation recorded successfully', {
        evaluationId: evaluation.id,
        noteId
      });

      return evaluation;
    } catch (error) {
      logger.error('Failed to record mood evaluation', { noteId, error });
      throw errorHandler.handle(error);
    }
  }

  async addIntervention(noteId, interventionData, options = {}) {
    try {
      const {
        encryptSensitiveData = true,
        validateTechnique = true
      } = options;

      logger.info('Adding intervention to session note', {
        noteId,
        technique: interventionData.technique,
        duration: interventionData.duration
      });

      let processedData = {
        noteId,
        ...interventionData,
        addedAt: new Date().toISOString(),
        interventionId: security.generateSecureId('intervention_')
      };

      if (encryptSensitiveData) {
        const encryptionKey = await privacy.generateEncryptionKey(
          'system',
          processedData.interventionId
        );

        processedData = await privacy.encryptSensitiveData(processedData, encryptionKey);
        processedData._encryptionKeyId = processedData.interventionId;
      }

      const response = await apiClient.post(
        ENDPOINTS.sessionNotes.addIntervention.replace(':noteId', noteId),
        processedData
      );

      const intervention = response.data;

      this.invalidateCache(['sessions', 'notes'], null);

      logger.auditEvent('intervention_added', {
        entityType: 'intervention',
        entityId: intervention.id,
        noteId,
        action: 'add',
        technique: interventionData.technique,
        timestamp: new Date().toISOString()
      });

      logger.info('Intervention added successfully', {
        interventionId: intervention.id,
        noteId
      });

      return intervention;
    } catch (error) {
      logger.error('Failed to add intervention', { noteId, error });
      throw errorHandler.handle(error);
    }
  }

  async assignHomework(noteId, homeworkData, options = {}) {
    try {
      const {
        encryptSensitiveData = true,
        setReminder = true,
        dueDate = null
      } = options;

      logger.info('Assigning homework', {
        noteId,
        title: homeworkData.title,
        dueDate
      });

      let processedData = {
        noteId,
        ...homeworkData,
        assignedAt: new Date().toISOString(),
        dueDate: dueDate || homeworkData.dueDate,
        homeworkId: security.generateSecureId('homework_'),
        status: 'assigned'
      };

      if (encryptSensitiveData) {
        const encryptionKey = await privacy.generateEncryptionKey(
          'system',
          processedData.homeworkId
        );

        processedData = await privacy.encryptSensitiveData(processedData, encryptionKey);
        processedData._encryptionKeyId = processedData.homeworkId;
      }

      const response = await apiClient.post(
        ENDPOINTS.sessionNotes.assignHomework.replace(':noteId', noteId),
        processedData
      );

      const homework = response.data;

      this.invalidateCache(['sessions', 'notes'], null);

      logger.auditEvent('homework_assigned', {
        entityType: 'homework',
        entityId: homework.id,
        noteId,
        action: 'assign',
        dueDate: processedData.dueDate,
        timestamp: new Date().toISOString()
      });

      logger.info('Homework assigned successfully', {
        homeworkId: homework.id,
        noteId
      });

      return homework;
    } catch (error) {
      logger.error('Failed to assign homework', { noteId, error });
      throw errorHandler.handle(error);
    }
  }

  async searchNotes(searchTerm, options = {}) {
    try {
      const {
        clientId = null,
        searchFields = ['title', 'notes', 'observations'],
        limit = 20,
        confidentialityLevel = null,
        exactMatch = false,
        dateRange = null
      } = options;

      const searchParams = {
        q: searchTerm,
        client_id: clientId,
        fields: searchFields.join(','),
        limit,
        confidentiality_level: confidentialityLevel,
        exact_match: exactMatch,
        date_range: dateRange
      };

      logger.info('Searching session notes', {
        searchTerm,
        clientId,
        fields: searchFields
      });

      const response = await apiClient.get(ENDPOINTS.sessionNotes.search, {
        params: searchParams
      });

      const results = response.data;

      privacy.logDataAccess(
        clientId || 'system',
        'session_note',
        'search',
        {
          searchTerm: searchTerm.substring(0, 50),
          resultsCount: results.length
        }
      );

      logger.info('Session notes search completed', {
        searchTerm,
        resultsCount: results.length
      });

      return results;
    } catch (error) {
      logger.error('Failed to search session notes', { searchTerm, error });
      throw errorHandler.handle(error);
    }
  }

  async generateSessionReport(sessionId, options = {}) {
    try {
      const {
        format = 'json',
        includeNotes = true,
        includeMoodEvaluations = true,
        includeInterventions = true,
        includeHomework = true,
        includeStatistics = false
      } = options;

      logger.info('Generating session report', { sessionId, format });

      const params = {
        format,
        include_notes: includeNotes,
        include_mood_evaluations: includeMoodEvaluations,
        include_interventions: includeInterventions,
        include_homework: includeHomework,
        include_statistics: includeStatistics
      };

      const response = await apiClient.get(
        ENDPOINTS.sessionNotes.generateSessionReport.replace(':sessionId', sessionId),
        {
          params,
          responseType: format === 'pdf' ? 'blob' : 'json'
        }
      );

      privacy.logDataAccess(
        'system',
        'session_report',
        'generate',
        { sessionId, format }
      );

      logger.info('Session report generated successfully', { sessionId, format });

      return response.data;
    } catch (error) {
      logger.error('Failed to generate session report', { sessionId, error });
      throw errorHandler.handle(error);
    }
  }

  invalidateCache(tags = [], specificClientId = null) {
    try {
      if (specificClientId) {
        cache.deleteByPattern(`${this.cachePrefix}*${specificClientId}*`);
      }

      tags.forEach(tag => {
        cache.deleteByTag(tag);
      });

      logger.debug('Session note service cache invalidated', { tags, specificClientId });
    } catch (error) {
      logger.warn('Failed to invalidate cache', error);
    }
  }

  clearCache() {
    try {
      cache.deleteByTag('sessions');
      cache.deleteByTag('notes');
      logger.info('Session note service cache cleared');
    } catch (error) {
      logger.warn('Failed to clear session note service cache', error);
    }
  }

  getStats() {
    return {
      service: 'SessionNoteService',
      initialized: this.isInitialized,
      cacheStats: {
        sessions: cache.getStatsByTag('sessions'),
        notes: cache.getStatsByTag('notes')
      },
      constants: {
        noteTypes: this.noteTypes,
        moodLevels: this.moodLevels,
        confidentialityLevels: this.confidentialityLevels,
        sessionOutcomes: this.sessionOutcomes
      },
      timestamp: new Date().toISOString()
    };
  }
}

export const sessionNoteService = new SessionNoteService();

export const {
  createSessionNote,
  getSessionNote,
  updateSessionNote,
  deleteSessionNote,
  getSessionNotes,
  recordMoodEvaluation,
  addIntervention,
  assignHomework,
  searchNotes,
  generateSessionReport
} = sessionNoteService;

export default sessionNoteService;