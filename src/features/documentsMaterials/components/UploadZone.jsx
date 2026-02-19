import React, { useState, useRef, useCallback } from 'react';
import {
  CloudArrowUpIcon,
  DocumentIcon,
  PhotoIcon,
  SpeakerWaveIcon,
  VideoCameraIcon,
  XMarkIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { fileTypeUtils } from './TypeChips';

const MAX_FILE_SIZE = 200 * 1024 * 1024; // 200MB
const ACCEPTED_TYPES = {
  'application/pdf': ['.pdf'],
  'image/*': ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'],
  'audio/*': ['.mp3', '.wav', '.ogg', '.m4a', '.aac'],
  'video/*': ['.mp4', '.avi', '.mov', '.wmv', '.flv', '.webm'],
  'application/msword': ['.doc'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
  'text/plain': ['.txt'],
  'application/rtf': ['.rtf'],
  'application/zip': ['.zip'],
  'application/x-rar-compressed': ['.rar']
};

const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const getFileIcon = (filename) => {
  const fileType = fileTypeUtils.getFileType(filename);
  
  switch (fileType) {
    case 'pdf':
    case 'document':
      return DocumentIcon;
    case 'image':
      return PhotoIcon;
    case 'audio':
      return SpeakerWaveIcon;
    case 'video':
      return VideoCameraIcon;
    default:
      return DocumentIcon;
  }
};

const FilePreview = ({ file, onRemove }) => {
  const Icon = getFileIcon(file.name);
  const fileType = fileTypeUtils.getFileType(file.name);
  const isImage = fileType === 'image';
  const [imagePreview, setImagePreview] = useState(null);

  React.useEffect(() => {
    if (isImage && file) {
      const reader = new FileReader();
      reader.onload = (e) => setImagePreview(e.target.result);
      reader.readAsDataURL(file);
    }
  }, [file, isImage]);

  return (
    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border">
      <div className="flex-shrink-0">
        {isImage && imagePreview ? (
          <img
            src={imagePreview}
            alt={file.name}
            className="w-10 h-10 object-cover rounded"
          />
        ) : (
          <Icon className="w-10 h-10 text-gray-400" />
        )}
      </div>
      
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
        <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
      </div>
      
      <button
        onClick={() => onRemove(file)}
        className="flex-shrink-0 p-1 text-gray-400 hover:text-red-500 transition-colors"
      >
        <XMarkIcon className="w-5 h-5" />
      </button>
    </div>
  );
};

export const UploadZone = ({ onFilesSelected, maxFiles = 10, className = '' }) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [errors, setErrors] = useState([]);
  const fileInputRef = useRef(null);

  const validateFile = (file) => {
    const errors = [];
    
    // Validar tamaño
    if (file.size > MAX_FILE_SIZE) {
      errors.push(`${file.name}: El archivo es demasiado grande (máximo ${formatFileSize(MAX_FILE_SIZE)})`);
    }
    
    // Validar tipo
    const fileType = fileTypeUtils.getFileType(file.name);
    if (!fileType || fileType === 'other') {
      const extension = file.name.split('.').pop()?.toLowerCase();
      if (!['zip', 'rar', 'xlsx', 'pptx', 'csv'].includes(extension)) {
        errors.push(`${file.name}: Tipo de archivo no soportado`);
      }
    }
    
    return errors;
  };

  const processFiles = useCallback((files) => {
    const fileArray = Array.from(files);
    const newErrors = [];
    const validFiles = [];
    
    // Validar límite de archivos
    if (selectedFiles.length + fileArray.length > maxFiles) {
      newErrors.push(`Solo puedes subir un máximo de ${maxFiles} archivos`);
      return;
    }
    
    fileArray.forEach(file => {
      const fileErrors = validateFile(file);
      if (fileErrors.length > 0) {
        newErrors.push(...fileErrors);
      } else {
        // Verificar duplicados
        const isDuplicate = selectedFiles.some(existing => 
          existing.name === file.name && existing.size === file.size
        );
        
        if (!isDuplicate) {
          validFiles.push(file);
        } else {
          newErrors.push(`${file.name}: Archivo duplicado`);
        }
      }
    });
    
    setErrors(newErrors);
    
    if (validFiles.length > 0) {
      const updatedFiles = [...selectedFiles, ...validFiles];
      setSelectedFiles(updatedFiles);
      onFilesSelected(updatedFiles);
    }
  }, [selectedFiles, maxFiles, onFilesSelected]);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      processFiles(files);
    }
  }, [processFiles]);

  const handleFileSelect = useCallback((e) => {
    const files = e.target.files;
    if (files.length > 0) {
      processFiles(files);
    }
    // Limpiar el input para permitir seleccionar el mismo archivo
    e.target.value = '';
  }, [processFiles]);

  const removeFile = (fileToRemove) => {
    const updatedFiles = selectedFiles.filter(file => file !== fileToRemove);
    setSelectedFiles(updatedFiles);
    onFilesSelected(updatedFiles);
  };

  const clearAllFiles = () => {
    setSelectedFiles([]);
    setErrors([]);
    onFilesSelected([]);
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Zona de drag and drop */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={openFileDialog}
        className={`relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all ${
          isDragOver
            ? 'border-blue-400 bg-blue-50'
            : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleFileSelect}
          accept={Object.keys(ACCEPTED_TYPES).join(',')}
          className="hidden"
        />
        
        <CloudArrowUpIcon className={`mx-auto h-12 w-12 ${
          isDragOver ? 'text-blue-500' : 'text-gray-400'
        }`} />
        
        <div className="mt-4">
          <p className={`text-lg font-medium ${
            isDragOver ? 'text-blue-700' : 'text-gray-900'
          }`}>
            {isDragOver ? 'Suelta los archivos aquí' : 'Arrastra archivos aquí'}
          </p>
          
          <p className="text-sm text-gray-500 mt-1">
            o{' '}
            <span className="text-blue-600 hover:text-blue-700 font-medium">
              haz clic para seleccionar
            </span>
          </p>
          
          <p className="text-xs text-gray-400 mt-2">
            Máximo {formatFileSize(MAX_FILE_SIZE)} por archivo • Hasta {maxFiles} archivos
          </p>
          
          <p className="text-xs text-gray-400 mt-1">
            PDF, Imágenes, Audio, Vídeo, Documentos
          </p>
        </div>
      </div>

      {/* Errores */}
      {errors.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start gap-2">
            <ExclamationTriangleIcon className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="text-sm font-medium text-red-800 mb-1">
                Errores al subir archivos:
              </h4>
              <ul className="text-sm text-red-700 space-y-1">
                {errors.map((error, index) => (
                  <li key={index}>• {error}</li>
                ))}
              </ul>
            </div>
            <button
              onClick={() => setErrors([])}
              className="text-red-400 hover:text-red-600"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* Lista de archivos seleccionados */}
      {selectedFiles.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-gray-900">
              Archivos seleccionados ({selectedFiles.length})
            </h4>
            <button
              onClick={clearAllFiles}
              className="text-sm text-gray-500 hover:text-red-600 transition-colors"
            >
              Limpiar todo
            </button>
          </div>
          
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {selectedFiles.map((file, index) => (
              <FilePreview
                key={`${file.name}-${index}`}
                file={file}
                onRemove={removeFile}
              />
            ))}
          </div>
          
          <div className="text-xs text-gray-500">
            Tamaño total: {formatFileSize(
              selectedFiles.reduce((total, file) => total + file.size, 0)
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export const UploadZoneCompact = (props) => {
  return (
    <UploadZone
      {...props}
      className="p-4"
    />
  );
};