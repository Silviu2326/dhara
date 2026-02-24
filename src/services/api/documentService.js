import { apiClient } from '../config/apiClient';
import { ENDPOINTS } from '../config/endpoints';
import { errorHandler } from '../utils/errorHandler';
import { logger } from '../utils/logger';
import { cache, apiCache } from '../utils/cache';
import { privacy, encryptSensitiveData, decryptSensitiveData } from '../utils/privacy';
import { security, generateSecureId } from '../utils/security';
import { auditService } from '../utils/auditService';

class DocumentService {
  constructor() {
    this.cachePrefix = 'document_';
    this.cacheTimeout = 60 * 60 * 1000; // 1 hora
    this.maxRetries = 3;
    this.auditContext = 'document_service';

    // Estados de documentos
    this.documentStatus = {
      UPLOADED: 'uploaded',
      PROCESSING: 'processing',
      READY: 'ready',
      FAILED: 'failed',
      ARCHIVED: 'archived',
      DELETED: 'deleted',
      QUARANTINED: 'quarantined'
    };

    // Tipos de documentos
    this.documentTypes = {
      MEDICAL_RECORD: 'medical_record',
      THERAPY_PLAN: 'therapy_plan',
      SESSION_NOTES: 'session_notes',
      ASSESSMENT: 'assessment',
      PRESCRIPTION: 'prescription',
      INSURANCE: 'insurance',
      CONSENT_FORM: 'consent_form',
      REPORT: 'report',
      IMAGE: 'image',
      VIDEO: 'video',
      AUDIO: 'audio',
      CONTRACT: 'contract',
      INVOICE: 'invoice',
      OTHER: 'other'
    };

    // Categorías de documentos (mapeadas a las del backend)
    this.documentCategories = {
      CLINICAL: 'clinical',
      ADMINISTRATIVE: 'administrative',
      LEGAL: 'legal',
      EDUCATIONAL: 'educational',
      PERSONAL: 'personal',
      SHARED: 'shared',
      TEMPLATE: 'template'
    };

    // Mapeo de categorías del frontend a categorías del backend
    this.categoryMapping = {
      'clinical': 'session_notes',
      'administrative': 'report',
      'legal': 'consent_form',
      'educational': 'resource',
      'personal': 'other',
      'shared': 'resource',
      'template': 'resource'
    };

    // Niveles de acceso
    this.accessLevels = {
      PRIVATE: 'private',
      THERAPIST_ONLY: 'therapist_only',
      CLIENT_SHARED: 'client_shared',
      TEAM_SHARED: 'team_shared',
      PUBLIC: 'public'
    };

    // Tipos de archivo permitidos
    this.allowedFileTypes = {
      documents: ['.pdf', '.doc', '.docx', '.txt', '.rtf', '.odt'],
      images: ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.svg'],
      videos: ['.mp4', '.avi', '.mov', '.wmv', '.flv', '.webm'],
      audio: ['.mp3', '.wav', '.ogg', '.m4a', '.flac'],
      spreadsheets: ['.xls', '.xlsx', '.csv', '.ods'],
      presentations: ['.ppt', '.pptx', '.odp']
    };

    // Límites de archivo
    this.fileLimits = {
      maxSize: 100 * 1024 * 1024, // 100MB
      maxSizePerType: {
        image: 10 * 1024 * 1024, // 10MB
        video: 500 * 1024 * 1024, // 500MB
        audio: 50 * 1024 * 1024, // 50MB
        document: 50 * 1024 * 1024 // 50MB
      }
    };

    // Niveles de compresión
    this.compressionLevels = {
      NONE: 'none',
      LOW: 'low',
      MEDIUM: 'medium',
      HIGH: 'high',
      MAXIMUM: 'maximum'
    };

    this.initialized = false;
  }

  async initialize() {
    if (this.initialized) return;

    try {
      await auditService.logEvent({
        eventType: 'system_change',
        entityType: 'service',
        entityId: 'document_service',
        action: 'initialize',
        details: { timestamp: new Date().toISOString() }
      });

      this.initialized = true;
      logger.info('DocumentService initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize DocumentService:', error);
      throw error;
    }
  }

