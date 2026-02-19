import { logger } from './logger';
import { validators } from './validators';

class FileHandler {
  constructor() {
    this.config = {
      maxFileSize: 50 * 1024 * 1024, // 50MB
      maxChunkSize: 1024 * 1024, // 1MB chunks
      imageQuality: 0.8,
      imageMaxWidth: 1920,
      imageMaxHeight: 1080,
      supportedFormats: {
        images: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'],
        documents: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'],
        videos: ['video/mp4', 'video/avi', 'video/quicktime', 'video/x-msvideo', 'video/webm'],
        audio: ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp4', 'audio/webm']
      },
      thumbnailSizes: {
        small: { width: 150, height: 150 },
        medium: { width: 300, height: 300 },
        large: { width: 600, height: 600 }
      }
    };

    // Estados de upload
    this.uploadStates = {
      PENDING: 'pending',
      UPLOADING: 'uploading',
      PROCESSING: 'processing',
      COMPLETED: 'completed',
      FAILED: 'failed',
      CANCELLED: 'cancelled'
    };

    // Callbacks activos
    this.activeUploads = new Map();
    this.uploadCounter = 0;
  }

  // Validación de archivos
  validateFile(file, options = {}) {
    try {
      const config = { ...this.config, ...options };
      const errors = [];

      // Verificar que es un objeto File válido
      if (!file || !(file instanceof File)) {
        errors.push('Invalid file object');
        return { valid: false, errors };
      }

      // Verificar tamaño
      if (file.size > config.maxFileSize) {
        errors.push(`File size exceeds maximum allowed size of ${this.formatFileSize(config.maxFileSize)}`);
      }

      if (file.size === 0) {
        errors.push('File is empty');
      }

      // Verificar tipo MIME
      const category = this.getFileCategory(file.type);
      if (!category) {
        errors.push(`File type ${file.type} is not supported`);
      }

      // Verificar extensión
      const extension = this.getFileExtension(file.name).toLowerCase();
      const dangerousExtensions = ['.exe', '.bat', '.cmd', '.scr', '.pif', '.vbs', '.js', '.jar'];
      if (dangerousExtensions.includes(extension)) {
        errors.push('File extension is not allowed for security reasons');
      }

      // Verificar nombre del archivo
      if (!/^[a-zA-Z0-9._\-\s()]+$/.test(file.name)) {
        errors.push('File name contains invalid characters');
      }

      return {
        valid: errors.length === 0,
        errors,
        category,
        fileInfo: {
          name: file.name,
          size: file.size,
          type: file.type,
          lastModified: file.lastModified,
          extension
        }
      };
    } catch (error) {
      logger.error('Error validating file:', error);
      return {
        valid: false,
        errors: ['File validation failed'],
        fileInfo: null
      };
    }
  }

  // Upload de archivos con progreso
  async uploadFile(file, options = {}) {
    const uploadId = `upload_${++this.uploadCounter}_${Date.now()}`;

    try {
      const {
        url,
        method = 'POST',
        headers = {},
        chunkSize = this.config.maxChunkSize,
        onProgress = null,
        onStateChange = null,
        metadata = {},
        compress = false,
        generateThumbnail = false
      } = options;

      // Validar archivo
      const validation = this.validateFile(file, options);
      if (!validation.valid) {
        throw new Error(`File validation failed: ${validation.errors.join(', ')}`);
      }

      // Configurar estado inicial
      const uploadState = {
        id: uploadId,
        file,
        state: this.uploadStates.PENDING,
        progress: 0,
        uploadedBytes: 0,
        totalBytes: file.size,
        startTime: Date.now(),
        error: null,
        result: null
      };

      this.activeUploads.set(uploadId, uploadState);
      this.updateUploadState(uploadId, this.uploadStates.UPLOADING, onStateChange);

      // Procesar archivo si es necesario
      let processedFile = file;
      if (compress && this.isImage(file)) {
        this.updateUploadState(uploadId, this.uploadStates.PROCESSING, onStateChange);
        processedFile = await this.compressImage(file, options);
      }

      // Generar thumbnail si es solicitado
      let thumbnail = null;
      if (generateThumbnail && this.isImage(file)) {
        thumbnail = await this.generateThumbnail(file, options.thumbnailSize || 'medium');
      }

      // Decidir método de upload
      const result = file.size > chunkSize
        ? await this.uploadFileInChunks(uploadId, processedFile, { ...options, onProgress, thumbnail })
        : await this.uploadFileWhole(uploadId, processedFile, { ...options, onProgress, thumbnail });

      this.updateUploadState(uploadId, this.uploadStates.COMPLETED, onStateChange, result);
      this.activeUploads.delete(uploadId);

      return {
        uploadId,
        success: true,
        result,
        thumbnail,
        uploadTime: Date.now() - uploadState.startTime
      };

    } catch (error) {
      logger.error('File upload failed:', error);
      this.updateUploadState(uploadId, this.uploadStates.FAILED, options.onStateChange, null, error.message);
      this.activeUploads.delete(uploadId);

      return {
        uploadId,
        success: false,
        error: error.message,
        uploadTime: this.activeUploads.get(uploadId)?.startTime ? Date.now() - this.activeUploads.get(uploadId).startTime : 0
      };
    }
  }

