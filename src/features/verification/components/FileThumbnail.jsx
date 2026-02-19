import React from 'react';
import { FileText, Image, Trash2, Download } from 'lucide-react';

const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const getFileIcon = (type) => {
  if (type.startsWith('image/')) {
    return Image;
  }
  return FileText;
};

export const FileThumbnail = ({ 
  file, 
  onRemove, 
  onDownload,
  showRemove = true,
  showDownload = false,
  status = 'pending',
  className = '' 
}) => {
  const Icon = getFileIcon(file.type);
  const isImage = file.type.startsWith('image/');
  
  const statusColors = {
    pending: 'border-gray-300',
    approved: 'border-green-300 bg-green-50',
    rejected: 'border-red-300 bg-red-50'
  };

  return (
    <div 
      className={`relative p-4 border-2 rounded-lg ${statusColors[status]} ${className}`}
      role="listitem"
    >
      {/* Preview */}
      <div className="flex flex-col items-center space-y-2">
        {isImage && file.preview ? (
          <img 
            src={file.preview} 
            alt={`Vista previa de ${file.name}`}
            className="w-16 h-16 object-cover rounded border"
          />
        ) : (
          <Icon 
            className="w-16 h-16 text-gray-400" 
            aria-hidden="true"
          />
        )}
        
        {/* File info */}
        <div className="text-center">
          <p className="text-sm font-medium text-gray-900 truncate max-w-32" title={file.name}>
            {file.name}
          </p>
          <p className="text-xs text-gray-500">
            {formatFileSize(file.size)}
          </p>
          {file.uploadDate && (
            <p className="text-xs text-gray-500">
              {new Date(file.uploadDate).toLocaleDateString('es-ES')}
            </p>
          )}
        </div>
      </div>

      {/* Action buttons */}
      <div className="absolute top-2 right-2 flex space-x-1">
        {showDownload && onDownload && (
          <button
            onClick={() => onDownload(file)}
            className="p-1 bg-blue-100 hover:bg-blue-200 rounded-full transition-colors"
            title="Descargar archivo"
            aria-label={`Descargar ${file.name}`}
          >
            <Download className="w-4 h-4 text-blue-600" />
          </button>
        )}
        
        {showRemove && onRemove && (
          <button
            onClick={() => onRemove(file.id || file.name)}
            className="p-1 bg-red-100 hover:bg-red-200 rounded-full transition-colors"
            title="Eliminar archivo"
            aria-label={`Eliminar ${file.name}`}
          >
            <Trash2 className="w-4 h-4 text-red-600" />
          </button>
        )}
      </div>

      {/* Status indicator */}
      {status !== 'pending' && (
        <div className="absolute top-2 left-2">
          {status === 'approved' && (
            <div className="w-3 h-3 bg-green-500 rounded-full" title="Aprobado" />
          )}
          {status === 'rejected' && (
            <div className="w-3 h-3 bg-red-500 rounded-full" title="Rechazado" />
          )}
        </div>
      )}
    </div>
  );
};