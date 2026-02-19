import React, { useState } from 'react';
import { 
  ClockIcon,
  EyeIcon,
  ArrowUturnLeftIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  CalendarIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';
import { Button } from '../../../components/Button';

const formatDate = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now - date);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 1) {
    return `Ayer a las ${date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}`;
  } else if (diffDays < 7) {
    return `Hace ${diffDays} días`;
  } else {
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
};

const getContentPreview = (content, maxLength = 150) => {
  if (!content) return 'Sin contenido';
  
  // Remover markdown básico para el preview
  const cleanContent = content
    .replace(/#{1,6}\s/g, '') // Headers
    .replace(/\*\*(.*?)\*\*/g, '$1') // Bold
    .replace(/\*(.*?)\*/g, '$1') // Italic
    .replace(/^[\*\-]\s/gm, '') // Lists
    .replace(/\n/g, ' ') // Line breaks
    .trim();
  
  return cleanContent.length > maxLength 
    ? cleanContent.substring(0, maxLength) + '...' 
    : cleanContent;
};

const getWordCount = (content) => {
  if (!content) return 0;
  return content.trim().split(/\s+/).filter(word => word.length > 0).length;
};

const HistoryItem = ({ 
  version, 
  onView, 
  onRestore, 
  onDelete, 
  isCurrentVersion = false 
}) => {
  const [showFullContent, setShowFullContent] = useState(false);
  
  const wordCount = getWordCount(version.content);
  const preview = getContentPreview(version.content);
  
  return (
    <div className={`border rounded-lg p-4 transition-all ${
      isCurrentVersion 
        ? 'border-primary bg-primary bg-opacity-5' 
        : 'border-gray-200 hover:border-gray-300'
    }`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${
            isCurrentVersion ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600'
          }`}>
            <ClockIcon className="h-4 w-4" />
          </div>
          
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-medium text-gray-900">
                {isCurrentVersion ? 'Versión actual' : `Versión ${version.id}`}
              </h4>
              {isCurrentVersion && (
                <span className="px-2 py-1 bg-primary text-white text-xs rounded-full">
                  Actual
                </span>
              )}
            </div>
            <p className="text-sm text-gray-600">
              {formatDate(version.createdAt)}
            </p>
            {version.author && (
              <p className="text-xs text-gray-500">
                por {version.author}
              </p>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-1">
          <button
            onClick={() => onView(version)}
            className="p-1 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded"
            title="Ver contenido completo"
          >
            <EyeIcon className="h-4 w-4" />
          </button>
          
          {!isCurrentVersion && (
            <>
              <button
                onClick={() => onRestore(version)}
                className="p-1 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded"
                title="Restaurar esta versión"
              >
                <ArrowUturnLeftIcon className="h-4 w-4" />
              </button>
              
              <button
                onClick={() => onDelete(version)}
                className="p-1 text-red-600 hover:text-red-700 hover:bg-red-50 rounded"
                title="Eliminar esta versión"
              >
                <TrashIcon className="h-4 w-4" />
              </button>
            </>
          )}
        </div>
      </div>
      
      {/* Estadísticas */}
      <div className="flex items-center gap-4 mb-3 text-sm text-gray-600">
        <span>{wordCount} palabras</span>
        <span>{version.content?.length || 0} caracteres</span>
        {version.changes && (
          <span className="text-green-600">+{version.changes.added} -{version.changes.removed}</span>
        )}
      </div>
      
      {/* Preview del contenido */}
      <div className="bg-gray-50 rounded-lg p-3">
        <p className="text-sm text-gray-700 leading-relaxed">
          {showFullContent ? version.content : preview}
        </p>
        
        {version.content && version.content.length > 150 && (
          <button
            onClick={() => setShowFullContent(!showFullContent)}
            className="text-primary hover:text-primary-dark text-sm font-medium mt-2"
          >
            {showFullContent ? 'Ver menos' : 'Ver más'}
          </button>
        )}
      </div>
      
      {/* Comentario de la versión */}
      {version.comment && (
        <div className="mt-3 p-2 bg-blue-50 rounded border-l-4 border-blue-200">
          <p className="text-sm text-blue-800">
            <strong>Nota:</strong> {version.comment}
          </p>
        </div>
      )}
    </div>
  );
};

const VersionModal = ({ version, isOpen, onClose, onRestore }) => {
  if (!isOpen || !version) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Versión {version.id}
            </h3>
            <p className="text-sm text-gray-600">
              {formatDate(version.createdAt)}
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onRestore(version)}
            >
              <ArrowUturnLeftIcon className="h-4 w-4 mr-1" />
              Restaurar
            </Button>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>
        </div>
        
        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          <div className="prose prose-sm max-w-none">
            <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-gray-700">
              {version.content}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};

export const NotesHistory = ({ 
  clientId, 
  versions = [], 
  currentVersion,
  onRestore,
  onDeleteVersion,
  onClose
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('all'); // all, today, week, month
  const [selectedVersion, setSelectedVersion] = useState(null);
  const [showModal, setShowModal] = useState(false);
  
  // Combinar versión actual con historial
  const allVersions = currentVersion 
    ? [{ ...currentVersion, id: 'current', isCurrentVersion: true }, ...versions]
    : versions;
  
  // Filtrar versiones
  const filteredVersions = allVersions.filter(version => {
    // Filtro de búsqueda
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      const contentMatch = version.content?.toLowerCase().includes(searchLower);
      const authorMatch = version.author?.toLowerCase().includes(searchLower);
      const commentMatch = version.comment?.toLowerCase().includes(searchLower);
      
      if (!contentMatch && !authorMatch && !commentMatch) {
        return false;
      }
    }
    
    // Filtro de fecha
    if (dateFilter !== 'all') {
      const versionDate = new Date(version.createdAt);
      const now = new Date();
      const diffTime = now - versionDate;
      const diffDays = diffTime / (1000 * 60 * 60 * 24);
      
      switch (dateFilter) {
        case 'today':
          if (diffDays > 1) return false;
          break;
        case 'week':
          if (diffDays > 7) return false;
          break;
        case 'month':
          if (diffDays > 30) return false;
          break;
      }
    }
    
    return true;
  });
  
  const handleViewVersion = (version) => {
    setSelectedVersion(version);
    setShowModal(true);
  };
  
  const handleRestoreVersion = async (version) => {
    if (window.confirm('¿Estás seguro de que quieres restaurar esta versión? Se perderán los cambios actuales.')) {
      await onRestore(version);
      setShowModal(false);
    }
  };
  
  const handleDeleteVersion = async (version) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar esta versión del historial?')) {
      await onDeleteVersion(version.id);
    }
  };
  
  if (allVersions.length === 0) {
    return (
      <div className="text-center py-12">
        <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No hay historial</h3>
        <p className="text-gray-500 mb-4">
          No se han guardado versiones anteriores de las notas.
        </p>
        <Button variant="outline" onClick={onClose}>
          Volver al editor
        </Button>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Historial de notas</h3>
          <p className="text-sm text-gray-600">
            {filteredVersions.length} de {allVersions.length} versiones
          </p>
        </div>
        
        <Button variant="outline" onClick={onClose}>
          Volver al editor
        </Button>
      </div>
      
      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Búsqueda */}
        <div className="flex-1">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar en el contenido..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
            />
          </div>
        </div>
        
        {/* Filtro de fecha */}
        <div className="sm:w-48">
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
          >
            <option value="all">Todas las fechas</option>
            <option value="today">Hoy</option>
            <option value="week">Última semana</option>
            <option value="month">Último mes</option>
          </select>
        </div>
      </div>
      
      {/* Lista de versiones */}
      <div className="space-y-4">
        {filteredVersions.map((version) => (
          <HistoryItem
            key={version.id}
            version={version}
            isCurrentVersion={version.isCurrentVersion}
            onView={handleViewVersion}
            onRestore={handleRestoreVersion}
            onDelete={handleDeleteVersion}
          />
        ))}
      </div>
      
      {filteredVersions.length === 0 && allVersions.length > 0 && (
        <div className="text-center py-8">
          <p className="text-gray-500">No se encontraron versiones que coincidan con los filtros.</p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSearchTerm('');
              setDateFilter('all');
            }}
            className="mt-2"
          >
            Limpiar filtros
          </Button>
        </div>
      )}
      
      {/* Modal de versión */}
      <VersionModal
        version={selectedVersion}
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onRestore={handleRestoreVersion}
      />
    </div>
  );
};