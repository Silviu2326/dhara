import React, { useState } from 'react';
import {
  EyeIcon,
  ArrowDownTrayIcon,
  PaperAirplaneIcon,
  TrashIcon,
  EllipsisVerticalIcon,
  DocumentIcon,
  PhotoIcon,
  SpeakerWaveIcon,
  VideoCameraIcon,
  DocumentTextIcon,
  ArchiveBoxIcon,
  CalendarIcon,
  UserIcon,
  PencilIcon,
  EyeSlashIcon
} from '@heroicons/react/24/outline';
import { fileTypeUtils } from './TypeChips';

const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const formatDate = (date) => {
  const now = new Date();
  const docDate = new Date(date);
  const diffTime = Math.abs(now - docDate);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 1) {
    return 'Hoy';
  } else if (diffDays === 2) {
    return 'Ayer';
  } else if (diffDays <= 7) {
    return `Hace ${diffDays - 1} días`;
  } else {
    return new Intl.DateTimeFormat('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).format(docDate);
  }
};

const getFileTypeIcon = (filename) => {
  const fileType = fileTypeUtils.getFileType(filename);
  
  const iconMap = {
    pdf: DocumentIcon,
    image: PhotoIcon,
    audio: SpeakerWaveIcon,
    video: VideoCameraIcon,
    document: DocumentTextIcon,
    other: ArchiveBoxIcon
  };
  
  return iconMap[fileType] || DocumentIcon;
};

const getFileTypeColor = (filename) => {
  const fileType = fileTypeUtils.getFileType(filename);
  
  const colorMap = {
    pdf: 'text-red-500',
    image: 'text-green-500',
    audio: 'text-purple-500',
    video: 'text-blue-500',
    document: 'text-indigo-500',
    other: 'text-gray-500'
  };
  
  return colorMap[fileType] || 'text-gray-500';
};

const getFileTypeLabel = (filename) => {
  const fileType = fileTypeUtils.getFileType(filename);
  
  const labelMap = {
    pdf: 'PDF',
    image: 'Imagen',
    audio: 'Audio',
    video: 'Vídeo',
    document: 'Documento',
    other: 'Archivo'
  };
  
  return labelMap[fileType] || 'Archivo';
};

