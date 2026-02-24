import React, { useState, useEffect, useCallback, useRef } from "react";
import { Card } from "../../components/Card";
import { DocsHeader } from "./components/DocsHeader";
import { UploadZone } from "./components/UploadZone";
import { UploadFormModal } from "./components/UploadFormModal";
import { DocumentsTable } from "./components/DocumentsTable";
import { BulkToolbar } from "./components/BulkToolbar";
import { PreviewModal } from "./components/PreviewModal";
import { EditDocumentModal } from "./components/EditDocumentModal";
import {
  ErrorBoundary,
  EmptyDocuments,
  ErrorState,
  Loader,
} from "./components/StateComponents";
import { documentService } from "../../services/api/documentService";
import { clientService } from "../../services/api/clientService";
import { notificationService } from "../../services/api/notificationService";
import { auditLogService } from "../../services/api/auditLogService";

const LOCALSTORAGE_KEY = "dhara_documents";
const LOCALSTORAGE_CLIENTS_KEY = "dhara_clients";

const mockDocuments = [
  {
    id: "1",
    title: "Ejercicios de Respiración",
    filename: "ejercicios-respiracion.pdf",
    type: "pdf",
    size: 2048576,
    client: { id: "1", name: "Ana García", avatar: null },
    session: "Sesión #3",
    tags: ["ejercicios", "ansiedad"],
    createdAt: new Date(),
    url: "/documents/ejercicios-respiracion.pdf",
  },
  {
    id: "2",
    title: "Técnicas de Relajación",
    filename: "relajacion-muscular.mp3",
    type: "audio",
    size: 5242880,
    client: { id: "2", name: "Carlos López", avatar: null },
    session: "Sesión #1",
    tags: ["relajación", "audio"],
    createdAt: new Date(Date.now() - 86400000),
    url: "/documents/relajacion-muscular.mp3",
  },
  {
    id: "3",
    title: "Diagrama de Emociones",
    filename: "diagrama-emociones.png",
    type: "image",
    size: 1024000,
    client: null,
    session: null,
    tags: ["emociones", "diagrama"],
    createdAt: new Date(Date.now() - 172800000),
    url: "/documents/diagrama-emociones.png",
  },
];

const mockClients = [
  { id: "1", name: "Ana García", email: "ana@email.com", avatar: null },
  { id: "2", name: "Carlos López", email: "carlos@email.com", avatar: null },
  { id: "3", name: "María Rodríguez", email: "maria@email.com", avatar: null },
];

const loadFromLocalStorage = (key, defaultValue) => {
  try {
    const stored = localStorage.getItem(key);
    if (stored) {
      const parsed = JSON.parse(stored);
      return parsed.map((doc) => ({
        ...doc,
        createdAt: doc.createdAt ? new Date(doc.createdAt) : new Date(),
        updatedAt: doc.updatedAt ? new Date(doc.updatedAt) : null,
        lastAccessed: doc.lastAccessed ? new Date(doc.lastAccessed) : null,
      }));
    }
  } catch (error) {
    console.error(`Error loading from localStorage (${key}):`, error);
  }
  return defaultValue;
};

const saveToLocalStorage = (key, data) => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
    return true;
  } catch (error) {
    console.error(`Error saving to localStorage (${key}):`, error);
    return false;
  }
};

const safeNotify = async (notificationService, options) => {
  if (!notificationService) return;
  try {
    if (typeof notificationService.sendNotification === "function") {
      await notificationService.sendNotification(options);
    }
  } catch (error) {
    console.warn("Notification service unavailable:", error);
  }
};

const clearLocalStorageData = () => {
  try {
    localStorage.removeItem(LOCALSTORAGE_KEY);
    localStorage.removeItem(LOCALSTORAGE_CLIENTS_KEY);
    console.log("🔍 DocumentsMaterials - LocalStorage cleared");
    return true;
  } catch (error) {
    console.error("Error clearing localStorage:", error);
    return false;
  }
};

