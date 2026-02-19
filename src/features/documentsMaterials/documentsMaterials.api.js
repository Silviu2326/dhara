// Documents and Materials API interface using integrated services
import { documentService } from '../../services/api/documentService';
import { clientService } from '../../services/api/clientService';
import { notificationService } from '../../services/api/notificationService';
import { auditLogService } from '../../services/api/auditLogService';

// Initialize services
export const initializeDocumentApi = async () => {
  await documentService.initialize();
  await clientService.initialize();
  await notificationService.initialize();
};

// Document operations
export const getDocuments = async (filters = {}, options = {}) => {
  try {
    return await documentService.getDocuments(filters, {
      decryptSensitiveData: true,
      includeMetadata: true,
      includeThumbnails: true,
      ...options
    });
  } catch (error) {
    console.error('Error fetching documents:', error);
    throw error;
  }
};

export const getDocument = async (documentId, options = {}) => {
  try {
    return await documentService.getDocument(documentId, {
      decryptSensitiveData: true,
      includeMetadata: true,
      trackAccess: true,
      ...options
    });
  } catch (error) {
    console.error('Error fetching document:', error);
    throw error;
  }
};

export const uploadDocument = async (file, metadata, options = {}) => {
  try {
    return await documentService.uploadDocument(file, metadata, {
      validateFile: true,
      generateThumbnail: true,
      encryptSensitiveData: true,
      createAuditLog: true,
      ...options
    });
  } catch (error) {
    console.error('Error uploading document:', error);
    throw error;
  }
};

export const updateDocument = async (documentId, updates, options = {}) => {
  try {
    return await documentService.updateDocument(documentId, updates, {
      validateData: true,
      createAuditLog: true,
      encryptSensitiveData: true,
      ...options
    });
  } catch (error) {
    console.error('Error updating document:', error);
    throw error;
  }
};

export const deleteDocument = async (documentId, options = {}) => {
  try {
    return await documentService.deleteDocument(documentId, {
      secureDelete: true,
      reason: 'user_request',
      createAuditLog: true,
      ...options
    });
  } catch (error) {
    console.error('Error deleting document:', error);
    throw error;
  }
};

export const downloadDocument = async (documentId, options = {}) => {
  try {
    return await documentService.downloadDocument(documentId, {
      includeMetadata: false,
      trackDownload: true,
      ...options
    });
  } catch (error) {
    console.error('Error downloading document:', error);
    throw error;
  }
};

// Sharing operations
export const shareDocument = async (documentId, clientId, permissions = {}) => {
  try {
    return await documentService.shareDocumentWithClient(documentId, clientId, {
      permissions: permissions.permissions || ['read', 'download'],
      notifyClient: permissions.notifyClient ?? true,
      expiresAt: permissions.expiresAt || null,
      ...permissions
    });
  } catch (error) {
    console.error('Error sharing document:', error);
    throw error;
  }
};

export const unshareDocument = async (documentId, clientId) => {
  try {
    return await documentService.unshareDocumentWithClient(documentId, clientId);
  } catch (error) {
    console.error('Error unsharing document:', error);
    throw error;
  }
};

export const getSharedDocuments = async (clientId, options = {}) => {
  try {
    return await documentService.getSharedDocuments(clientId, options);
  } catch (error) {
    console.error('Error fetching shared documents:', error);
    throw error;
  }
};

// Search operations
export const searchDocuments = async (query, filters = {}) => {
  try {
    return await documentService.searchDocuments({
      query,
      ...filters
    });
  } catch (error) {
    console.error('Error searching documents:', error);
    throw error;
  }
};

// Bulk operations
export const bulkDownload = async (documentIds, options = {}) => {
  try {
    return await documentService.bulkOperations('download', documentIds, {}, {
      createAuditLog: true,
      trackDownloads: true,
      format: 'zip',
      ...options
    });
  } catch (error) {
    console.error('Error in bulk download:', error);
    throw error;
  }
};

export const bulkDelete = async (documentIds, options = {}) => {
  try {
    return await documentService.bulkOperations('delete', documentIds, {
      secureDelete: true,
      reason: 'bulk_user_request'
    }, {
      createAuditLog: true,
      batchSize: 25,
      ...options
    });
  } catch (error) {
    console.error('Error in bulk delete:', error);
    throw error;
  }
};

