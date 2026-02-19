import React, { useState, useRef } from 'react';
import { Upload, FileText, AlertCircle } from 'lucide-react';
import { FileThumbnail } from './FileThumbnail';

const MAX_FILES = 3;
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ACCEPTED_TYPES = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];

const validateFile = (file) => {
  const errors = [];
  
  if (!ACCEPTED_TYPES.includes(file.type)) {
    errors.push('Tipo de archivo no válido. Solo se permiten PDF, JPG y PNG.');
  }
  
  if (file.size > MAX_FILE_SIZE) {
    errors.push('El archivo es demasiado grande. Máximo 10MB.');
  }
  
  return errors;
};

export const DiplomaUpload = ({ 
  files = [], 
  onFilesChange, 
  disabled = false,
  className = '' 
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [errors, setErrors] = useState([]);
  const fileInputRef = useRef(null);

  const handleFiles = (newFiles) => {
    const fileArray = Array.from(newFiles);
    const validFiles = [];
    const allErrors = [];

    // Check total file count
    if (files.length + fileArray.length > MAX_FILES) {
      allErrors.push(`Máximo ${MAX_FILES} documentos permitidos.`);
      setErrors(allErrors);
      return;
    }

    fileArray.forEach(file => {
      const fileErrors = validateFile(file);
      if (fileErrors.length === 0) {
        // Create preview for images
        if (file.type.startsWith('image/')) {
          file.preview = URL.createObjectURL(file);
        }
        file.id = Date.now() + Math.random();
        validFiles.push(file);
      } else {
        allErrors.push(`${file.name}: ${fileErrors.join(' ')}`);
      }
    });

    setErrors(allErrors);
    
    if (validFiles.length > 0) {
      onFilesChange([...files, ...validFiles]);
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (disabled) return;
    
    const droppedFiles = e.dataTransfer.files;
    if (droppedFiles) {
      handleFiles(droppedFiles);
    }
  };

  const handleInputChange = (e) => {
    if (disabled) return;
    
    const selectedFiles = e.target.files;
    if (selectedFiles) {
      handleFiles(selectedFiles);
    }
    // Reset input
    e.target.value = '';
  };

  const handleRemoveFile = (fileId) => {
    const updatedFiles = files.filter(file => file.id !== fileId);
    onFilesChange(updatedFiles);
    setErrors([]);
  };

  const openFileDialog = () => {
    if (!disabled) {
      fileInputRef.current?.click();
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Upload Area */}
      <div
        className={`
          relative border-2 border-dashed rounded-lg p-8 text-center transition-colors
          ${dragActive ? 'border-blue-400 bg-blue-50' : 'border-gray-300'}
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-gray-400'}
        `}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={openFileDialog}
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-label="Área de subida de diplomas"
        onKeyDown={(e) => {
          if ((e.key === 'Enter' || e.key === ' ') && !disabled) {
            e.preventDefault();
            openFileDialog();
          }
        }}
      >
        <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" aria-hidden="true" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Subir Diplomas y Títulos
        </h3>
        <p className="text-gray-600 mb-2">
          Arrastra y suelta tus archivos aquí, o haz clic para seleccionar
        </p>
        <p className="text-sm text-gray-500">
          Máximo {MAX_FILES} documentos • PDF, JPG, PNG • Máx. 5MB cada uno
        </p>
        
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,.jpg,.jpeg,.png"
          onChange={handleInputChange}
          className="hidden"
          disabled={disabled}
          aria-describedby="diploma-upload-description"
        />
      </div>

      {/* File count indicator */}
      <div className="flex justify-between items-center text-sm text-gray-600">
        <span id="diploma-upload-description">
          {files.length} de {MAX_FILES} documentos subidos
        </span>
        {files.length > 0 && (
          <span className="text-green-600">
            ✓ Documentos listos
          </span>
        )}
      </div>

      {/* Error messages */}
      {errors.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4" role="alert">
          <div className="flex items-start">
            <AlertCircle className="h-5 w-5 text-red-400 mt-0.5 mr-3 flex-shrink-0" />
            <div>
              <h4 className="text-sm font-medium text-red-800 mb-1">
                Errores en la subida:
              </h4>
              <ul className="text-sm text-red-700 space-y-1">
                {errors.map((error, index) => (
                  <li key={index}>• {error}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* File thumbnails */}
      {files.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {files.map((file) => (
            <FileThumbnail
              key={file.id}
              file={file}
              onRemove={handleRemoveFile}
              showRemove={!disabled}
            />
          ))}
        </div>
      )}
    </div>
  );
};