export const DocumentsMaterials = () => {
  const [documents, setDocuments] = useState([]);
  const [filteredDocuments, setFilteredDocuments] = useState([]);
  const [clients, setClients] = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTypes, setSelectedTypes] = useState([]);
  const [selectedDocuments, setSelectedDocuments] = useState([]);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [preselectedFiles, setPreselectedFiles] = useState([]);
  const [previewDocument, setPreviewDocument] = useState(null);
  const [editDocument, setEditDocument] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});
  const [storageStats, setStorageStats] = useState({
    used: 0,
    limit: 5368709120,
  }); // 5GB default
  const [error, setError] = useState(null);

  // Referencias para cleanup
  const abortControllerRef = useRef(null);

  // Debug: Rastrear cambios en el estado de documentos
  useEffect(() => {
    console.log("🔍 DocumentsMaterials - Documents state updated:", {
      count: documents.length,
      documents: documents,
    });
  }, [documents]);

  // Inicializar servicios y cargar datos
  useEffect(() => {
    const initializeServices = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Inicializar servicios
        await documentService.initialize();
        await clientService.initialize();
        await notificationService.initialize();

        // Cargar datos iniciales en paralelo
        await Promise.all([loadDocuments(), loadClients(), loadStorageStats()]);

        console.log("Document services initialized successfully");
      } catch (error) {
        console.error("Error initializing document services:", error);
        setError(error.message || "Error al inicializar los servicios");

        // Fallback a datos de localStorage o mock
        console.log(
          "🔍 DocumentsMaterials - Falling back to localStorage or mock data:",
          error,
        );
        const localDocs = loadFromLocalStorage(LOCALSTORAGE_KEY, null);
        const localClients = loadFromLocalStorage(
          LOCALSTORAGE_CLIENTS_KEY,
          null,
        );

        if (localDocs && localDocs.length > 0) {
          console.log(
            "🔍 DocumentsMaterials - Loading from localStorage:",
            localDocs.length,
            "documents",
          );
          setDocuments(localDocs);
        } else {
          console.log("🔍 DocumentsMaterials - Using mock documents");
          setDocuments(mockDocuments);
        }

        if (localClients && localClients.length > 0) {
          setClients(localClients);
        } else {
          setClients(mockClients);
        }
      } finally {
        setIsLoading(false);
      }
    };

    initializeServices();

    // Cleanup al desmontar
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Cargar documentos desde la API
  const loadDocuments = useCallback(
    async (filters = {}) => {
      try {
        abortControllerRef.current = new AbortController();

        console.log("🔍 DocumentsMaterials - Loading documents with filters:", {
          clientId: selectedClient?.id,
          search: searchTerm,
          types: selectedTypes,
          category: filters.category,
          accessLevel: filters.accessLevel,
          ...filters,
        });

        // For initial load, get ALL documents without any filters
        const isInitialLoad =
          !selectedClient &&
          !searchTerm &&
          selectedTypes.length === 0 &&
          !filters.category;
        console.log(
          "🔍 DocumentsMaterials - Is initial load (no filters):",
          isInitialLoad,
        );

        const requestFilters = isInitialLoad
          ? {}
          : {
              clientId: selectedClient?.id,
              search: searchTerm,
              types: selectedTypes.length > 0 ? selectedTypes : undefined,
              category: filters.category,
              accessLevel: filters.accessLevel,
              ...filters,
            };

        console.log(
          "🔍 DocumentsMaterials - Final filters to send:",
          requestFilters,
        );

        const response = await documentService.getDocuments(requestFilters, {
          decryptSensitiveData: true,
          includeMetadata: true,
          includeThumbnails: true,
          signal: abortControllerRef.current.signal,
        });

        console.log(
          "🔍 DocumentsMaterials - Raw response from documentService:",
          response,
        );
        console.log(
          "🔍 DocumentsMaterials - Response.documents:",
          response.documents,
        );
        console.log("🔍 DocumentsMaterials - Response.data:", response.data);
        console.log(
          "🔍 DocumentsMaterials - Response.data.documents:",
          response.data?.documents,
        );
        console.log(
          "🔍 DocumentsMaterials - Documents count:",
          response.documents?.length,
        );

        // Check which property contains the actual documents array
        const actualDocuments =
          response.documents || response.data?.documents || response.data || [];
        console.log(
          "🔍 DocumentsMaterials - Actual documents array:",
          actualDocuments,
        );

        // Si la API retorna vacío, intentar usar localStorage
        let finalDocuments = actualDocuments;
        if (actualDocuments.length === 0) {
          console.log(
            "🔍 DocumentsMaterials - API returned empty, checking localStorage...",
          );
          const localDocs = loadFromLocalStorage(LOCALSTORAGE_KEY, null);
          if (localDocs && localDocs.length > 0) {
            console.log(
              "🔍 DocumentsMaterials - Using localStorage docs:",
              localDocs.length,
            );
            finalDocuments = localDocs;
          }
        }

        const transformedDocuments = finalDocuments.map((doc) => ({
          id: doc.id,
          title: doc.title || doc.filename,
          filename: doc.filename,
          type: doc.type || doc.mimeType?.split("/")[0] || "file",
          size: doc.size,
          client: doc.clientId
            ? {
                id: doc.clientId,
                name: doc.clientName || "Cliente",
                avatar: doc.clientAvatar,
              }
            : null,
          session: doc.sessionId || doc.sessionNumber || null,
          tags: doc.tags || [],
          createdAt: new Date(doc.createdAt),
          updatedAt: doc.updatedAt ? new Date(doc.updatedAt) : null,
          url: doc.secureUrl || doc.url,
          thumbnailUrl: doc.thumbnailUrl,
          status: doc.status,
          accessLevel: doc.accessLevel,
          category: doc.category,
          description: doc.description,
          version: doc.version || 1,
          isShared: doc.isShared || false,
          sharedWith: doc.sharedWith || [],
          downloadCount: doc.downloadCount || 0,
          lastAccessed: doc.lastAccessed ? new Date(doc.lastAccessed) : null,
        }));

        console.log(
          "🔍 DocumentsMaterials - Transformed documents:",
          transformedDocuments,
        );
        console.log(
          "🔍 DocumentsMaterials - First document sample:",
          transformedDocuments[0],
        );

        setDocuments(transformedDocuments);

        // Save to localStorage only if we have documents from API
        if (transformedDocuments.length > 0) {
          saveToLocalStorage(LOCALSTORAGE_KEY, transformedDocuments);
        }

        return transformedDocuments;
      } catch (error) {
        if (error.name !== "AbortError") {
          console.error("Error loading documents:", error);
          setError("Error al cargar documentos");

          // Fallback a localStorage o mock data
          console.log(
            "🔍 DocumentsMaterials - API error, falling back to localStorage or mock:",
            error,
          );
          const localDocs = loadFromLocalStorage(LOCALSTORAGE_KEY, null);

          if (localDocs && localDocs.length > 0) {
            console.log(
              "🔍 DocumentsMaterials - Loaded from localStorage:",
              localDocs.length,
              "documents",
            );
            setDocuments(localDocs);
          } else {
            setDocuments(mockDocuments);
          }
        }
        throw error;
      }
    },
    [selectedClient?.id, searchTerm, selectedTypes],
  );

  // Cargar clientes
  const loadClients = useCallback(async () => {
    try {
      const response = await clientService.getClients(
        {},
        {
          includeInactive: false,
          limit: 100,
        },
      );

      const transformedClients = response.clients.map((client) => ({
        id: client.id,
        name: client.name,
        email: client.email,
        avatar: client.avatar,
      }));

      // Save to localStorage
      saveToLocalStorage(LOCALSTORAGE_CLIENTS_KEY, transformedClients);

      setClients(transformedClients);
      return transformedClients;
    } catch (error) {
      console.error("Error loading clients:", error);
      // Fallback a localStorage o mock data
      const localClients = loadFromLocalStorage(LOCALSTORAGE_CLIENTS_KEY, null);

      if (localClients && localClients.length > 0) {
        setClients(localClients);
      } else {
        setClients(mockClients);
      }
    }
  }, []);

  // Cargar estadísticas de almacenamiento
  const loadStorageStats = useCallback(async () => {
    try {
      // Verificar si el método existe en el servicio
      if (typeof documentService.getStorageStats === "function") {
        const stats = await documentService.getStorageStats();
        setStorageStats({
          used: stats.used || 0,
          limit: stats.limit || 5368709120, // 5GB default
          fileCount: stats.fileCount || 0,
          byType: stats.byType || {},
        });
      } else {
        // Usar método alternativo o valores por defecto
        const stats = await documentService.getDocumentStatistics();
        setStorageStats({
          used: stats?.totalSize || 0,
          limit: 5368709120, // 5GB default
          fileCount: stats?.totalDocuments || 0,
          byType: stats?.byType || {},
        });
      }
    } catch (error) {
      console.error("Error loading storage stats:", error);
      // Mantener valores por defecto
      setStorageStats({
        used: 0,
        limit: 5368709120,
        fileCount: 0,
        byType: {},
      });
    }
  }, []);

  // Recargar documentos cuando cambien los filtros
  useEffect(() => {
    if (documentService.initialized) {
      loadDocuments();
    }
  }, [selectedClient, searchTerm, selectedTypes, loadDocuments]);

  // Filtrar documentos
  useEffect(() => {
    console.log("🔍 DocumentsMaterials - Filtering documents:", {
      totalDocuments: documents.length,
      selectedClient,
      searchTerm,
      selectedTypes,
    });

    let filtered = documents;

    // Filtrar por cliente
    if (selectedClient) {
      filtered = filtered.filter((doc) => doc.client?.id === selectedClient.id);
      console.log(
        "🔍 DocumentsMaterials - After client filter:",
        filtered.length,
      );
    }

    // Filtrar por término de búsqueda
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (doc) =>
          doc.title.toLowerCase().includes(term) ||
          doc.filename.toLowerCase().includes(term) ||
          doc.tags.some((tag) => tag.toLowerCase().includes(term)),
      );
      console.log(
        "🔍 DocumentsMaterials - After search filter:",
        filtered.length,
      );
    }

    // Filtrar por tipos
    if (selectedTypes.length > 0) {
      filtered = filtered.filter((doc) => selectedTypes.includes(doc.type));
      console.log(
        "🔍 DocumentsMaterials - After type filter:",
        filtered.length,
      );
    }

    console.log("🔍 DocumentsMaterials - Final filtered documents:", filtered);
    setFilteredDocuments(filtered);
  }, [documents, selectedClient, searchTerm, selectedTypes]);

  // Handlers
  const handleClientSelect = (client) => {
    setSelectedClient(client);
  };

  const handleSearch = (term) => {
    setSearchTerm(term);
  };

  const handleTypeFilter = (types) => {
    setSelectedTypes(types);
  };

  const handleFilesSelected = (files) => {
    setPreselectedFiles(files);
    setIsUploadModalOpen(true);
  };

  const handleUpload = async (uploadData) => {
    try {
      setIsLoading(true);
      setError(null);

      const uploadedDocuments = [];

      // Procesar cada archivo por separado
      for (const [index, file] of uploadData.files.entries()) {
        try {
          // Validar archivo antes de subir
          await documentService.validateFile(file);

          // Preparar metadatos del documento
          const documentMetadata = {
            title: uploadData.title || file.name.split(".")[0],
            description: uploadData.description || "",
            clientId: uploadData.client?.id || null,
            sessionId: uploadData.session || null,
            tags: uploadData.tags || [],
            category:
              uploadData.category ||
              documentService.documentCategories.CLINICAL,
            type:
              uploadData.documentType || documentService.documentTypes.OTHER,
            accessLevel:
              uploadData.accessLevel ||
              documentService.accessLevels.THERAPIST_ONLY,
            isShared: uploadData.shareWithClient || false,
          };

          // Callback para progreso de subida
          const onUploadProgress = (progressEvent) => {
            const progress = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total,
            );
            setUploadProgress((prev) => ({
              ...prev,
              [file.name]: progress,
            }));
          };

          console.log(
            `Uploading file ${index + 1}/${uploadData.files.length}: ${file.name}`,
          );

          let uploadedDocument;
          let fromLocalStorage = false;

          // Intentar subir a la API
          try {
            uploadedDocument = await documentService.uploadDocument(
              file,
              documentMetadata,
              {
                validateFile: true,
                generateThumbnail: true,
                encryptSensitiveData: true,
                createAuditLog: true,
                onUploadProgress,
              },
            );
          } catch (apiError) {
            // Si la API falla, guardar en localStorage
            console.log(
              `🔍 DocumentsMaterials - API upload failed, saving to localStorage:`,
              apiError,
            );

            // Crear documento local
            const localDocId = `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            uploadedDocument = {
              id: localDocId,
              title: documentMetadata.title || file.name.split(".")[0],
              filename: file.name,
              type: file.type.split("/")[0] || "file",
              size: file.size,
              clientId: uploadData.client?.id || null,
              clientName: uploadData.client?.name || null,
              clientAvatar: uploadData.client?.avatar || null,
              sessionId: uploadData.session || null,
              tags: documentMetadata.tags || [],
              createdAt: new Date().toISOString(),
              url: null, // No hay URL real porque no se subió
              status: "local",
              accessLevel: documentMetadata.accessLevel,
              category: documentMetadata.category,
              description: documentMetadata.description,
              isShared: false,
            };
            fromLocalStorage = true;
          }

          // Transformar respuesta para el componente
          const transformedDocument = {
            id: uploadedDocument.id,
            title: uploadedDocument.title,
            filename: uploadedDocument.filename,
            type: uploadedDocument.type || file.type.split("/")[0],
            size: uploadedDocument.size,
            client: uploadedDocument.clientId
              ? {
                  id: uploadedDocument.clientId,
                  name: uploadedDocument.clientName || uploadData.client?.name,
                  avatar:
                    uploadedDocument.clientAvatar || uploadData.client?.avatar,
                }
              : uploadData.client,
            session: uploadedDocument.sessionId || uploadData.session,
            tags: uploadedDocument.tags || [],
            createdAt: new Date(uploadedDocument.createdAt),
            url: uploadedDocument.secureUrl || uploadedDocument.url,
            thumbnailUrl: uploadedDocument.thumbnailUrl,
            status: uploadedDocument.status,
            accessLevel: uploadedDocument.accessLevel,
            category: uploadedDocument.category,
            description: uploadedDocument.description,
            version: 1,
            isShared: uploadedDocument.isShared,
            downloadCount: 0,
            fromLocalStorage: fromLocalStorage,
          };

          uploadedDocuments.push(transformedDocument);

          // Limpiar progreso
          setUploadProgress((prev) => {
            const updated = { ...prev };
            delete updated[file.name];
            return updated;
          });

          // Log de auditoría solo si fue exitoso en API
          if (!fromLocalStorage) {
            try {
              await auditLogService.logEvent({
                eventType: "create",
                entityType: "document",
                entityId: uploadedDocument.id,
                action: "upload_document",
                details: {
                  filename: file.name,
                  size: file.size,
                  clientId: uploadData.client?.id,
                  category: documentMetadata.category,
                },
              });
            } catch (auditError) {
              console.error("Error logging audit:", auditError);
            }
          }

          console.log(
            `File uploaded ${fromLocalStorage ? "to localStorage" : "successfully"}: ${file.name}`,
          );
        } catch (fileError) {
          console.error(`Error uploading file ${file.name}:`, fileError);

          // Notificar error específico del archivo
          await safeNotify(notificationService, {
            title: "Error de subida",
            body: `No se pudo subir el archivo "${file.name}": ${fileError.message}`,
            type: "error",
            timeout: 5000,
          });

          // Limpiar progreso del archivo fallido
          setUploadProgress((prev) => {
            const updated = { ...prev };
            delete updated[file.name];
            return updated;
          });
        }
      }

      if (uploadedDocuments.length > 0) {
        // Actualizar lista de documentos
        setDocuments((prev) => {
          const newDocs = [...uploadedDocuments, ...prev];
          // Save to localStorage
          saveToLocalStorage(LOCALSTORAGE_KEY, newDocs);
          return newDocs;
        });

        // Actualizar estadísticas de almacenamiento
        await loadStorageStats();

        // Notificar éxito
        await safeNotify(notificationService, {
          title: "Subida exitosa",
          body: `${uploadedDocuments.length} archivo(s) subido(s) correctamente`,
          type: "success",
          timeout: 3000,
        });

        console.log(
          `Successfully uploaded ${uploadedDocuments.length} documents`,
        );
      }

      setIsUploadModalOpen(false);
    } catch (error) {
      console.error("Error in upload process:", error);
      setError(error.message || "Error al subir los archivos");

      // Notificar error general
      await safeNotify(notificationService, {
        title: "Error de subida",
        body: "Hubo un problema al subir los archivos. Por favor, inténtalo de nuevo.",
        type: "error",
        timeout: 5000,
      });
    } finally {
      setIsLoading(false);
      setUploadProgress({});
    }
  };

  const handleDocumentSelect = (documentId, isSelected) => {
    setSelectedDocuments((prev) =>
      isSelected
        ? [...prev, documentId]
        : prev.filter((id) => id !== documentId),
    );
  };

  const handleSelectAll = (isSelected) => {
    setSelectedDocuments(
      isSelected ? filteredDocuments.map((doc) => doc.id) : [],
    );
  };

  const handlePreview = (document) => {
    setPreviewDocument(document);
  };

  const handleDownload = async (document) => {
    try {
      setError(null);

      // Descargar documento usando documentService
      const downloadResult = await documentService.downloadDocument(
        document.id,
        {
          includeMetadata: false,
          trackDownload: true,
        },
      );

      // Crear enlace de descarga
      const link = window.document.createElement("a");
      link.href = downloadResult.downloadUrl || document.url;
      link.download = document.filename;
      link.target = "_blank";

      // Ejecutar descarga
      window.document.body.appendChild(link);
      link.click();
      window.document.body.removeChild(link);

      // Actualizar contador de descargas en el estado local
      setDocuments((prev) => {
        const newDocs = prev.map((doc) =>
          doc.id === document.id
            ? {
                ...doc,
                downloadCount: (doc.downloadCount || 0) + 1,
                lastAccessed: new Date(),
              }
            : doc,
        );
        saveToLocalStorage(LOCALSTORAGE_KEY, newDocs);
        return newDocs;
      });

      // Log de auditoría
      await auditLogService.logEvent({
        eventType: "read",
        entityType: "document",
        entityId: document.id,
        action: "download_document",
        details: {
          filename: document.filename,
          clientId: document.client?.id,
        },
      });

      console.log(`Document downloaded: ${document.filename}`);
    } catch (error) {
      console.error("Error downloading document:", error);
      setError("Error al descargar el documento");

      await notificationService.sendNotification({
        title: "Error de descarga",
        body: `No se pudo descargar "${document.filename}": ${error.message}`,
        type: "error",
        timeout: 5000,
      });
    }
  };

  const handleResend = async (document) => {
    try {
      if (!document.client) {
        throw new Error("No hay cliente asociado a este documento");
      }

      setError(null);

      // Compartir documento con cliente usando documentService
      const shareResult = await documentService.shareDocumentWithClient(
        document.id,
        document.client.id,
        {
          permissions: ["read", "download"],
          notifyClient: true,
          expiresAt: null, // Sin expiración
        },
      );

      // Actualizar estado local
      setDocuments((prev) => {
        const newDocs = prev.map((doc) =>
          doc.id === document.id
            ? {
                ...doc,
                isShared: true,
                sharedWith: [...(doc.sharedWith || []), document.client.id],
              }
            : doc,
        );
        saveToLocalStorage(LOCALSTORAGE_KEY, newDocs);
        return newDocs;
      });

      // Log de auditoría
      await auditLogService.logEvent({
        eventType: "update",
        entityType: "document",
        entityId: document.id,
        action: "share_document",
        details: {
          filename: document.filename,
          clientId: document.client.id,
          clientName: document.client.name,
        },
      });

      // Notificar éxito
      await notificationService.sendNotification({
        title: "Documento compartido",
        body: `"${document.title}" ha sido compartido con ${document.client.name}`,
        type: "success",
        timeout: 3000,
      });

      console.log(`Document shared with client: ${document.client.name}`);
    } catch (error) {
      console.error("Error sharing document:", error);
      setError("Error al compartir el documento");

      await notificationService.sendNotification({
        title: "Error al compartir",
        body: `No se pudo compartir "${document.title}": ${error.message}`,
        type: "error",
        timeout: 5000,
      });
    }
  };

  const handleEdit = (document) => {
    setEditDocument(document);
  };

  const handleSaveEdit = async (updatedDocument) => {
    try {
      setError(null);

      // Preparar datos de actualización
      const updateData = {
        title: updatedDocument.title,
        description: updatedDocument.description,
        tags: updatedDocument.tags,
        clientId: updatedDocument.client?.id,
        sessionId: updatedDocument.session,
        category: updatedDocument.category,
        accessLevel: updatedDocument.accessLevel,
      };

      // Actualizar documento usando documentService
      const updatedDocumentResponse = await documentService.updateDocument(
        updatedDocument.id,
        updateData,
        {
          validateData: true,
          createAuditLog: true,
          encryptSensitiveData: true,
        },
      );

      // Actualizar estado local
      setDocuments((prev) => {
        const newDocs = prev.map((doc) =>
          doc.id === updatedDocument.id
            ? { ...doc, ...updatedDocument, updatedAt: new Date() }
            : doc,
        );
        saveToLocalStorage(LOCALSTORAGE_KEY, newDocs);
        return newDocs;
      });

      setEditDocument(null);

      // Log de auditoría
      await auditLogService.logEvent({
        eventType: "update",
        entityType: "document",
        entityId: updatedDocument.id,
        action: "edit_document",
        details: {
          changes: Object.keys(updateData),
          filename: updatedDocument.filename,
        },
      });

      // Notificar éxito
      await notificationService.sendNotification({
        title: "Documento actualizado",
        body: `"${updatedDocument.title}" ha sido actualizado correctamente`,
        type: "success",
        timeout: 3000,
      });

      console.log(`Document updated: ${updatedDocument.title}`);
    } catch (error) {
      console.error("Error updating document:", error);
      setError("Error al actualizar el documento");

      await notificationService.sendNotification({
        title: "Error de actualización",
        body: `No se pudo actualizar "${updatedDocument.title}": ${error.message}`,
        type: "error",
        timeout: 5000,
      });
    }
  };

  const handleDelete = async (document) => {
    const confirmed = window.confirm(
      `¿Estás seguro de que quieres eliminar "${document.title}"?\n\nEsta acción no se puede deshacer.`,
    );

    if (!confirmed) return;

    try {
      setError(null);

      // Eliminar documento usando documentService
      await documentService.deleteDocument(document.id, {
        secureDelete: true,
        reason: "user_request",
        createAuditLog: true,
      });

      // Actualizar estado local
      setDocuments((prev) => {
        const newDocs = prev.filter((doc) => doc.id !== document.id);
        saveToLocalStorage(LOCALSTORAGE_KEY, newDocs);
        return newDocs;
      });
      setSelectedDocuments((prev) => prev.filter((id) => id !== document.id));

      // Actualizar estadísticas de almacenamiento
      await loadStorageStats();

      // Log de auditoría
      await auditLogService.logEvent({
        eventType: "delete",
        entityType: "document",
        entityId: document.id,
        action: "delete_document",
        details: {
          filename: document.filename,
          title: document.title,
          clientId: document.client?.id,
          size: document.size,
        },
      });

      // Notificar éxito
      await notificationService.sendNotification({
        title: "Documento eliminado",
        body: `"${document.title}" ha sido eliminado correctamente`,
        type: "success",
        timeout: 3000,
      });

      console.log(`Document deleted: ${document.title}`);

      // Cerrar modales si el documento eliminado estaba siendo previsualizado o editado
      if (previewDocument?.id === document.id) {
        setPreviewDocument(null);
      }
      if (editDocument?.id === document.id) {
        setEditDocument(null);
      }
    } catch (error) {
      console.error("Error deleting document:", error);
      setError("Error al eliminar el documento");

      await notificationService.sendNotification({
        title: "Error de eliminación",
        body: `No se pudo eliminar "${document.title}": ${error.message}`,
        type: "error",
        timeout: 5000,
      });
    }
  };

  const handleBulkDownload = async () => {
    try {
      if (selectedDocuments.length === 0) return;

      setError(null);
      setIsLoading(true);

      const selectedDocs = documents.filter((doc) =>
        selectedDocuments.includes(doc.id),
      );

      // Usar bulk operation del documentService
      const bulkResult = await documentService.bulkOperations(
        "download",
        selectedDocuments,
        {},
        {
          createAuditLog: true,
          trackDownloads: true,
          format: "zip", // Descargar como ZIP
        },
      );

      if (bulkResult.downloadUrl) {
        // Crear enlace de descarga para el ZIP
        const link = window.document.createElement("a");
        link.href = bulkResult.downloadUrl;
        link.download = `documentos_${new Date().toISOString().split("T")[0]}.zip`;
        link.target = "_blank";

        window.document.body.appendChild(link);
        link.click();
        window.document.body.removeChild(link);

        // Actualizar contadores de descarga
        setDocuments((prev) => {
          const newDocs = prev.map((doc) =>
            selectedDocuments.includes(doc.id)
              ? {
                  ...doc,
                  downloadCount: (doc.downloadCount || 0) + 1,
                  lastAccessed: new Date(),
                }
              : doc,
          );
          saveToLocalStorage(LOCALSTORAGE_KEY, newDocs);
          return newDocs;
        });

        // Notificar éxito
        await notificationService.sendNotification({
          title: "Descarga masiva completada",
          body: `${selectedDocs.length} documentos descargados como ZIP`,
          type: "success",
          timeout: 3000,
        });

        console.log(
          `Bulk download completed: ${selectedDocs.length} documents`,
        );
      }

      setSelectedDocuments([]);
    } catch (error) {
      console.error("Error in bulk download:", error);
      setError("Error en la descarga masiva");

      await notificationService.sendNotification({
        title: "Error de descarga masiva",
        body: `No se pudieron descargar los documentos: ${error.message}`,
        type: "error",
        timeout: 5000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedDocuments.length === 0) return;

    const selectedDocs = documents.filter((doc) =>
      selectedDocuments.includes(doc.id),
    );
    const confirmed = window.confirm(
      `¿Estás seguro de que quieres eliminar ${selectedDocuments.length} documentos?\n\nEsta acción no se puede deshacer.`,
    );

    if (!confirmed) return;

    try {
      setError(null);
      setIsLoading(true);

      // Usar bulk operation del documentService
      const bulkResult = await documentService.bulkOperations(
        "delete",
        selectedDocuments,
        {
          secureDelete: true,
          reason: "bulk_user_request",
        },
        {
          createAuditLog: true,
          batchSize: 25, // Procesar en lotes de 25
        },
      );

      const successCount = bulkResult.results.filter((r) => r.success).length;
      const failureCount = bulkResult.results.filter((r) => !r.success).length;

      // Actualizar estado local
      setDocuments((prev) => {
        const newDocs = prev.filter(
          (doc) => !selectedDocuments.includes(doc.id),
        );
        saveToLocalStorage(LOCALSTORAGE_KEY, newDocs);
        return newDocs;
      });
      setSelectedDocuments([]);

      // Actualizar estadísticas de almacenamiento
      await loadStorageStats();

      // Notificar resultado
      if (failureCount === 0) {
        await notificationService.sendNotification({
          title: "Eliminación masiva completada",
          body: `${successCount} documentos eliminados correctamente`,
          type: "success",
          timeout: 3000,
        });
      } else {
        await notificationService.sendNotification({
          title: "Eliminación masiva parcial",
          body: `${successCount} documentos eliminados, ${failureCount} fallos`,
          type: "warning",
          timeout: 5000,
        });
      }

      console.log(
        `Bulk delete completed: ${successCount} success, ${failureCount} failures`,
      );
    } catch (error) {
      console.error("Error in bulk delete:", error);
      setError("Error en la eliminación masiva");

      await notificationService.sendNotification({
        title: "Error de eliminación masiva",
        body: `No se pudieron eliminar los documentos: ${error.message}`,
        type: "error",
        timeout: 5000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Operación masiva de compartir documentos
  const handleBulkShare = async (clientId) => {
    if (selectedDocuments.length === 0 || !clientId) return;

    try {
      setError(null);
      setIsLoading(true);

      const client = clients.find((c) => c.id === clientId);
      if (!client) {
        throw new Error("Cliente no encontrado");
      }

      // Usar bulk operation del documentService
      const bulkResult = await documentService.bulkOperations(
        "share",
        selectedDocuments,
        {
          clientId: clientId,
          permissions: ["read", "download"],
          notifyClient: true,
        },
        {
          createAuditLog: true,
          batchSize: 25,
        },
      );

      const successCount = bulkResult.results.filter((r) => r.success).length;
      const failureCount = bulkResult.results.filter((r) => !r.success).length;

      // Actualizar estado local
      setDocuments((prev) => {
        const newDocs = prev.map((doc) =>
          selectedDocuments.includes(doc.id)
            ? {
                ...doc,
                isShared: true,
                sharedWith: [...(doc.sharedWith || []), clientId],
              }
            : doc,
        );
        saveToLocalStorage(LOCALSTORAGE_KEY, newDocs);
        return newDocs;
      });

      setSelectedDocuments([]);

      // Notificar resultado
      if (failureCount === 0) {
        await notificationService.sendNotification({
          title: "Documentos compartidos",
          body: `${successCount} documentos compartidos con ${client.name}`,
          type: "success",
          timeout: 3000,
        });
      } else {
        await notificationService.sendNotification({
          title: "Compartir parcialmente completado",
          body: `${successCount} documentos compartidos, ${failureCount} fallos`,
          type: "warning",
          timeout: 5000,
        });
      }

      console.log(
        `Bulk share completed: ${successCount} success, ${failureCount} failures`,
      );
    } catch (error) {
      console.error("Error in bulk share:", error);
      setError("Error al compartir documentos");

      await notificationService.sendNotification({
        title: "Error al compartir",
        body: `No se pudieron compartir los documentos: ${error.message}`,
        type: "error",
        timeout: 5000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearFilters = () => {
    setSelectedClient(null);
    setSearchTerm("");
    setSelectedTypes([]);
  };

  // Debug: Force load all documents without any filters
  const handleForceLoadAllDocuments = async () => {
    try {
      console.log(
        "🔍 DocumentsMaterials - FORCE LOADING ALL DOCUMENTS - NO FILTERS",
      );

      // Clear cache first - but handle the error gracefully
      try {
        documentService.clearCache();
        console.log("🔍 DocumentsMaterials - Cache cleared");
      } catch (cacheError) {
        console.log(
          "🔍 DocumentsMaterials - Cache clear failed, continuing anyway:",
          cacheError,
        );
      }

      const response = await documentService.getDocuments(
        {},
        {
          page: 1,
          limit: 50,
          sortBy: "createdAt",
          sortOrder: "desc",
          forceNoCache: true, // Custom option to bypass cache
          timestamp: Date.now(), // Force unique cache key
        },
      );
      console.log("🔍 DocumentsMaterials - Force load response:", response);

      // Also try direct API call to bypass documentService completely
      try {
        console.log("🔍 DocumentsMaterials - Making DIRECT API call");
        const directResponse = await fetch(
          "https://dharaback-production.up.railway.app/api/documents",
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
              "Content-Type": "application/json",
            },
          },
        );
        const directData = await directResponse.json();
        console.log("🔍 DocumentsMaterials - Direct API response:", directData);
      } catch (directError) {
        console.error("🔍 DocumentsMaterials - Direct API error:", directError);
      }

      if (response.documents) {
        const transformedDocs = response.documents.map((doc) => ({
          id: doc.id || doc._id,
          title: doc.title || doc.filename,
          filename: doc.filename,
          type: doc.type || doc.mimeType?.split("/")[0] || "file",
          size: doc.size,
          client: doc.clientId
            ? {
                id: doc.clientId,
                name: doc.clientName || "Cliente",
                avatar: doc.clientAvatar,
              }
            : null,
          session: doc.sessionId || doc.sessionNumber || null,
          tags: doc.tags || [],
          createdAt: new Date(doc.createdAt),
          updatedAt: doc.updatedAt ? new Date(doc.updatedAt) : null,
          url: doc.secureUrl || doc.url,
          thumbnailUrl: doc.thumbnailUrl,
          status: doc.status,
          accessLevel: doc.accessLevel,
          category: doc.category,
          description: doc.description,
          version: doc.version || 1,
          isShared: doc.isShared || false,
          sharedWith: doc.sharedWith || [],
          downloadCount: doc.downloadCount || 0,
          lastAccessed: doc.lastAccessed ? new Date(doc.lastAccessed) : null,
        }));

        setDocuments(transformedDocs);
        saveToLocalStorage(LOCALSTORAGE_KEY, transformedDocs);
      }
    } catch (error) {
      console.error("🔍 DocumentsMaterials - Force load error:", error);
    }
  };

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-deep">
            Documentos y Materiales
          </h1>
        </div>
        <ErrorState
          title="Error al cargar documentos"
          description={error}
          onRetry={() => {
            setError(null);
            setIsLoading(false);
          }}
        />
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-deep">
              Documentos y Materiales
            </h1>
            <p className="text-gray-600">Gestiona recursos y documentos</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleForceLoadAllDocuments}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
            >
              🔍 Debug: Cargar Todo
            </button>
            <button
              onClick={() => {
                if (
                  window.confirm(
                    "¿Estás seguro de que quieres borrar los datos locales?",
                  )
                ) {
                  clearLocalStorageData();
                  setDocuments(mockDocuments);
                  setClients(mockClients);
                }
              }}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm"
            >
              🗑️ Limpiar Local
            </button>
          </div>
        </div>

        {/* Controles principales */}
        <DocsHeader
          clients={clients}
          selectedClient={selectedClient}
          onClientSelect={handleClientSelect}
          searchTerm={searchTerm}
          onSearch={handleSearch}
          selectedTypes={selectedTypes}
          onTypeFilter={handleTypeFilter}
          documents={documents}
          storageUsed={storageStats.used}
          storageLimit={storageStats.limit}
          storageStats={storageStats}
          onRefresh={() => loadDocuments()}
          isLoading={isLoading}
        />

        {/* Zona de subida */}
        <Card>
          <UploadZone
            onFilesSelected={handleFilesSelected}
            maxFileSize={
              documentService.fileLimits?.maxSize || 200 * 1024 * 1024
            }
            acceptedTypes={[
              ...Object.values(documentService.allowedFileTypes || {}).flat(),
              "application/pdf",
              "image/*",
              "audio/*",
              "video/*",
            ]}
            isLoading={isLoading}
            uploadProgress={uploadProgress}
            storageUsed={storageStats.used}
            storageLimit={storageStats.limit}
          />
        </Card>

        {/* Toolbar de acciones masivas */}
        {selectedDocuments.length > 0 && (
          <BulkToolbar
            selectedCount={selectedDocuments.length}
            onDownload={handleBulkDownload}
            onDelete={handleBulkDelete}
            onShare={handleBulkShare}
            onClear={() => setSelectedDocuments([])}
            clients={clients}
            isLoading={isLoading}
          />
        )}

        {/* Tabla de documentos */}
        <Card>
          {isLoading ? (
            <Loader message="Cargando documentos..." />
          ) : filteredDocuments.length === 0 ? (
            documents.length === 0 ? (
              <EmptyDocuments onUpload={() => setIsUploadModalOpen(true)} />
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-500 mb-4">
                  No se encontraron documentos con los filtros aplicados
                </p>
                <button
                  onClick={handleClearFilters}
                  className="text-blue-600 hover:text-blue-700"
                >
                  Limpiar filtros
                </button>
              </div>
            )
          ) : (
            <DocumentsTable
              documents={filteredDocuments}
              selectedDocuments={selectedDocuments}
              onDocumentSelect={handleDocumentSelect}
              onSelectAll={handleSelectAll}
              onPreview={handlePreview}
              onDownload={handleDownload}
              onResend={handleResend}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          )}
        </Card>

        {/* Modales */}
        <UploadFormModal
          isOpen={isUploadModalOpen}
          onClose={() => {
            setIsUploadModalOpen(false);
            setPreselectedFiles([]);
          }}
          onUpload={handleUpload}
          clients={clients}
          isLoading={isLoading}
          initialFiles={preselectedFiles}
        />

        <PreviewModal
          isOpen={!!previewDocument}
          onClose={() => setPreviewDocument(null)}
          document={previewDocument}
          documents={filteredDocuments}
          onDownload={handleDownload}
          onResend={handleResend}
          onDelete={handleDelete}
        />

        <EditDocumentModal
          isOpen={!!editDocument}
          onClose={() => setEditDocument(null)}
          document={editDocument}
          clients={clients}
          onSave={handleSaveEdit}
        />
      </div>
    </ErrorBoundary>
  );
};
