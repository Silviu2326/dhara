import React from 'react';
import { CheckCircle, XCircle, Clock, FileText, Image, Download, Trash2 } from 'lucide-react';

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

const getStatusConfig = (status) => {
  const configs = {
    received: {
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      text: 'Recibido'
    },
    rejected: {
      icon: XCircle,
      color: 'text-red-600',
      bgColor: 'bg-red-100',
      text: 'Rechazado'
    },
    pending: {
      icon: Clock,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100',
      text: 'Pendiente'
    }
  };
  return configs[status] || configs.pending;
};

const getFileTypeText = (type) => {
  if (type === 'diploma') return 'Diploma';
  if (type === 'insurance') return 'Seguro RC';
  return 'Documento';
};

export const FileRow = ({ 
  file, 
  onDownload,
  onDelete,
  canDelete = false,
  className = '' 
}) => {
  const FileIcon = getFileIcon(file.mimeType || 'application/pdf');
  const statusConfig = getStatusConfig(file.status);
  const StatusIcon = statusConfig.icon;

  return (
    <tr className={`hover:bg-gray-50 ${className}`}>
      {/* File name with icon */}
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center">
          <FileIcon className="h-5 w-5 text-gray-400 mr-3 flex-shrink-0" aria-hidden="true" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-gray-900 truncate" title={file.name}>
              {file.name}
            </p>
            {file.originalName && file.originalName !== file.name && (
              <p className="text-xs text-gray-500 truncate" title={file.originalName}>
                Original: {file.originalName}
              </p>
            )}
          </div>
        </div>
      </td>

      {/* File type */}
      <td className="px-6 py-4 whitespace-nowrap">
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
          {getFileTypeText(file.type)}
        </span>
      </td>

      {/* File size */}
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
        {formatFileSize(file.size)}
      </td>

      {/* Upload date */}
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
        {new Date(file.uploadDate).toLocaleDateString('es-ES', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric'
        })}
      </td>

      {/* Status */}
      <td className="px-6 py-4 whitespace-nowrap">
        <span 
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusConfig.bgColor} ${statusConfig.color}`}
          role="status"
          aria-label={`Estado: ${statusConfig.text}`}
        >
          <StatusIcon className="w-3 h-3 mr-1" aria-hidden="true" />
          {statusConfig.text}
        </span>
      </td>

      {/* Actions */}
      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
        <div className="flex items-center justify-end space-x-2">
          {onDownload && (
            <button
              onClick={() => onDownload(file)}
              className="text-blue-600 hover:text-blue-900 inline-flex items-center"
              aria-label={`Descargar ${file.name}`}
            >
              <Download className="w-4 h-4 mr-1" aria-hidden="true" />
              Descargar
            </button>
          )}
          {onDelete && canDelete && (
            <button
              onClick={() => onDelete(file.id)}
              className="text-red-600 hover:text-red-900 inline-flex items-center ml-3"
              aria-label={`Eliminar ${file.name}`}
              title="Eliminar archivo"
            >
              <Trash2 className="w-4 h-4 mr-1" aria-hidden="true" />
              Eliminar
            </button>
          )}
        </div>
      </td>
    </tr>
  );
};