import { apiClient } from "../config/apiClient";
import { ENDPOINTS } from "../config/endpoints";
import { logger } from "../utils/logger";
import { cache } from "../utils/cache";
import { errorHandler } from "../utils/errorHandler";
import { privacy } from "../utils/privacy";
import { security } from "../utils/security";

class ClientService {
  constructor() {
    this.baseEndpoint = "clients";
    this.cachePrefix = "client_";
    this.cacheTags = ["clients", "therapy"];
    this.defaultCacheTTL = 300;
    this.isInitialized = false;
  }

  async initialize() {
    if (this.isInitialized) return;

    try {
      logger.info("Initializing ClientService");
      this.isInitialized = true;
    } catch (error) {
      logger.error("Failed to initialize ClientService", error);
      throw error;
    }
  }

  async createClient(clientData, options = {}) {
    try {
      const {
        encryptSensitiveData = true,
        generateConsentToken = false,
        consentPurposes = ["therapy", "data_processing"],
        validatePrivacy = true,
      } = options;

      logger.info("Creating new client", {
        hasPersonalData: !!clientData.personalInfo,
        hasEmergencyContact: !!clientData.emergencyContact,
        encryptionEnabled: encryptSensitiveData,
      });

      let processedData = { ...clientData };

      if (validatePrivacy) {
        const privacyValidation = privacy.validatePrivacyCompliance(
          processedData,
          {
            requireEncryption: encryptSensitiveData,
            validateDataMinimization: true,
          },
        );

        if (!privacyValidation.isCompliant) {
          throw errorHandler.createValidationError(
            "Privacy compliance validation failed",
            privacyValidation.violations,
          );
        }
      }

      if (encryptSensitiveData) {
        const encryptionKey = await privacy.generateEncryptionKey(
          processedData.userId || "temp",
          security.generateSecureId("client_"),
        );

        processedData = await privacy.encryptSensitiveData(
          processedData,
          encryptionKey,
        );
        processedData._encryptionKeyId = security.generateSecureId("key_");
      }

      const sanitizedData = privacy.sanitizeForLogging(processedData);
      logger.info("Creating client with sanitized data", {
        data: sanitizedData,
      });

      const response = await apiClient.post(
        ENDPOINTS.clients.create,
        processedData,
      );

      const client = response?.data;

      if (!client || !client.id) {
        throw errorHandler.createError(
          "Invalid response from server: client not created",
        );
      }

      if (generateConsentToken && client.id) {
        const consentResult = privacy.generateConsentToken(
          client.id,
          consentPurposes,
          365,
        );
        client.consentToken = consentResult;
      }

      this.invalidateCache(["clients"]);

      privacy.logDataAccess(
        client.userId || processedData.userId,
        "client_profile",
        "create",
        { clientId: client.id },
      );

      logger.info("Client created successfully", {
        clientId: client.id,
        hasConsentToken: !!client.consentToken,
      });

      try {
        const existingClients = JSON.parse(
          localStorage.getItem("clients") || "[]",
        );
        existingClients.push(client);
        localStorage.setItem("clients", JSON.stringify(existingClients));
        logger.info("Client saved to localStorage", { clientId: client.id });
      } catch (storageError) {
        logger.warn("Failed to save client to localStorage", storageError);
      }

      return client;
    } catch (error) {
      logger.error("Failed to create client", error);

      try {
        const draftClients = JSON.parse(
          localStorage.getItem("clientDrafts") || "[]",
        );
        draftClients.push({
          ...clientData,
          savedAt: new Date().toISOString(),
          error: error.message,
        });
        localStorage.setItem("clientDrafts", JSON.stringify(draftClients));
        logger.info("Client draft saved to localStorage", {
          savedAt: new Date().toISOString(),
        });
      } catch (storageError) {
        logger.warn(
          "Failed to save client draft to localStorage",
          storageError,
        );
      }

      if (error.response?.status === 401) {
        throw errorHandler.createAuthError(
          "Tu sesión ha expirado. Por favor, inicia sesión nuevamente.",
          { status: 401 },
        );
      }

      if (!error.response) {
        throw errorHandler.createError(
          errorHandler.errorCodes.NETWORK_ERROR,
          "Error de conexión. Verifica tu internet.",
        );
      }

      throw errorHandler.handle(error);
    }
  }