const ActionButton = ({ onClick, icon: Icon, label, variant = 'default', disabled = false }) => {
  const baseClasses = "p-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed";
  
  const variantClasses = {
    default: "text-gray-400 hover:text-gray-600 hover:bg-gray-100",
    primary: "text-blue-500 hover:text-blue-700 hover:bg-blue-50",
    success: "text-green-500 hover:text-green-700 hover:bg-green-50",
    danger: "text-red-500 hover:text-red-700 hover:bg-red-50"
  };
  
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${variantClasses[variant]}`}
      title={label}
    >
      <Icon className="w-4 h-4" />
    </button>
  );
};

const DropdownMenu = ({ document, onPreview, onDownload, onResend, onEdit, onDelete }) => {
  const [isOpen, setIsOpen] = useState(false);
  
  const menuItems = [
    {
      label: 'Ver documento',
      icon: EyeIcon,
      onClick: () => {
        onPreview();
        setIsOpen(false);
      },
      variant: 'default'
    },
    {
      label: 'Descargar',
      icon: ArrowDownTrayIcon,
      onClick: () => {
        onDownload();
        setIsOpen(false);
      },
      variant: 'primary'
    },
    {
      label: 'Reenviar al cliente',
      icon: PaperAirplaneIcon,
      onClick: () => {
        onResend();
        setIsOpen(false);
      },
      variant: 'success',
      disabled: !document.client
    },
    {
      label: 'Editar',
      icon: PencilIcon,
      onClick: () => {
        onEdit();
        setIsOpen(false);
      },
      variant: 'default'
    },
    {
      label: 'Eliminar',
      icon: TrashIcon,
      onClick: () => {
        onDelete();
        setIsOpen(false);
      },
      variant: 'danger'
    }
  ];
  
  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
      >
        <EllipsisVerticalIcon className="w-4 h-4" />
      </button>
      
      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          
          <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-20">
            <div className="py-1">
              {menuItems.map((item, index) => {
                const Icon = item.icon;
                return (
                  <button
                    key={index}
                    onClick={item.onClick}
                    disabled={item.disabled}
                    className={`w-full flex items-center gap-3 px-4 py-2 text-sm text-left transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                      item.variant === 'danger'
                        ? 'text-red-700 hover:bg-red-50'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export const DocumentRow = ({
  document,
  isSelected,
  onSelect,
  onPreview,
  onDownload,
  onResend,
  onEdit,
  onDelete
}) => {
  const FileIcon = getFileTypeIcon(document.filename);
  const fileTypeColor = getFileTypeColor(document.filename);
  const fileTypeLabel = getFileTypeLabel(document.filename);
  
  return (
    <tr className={`hover:bg-gray-50 transition-colors ${
      isSelected ? 'bg-blue-50' : ''
    }`}>
      {/* Checkbox */}
      <td className="px-6 py-4">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={(e) => onSelect(e.target.checked)}
          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
        />
      </td>
      
      {/* Título */}
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <FileIcon className={`w-8 h-8 ${fileTypeColor} flex-shrink-0`} />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium text-gray-900 truncate">
                {document.title}
              </p>
              {document.isPrivate && (
                <EyeSlashIcon className="w-4 h-4 text-amber-500 flex-shrink-0" title="Documento privado" />
              )}
            </div>
            <p className="text-xs text-gray-500 truncate">
              {document.filename}
            </p>
            {document.tags && document.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1">
                {document.tags.slice(0, 2).map((tag, index) => (
                  <span
                    key={index}
                    className="inline-block px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded-full"
                  >
                    #{tag}
                  </span>
                ))}
                {document.tags.length > 2 && (
                  <span className="text-xs text-gray-400">
                    +{document.tags.length - 2}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </td>
      
      {/* Tipo */}
      <td className="px-6 py-4">
        <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${
          fileTypeColor.replace('text-', 'text-').replace('-500', '-700')
        } bg-gray-100`}>
          {fileTypeLabel}
        </span>
      </td>
      
      {/* Tamaño */}
      <td className="px-6 py-4">
        <span className="text-sm text-gray-900">
          {formatFileSize(document.size || 0)}
        </span>
      </td>
      
      {/* Cliente */}
      <td className="px-6 py-4">
        {document.client ? (
          <div className="flex items-center gap-2">
            {document.client.avatar ? (
              <img
                src={document.client.avatar}
                alt={document.client.name}
                className="w-6 h-6 rounded-full object-cover"
              />
            ) : (
              <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center">
                <UserIcon className="w-3 h-3 text-gray-600" />
              </div>
            )}
            <span className="text-sm text-gray-900 truncate max-w-24">
              {document.client.name}
            </span>
          </div>
        ) : (
          <span className="text-sm text-gray-400">—</span>
        )}
      </td>
      
      {/* Sesión */}
      <td className="px-6 py-4">
        {document.session ? (
          <div className="flex items-center gap-2">
            <CalendarIcon className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-900 truncate max-w-32">
              {document.session.title}
            </span>
          </div>
        ) : (
          <span className="text-sm text-gray-400">—</span>
        )}
      </td>
      
      {/* Fecha */}
      <td className="px-6 py-4">
        <div className="text-sm text-gray-900">
          {formatDate(document.createdAt)}
        </div>
        <div className="text-xs text-gray-500">
          {new Intl.DateTimeFormat('es-ES', {
            hour: '2-digit',
            minute: '2-digit'
          }).format(new Date(document.createdAt))}
        </div>
      </td>
      
      {/* Acciones */}
      <td className="px-6 py-4">
        <div className="flex items-center justify-end gap-1">
          {/* Acciones rápidas en desktop */}
          <div className="hidden lg:flex items-center gap-1">
            <ActionButton
              onClick={onPreview}
              icon={EyeIcon}
              label="Ver documento"
              variant="default"
            />
            
            <ActionButton
              onClick={onDownload}
              icon={ArrowDownTrayIcon}
              label="Descargar"
              variant="primary"
            />
            
            <ActionButton
              onClick={onResend}
              icon={PaperAirplaneIcon}
              label="Reenviar al cliente"
              variant="success"
              disabled={!document.client}
            />
            
            <ActionButton
              onClick={onEdit}
              icon={PencilIcon}
              label="Editar"
              variant="default"
            />
            
            <ActionButton
              onClick={onDelete}
              icon={TrashIcon}
              label="Eliminar"
              variant="danger"
            />
          </div>
          
          {/* Menú dropdown en mobile */}
          <div className="lg:hidden">
            <DropdownMenu
              document={document}
              onPreview={onPreview}
              onDownload={onDownload}
              onResend={onResend}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          </div>
        </div>
      </td>
    </tr>
  );
};

export default DocumentRow;