  // Validación de archivos
  validateFile(file, options = {}) {
    const { maxSize, allowedTypes, requireEncryption = false } = options;

    // Validar tamaño del archivo
    const sizeLimit = maxSize || this.fileLimits.maxSize;
    if (file.size > sizeLimit) {
      throw errorHandler.createValidationError(
        `File size exceeds limit of ${this.formatFileSize(sizeLimit)}`
      );
    }

    // Validar tipo de archivo
    const fileExtension = this.getFileExtension(file.name).toLowerCase();
    const allAllowedTypes = allowedTypes || Object.values(this.allowedFileTypes).flat();

    if (!allAllowedTypes.includes(fileExtension)) {
      throw errorHandler.createValidationError(
        `File type '${fileExtension}' is not allowed`
      );
    }

    // Validar nombre del archivo (permitir caracteres unicode/internacionales)
    if (!/^[\w\s\-_.()\[\]áéíóúÁÉÍÓÚñÑüÜçÇàèìòùÀÈÌÒÙâêîôûÂÊÎÔÛãõÃÕäëïöüÄËÏÖÜ]+$/.test(file.name)) {
      throw errorHandler.createValidationError(
        'File name contains invalid characters'
      );
    }

    // Verificar límites por tipo
    const fileType = this.getFileTypeCategory(fileExtension);
    const typeSizeLimit = this.fileLimits.maxSizePerType[fileType];

    if (typeSizeLimit && file.size > typeSizeLimit) {
      throw errorHandler.createValidationError(
        `File size exceeds limit for ${fileType} files: ${this.formatFileSize(typeSizeLimit)}`
      );
    }

    return true;
  }