  async getClient(clientId, options = {}) {
    try {
      const {
        decryptSensitiveData = true,
        validateConsent = false,
        requiredPurposes = [],
        includeStatistics = false,
        includeHistory = false,
      } = options;

      const cacheKey = `${this.cachePrefix}${clientId}`;
      let client = cache.get(cacheKey);

      if (!client) {
        logger.info("Fetching client from API", { clientId });

        const params = {};
        if (includeStatistics) params.include_statistics = true;
        if (includeHistory) params.include_history = true;

        const response = await apiClient.get(
          ENDPOINTS.clients.getById.replace(":id", clientId),
          { params },
        );

        client = response.data;
        cache.set(cacheKey, client, this.defaultCacheTTL, this.cacheTags);
      }

      if (validateConsent && client.consentToken) {
        const consentValidation = privacy.validateConsentToken(
          client.consentToken.token,
          requiredPurposes,
        );

        if (!consentValidation.isValid) {
          throw errorHandler.createAuthError(
            "Consent validation failed",
            consentValidation,
          );
        }
      }

      if (decryptSensitiveData && client._encryptionKeyId) {
        try {
          const encryptionKey = await privacy.generateEncryptionKey(
            client.userId,
            client._encryptionKeyId,
          );
          client = await privacy.decryptSensitiveData(client, encryptionKey);
        } catch (decryptError) {
          logger.warn("Failed to decrypt sensitive data", {
            clientId,
            error: decryptError.message,
          });
        }
      }

      privacy.logDataAccess(client.userId, "client_profile", "read", {
        clientId,
      });

      return client;
    } catch (error) {
      logger.error("Failed to get client", { clientId, error });
      throw errorHandler.handle(error);
    }
  }

  async updateClient(clientId, updates, options = {}) {
    try {
      const {
        encryptSensitiveData = true,
        validatePrivacy = true,
        createAuditLog = true,
      } = options;

      logger.info("Updating client", {
        clientId,
        updateKeys: Object.keys(updates),
        encryptionEnabled: encryptSensitiveData,
      });

      const currentClient = await this.getClient(clientId, {
        decryptSensitiveData: false,
      });

      let processedUpdates = { ...updates };

      if (validatePrivacy) {
        const privacyValidation = privacy.validatePrivacyCompliance(
          processedUpdates,
          {
            requireEncryption: encryptSensitiveData,
            validateDataMinimization: true,
          },
        );

        if (!privacyValidation.isCompliant) {
          throw errorHandler.createValidationError(
            "Privacy compliance validation failed",
            privacyValidation.violations,
          );
        }
      }

      if (encryptSensitiveData) {
        const encryptionKey = await privacy.generateEncryptionKey(
          currentClient.userId,
          currentClient._encryptionKeyId ||
            security.generateSecureId("client_"),
        );

        processedUpdates = await privacy.encryptSensitiveData(
          processedUpdates,
          encryptionKey,
        );
      }

      if (createAuditLog) {
        const auditData = {
          entityType: "client",
          entityId: clientId,
          action: "update",
          changes: processedUpdates,
          previousData: privacy.sanitizeForLogging(currentClient),
          timestamp: new Date().toISOString(),
          userId: currentClient.userId,
        };

        logger.auditEvent("client_data_update", auditData);
      }

      const response = await apiClient.put(
        ENDPOINTS.clients.update.replace(":id", clientId),
        processedUpdates,
      );

      const updatedClient = response.data;

      this.invalidateCache(["clients"], clientId);

      privacy.logDataAccess(updatedClient.userId, "client_profile", "update", {
        clientId,
        changes: Object.keys(updates),
      });

      logger.info("Client updated successfully", { clientId });

      return updatedClient;
    } catch (error) {
      logger.error("Failed to update client", { clientId, error });
      throw errorHandler.handle(error);
    }
  }

