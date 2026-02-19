import React, { useState } from 'react';
import {
  ArrowDownTrayIcon,
  TrashIcon,
  XMarkIcon,
  CheckIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

const ConfirmDialog = ({ isOpen, onClose, onConfirm, title, message, confirmText, type = 'danger' }) => {
  if (!isOpen) return null;

  const typeStyles = {
    danger: {
      icon: TrashIcon,
      iconColor: 'text-red-600',
      iconBg: 'bg-red-100',
      button: 'bg-red-600 hover:bg-red-700 text-white'
    },
    warning: {
      icon: ExclamationTriangleIcon,
      iconColor: 'text-yellow-600',
      iconBg: 'bg-yellow-100',
      button: 'bg-yellow-600 hover:bg-yellow-700 text-white'
    }
  };

  const style = typeStyles[type];
  const Icon = style.icon;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        {/* Backdrop */}
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
          onClick={onClose}
        />
        
        {/* Modal */}
        <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full">
          <div className="p-6">
            <div className="flex items-center gap-4">
              <div className={`flex-shrink-0 w-10 h-10 ${style.iconBg} rounded-full flex items-center justify-center`}>
                <Icon className={`w-6 h-6 ${style.iconColor}`} />
              </div>
              
              <div className="flex-1">
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {title}
                </h3>
                <p className="text-sm text-gray-600">
                  {message}
                </p>
              </div>
            </div>
            
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              
              <button
                onClick={onConfirm}
                className={`px-4 py-2 rounded-lg transition-colors ${style.button}`}
              >
                {confirmText}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const BulkToolbar = ({ 
  selectedCount, 
  onDownload, 
  onDelete, 
  onClear,
  isDownloading = false,
  isDeleting = false
}) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleDownload = () => {
    onDownload();
  };

  const handleDelete = () => {
    setShowDeleteConfirm(true);
  };

  const confirmDelete = () => {
    onDelete();
    setShowDeleteConfirm(false);
  };

  return (
    <>
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                <CheckIcon className="w-5 h-5 text-white" />
              </div>
              
              <div>
                <p className="text-sm font-medium text-blue-900">
                  {selectedCount} documento{selectedCount !== 1 ? 's' : ''} seleccionado{selectedCount !== 1 ? 's' : ''}
                </p>
                <p className="text-xs text-blue-700">
                  Elige una acción para aplicar a los documentos seleccionados
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Botón Descargar ZIP */}
            <button
              onClick={handleDownload}
              disabled={isDownloading || isDeleting}
              className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isDownloading ? (
                <>
                  <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                  Preparando...
                </>
              ) : (
                <>
                  <ArrowDownTrayIcon className="w-4 h-4" />
                  Descargar ZIP
                </>
              )}
            </button>
            
            {/* Botón Eliminar */}
            <button
              onClick={handleDelete}
              disabled={isDownloading || isDeleting}
              className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isDeleting ? (
                <>
                  <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                  Eliminando...
                </>
              ) : (
                <>
                  <TrashIcon className="w-4 h-4" />
                  Eliminar
                </>
              )}
            </button>
            
            {/* Botón Limpiar selección */}
            <button
              onClick={onClear}
              disabled={isDownloading || isDeleting}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Limpiar selección"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Diálogo de confirmación para eliminar */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={confirmDelete}
        title="Eliminar documentos"
        message={`¿Estás seguro de que quieres eliminar ${selectedCount} documento${selectedCount !== 1 ? 's' : ''}? Esta acción no se puede deshacer.`}
        confirmText="Eliminar"
        type="danger"
      />
    </>
  );
};

// Componente compacto para espacios reducidos
export const BulkToolbarCompact = ({ 
  selectedCount, 
  onDownload, 
  onDelete, 
  onClear,
  isDownloading = false,
  isDeleting = false
}) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showActions, setShowActions] = useState(false);

  const handleDownload = () => {
    onDownload();
    setShowActions(false);
  };

  const handleDelete = () => {
    setShowDeleteConfirm(true);
    setShowActions(false);
  };

  const confirmDelete = () => {
    onDelete();
    setShowDeleteConfirm(false);
  };

  return (
    <>
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
              <CheckIcon className="w-4 h-4 text-white" />
            </div>
            
            <span className="text-sm font-medium text-blue-900">
              {selectedCount} seleccionado{selectedCount !== 1 ? 's' : ''}
            </span>
          </div>
          
          <div className="flex items-center gap-1">
            {!showActions ? (
              <button
                onClick={() => setShowActions(true)}
                className="px-3 py-1 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
              >
                Acciones
              </button>
            ) : (
              <>
                <button
                  onClick={handleDownload}
                  disabled={isDownloading || isDeleting}
                  className="p-2 text-green-600 hover:bg-green-50 rounded-md transition-colors disabled:opacity-50"
                  title="Descargar ZIP"
                >
                  <ArrowDownTrayIcon className="w-4 h-4" />
                </button>
                
                <button
                  onClick={handleDelete}
                  disabled={isDownloading || isDeleting}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors disabled:opacity-50"
                  title="Eliminar"
                >
                  <TrashIcon className="w-4 h-4" />
                </button>
              </>
            )}
            
            <button
              onClick={onClear}
              disabled={isDownloading || isDeleting}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-white rounded-md transition-colors disabled:opacity-50"
              title="Limpiar selección"
            >
              <XMarkIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Diálogo de confirmación para eliminar */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={confirmDelete}
        title="Eliminar documentos"
        message={`¿Estás seguro de que quieres eliminar ${selectedCount} documento${selectedCount !== 1 ? 's' : ''}? Esta acción no se puede deshacer.`}
        confirmText="Eliminar"
        type="danger"
      />
    </>
  );
};

export default BulkToolbar;