export const bulkShare = async (documentIds, clientId, permissions = {}) => {
  try {
    return await documentService.bulkOperations('share', documentIds, {
      clientId,
      permissions: permissions.permissions || ['read', 'download'],
      notifyClient: permissions.notifyClient ?? true
    }, {
      createAuditLog: true,
      batchSize: 25
    });
  } catch (error) {
    console.error('Error in bulk share:', error);
    throw error;
  }
};

export const bulkUpdateTags = async (documentIds, tags, action = 'replace') => {
  try {
    return await documentService.bulkOperations('updateTags', documentIds, {
      tags,
      action // 'replace', 'add', 'remove'
    }, {
      createAuditLog: true,
      batchSize: 50
    });
  } catch (error) {
    console.error('Error in bulk tag update:', error);
    throw error;
  }
};

// Storage and statistics
export const getStorageStats = async (options = {}) => {
  try {
    return await documentService.getStorageStats(options);
  } catch (error) {
    console.error('Error fetching storage stats:', error);
    throw error;
  }
};

export const getDocumentStats = async (filters = {}) => {
  try {
    return await documentService.getDocumentStats(filters);
  } catch (error) {
    console.error('Error fetching document stats:', error);
    throw error;
  }
};

export const optimizeStorage = async () => {
  try {
    return await documentService.optimizeStorage();
  } catch (error) {
    console.error('Error optimizing storage:', error);
    throw error;
  }
};

// Client operations
export const getClients = async (options = {}) => {
  try {
    return await clientService.getClients({}, {
      includeInactive: false,
      limit: 100,
      ...options
    });
  } catch (error) {
    console.error('Error fetching clients:', error);
    throw error;
  }
};

export const searchClients = async (searchTerm, options = {}) => {
  try {
    return await clientService.searchClients(searchTerm, {
      searchFields: ['name', 'email', 'phone'],
      limit: 10,
      exactMatch: false,
      includeInactive: false,
      ...options
    });
  } catch (error) {
    console.error('Error searching clients:', error);
    throw error;
  }
};

// File validation and utilities
export const validateFile = async (file) => {
  try {
    return await documentService.validateFile(file);
  } catch (error) {
    console.error('Error validating file:', error);
    throw error;
  }
};

export const getFileType = (filename) => {
  return documentService.getFileType(filename);
};

export const getMaxFileSize = (fileType) => {
  return documentService.fileLimits?.maxSizePerType?.[fileType] || documentService.fileLimits?.maxSize;
};

// Notifications
export const sendNotification = async (notificationData) => {
  try {
    return await notificationService.sendNotification(notificationData);
  } catch (error) {
    console.error('Error sending notification:', error);
    throw error;
  }
};

// Audit logging
export const logDocumentEvent = async (eventData) => {
  try {
    return await auditLogService.logEvent({
      eventType: eventData.type || 'update',
      entityType: 'document',
      ...eventData
    });
  } catch (error) {
    console.error('Error logging document event:', error);
    throw error;
  }
};

export const getDocumentAuditLog = async (documentId, options = {}) => {
  try {
    return await auditLogService.getAuditLogs({
      entityType: 'document',
      entityId: documentId,
      ...options
    });
  } catch (error) {
    console.error('Error fetching document audit log:', error);
    throw error;
  }
};

// Utility functions
export const getDocumentService = () => documentService;
export const getClientService = () => clientService;
export const getNotificationService = () => notificationService;
export const getAuditLogService = () => auditLogService;

// Export constants from document service
export const DOCUMENT_TYPES = documentService.documentTypes;
export const DOCUMENT_CATEGORIES = documentService.documentCategories;
export const ACCESS_LEVELS = documentService.accessLevels;
export const DOCUMENT_STATUS = documentService.documentStatus;
export const ALLOWED_FILE_TYPES = documentService.allowedFileTypes;
export const FILE_LIMITS = documentService.fileLimits;
export const COMPRESSION_LEVELS = documentService.compressionLevels;