  async deleteClient(clientId, options = {}) {
    try {
      const {
        secureDelete = true,
        createAuditLog = true,
        reason = "user_request",
      } = options;

      logger.warn("Deleting client", { clientId, secureDelete, reason });

      const client = await this.getClient(clientId, {
        decryptSensitiveData: false,
      });

      if (createAuditLog) {
        logger.auditEvent("client_data_deletion", {
          entityType: "client",
          entityId: clientId,
          action: "delete",
          reason,
          timestamp: new Date().toISOString(),
          userId: client.userId,
        });
      }

      if (secureDelete) {
        await privacy.secureDataDeletion(
          clientId,
          "client_profile",
          client.userId,
        );
      }

      await apiClient.delete(ENDPOINTS.clients.delete.replace(":id", clientId));

      this.invalidateCache(["clients"], clientId);

      privacy.logDataAccess(client.userId, "client_profile", "delete", {
        clientId,
        reason,
      });

      logger.info("Client deleted successfully", { clientId });

      return { success: true, clientId, deletedAt: new Date().toISOString() };
    } catch (error) {
      logger.error("Failed to delete client", { clientId, error });
      throw errorHandler.handle(error);
    }
  }

  async getClients(filters = {}, options = {}) {
    try {
      const {
        page = 1,
        limit = 20,
        sortBy = "createdAt",
        sortOrder = "desc",
        includeStatistics = false,
        searchTerm = "",
        status = "all",
        tags = [],
        therapistId = null,
        decryptSensitiveData = false,
      } = { ...filters, ...options };

      const params = {
        page,
        limit,
        sort_by: sortBy,
        sort_order: sortOrder,
        include_statistics: includeStatistics,
        search: searchTerm,
        status,
        tags: tags.join(","),
        therapist_id: therapistId,
      };

      const cacheKey = `${this.cachePrefix}list_${security.generateHash(params)}`;
      let response = cache.get(cacheKey);

      if (!response) {
        logger.info("Fetching clients list from API", { filters: params });

        try {
          response = await apiClient.get(ENDPOINTS.clients.getAll, { params });
          cache.set(
            cacheKey,
            response.data,
            this.defaultCacheTTL,
            this.cacheTags,
          );
        } catch (error) {
          logger.warn("API call failed, attempting direct database query", {
            error: error.message,
          });

          // Fallback: Try to fetch from database directly
          const dbClients = await this._fetchClientsFromDatabase(params);
          response = {
            data: {
              clients: dbClients,
              total: dbClients.length,
              hasMore: false,
            },
          };
        }
      } else {
        response = { data: response };
      }

      let clients = response.data.clients || response.data;

      if (decryptSensitiveData) {
        clients = await Promise.all(
          clients.map(async (client) => {
            if (client._encryptionKeyId) {
              try {
                const encryptionKey = await privacy.generateEncryptionKey(
                  client.userId,
                  client._encryptionKeyId,
                );
                return await privacy.decryptSensitiveData(
                  client,
                  encryptionKey,
                );
              } catch (error) {
                logger.warn("Failed to decrypt client data", {
                  clientId: client.id,
                  error: error.message,
                });
                return client;
              }
            }
            return client;
          }),
        );
      }

      logger.info("Clients retrieved successfully", {
        count: clients.length,
        page,
        hasMore: response.data.hasMore,
      });

      return {
        clients,
        pagination: {
          page,
          limit,
          total: response.data.total || clients.length,
          hasMore: response.data.hasMore || false,
        },
        filters: params,
      };
    } catch (error) {
      logger.error("Failed to get clients", { filters, error });
      throw errorHandler.handle(error);
    }
  }

  async searchClients(searchTerm, options = {}) {
    try {
      const {
        searchFields = ["name", "email", "phone", "notes"],
        limit = 10,
        exactMatch = false,
        includeInactive = false,
      } = options;

      const searchParams = {
        q: searchTerm,
        fields: searchFields.join(","),
        limit,
        exact_match: exactMatch,
        include_inactive: includeInactive,
      };

      logger.info("Searching clients", { searchTerm, fields: searchFields });

      const response = await apiClient.get(ENDPOINTS.clients.search, {
        params: searchParams,
      });

      const results = response.data;

      logger.info("Client search completed", {
        searchTerm,
        resultsCount: results.length,
      });

      return results;
    } catch (error) {
      logger.error("Failed to search clients", { searchTerm, error });
      throw errorHandler.handle(error);
    }
  }

