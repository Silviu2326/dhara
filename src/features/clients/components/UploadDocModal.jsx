import React, { useState, useRef, useCallback } from 'react';
import { 
  CloudArrowUpIcon,
  DocumentIcon,
  PhotoIcon,
  XMarkIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
import { Button } from '../../../components/Button';

const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const getFileIcon = (fileType) => {
  if (fileType.startsWith('image/')) {
    return <PhotoIcon className="h-8 w-8 text-blue-500" />;
  }
  return <DocumentIcon className="h-8 w-8 text-gray-500" />;
};

const validateFile = (file) => {
  const maxSize = 200 * 1024 * 1024; // 200 MB
  const allowedTypes = [
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain'
  ];
  
  const errors = [];
  
  if (file.size > maxSize) {
    errors.push(`El archivo es demasiado grande. Máximo permitido: ${formatFileSize(maxSize)}`);
  }
  
  if (!allowedTypes.includes(file.type)) {
    errors.push('Tipo de archivo no permitido. Formatos aceptados: PDF, imágenes (JPG, PNG, GIF, WebP), Word, texto.');
  }
  
  return errors;
};

const FilePreview = ({ file, onRemove }) => {
  const [preview, setPreview] = useState(null);
  
  React.useEffect(() => {
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => setPreview(e.target.result);
      reader.readAsDataURL(file);
    }
  }, [file]);
  
  const validationErrors = validateFile(file);
  const hasErrors = validationErrors.length > 0;
  
  return (
    <div className={`border rounded-lg p-4 ${
      hasErrors ? 'border-red-200 bg-red-50' : 'border-gray-200 bg-gray-50'
    }`}>
      <div className="flex items-start gap-3">
        {/* Preview o icono */}
        <div className="flex-shrink-0">
          {preview ? (
            <img 
              src={preview} 
              alt={file.name}
              className="w-12 h-12 object-cover rounded"
            />
          ) : (
            getFileIcon(file.type)
          )}
        </div>
        
        {/* Información del archivo */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-medium truncate ${
                hasErrors ? 'text-red-900' : 'text-gray-900'
              }`}>
                {file.name}
              </p>
              <p className={`text-xs ${
                hasErrors ? 'text-red-600' : 'text-gray-600'
              }`}>
                {formatFileSize(file.size)} • {file.type}
              </p>
            </div>
            
            <button
              onClick={() => onRemove(file)}
              className="ml-2 p-1 text-gray-400 hover:text-red-500"
            >
              <TrashIcon className="h-4 w-4" />
            </button>
          </div>
          
          {/* Errores de validación */}
          {hasErrors && (
            <div className="mt-2">
              {validationErrors.map((error, index) => (
                <div key={index} className="flex items-center gap-1 text-xs text-red-600">
                  <ExclamationTriangleIcon className="h-3 w-3" />
                  <span>{error}</span>
                </div>
              ))}
            </div>
          )}
          
          {/* Estado de éxito */}
          {!hasErrors && (
            <div className="flex items-center gap-1 mt-1 text-xs text-green-600">
              <CheckCircleIcon className="h-3 w-3" />
              <span>Archivo válido</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const DropZone = ({ onFilesSelected, isDragActive, children }) => {
  const fileInputRef = useRef(null);
  
  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);
  
  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    
    const files = Array.from(e.dataTransfer.files);
    onFilesSelected(files);
  }, [onFilesSelected]);
  
  const handleFileInput = useCallback((e) => {
    const files = Array.from(e.target.files);
    onFilesSelected(files);
    // Reset input para permitir seleccionar el mismo archivo de nuevo
    e.target.value = '';
  }, [onFilesSelected]);
  
  return (
    <div
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onClick={() => fileInputRef.current?.click()}
      className={`
        border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
        ${
          isDragActive
            ? 'border-primary bg-primary bg-opacity-5'
            : 'border-gray-300 hover:border-gray-400'
        }
      `}
    >
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept=".pdf,.jpg,.jpeg,.png,.gif,.webp,.doc,.docx,.txt"
        onChange={handleFileInput}
        className="hidden"
      />
      {children}
    </div>
  );
};

export const UploadDocModal = ({ 
  isOpen, 
  onClose, 
  client,
  onUpload
}) => {
  const [files, setFiles] = useState([]);
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [category, setCategory] = useState('general');
  const [isDragActive, setIsDragActive] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});
  
  const categories = [
    { id: 'general', name: 'General' },
    { id: 'medical', name: 'Informes médicos' },
    { id: 'insurance', name: 'Seguros' },
    { id: 'consent', name: 'Consentimientos' },
    { id: 'assessment', name: 'Evaluaciones' },
    { id: 'treatment', name: 'Plan de tratamiento' },
    { id: 'other', name: 'Otros' }
  ];
  
  React.useEffect(() => {
    if (isOpen) {
      // Reset form when modal opens
      setFiles([]);
      setTitle('');
      setNotes('');
      setCategory('general');
      setUploadProgress({});
    }
  }, [isOpen]);
  
  const handleFilesSelected = useCallback((newFiles) => {
    setFiles(prev => [...prev, ...newFiles]);
  }, []);
  
  const handleRemoveFile = useCallback((fileToRemove) => {
    setFiles(prev => prev.filter(file => file !== fileToRemove));
  }, []);
  
  const handleDragEnter = useCallback((e) => {
    e.preventDefault();
    setIsDragActive(true);
  }, []);
  
  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setIsDragActive(false);
    }
  }, []);
  
  const validateForm = () => {
    if (files.length === 0) {
      alert('Por favor selecciona al menos un archivo');
      return false;
    }
    
    if (!title.trim()) {
      alert('Por favor introduce un título para los documentos');
      return false;
    }
    
    // Verificar que no hay archivos con errores
    const hasInvalidFiles = files.some(file => validateFile(file).length > 0);
    if (hasInvalidFiles) {
      alert('Por favor corrige los errores en los archivos antes de continuar');
      return false;
    }
    
    return true;
  };
  
  const simulateUpload = (file) => {
    return new Promise((resolve) => {
      let progress = 0;
      const interval = setInterval(() => {
        progress += Math.random() * 30;
        if (progress >= 100) {
          progress = 100;
          clearInterval(interval);
          resolve();
        }
        setUploadProgress(prev => ({ ...prev, [file.name]: progress }));
      }, 200);
    });
  };
  
  const handleSubmit = async () => {
    if (!validateForm()) return;
    
    setIsUploading(true);
    
    try {
      // Simular subida de archivos
      const uploadPromises = files.map(file => simulateUpload(file));
      await Promise.all(uploadPromises);
      
      const uploadData = {
        clientId: client.id,
        title: title.trim(),
        notes: notes.trim(),
        category,
        files: files.map(file => ({
          name: file.name,
          size: file.size,
          type: file.type,
          lastModified: file.lastModified
        }))
      };
      
      await onUpload(uploadData);
      onClose();
    } catch (error) {
      console.error('Error uploading documents:', error);
      alert('Error al subir los documentos. Por favor inténtalo de nuevo.');
    } finally {
      setIsUploading(false);
      setUploadProgress({});
    }
  };
  
  if (!isOpen) return null;
  
  const validFiles = files.filter(file => validateFile(file).length === 0);
  const totalSize = files.reduce((sum, file) => sum + file.size, 0);
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Subir documentos</h2>
            <p className="text-sm text-gray-600">
              Cliente: {client?.name}
            </p>
          </div>
          
          <button
            onClick={onClose}
            disabled={isUploading}
            className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          <div className="space-y-6">
            {/* Información del documento */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Título del documento *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ej: Informe médico, Consentimiento informado..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                  disabled={isUploading}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Categoría
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                  disabled={isUploading}
                >
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
            </div>
            
            {/* Notas */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notas (opcional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Información adicional sobre los documentos..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary resize-none"
                disabled={isUploading}
              />
            </div>
            
            {/* Zona de subida */}
            <div
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
            >
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Archivos *
              </label>
              
              {files.length === 0 ? (
                <DropZone 
                  onFilesSelected={handleFilesSelected}
                  isDragActive={isDragActive}
                >
                  <CloudArrowUpIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <p className="text-lg font-medium text-gray-900 mb-2">
                    {isDragActive ? 'Suelta los archivos aquí' : 'Arrastra archivos aquí'}
                  </p>
                  <p className="text-sm text-gray-600 mb-4">
                    o haz clic para seleccionar archivos
                  </p>
                  <p className="text-xs text-gray-500">
                    Formatos aceptados: PDF, imágenes (JPG, PNG, GIF, WebP), Word, texto<br />
                    Tamaño máximo: 200 MB por archivo
                  </p>
                </DropZone>
              ) : (
                <div className="space-y-3">
                  {/* Lista de archivos */}
                  {files.map((file, index) => (
                    <div key={index} className="relative">
                      <FilePreview 
                        file={file} 
                        onRemove={handleRemoveFile}
                      />
                      
                      {/* Barra de progreso durante la subida */}
                      {isUploading && uploadProgress[file.name] !== undefined && (
                        <div className="absolute inset-0 bg-white bg-opacity-90 flex items-center justify-center rounded-lg">
                          <div className="w-full max-w-xs">
                            <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
                              <span>Subiendo...</span>
                              <span>{Math.round(uploadProgress[file.name])}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-primary h-2 rounded-full transition-all duration-300"
                                style={{ width: `${uploadProgress[file.name]}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                  
                  {/* Botón para añadir más archivos */}
                  {!isUploading && (
                    <DropZone 
                      onFilesSelected={handleFilesSelected}
                      isDragActive={isDragActive}
                    >
                      <div className="py-4">
                        <CloudArrowUpIcon className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                        <p className="text-sm text-gray-600">
                          Añadir más archivos
                        </p>
                      </div>
                    </DropZone>
                  )}
                </div>
              )}
            </div>
            
            {/* Resumen */}
            {files.length > 0 && (
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">Resumen</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Total de archivos:</span>
                    <span className="ml-2 font-medium">{files.length}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Archivos válidos:</span>
                    <span className="ml-2 font-medium text-green-600">{validFiles.length}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Tamaño total:</span>
                    <span className="ml-2 font-medium">{formatFileSize(totalSize)}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Categoría:</span>
                    <span className="ml-2 font-medium">
                      {categories.find(c => c.id === category)?.name}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isUploading}
          >
            Cancelar
          </Button>
          
          <Button
            onClick={handleSubmit}
            disabled={files.length === 0 || !title.trim() || validFiles.length === 0 || isUploading}
            loading={isUploading}
          >
            {isUploading ? 'Subiendo...' : `Subir ${files.length} archivo${files.length !== 1 ? 's' : ''}`}
          </Button>
        </div>
      </div>
    </div>
  );
};