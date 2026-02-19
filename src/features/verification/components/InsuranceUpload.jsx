import React, { useState, useRef } from 'react';
import { Shield, Upload, AlertCircle } from 'lucide-react';
import { FileThumbnail } from './FileThumbnail';

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

export const InsuranceUpload = ({ 
  file = null, 
  onFileChange, 
  disabled = false,
  className = '' 
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [errors, setErrors] = useState([]);
  const fileInputRef = useRef(null);

  const handleFile = (newFile) => {
    const fileErrors = validateFile(newFile);
    
    if (fileErrors.length === 0) {
      // Create preview for images
      if (newFile.type.startsWith('image/')) {
        newFile.preview = URL.createObjectURL(newFile);
      }
      newFile.id = Date.now() + Math.random();
      onFileChange(newFile);
      setErrors([]);
    } else {
      setErrors([`${newFile.name}: ${fileErrors.join(' ')}`]);
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
    if (droppedFiles && droppedFiles[0]) {
      handleFile(droppedFiles[0]);
    }
  };

  const handleInputChange = (e) => {
    if (disabled) return;
    
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      handleFile(selectedFile);
    }
    // Reset input
    e.target.value = '';
  };

  const handleRemoveFile = () => {
    onFileChange(null);
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
      {!file && (
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
          aria-label="Área de subida de seguro de responsabilidad civil"
          onKeyDown={(e) => {
            if ((e.key === 'Enter' || e.key === ' ') && !disabled) {
              e.preventDefault();
              openFileDialog();
            }
          }}
        >
          <Shield className="mx-auto h-12 w-12 text-blue-500 mb-4" aria-hidden="true" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Subir Seguro de Responsabilidad Civil
          </h3>
          <p className="text-gray-600 mb-2">
            Arrastra y suelta tu archivo aquí, o haz clic para seleccionar
          </p>
          <p className="text-sm text-gray-500">
            1 documento • PDF, JPG, PNG • Máx. 5MB
          </p>
          
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            onChange={handleInputChange}
            className="hidden"
            disabled={disabled}
            aria-describedby="insurance-upload-description"
          />
        </div>
      )}

      {/* File status indicator */}
      <div className="flex justify-between items-center text-sm text-gray-600">
        <span id="insurance-upload-description">
          {file ? 'Seguro RC subido' : 'Seguro RC requerido'}
        </span>
        {file && (
          <span className="text-green-600">
            ✓ Documento listo
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
                Error en la subida:
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

      {/* File thumbnail */}
      {file && (
        <div className="max-w-xs">
          <FileThumbnail
            file={file}
            onRemove={handleRemoveFile}
            showRemove={!disabled}
          />
        </div>
      )}

      {/* Replace file option */}
      {file && !disabled && (
        <button
          onClick={openFileDialog}
          className="text-sm text-blue-600 hover:text-blue-800 underline"
          aria-label="Reemplazar archivo de seguro"
        >
          Reemplazar archivo
        </button>
      )}
    </div>
  );
};