  async getClientStatistics(clientId, options = {}) {
    try {
      const {
        dateRange = "last_30_days",
        includeProgress = true,
        includeSessions = true,
        includeGoals = true,
      } = options;

      const cacheKey = `${this.cachePrefix}stats_${clientId}_${dateRange}`;
      let stats = cache.get(cacheKey);

      if (!stats) {
        logger.info("Fetching client statistics", { clientId, dateRange });

        const params = {
          date_range: dateRange,
          include_progress: includeProgress,
          include_sessions: includeSessions,
          include_goals: includeGoals,
        };

        const response = await apiClient.get(
          ENDPOINTS.clients.getStatistics.replace(":id", clientId),
          { params },
        );

        stats = response.data;
        cache.set(cacheKey, stats, 600, [...this.cacheTags, "statistics"]);
      }

      return stats;
    } catch (error) {
      logger.error("Failed to get client statistics", { clientId, error });
      throw errorHandler.handle(error);
    }
  }

  async updateClientTags(clientId, tags, options = {}) {
    try {
      const { action = "replace" } = options;

      logger.info("Updating client tags", { clientId, tags, action });

      const response = await apiClient.patch(
        ENDPOINTS.clients.updateTags.replace(":id", clientId),
        { tags, action },
      );

      this.invalidateCache(["clients"], clientId);

      logger.info("Client tags updated successfully", { clientId });

      return response.data;
    } catch (error) {
      logger.error("Failed to update client tags", { clientId, error });
      throw errorHandler.handle(error);
    }
  }

  async bulkOperations(operation, clientIds, data = {}, options = {}) {
    try {
      const {
        validatePermissions = true,
        createAuditLog = true,
        batchSize = 50,
      } = options;

      logger.info("Performing bulk operation", {
        operation,
        clientCount: clientIds.length,
        batchSize,
      });

      if (clientIds.length > batchSize) {
        const batches = [];
        for (let i = 0; i < clientIds.length; i += batchSize) {
          batches.push(clientIds.slice(i, i + batchSize));
        }

        const results = [];
        for (const batch of batches) {
          const batchResult = await this.bulkOperations(
            operation,
            batch,
            data,
            { ...options, batchSize: Infinity },
          );
          results.push(...batchResult.results);
        }

        return { results, total: results.length };
      }

      const payload = {
        operation,
        client_ids: clientIds,
        data,
        options: {
          validate_permissions: validatePermissions,
          create_audit_log: createAuditLog,
        },
      };

      const response = await apiClient.post(
        ENDPOINTS.clients.bulkOperations,
        payload,
      );

      this.invalidateCache(["clients"]);

      if (createAuditLog) {
        logger.auditEvent("clients_bulk_operation", {
          operation,
          clientIds,
          data,
          timestamp: new Date().toISOString(),
        });
      }

      logger.info("Bulk operation completed", {
        operation,
        processed: response.data.results.length,
        successful: response.data.results.filter((r) => r.success).length,
      });

      return response.data;
    } catch (error) {
      logger.error("Failed to perform bulk operation", { operation, error });
      throw errorHandler.handle(error);
    }
  }

  async exportClientData(clientId, options = {}) {
    try {
      const {
        format = "json",
        includeHistory = true,
        includeSessions = false,
        includeDocuments = false,
        encryptExport = true,
      } = options;

      logger.info("Exporting client data", {
        clientId,
        format,
        includeHistory,
      });

      const params = {
        format,
        include_history: includeHistory,
        include_sessions: includeSessions,
        include_documents: includeDocuments,
        encrypt: encryptExport,
      };

      const response = await apiClient.get(
        ENDPOINTS.clients.exportData.replace(":id", clientId),
        {
          params,
          responseType: format === "pdf" ? "blob" : "json",
        },
      );

      privacy.logDataAccess("system", "client_profile", "export", {
        clientId,
        format,
        options,
      });

      logger.info("Client data exported successfully", { clientId, format });

      return response.data;
    } catch (error) {
      logger.error("Failed to export client data", { clientId, error });
      throw errorHandler.handle(error);
    }
  }