  // Subir documento
  async uploadDocument(file, metadata = {}, options = {}) {
    try {
      const {
        category = this.documentCategories.PERSONAL,
        type = this.documentTypes.OTHER,
        accessLevel = this.accessLevels.PRIVATE,
        encrypt = false,
        compress = true,
        compressionLevel = this.compressionLevels.MEDIUM,
        scanMalware = true,
        generatePreview = true,
        auditEvent = true
      } = options;

      // Validar archivo
      this.validateFile(file, options);

      // Preparar datos del documento
      const documentData = {
        documentId: security.generateSecureId('doc_'),
        originalName: file.name,
        fileName: this.generateSecureFileName(file.name),
        fileSize: file.size,
        mimeType: file.type,
        category,
        type,
        accessLevel,
        status: this.documentStatus.UPLOADED,
        uploadedAt: new Date().toISOString(),
        ...metadata
      };

      // Encriptar metadatos sensibles
      if (metadata.patientInfo || metadata.clinicalData) {
        documentData.encryptedMetadata = await encryptSensitiveData({
          patientInfo: metadata.patientInfo,
          clinicalData: metadata.clinicalData
        });
      }

      // Crear FormData para subida
      const formData = new FormData();
      formData.append('file', file);
      
      // Enviar campos directamente para compatibilidad con el backend
      // Mapear categoría del frontend a la del backend
      const backendCategory = this.categoryMapping[category] || 'other';
      formData.append('title', metadata.title || file.name.split('.')[0]);
      formData.append('category', backendCategory);
      if (metadata.clientId) {
        formData.append('clientId', metadata.clientId);
      }
      formData.append('session', metadata.sessionId || '');
      formData.append('tags', JSON.stringify(metadata.tags || []));
      formData.append('visibility', accessLevel === 'public' ? 'client_shared' : 'therapist_only');
      formData.append('isConfidential', accessLevel === 'private' ? 'true' : 'false');
      
      // Enviar metadata completa como JSON para compatibilidad
      formData.append('metadata', JSON.stringify({
        ...documentData,
        description: metadata.description || '',
        sessionId: metadata.sessionId || null
      }));
      formData.append('options', JSON.stringify({
        encrypt,
        compress,
        compressionLevel,
        scanMalware,
        generatePreview
      }));

      const response = await apiClient.post(ENDPOINTS.DOCUMENTS.UPLOAD, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        timeout: 5 * 60 * 1000, // 5 minutos
        onUploadProgress: options.onProgress
      });

      // Invalidar cache relacionado
      this.invalidateRelatedCache();

      // Auditoría
      if (auditEvent) {
        await auditService.logEvent({
          eventType: 'document_change',
          entityType: 'document',
          entityId: response.data.documentId,
          action: 'upload',
          userId: metadata.uploadedBy,
          details: {
            fileName: file.name,
            fileSize: file.size,
            category,
            type,
            accessLevel,
            encrypted: encrypt
          }
        });
      }

      logger.info('Document uploaded', {
        documentId: response.data.documentId,
        fileName: file.name,
        fileSize: file.size,
        category,
        type
      });

      return response.data;
    } catch (error) {
      logger.error('Error uploading document:', error);
      throw errorHandler.handle(error);
    }
  }

  // Descargar documento
  async downloadDocument(documentId, options = {}) {
    try {
      const { version, decrypt = false, auditEvent = true } = options;

      const params = {
        version,
        decrypt
      };

      const response = await apiClient.get(`${ENDPOINTS.DOCUMENTS.BASE}/${documentId}/download`, {
        params,
        responseType: 'blob',
        timeout: 5 * 60 * 1000 // 5 minutos
      });

      // Auditoría de descarga
      if (auditEvent) {
        await auditService.logEvent({
          eventType: 'document_access',
          entityType: 'document',
          entityId: documentId,
          action: 'download',
          details: {
            version: version || 'latest',
            decrypted: decrypt
          }
        });
      }

      return response.data;
    } catch (error) {
      logger.error('Error downloading document:', error);
      throw errorHandler.handle(error);
    }
  }

  // Obtener documento por ID
  async getDocumentById(documentId, options = {}) {
    try {
      const { includeMetadata = true, decryptSensitive = false } = options;
      const cacheKey = `${this.cachePrefix}${documentId}_${includeMetadata}_${decryptSensitive}`;

      // Verificar cache
      let documentData = cache.get(cacheKey);
      if (documentData) {
        return documentData;
      }

      const params = { includeMetadata };
      const response = await apiClient.get(`${ENDPOINTS.DOCUMENTS.BASE}/${documentId}`, { params });

      documentData = response.data;

      // Desencriptar metadatos sensibles si es necesario
      if (decryptSensitive && documentData.encryptedMetadata) {
        const decryptedMetadata = await decryptSensitiveData(documentData.encryptedMetadata);
        documentData = { ...documentData, ...decryptedMetadata };
        delete documentData.encryptedMetadata;
      }

      // Guardar en cache
      cache.set(cacheKey, documentData, this.cacheTimeout);

      return documentData;
    } catch (error) {
      logger.error('Error getting document by ID:', error);
      throw errorHandler.handle(error);
    }
  }

  // Listar documentos con filtros
  async getDocuments(filters = {}, options = {}) {
    try {
      const {
        page = 1,
        limit = 20,
        sortBy = 'uploadedAt',
        sortOrder = 'desc',
        includeDeleted = false,
        forceNoCache = false,
        timestamp = ''
      } = options;

      const cacheKey = `${this.cachePrefix}list_${JSON.stringify(filters)}_${page}_${limit}_${sortBy}_${sortOrder}_${includeDeleted}_${timestamp}`;

      // Verificar cache (skip if forceNoCache is true)
      let documents;
      if (!forceNoCache) {
        documents = cache.get(cacheKey);
        if (documents) {
          console.log('🔍 DocumentService - RETURNING FROM CACHE:', documents);
          console.log('🔍 DocumentService - Cache key was:', cacheKey);
          return documents;
        }
      } else {
        console.log('🔍 DocumentService - FORCING NO CACHE - Making fresh API call');
      }

      console.log('🔍 DocumentService - No cache found, making fresh API call');

      // Clean filters - remove undefined, null, and empty values
      const cleanedFilters = {};
      Object.keys(filters).forEach(key => {
        const value = filters[key];
        if (value !== undefined && value !== null && value !== '') {
          cleanedFilters[key] = value;
        }
      });

      const params = {
        ...cleanedFilters,
        page,
        limit,
        sortBy,
        sortOrder,
        includeDeleted
      };

      console.log('🔍 DocumentService - Original filters:', filters);
      console.log('🔍 DocumentService - Cleaned filters:', cleanedFilters);

      console.log('🔍 DocumentService - Making API call to:', ENDPOINTS.DOCUMENTS.BASE);
      console.log('🔍 DocumentService - Full URL will be:', `${apiClient.defaults.baseURL}${ENDPOINTS.DOCUMENTS.BASE}`);
      console.log('🔍 DocumentService - With params:', params);
      console.log('🔍 DocumentService - API Client headers:', apiClient.defaults.headers);

      const response = await apiClient.get(ENDPOINTS.DOCUMENTS.BASE, { params });

      console.log('🔍 DocumentService - RAW API RESPONSE FULL:', response);
      console.log('🔍 DocumentService - response.status:', response.status);
      console.log('🔍 DocumentService - response.statusText:', response.statusText);
      console.log('🔍 DocumentService - response.headers:', response.headers);
      console.log('🔍 DocumentService - response.config:', response.config);
      console.log('🔍 DocumentService - response.data:', response.data);
      console.log('🔍 DocumentService - response.data TYPE:', typeof response.data);
      console.log('🔍 DocumentService - response.data KEYS:', Object.keys(response.data || {}));
      console.log('🔍 DocumentService - response.data.success:', response.data?.success);
      console.log('🔍 DocumentService - response.data.data:', response.data?.data);
      console.log('🔍 DocumentService - response.data.data.documents:', response.data?.data?.documents);

      // Also check if it's in a different structure
      console.log('🔍 DocumentService - Check direct documents:', response.data?.documents);
      console.log('🔍 DocumentService - Check pagination:', response.data?.pagination);

      // Fix: Based on logs, API returns documents directly in response.data.documents
      documents = {
        documents: response.data?.documents || [],
        total: response.data?.pagination?.total || 0,
        pagination: response.data?.pagination || {}
      };

      console.log('🔍 DocumentService - Final processed documents:', documents);

      // Guardar en cache
      cache.set(cacheKey, documents, this.cacheTimeout);

      return documents;
    } catch (error) {
      console.log('🔍 DocumentService - ERROR CAUGHT:', error);
      console.log('🔍 DocumentService - Error response FULL:', error.response);
      console.log('🔍 DocumentService - Error response status:', error.response?.status);
      console.log('🔍 DocumentService - Error response statusText:', error.response?.statusText);
      console.log('🔍 DocumentService - Error response headers:', error.response?.headers);
      console.log('🔍 DocumentService - Error response data:', error.response?.data);
      console.log('🔍 DocumentService - Error response config URL:', error.response?.config?.url);
      console.log('🔍 DocumentService - Error response config method:', error.response?.config?.method);
      console.log('🔍 DocumentService - Error response config headers:', error.response?.config?.headers);
      console.log('🔍 DocumentService - Error message:', error.message);
      console.log('🔍 DocumentService - Error code:', error.code);
      console.log('🔍 DocumentService - Error name:', error.name);

      // Check if it's specifically an auth error
      if (error.response?.status === 401) {
        console.log('🔍 DocumentService - 401 UNAUTHORIZED - Token likely invalid');
        console.log('🔍 DocumentService - Current auth header:', error.response?.config?.headers?.Authorization);
      }

      logger.error('Error getting documents:', error);
      throw errorHandler.handle(error);
    }
  }

  // Actualizar metadatos del documento
  async updateDocument(documentId, updateData, options = {}) {
    try {
      const { auditEvent = true } = options;

      // Procesar datos de actualización
      let processedData = {
        ...updateData,
        updatedAt: new Date().toISOString()
      };

      // Encriptar datos sensibles si están incluidos
      if (updateData.patientInfo || updateData.clinicalData) {
        processedData.encryptedMetadata = await encryptSensitiveData({
          patientInfo: updateData.patientInfo,
          clinicalData: updateData.clinicalData
        });

        // Remover datos sensibles sin encriptar
        delete processedData.patientInfo;
        delete processedData.clinicalData;
      }

      const response = await apiClient.put(`${ENDPOINTS.DOCUMENTS.BASE}/${documentId}`, processedData);

      // Invalidar cache relacionado
      this.invalidateRelatedCache(documentId);

      // Auditoría
      if (auditEvent) {
        await auditService.logEvent({
          eventType: 'document_change',
          entityType: 'document',
          entityId: documentId,
          action: 'update',
          userId: processedData.updatedBy,
          details: {
            updatedFields: Object.keys(updateData),
            sensitiveFields: ['patientInfo', 'clinicalData'].filter(field => updateData[field])
          }
        });
      }

      logger.info('Document updated', {
        documentId,
        updatedFields: Object.keys(updateData)
      });

      return response.data;
    } catch (error) {
      logger.error('Error updating document:', error);
      throw errorHandler.handle(error);
    }
  }

  // Eliminar documento
  async deleteDocument(documentId, options = {}) {
    try {
      const { permanent = false, auditEvent = true, userId } = options;

      const deleteData = {
        permanent,
        deletedBy: userId,
        deletedAt: new Date().toISOString()
      };

      const response = await apiClient.delete(`${ENDPOINTS.DOCUMENTS.BASE}/${documentId}`, {
        data: deleteData
      });

      // Invalidar cache relacionado
      this.invalidateRelatedCache(documentId);

      // Auditoría
      if (auditEvent) {
        await auditService.logEvent({
          eventType: 'document_change',
          entityType: 'document',
          entityId: documentId,
          action: permanent ? 'delete_permanent' : 'delete_soft',
          userId: userId,
          details: {
            permanent,
            timestamp: new Date().toISOString()
          }
        });
      }

      logger.info('Document deleted', {
        documentId,
        permanent,
        deletedBy: userId
      });

      return response.data;
    } catch (error) {
      logger.error('Error deleting document:', error);
      throw errorHandler.handle(error);
    }
  }

  // Compartir documento
  async shareDocument(documentId, shareData, options = {}) {
    try {
      const { auditEvent = true } = options;

      const sharePayload = {
        ...shareData,
        sharedAt: new Date().toISOString(),
        shareId: security.generateSecureId('share_')
      };

      const response = await apiClient.post(`${ENDPOINTS.DOCUMENTS.BASE}/${documentId}/share`, sharePayload);

      // Invalidar cache relacionado
      this.invalidateRelatedCache(documentId);

      // Auditoría
      if (auditEvent) {
        await auditService.logEvent({
          eventType: 'document_access',
          entityType: 'document',
          entityId: documentId,
          action: 'share',
          userId: shareData.sharedBy,
          details: {
            sharedWith: shareData.sharedWith,
            permissions: shareData.permissions,
            expiresAt: shareData.expiresAt
          }
        });
      }

      logger.info('Document shared', {
        documentId,
        shareId: response.data.shareId,
        sharedWith: shareData.sharedWith
      });

      return response.data;
    } catch (error) {
      logger.error('Error sharing document:', error);
      throw errorHandler.handle(error);
    }
  }

  // Crear nueva versión del documento
  async createDocumentVersion(documentId, file, versionData = {}, options = {}) {
    try {
      const { auditEvent = true } = options;

      // Validar archivo
      this.validateFile(file, options);

      // Preparar datos de la versión
      const versionPayload = {
        versionId: security.generateSecureId('ver_'),
        documentId,
        originalName: file.name,
        fileSize: file.size,
        mimeType: file.type,
        versionNumber: versionData.versionNumber,
        changeNotes: versionData.changeNotes,
        createdAt: new Date().toISOString(),
        ...versionData
      };

      // Crear FormData
      const formData = new FormData();
      formData.append('file', file);
      formData.append('versionData', JSON.stringify(versionPayload));

      const response = await apiClient.post(
        `${ENDPOINTS.DOCUMENTS.BASE}/${documentId}/versions`,
        formData,
        {
          headers: { 'Content-Type': 'multipart/form-data' },
          timeout: 5 * 60 * 1000
        }
      );

      // Invalidar cache relacionado
      this.invalidateRelatedCache(documentId);

      // Auditoría
      if (auditEvent) {
        await auditService.logEvent({
          eventType: 'document_change',
          entityType: 'document',
          entityId: documentId,
          action: 'version_create',
          userId: versionData.createdBy,
          details: {
            versionId: response.data.versionId,
            versionNumber: response.data.versionNumber,
            fileName: file.name,
            fileSize: file.size
          }
        });
      }

      logger.info('Document version created', {
        documentId,
        versionId: response.data.versionId,
        versionNumber: response.data.versionNumber
      });

      return response.data;
    } catch (error) {
      logger.error('Error creating document version:', error);
      throw errorHandler.handle(error);
    }
  }

  // Buscar documentos por contenido
  async searchDocuments(query, filters = {}, options = {}) {
    try {
      const { page = 1, limit = 20, searchType = 'content' } = options;

      const params = {
        query,
        searchType,
        ...filters,
        page,
        limit
      };

      const response = await apiClient.get(ENDPOINTS.DOCUMENTS.SEARCH, { params });

      // Auditoría de búsqueda
      await auditService.logEvent({
        eventType: 'data_access',
        entityType: 'document',
        entityId: 'search',
        action: 'search',
        details: {
          query,
          searchType,
          resultCount: response.data.total
        }
      });

      return response.data;
    } catch (error) {
      logger.error('Error searching documents:', error);
      throw errorHandler.handle(error);
    }
  }

  // Obtener previsualización del documento
  async getDocumentPreview(documentId, options = {}) {
    try {
      const { page = 1, size = 'medium' } = options;
      const cacheKey = `${this.cachePrefix}preview_${documentId}_${page}_${size}`;

      // Verificar cache
      let preview = cache.get(cacheKey);
      if (preview) {
        return preview;
      }

      const params = { page, size };
      const response = await apiClient.get(`${ENDPOINTS.DOCUMENTS.BASE}/${documentId}/preview`, {
        params,
        responseType: 'blob'
      });

      preview = response.data;

      // Guardar en cache
      cache.set(cacheKey, preview, this.cacheTimeout);

      return preview;
    } catch (error) {
      logger.error('Error getting document preview:', error);
      throw errorHandler.handle(error);
    }
  }

  // Comprimir documento
  async compressDocument(documentId, compressionLevel = this.compressionLevels.MEDIUM) {
    try {
      const compressionData = {
        level: compressionLevel,
        requestedAt: new Date().toISOString()
      };

      const response = await apiClient.post(
        `${ENDPOINTS.DOCUMENTS.BASE}/${documentId}/compress`,
        compressionData
      );

      // Invalidar cache relacionado
      this.invalidateRelatedCache(documentId);

      logger.info('Document compression initiated', {
        documentId,
        compressionLevel,
        jobId: response.data.jobId
      });

      return response.data;
    } catch (error) {
      logger.error('Error compressing document:', error);
      throw errorHandler.handle(error);
    }
  }

  // Escanear documento en busca de malware
  async scanDocument(documentId, options = {}) {
    try {
      const { deepScan = false, auditEvent = true } = options;

      const scanData = {
        deepScan,
        requestedAt: new Date().toISOString()
      };

      const response = await apiClient.post(
        `${ENDPOINTS.DOCUMENTS.BASE}/${documentId}/scan`,
        scanData
      );

      // Auditoría del escaneo
      if (auditEvent) {
        await auditService.logEvent({
          eventType: 'security_scan',
          entityType: 'document',
          entityId: documentId,
          action: 'malware_scan',
          details: {
            deepScan,
            scanResult: response.data.result,
            threatLevel: response.data.threatLevel
          }
        });
      }

      logger.info('Document scan completed', {
        documentId,
        result: response.data.result,
        threatLevel: response.data.threatLevel
      });

      return response.data;
    } catch (error) {
      logger.error('Error scanning document:', error);
      throw errorHandler.handle(error);
    }
  }

  // Crear backup del documento
  async backupDocument(documentId, options = {}) {
    try {
      const { auditEvent = true } = options;

      const backupData = {
        backupId: security.generateSecureId('backup_'),
        documentId,
        createdAt: new Date().toISOString()
      };

      const response = await apiClient.post(`${ENDPOINTS.DOCUMENTS.BASE}/${documentId}/backup`, backupData);

      // Auditoría del backup
      if (auditEvent) {
        await auditService.logEvent({
          eventType: 'data_backup',
          entityType: 'document',
          entityId: documentId,
          action: 'backup_create',
          details: {
            backupId: response.data.backupId,
            backupLocation: response.data.location
          }
        });
      }

      logger.info('Document backup created', {
        documentId,
        backupId: response.data.backupId
      });

      return response.data;
    } catch (error) {
      logger.error('Error creating document backup:', error);
      throw errorHandler.handle(error);
    }
  }

  // Obtener estadísticas de documentos
  async getDocumentStatistics(filters = {}, options = {}) {
    try {
      const { dateRange, groupBy = 'category' } = options;
      const cacheKey = `${this.cachePrefix}stats_${JSON.stringify(filters)}_${JSON.stringify(options)}`;

      // Verificar cache
      let stats = cache.get(cacheKey);
      if (stats) {
        return stats;
      }

      const params = {
        ...filters,
        dateRange: dateRange ? JSON.stringify(dateRange) : undefined,
        groupBy
      };

      const response = await apiClient.get(`${ENDPOINTS.DOCUMENTS.BASE}/statistics`, { params });
      stats = response.data;

      // Guardar en cache por menos tiempo para estadísticas
      cache.set(cacheKey, stats, 10 * 60 * 1000); // 10 minutos

      return stats;
    } catch (error) {
      logger.error('Error getting document statistics:', error);
      throw errorHandler.handle(error);
    }
  }

  // Utilidades
  getFileExtension(fileName) {
    return fileName.substring(fileName.lastIndexOf('.'));
  }

  getFileTypeCategory(extension) {
    for (const [category, extensions] of Object.entries(this.allowedFileTypes)) {
      if (extensions.includes(extension.toLowerCase())) {
        return category === 'documents' ? 'document' : category.slice(0, -1); // Remove 's' from plural
      }
    }
    return 'other';
  }

  formatFileSize(bytes) {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  }

  generateSecureFileName(originalName) {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2);
    const extension = this.getFileExtension(originalName);
    return `${timestamp}_${random}${extension}`;
  }

  // Invalidar cache relacionado
  invalidateRelatedCache(documentId = null) {
    try {
      if (documentId) {
        // Invalidar cache específico del documento
        const patterns = [
          `${this.cachePrefix}${documentId}*`,
          `${this.cachePrefix}list*`,
          `${this.cachePrefix}stats*`,
          `${this.cachePrefix}preview_${documentId}*`
        ];

        patterns.forEach(pattern => cache.deleteByPattern(pattern));
      } else {
        // Invalidar todo el cache de documentos
        cache.deleteByPattern(`${this.cachePrefix}*`);
      }

      // También invalidar cache de API relacionado
      apiCache.deleteByPattern('documents*');

    } catch (error) {
      logger.error('Error invalidating cache:', error);
    }
  }

  // Limpiar cache
  clearCache() {
    try {
      cache.deleteByPattern(`${this.cachePrefix}*`);
      logger.info('DocumentService cache cleared');
    } catch (error) {
      logger.error('Error clearing cache:', error);
    }
  }

  // Verificar salud del servicio
  async checkHealth() {
    try {
      const healthData = {
        service: 'DocumentService',
        status: 'healthy',
        timestamp: new Date().toISOString(),
        cache: {
          size: cache.size(),
          enabled: true
        }
      };

      // Verificar conectividad básica
      await apiClient.get(`${ENDPOINTS.DOCUMENTS.BASE}/health`);

      return healthData;
    } catch (error) {
      return {
        service: 'DocumentService',
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }
}

// Crear instancia única del servicio
export const documentService = new DocumentService();

// Métodos de conveniencia para exportación directa
export const uploadDocument = (file, metadata, options) => documentService.uploadDocument(file, metadata, options);
export const downloadDocument = (documentId, options) => documentService.downloadDocument(documentId, options);
export const getDocumentById = (documentId, options) => documentService.getDocumentById(documentId, options);
export const getDocuments = (filters, options) => documentService.getDocuments(filters, options);
export const updateDocument = (documentId, updateData, options) => documentService.updateDocument(documentId, updateData, options);
export const deleteDocument = (documentId, options) => documentService.deleteDocument(documentId, options);
export const shareDocument = (documentId, shareData, options) => documentService.shareDocument(documentId, shareData, options);
export const createDocumentVersion = (documentId, file, versionData, options) => documentService.createDocumentVersion(documentId, file, versionData, options);
export const searchDocuments = (query, filters, options) => documentService.searchDocuments(query, filters, options);
export const getDocumentPreview = (documentId, options) => documentService.getDocumentPreview(documentId, options);
export const compressDocument = (documentId, compressionLevel) => documentService.compressDocument(documentId, compressionLevel);
export const scanDocument = (documentId, options) => documentService.scanDocument(documentId, options);
export const backupDocument = (documentId, options) => documentService.backupDocument(documentId, options);
export const getDocumentStatistics = (filters, options) => documentService.getDocumentStatistics(filters, options);

export default documentService;