  // Upload completo (archivo pequeño)
  async uploadFileWhole(uploadId, file, options) {
    const { url, method, headers, metadata, thumbnail } = options;

    const formData = new FormData();
    formData.append('file', file);

    if (metadata) {
      formData.append('metadata', JSON.stringify(metadata));
    }

    if (thumbnail) {
      formData.append('thumbnail', thumbnail);
    }

    const xhr = new XMLHttpRequest();

    return new Promise((resolve, reject) => {
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded / event.total) * 100);
          this.updateUploadProgress(uploadId, event.loaded, event.total, progress, options.onProgress);
        }
      });

      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const response = JSON.parse(xhr.responseText);
            resolve(response);
          } catch {
            resolve({ uploaded: true, status: xhr.status });
          }
        } else {
          reject(new Error(`Upload failed with status ${xhr.status}`));
        }
      });

      xhr.addEventListener('error', () => {
        reject(new Error('Upload failed due to network error'));
      });

      xhr.addEventListener('abort', () => {
        reject(new Error('Upload was cancelled'));
      });

      // Configurar headers
      Object.entries(headers).forEach(([key, value]) => {
        xhr.setRequestHeader(key, value);
      });

      xhr.open(method, url, true);
      xhr.send(formData);

      // Guardar referencia para cancelación
      const uploadState = this.activeUploads.get(uploadId);
      if (uploadState) {
        uploadState.xhr = xhr;
      }
    });
  }

  // Upload por chunks (archivo grande)
  async uploadFileInChunks(uploadId, file, options) {
    const { url, chunkSize, headers, metadata, thumbnail } = options;
    const totalChunks = Math.ceil(file.size / chunkSize);
    let uploadedChunks = 0;
    let uploadedBytes = 0;

    // Inicializar upload por chunks
    const initResponse = await this.initializeChunkedUpload(file, metadata, thumbnail, options);
    const sessionId = initResponse.sessionId || initResponse.uploadId;

    try {
      for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
        const start = chunkIndex * chunkSize;
        const end = Math.min(start + chunkSize, file.size);
        const chunk = file.slice(start, end);

        const chunkResult = await this.uploadChunk(
          sessionId,
          chunk,
          chunkIndex,
          totalChunks,
          { ...options, headers }
        );

        uploadedChunks++;
        uploadedBytes += chunk.size;

        const progress = Math.round((uploadedBytes / file.size) * 100);
        this.updateUploadProgress(uploadId, uploadedBytes, file.size, progress, options.onProgress);

        // Verificar si el upload fue cancelado
        const uploadState = this.activeUploads.get(uploadId);
        if (uploadState && uploadState.state === this.uploadStates.CANCELLED) {
          throw new Error('Upload was cancelled');
        }
      }

      // Finalizar upload por chunks
      return await this.finalizeChunkedUpload(sessionId, options);

    } catch (error) {
      // Intentar limpiar upload fallido
      try {
        await this.abortChunkedUpload(sessionId, options);
      } catch (abortError) {
        logger.error('Error aborting chunked upload:', abortError);
      }
      throw error;
    }
  }

  // Inicializar upload por chunks
  async initializeChunkedUpload(file, metadata, thumbnail, options) {
    const { url, headers } = options;

    const initData = {
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      totalChunks: Math.ceil(file.size / options.chunkSize),
      metadata,
      hasThumbnail: !!thumbnail
    };

    const response = await fetch(`${url}/init`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...headers
      },
      body: JSON.stringify(initData)
    });

    if (!response.ok) {
      throw new Error(`Failed to initialize chunked upload: ${response.status}`);
    }

    return await response.json();
  }

  // Upload de un chunk individual
  async uploadChunk(sessionId, chunk, chunkIndex, totalChunks, options) {
    const { url, headers } = options;

    const formData = new FormData();
    formData.append('chunk', chunk);
    formData.append('chunkIndex', chunkIndex.toString());
    formData.append('totalChunks', totalChunks.toString());
    formData.append('sessionId', sessionId);

    const response = await fetch(`${url}/chunk`, {
      method: 'POST',
      headers: headers,
      body: formData
    });

    if (!response.ok) {
      throw new Error(`Failed to upload chunk ${chunkIndex}: ${response.status}`);
    }

    return await response.json();
  }

  // Finalizar upload por chunks
  async finalizeChunkedUpload(sessionId, options) {
    const { url, headers } = options;

    const response = await fetch(`${url}/finalize`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...headers
      },
      body: JSON.stringify({ sessionId })
    });

    if (!response.ok) {
      throw new Error(`Failed to finalize chunked upload: ${response.status}`);
    }

    return await response.json();
  }

  // Abortar upload por chunks
  async abortChunkedUpload(sessionId, options) {
    const { url, headers } = options;

    const response = await fetch(`${url}/abort`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...headers
      },
      body: JSON.stringify({ sessionId })
    });

    return response.ok;
  }

  // Cancelar upload
  cancelUpload(uploadId) {
    const uploadState = this.activeUploads.get(uploadId);
    if (!uploadState) {
      return false;
    }

    // Cancelar XMLHttpRequest si existe
    if (uploadState.xhr) {
      uploadState.xhr.abort();
    }

    // Marcar como cancelado
    uploadState.state = this.uploadStates.CANCELLED;
    this.activeUploads.delete(uploadId);

    return true;
  }

  // Compresión de imágenes
  async compressImage(file, options = {}) {
    return new Promise((resolve, reject) => {
      const {
        quality = this.config.imageQuality,
        maxWidth = this.config.imageMaxWidth,
        maxHeight = this.config.imageMaxHeight,
        format = 'image/jpeg'
      } = options;

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        try {
          // Calcular nuevas dimensiones manteniendo proporción
          const { width, height } = this.calculateDimensions(
            img.width,
            img.height,
            maxWidth,
            maxHeight
          );

          canvas.width = width;
          canvas.height = height;

          // Dibujar imagen redimensionada
          ctx.drawImage(img, 0, 0, width, height);

          // Convertir a blob comprimido
          canvas.toBlob(
            (blob) => {
              if (blob) {
                // Crear nuevo File object
                const compressedFile = new File([blob], file.name, {
                  type: format,
                  lastModified: Date.now()
                });
                resolve(compressedFile);
              } else {
                reject(new Error('Image compression failed'));
              }
            },
            format,
            quality
          );
        } catch (error) {
          reject(error);
        }
      };

      img.onerror = () => {
        reject(new Error('Failed to load image for compression'));
      };

      img.src = URL.createObjectURL(file);
    });
  }

  // Generar thumbnail
  async generateThumbnail(file, size = 'medium') {
    return new Promise((resolve, reject) => {
      const thumbnailConfig = this.config.thumbnailSizes[size] || this.config.thumbnailSizes.medium;
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        try {
          canvas.width = thumbnailConfig.width;
          canvas.height = thumbnailConfig.height;

          // Calcular recorte para mantener proporción
          const scale = Math.max(
            thumbnailConfig.width / img.width,
            thumbnailConfig.height / img.height
          );

          const scaledWidth = img.width * scale;
          const scaledHeight = img.height * scale;

          const x = (thumbnailConfig.width - scaledWidth) / 2;
          const y = (thumbnailConfig.height - scaledHeight) / 2;

          // Dibujar imagen centrada y recortada
          ctx.drawImage(img, x, y, scaledWidth, scaledHeight);

          // Convertir a blob
          canvas.toBlob(
            (blob) => {
              if (blob) {
                const thumbnailFile = new File([blob], `thumb_${file.name}`, {
                  type: 'image/jpeg',
                  lastModified: Date.now()
                });
                resolve(thumbnailFile);
              } else {
                reject(new Error('Thumbnail generation failed'));
              }
            },
            'image/jpeg',
            0.8
          );
        } catch (error) {
          reject(error);
        }
      };

      img.onerror = () => {
        reject(new Error('Failed to load image for thumbnail'));
      };

      img.src = URL.createObjectURL(file);
    });
  }

  // Previsualización de archivos
  async generatePreview(file, options = {}) {
    const category = this.getFileCategory(file.type);

    switch (category) {
      case 'images':
        return this.generateImagePreview(file, options);
      case 'videos':
        return this.generateVideoPreview(file, options);
      case 'documents':
        return this.generateDocumentPreview(file, options);
      default:
        return this.generateGenericPreview(file, options);
    }
  }

  // Previsualización de imagen
  generateImagePreview(file, options = {}) {
    return new Promise((resolve, reject) => {
      const { maxWidth = 400, maxHeight = 300 } = options;
      const img = new Image();

      img.onload = () => {
        const { width, height } = this.calculateDimensions(
          img.width,
          img.height,
          maxWidth,
          maxHeight
        );

        resolve({
          type: 'image',
          url: img.src,
          width,
          height,
          originalWidth: img.width,
          originalHeight: img.height
        });
      };

      img.onerror = () => {
        reject(new Error('Failed to generate image preview'));
      };

      img.src = URL.createObjectURL(file);
    });
  }

  // Previsualización de video
  generateVideoPreview(file, options = {}) {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      const { maxWidth = 400, maxHeight = 300 } = options;

      video.onloadedmetadata = () => {
        const { width, height } = this.calculateDimensions(
          video.videoWidth,
          video.videoHeight,
          maxWidth,
          maxHeight
        );

        resolve({
          type: 'video',
          url: URL.createObjectURL(file),
          width,
          height,
          duration: video.duration,
          originalWidth: video.videoWidth,
          originalHeight: video.videoHeight
        });
      };

      video.onerror = () => {
        reject(new Error('Failed to generate video preview'));
      };

      video.src = URL.createObjectURL(file);
    });
  }

  // Previsualización de documento
  generateDocumentPreview(file, options = {}) {
    return new Promise((resolve) => {
      const preview = {
        type: 'document',
        name: file.name,
        size: file.size,
        extension: this.getFileExtension(file.name),
        canPreview: file.type === 'application/pdf' || file.type === 'text/plain'
      };

      if (file.type === 'text/plain') {
        const reader = new FileReader();
        reader.onload = (e) => {
          preview.content = e.target.result.substring(0, 500); // Primeros 500 caracteres
          resolve(preview);
        };
        reader.readAsText(file);
      } else {
        resolve(preview);
      }
    });
  }

  // Previsualización genérica
  generateGenericPreview(file, options = {}) {
    return Promise.resolve({
      type: 'generic',
      name: file.name,
      size: file.size,
      extension: this.getFileExtension(file.name),
      mimeType: file.type,
      icon: this.getFileIcon(file.type)
    });
  }

  // Utilidades de estado
  updateUploadState(uploadId, state, onStateChange, result = null, error = null) {
    const uploadState = this.activeUploads.get(uploadId);
    if (uploadState) {
      uploadState.state = state;
      uploadState.result = result;
      uploadState.error = error;

      if (onStateChange && typeof onStateChange === 'function') {
        onStateChange({
          uploadId,
          state,
          progress: uploadState.progress,
          result,
          error
        });
      }
    }
  }

  updateUploadProgress(uploadId, uploadedBytes, totalBytes, progress, onProgress) {
    const uploadState = this.activeUploads.get(uploadId);
    if (uploadState) {
      uploadState.uploadedBytes = uploadedBytes;
      uploadState.progress = progress;

      if (onProgress && typeof onProgress === 'function') {
        onProgress({
          uploadId,
          progress,
          uploadedBytes,
          totalBytes,
          speed: this.calculateUploadSpeed(uploadState)
        });
      }
    }
  }

  calculateUploadSpeed(uploadState) {
    const elapsedTime = Date.now() - uploadState.startTime;
    if (elapsedTime === 0) return 0;

    return Math.round((uploadState.uploadedBytes / elapsedTime) * 1000); // bytes per second
  }

  // Utilidades de archivo
  getFileCategory(mimeType) {
    for (const [category, types] of Object.entries(this.config.supportedFormats)) {
      if (types.includes(mimeType)) {
        return category;
      }
    }
    return null;
  }

  getFileExtension(fileName) {
    return fileName.substring(fileName.lastIndexOf('.'));
  }

  getFileIcon(mimeType) {
    const category = this.getFileCategory(mimeType);
    const iconMap = {
      images: '🖼️',
      documents: '📄',
      videos: '🎥',
      audio: '🎵'
    };
    return iconMap[category] || '📁';
  }

  isImage(file) {
    return this.config.supportedFormats.images.includes(file.type);
  }

  isVideo(file) {
    return this.config.supportedFormats.videos.includes(file.type);
  }

  isDocument(file) {
    return this.config.supportedFormats.documents.includes(file.type);
  }

  calculateDimensions(originalWidth, originalHeight, maxWidth, maxHeight) {
    const aspectRatio = originalWidth / originalHeight;

    let width = originalWidth;
    let height = originalHeight;

    // Ajustar ancho si excede el máximo
    if (width > maxWidth) {
      width = maxWidth;
      height = width / aspectRatio;
    }

    // Ajustar alto si excede el máximo
    if (height > maxHeight) {
      height = maxHeight;
      width = height * aspectRatio;
    }

    return {
      width: Math.round(width),
      height: Math.round(height)
    };
  }

  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // Obtener información de uploads activos
  getActiveUploads() {
    return Array.from(this.activeUploads.values()).map(upload => ({
      id: upload.id,
      fileName: upload.file.name,
      state: upload.state,
      progress: upload.progress,
      uploadedBytes: upload.uploadedBytes,
      totalBytes: upload.totalBytes,
      startTime: upload.startTime
    }));
  }

  // Configuración
  configure(newConfig) {
    this.config = { ...this.config, ...newConfig };
  }

  getConfig() {
    return { ...this.config };
  }

  // Limpiar uploads completados
  clearCompletedUploads() {
    for (const [uploadId, uploadState] of this.activeUploads.entries()) {
      if ([this.uploadStates.COMPLETED, this.uploadStates.FAILED, this.uploadStates.CANCELLED].includes(uploadState.state)) {
        this.activeUploads.delete(uploadId);
      }
    }
  }

  // Validación MIME avanzada
  async validateMimeType(file) {
    return new Promise((resolve) => {
      // Verificar magic numbers para validación real del tipo
      const reader = new FileReader();
      reader.onloadend = (e) => {
        const arr = new Uint8Array(e.target.result).subarray(0, 4);
        let header = '';
        for (let i = 0; i < arr.length; i++) {
          header += arr[i].toString(16).padStart(2, '0');
        }

        const mimeType = this.getMimeTypeFromHeader(header);
        resolve({
          declaredType: file.type,
          detectedType: mimeType,
          isValid: !mimeType || mimeType === file.type || this.isCompatibleType(file.type, mimeType)
        });
      };

      reader.readAsArrayBuffer(file.slice(0, 4));
    });
  }

  getMimeTypeFromHeader(header) {
    const signatures = {
      '89504e47': 'image/png',
      'ffd8ffe0': 'image/jpeg',
      'ffd8ffe1': 'image/jpeg',
      'ffd8ffe2': 'image/jpeg',
      '47494638': 'image/gif',
      '25504446': 'application/pdf',
      '504b0304': 'application/zip',
      '504b0506': 'application/zip',
      '504b0708': 'application/zip'
    };

    return signatures[header.substring(0, 8)] || null;
  }

  isCompatibleType(declaredType, detectedType) {
    // Algunos tipos son compatibles entre sí
    const compatibilityMap = {
      'image/jpg': 'image/jpeg',
      'image/jpeg': 'image/jpg'
    };

    return compatibilityMap[declaredType] === detectedType;
  }
}

// Crear instancia única
export const fileHandler = new FileHandler();

// Exportar métodos individuales para conveniencia
export const validateFile = (file, options) => fileHandler.validateFile(file, options);
export const uploadFile = (file, options) => fileHandler.uploadFile(file, options);
export const compressImage = (file, options) => fileHandler.compressImage(file, options);
export const generateThumbnail = (file, size) => fileHandler.generateThumbnail(file, size);
export const generatePreview = (file, options) => fileHandler.generatePreview(file, options);
export const cancelUpload = (uploadId) => fileHandler.cancelUpload(uploadId);
export const getActiveUploads = () => fileHandler.getActiveUploads();

export default fileHandler;