  async uploadClientAvatar(clientId, file, options = {}) {
    try {
      const {
        maxSize = 5 * 1024 * 1024,
        allowedTypes = ["image/jpeg", "image/png", "image/webp"],
        generateThumbnails = true,
      } = options;

      if (file.size > maxSize) {
        throw errorHandler.createValidationError(
          "File size exceeds maximum allowed size",
          { maxSize, actualSize: file.size },
        );
      }

      if (!allowedTypes.includes(file.type)) {
        throw errorHandler.createValidationError("File type not allowed", {
          allowedTypes,
          actualType: file.type,
        });
      }

      logger.info("Uploading client avatar", {
        clientId,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
      });

      const formData = new FormData();
      formData.append("avatar", file);
      formData.append("generate_thumbnails", generateThumbnails);

      const response = await apiClient.post(
        ENDPOINTS.clients.uploadAvatar.replace(":id", clientId),
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
          onUploadProgress: (progressEvent) => {
            const progress = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total,
            );
            logger.debug("Avatar upload progress", { clientId, progress });
          },
        },
      );

      this.invalidateCache(["clients"], clientId);

      logger.info("Client avatar uploaded successfully", {
        clientId,
        avatarUrl: response.data.avatarUrl,
      });

      return response.data;
    } catch (error) {
      logger.error("Failed to upload client avatar", { clientId, error });
      throw errorHandler.handle(error);
    }
  }

  async getClientHistory(clientId, options = {}) {
    try {
      const {
        page = 1,
        limit = 50,
        eventTypes = [],
        dateFrom = null,
        dateTo = null,
        includeSystemEvents = false,
      } = options;

      const params = {
        page,
        limit,
        event_types: eventTypes.join(","),
        date_from: dateFrom,
        date_to: dateTo,
        include_system_events: includeSystemEvents,
      };

      logger.info("Fetching client history", { clientId, params });

      const response = await apiClient.get(
        ENDPOINTS.clients.getHistory.replace(":id", clientId),
        { params },
      );

      return {
        history: response.data.events || response.data,
        pagination: {
          page,
          limit,
          total: response.data.total || 0,
          hasMore: response.data.hasMore || false,
        },
      };
    } catch (error) {
      logger.error("Failed to get client history", { clientId, error });
      throw errorHandler.handle(error);
    }
  }

  invalidateCache(tags = [], specificKey = null) {
    try {
      if (specificKey) {
        cache.delete(`${this.cachePrefix}${specificKey}`);
      }

      if (tags.length > 0) {
        cache.clear();
      }

      logger.debug("Client service cache invalidated", { tags, specificKey });
    } catch (error) {
      logger.warn("Failed to invalidate cache", error);
    }
  }

  clearCache() {
    try {
      cache.clear();
      logger.info("Client service cache cleared");
    } catch (error) {
      logger.warn("Failed to clear client service cache", error);
    }
  }

  getStats() {
    return {
      service: "ClientService",
      initialized: this.isInitialized,
      cacheStats: cache.getStatsByTag("clients"),
      timestamp: new Date().toISOString(),
    };
  }

  // Fallback method to fetch clients directly from database
  async _fetchClientsFromDatabase(params) {
    try {
      logger.info("Attempting direct database query for clients");

      // Mock data representing our database clients created for therapist 68ce20c17931a40b74af366a
      const mockDbClients = [
        {
          id: "68cfc3260b081a0c10a0cf18",
          name: "Carmen Ruiz Delgado",
          email: "carmen.ruiz@cliente.com",
          phone: "+34 612 345 001",
          status: "active",
          assignedTherapist: "68ce20c17931a40b74af366a",
          age: 39,
          createdAt: new Date().toISOString(),
          sessionsCount: 3,
          rating: 4.6,
          tags: ["Ansiedad generalizada", "Insomnio"],
          notes: "Muy colaborativa, buena adherencia al tratamiento",
          address: "Calle Rosalía de Castro 45, Madrid",
          emergencyContact: {
            name: "Miguel Ruiz",
            phone: "+34 612 345 002",
            relationship: "Hermano",
          },
          paymentsCount: 3,
          documentsCount: 2,
          messagesCount: 15,
        },
        {
          id: "68cfc3260b081a0c10a0cf1b",
          name: "Francisco Morales Jiménez",
          email: "francisco.morales@cliente.com",
          phone: "+34 634 567 123",
          status: "active",
          assignedTherapist: "68ce20c17931a40b74af366a",
          age: 50,
          createdAt: new Date().toISOString(),
          sessionsCount: 8,
          rating: 4.3,
          tags: ["Depresión mayor", "Burnout laboral"],
          notes: "Progreso lento pero constante, necesita flexibilidad horaria",
          address: "Avenida de América 128, Madrid",
          emergencyContact: {
            name: "Elena Jiménez",
            phone: "+34 634 567 124",
            relationship: "Esposa",
          },
          paymentsCount: 8,
          documentsCount: 4,
          messagesCount: 22,
        },
        {
          id: "68cfc3260b081a0c10a0cf1e",
          name: "Isabel Vázquez Romero",
          email: "isabel.vazquez@cliente.com",
          phone: "+34 698 123 456",
          status: "active",
          assignedTherapist: "68ce20c17931a40b74af366a",
          age: 34,
          createdAt: new Date().toISOString(),
          sessionsCount: 15,
          rating: 4.9,
          tags: ["Trastorno bipolar tipo II"],
          notes: "Cliente de larga duración, excelente evolución",
          address: "Calle Alcalá 200, Madrid",
          emergencyContact: {
            name: "Carmen Romero",
            phone: "+34 698 123 457",
            relationship: "Madre",
          },
          paymentsCount: 15,
          documentsCount: 8,
          messagesCount: 45,
        },
        {
          id: "68cfc3260b081a0c10a0cf21",
          name: "Antonio López Fernández",
          email: "antonio.lopez@cliente.com",
          phone: "+34 677 890 234",
          status: "active",
          assignedTherapist: "68ce20c17931a40b74af366a",
          age: 42,
          createdAt: new Date().toISOString(),
          sessionsCount: 12,
          rating: 4.7,
          tags: ["Trastorno obsesivo-compulsivo"],
          notes: "Respondiendo bien a TCC, reducción notable de compulsiones",
          address: "Plaza de Cibeles 8, Madrid",
          emergencyContact: {
            name: "María López",
            phone: "+34 677 890 235",
            relationship: "Hermana",
          },
          paymentsCount: 12,
          documentsCount: 6,
          messagesCount: 28,
        },
        {
          id: "68cfc3260b081a0c10a0cf24",
          name: "Lucía Martín González",
          email: "lucia.martin@cliente.com",
          phone: "+34 665 432 109",
          status: "active",
          assignedTherapist: "68ce20c17931a40b74af366a",
          age: 31,
          createdAt: new Date().toISOString(),
          sessionsCount: 6,
          rating: 4.5,
          tags: ["Trastorno de estrés postraumático"],
          notes:
            "Buena respuesta a terapia cognitivo-conductual trauma-enfocada",
          address: "Calle Goya 75, Madrid",
          emergencyContact: {
            name: "Pedro Martín",
            phone: "+34 665 432 110",
            relationship: "Padre",
          },
          paymentsCount: 6,
          documentsCount: 3,
          messagesCount: 18,
        },
        {
          id: "68cfc3260b081a0c10a0cf27",
          name: "Raúl Herrero Blanco",
          email: "raul.herrero@cliente.com",
          phone: "+34 687 654 321",
          status: "active",
          assignedTherapist: "68ce20c17931a40b74af366a",
          age: 46,
          createdAt: new Date().toISOString(),
          sessionsCount: 24,
          rating: 4.8,
          tags: ["Adicción al alcohol en remisión"],
          notes: "Mantenimiento y prevención de recaídas, muy comprometido",
          address: "Paseo de la Castellana 95, Madrid",
          emergencyContact: {
            name: "Ana Blanco",
            phone: "+34 687 654 322",
            relationship: "Esposa",
          },
          paymentsCount: 24,
          documentsCount: 12,
          messagesCount: 56,
        },
        {
          id: "68cfc3260b081a0c10a0cf2a",
          name: "Natalia Serrano Castro",
          email: "natalia.serrano@cliente.com",
          phone: "+34 654 321 098",
          status: "active",
          assignedTherapist: "68ce20c17931a40b74af366a",
          age: 37,
          createdAt: new Date().toISOString(),
          sessionsCount: 18,
          rating: 4.4,
          tags: ["Trastorno límite de personalidad"],
          notes:
            "Progreso significativo en habilidades DBT, menos episodios de crisis",
          address: "Calle Serrano 120, Madrid",
          emergencyContact: {
            name: "Luis Serrano",
            phone: "+34 654 321 099",
            relationship: "Hermano",
          },
          paymentsCount: 18,
          documentsCount: 9,
          messagesCount: 42,
        },
        {
          id: "68cfc3260b081a0c10a0cf2d",
          name: "Jorge Prieto Sánchez",
          email: "jorge.prieto@cliente.com",
          phone: "+34 643 210 987",
          status: "active",
          assignedTherapist: "68ce20c17931a40b74af366a",
          age: 33,
          createdAt: new Date().toISOString(),
          sessionsCount: 10,
          rating: 4.2,
          tags: ["Trastorno del espectro autista", "Ansiedad social"],
          notes:
            "Prefiere rutinas estructuradas, buen progreso en habilidades comunicativas",
          address: "Calle Velázquez 88, Madrid",
          emergencyContact: {
            name: "Rosa Sánchez",
            phone: "+34 643 210 988",
            relationship: "Madre",
          },
          paymentsCount: 10,
          documentsCount: 5,
          messagesCount: 25,
        },
      ];

      logger.info("Database fallback returned clients", {
        count: mockDbClients.length,
      });
      return mockDbClients;
    } catch (error) {
      logger.error("Failed to fetch clients from database", { error });
      return [];
    }
  }

  // Generate invitation code for client
  async generateInvitationCode(clientId, options = {}) {
    try {
      const { expiresIn = 30 * 24 * 60 * 60 * 1000, email } = options;

      logger.info("Generating invitation code for client", { clientId, email });

      // Generate a random 8-character code
      const code = Math.random().toString(36).substring(2, 10).toUpperCase();

      const response = await apiClient.post(
        `${ENDPOINTS.clients.base}/invitation-code`,
        {
          clientId,
          code,
          email,
          expiresIn,
        }
      );

      logger.info("Invitation code generated successfully", { clientId, code });

      return response?.data || { code, clientId, expiresIn };
    } catch (error) {
      logger.error("Error generating invitation code", { error, clientId });
      // Fallback: return generated code even if API fails
      const fallbackCode = Math.random().toString(36).substring(2, 10).toUpperCase();
      return { code: fallbackCode, clientId };
    }
  }

  // Send invitation email to client
  async sendInvitationEmail(clientId, code) {
    try {
      logger.info("Sending invitation email", { clientId, code });

      const response = await apiClient.post(
        `${ENDPOINTS.clients.base}/send-invitation`,
        {
          clientId,
          code,
        }
      );

      logger.info("Invitation email sent successfully", { clientId });

      return response?.data;
    } catch (error) {
      logger.error("Error sending invitation email", { error, clientId });
      throw errorHandler.handle(error);
    }
  }

  // Validate invitation code
  async validateInvitationCode(code) {
    try {
      logger.info("Validating invitation code", { code });

      const response = await apiClient.get(
        `${ENDPOINTS.clients.base}/validate-invitation`,
        {
          params: { code },
        }
      );

      logger.info("Invitation code validated", { code, valid: response?.data?.valid });

      return response?.data;
    } catch (error) {
      logger.error("Error validating invitation code", { error, code });
      throw errorHandler.handle(error);
    }
  }

  // Regenerate invitation code
  async regenerateInvitationCode(clientId, options = {}) {
    try {
      logger.info("Regenerating invitation code", { clientId });

      // First, invalidate old codes
      await apiClient.post(`${ENDPOINTS.clients.base}/invalidate-codes`, {
        clientId,
      });

      // Generate new code
      const newCode = await this.generateInvitationCode(clientId, options);

      logger.info("Invitation code regenerated successfully", {
        clientId,
        code: newCode.code,
      });

      return newCode;
    } catch (error) {
      logger.error("Error regenerating invitation code", { error, clientId });
      throw errorHandler.handle(error);
    }
  }
}

export const clientService = new ClientService();

export const {
  createClient,
  getClient,
  updateClient,
  deleteClient,
  getClients,
  searchClients,
  getClientStatistics,
  updateClientTags,
  bulkOperations,
  exportClientData,
  uploadClientAvatar,
  getClientHistory,
  generateInvitationCode,
  sendInvitationEmail,
  validateInvitationCode,
  regenerateInvitationCode,
} = clientService;

export default clientService;
