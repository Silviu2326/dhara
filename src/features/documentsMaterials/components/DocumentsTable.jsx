import React, { useState, useMemo } from 'react';
import {
  ChevronUpIcon,
  ChevronDownIcon,
  EyeIcon,
  ArrowDownTrayIcon,
  PaperAirplaneIcon,
  TrashIcon,
  EllipsisVerticalIcon
} from '@heroicons/react/24/outline';
import { DocumentRow } from './DocumentRow';
import { BulkToolbar } from './BulkToolbar';
import { fileTypeUtils } from './TypeChips';

const SORT_OPTIONS = [
  { key: 'title', label: 'Título' },
  { key: 'type', label: 'Tipo' },
  { key: 'size', label: 'Tamaño' },
  { key: 'client', label: 'Cliente' },
  { key: 'session', label: 'Sesión' },
  { key: 'createdAt', label: 'Fecha' }
];

const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const formatDate = (date) => {
  return new Intl.DateTimeFormat('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(date));
};

const TableHeader = ({ sortBy, sortOrder, onSort }) => {
  const handleSort = (key) => {
    if (sortBy === key) {
      onSort(key, sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      onSort(key, 'asc');
    }
  };

  const getSortIcon = (key) => {
    if (sortBy !== key) return null;
    return sortOrder === 'asc' ? (
      <ChevronUpIcon className="w-4 h-4" />
    ) : (
      <ChevronDownIcon className="w-4 h-4" />
    );
  };

  return (
    <thead className="bg-gray-50">
      <tr>
        <th className="w-12 px-6 py-3">
          <input
            type="checkbox"
            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
        </th>
        
        {SORT_OPTIONS.map((option) => (
          <th
            key={option.key}
            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
            onClick={() => handleSort(option.key)}
          >
            <div className="flex items-center gap-1">
              {option.label}
              {getSortIcon(option.key)}
            </div>
          </th>
        ))}
        
        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
          Acciones
        </th>
      </tr>
    </thead>
  );
};

const EmptyState = ({ hasFilters, onClearFilters }) => {
  return (
    <div className="text-center py-12">
      <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
        <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      </div>
      
      <h3 className="text-lg font-medium text-gray-900 mb-2">
        {hasFilters ? 'No se encontraron documentos' : 'No hay documentos'}
      </h3>
      
      <p className="text-gray-500 mb-4">
        {hasFilters 
          ? 'Intenta ajustar los filtros de búsqueda'
          : 'Comienza subiendo tu primer documento'
        }
      </p>
      
      {hasFilters && (
        <button
          onClick={onClearFilters}
          className="text-blue-600 hover:text-blue-700 font-medium"
        >
          Limpiar filtros
        </button>
      )}
    </div>
  );
};

const LoadingSkeleton = () => {
  return (
    <tbody>
      {Array.from({ length: 5 }).map((_, index) => (
        <tr key={index} className="border-b border-gray-200">
          <td className="px-6 py-4">
            <div className="w-4 h-4 bg-gray-200 rounded animate-pulse"></div>
          </td>
          <td className="px-6 py-4">
            <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4"></div>
          </td>
          <td className="px-6 py-4">
            <div className="h-4 bg-gray-200 rounded animate-pulse w-16"></div>
          </td>
          <td className="px-6 py-4">
            <div className="h-4 bg-gray-200 rounded animate-pulse w-20"></div>
          </td>
          <td className="px-6 py-4">
            <div className="h-4 bg-gray-200 rounded animate-pulse w-24"></div>
          </td>
          <td className="px-6 py-4">
            <div className="h-4 bg-gray-200 rounded animate-pulse w-20"></div>
          </td>
          <td className="px-6 py-4">
            <div className="h-4 bg-gray-200 rounded animate-pulse w-32"></div>
          </td>
          <td className="px-6 py-4">
            <div className="flex gap-2">
              <div className="w-8 h-8 bg-gray-200 rounded animate-pulse"></div>
              <div className="w-8 h-8 bg-gray-200 rounded animate-pulse"></div>
              <div className="w-8 h-8 bg-gray-200 rounded animate-pulse"></div>
            </div>
          </td>
        </tr>
      ))}
    </tbody>
  );
};

export const DocumentsTable = ({
  documents = [],
  loading = false,
  selectedDocuments = [],
  onDocumentSelect,
  onDocumentsSelect,
  onPreview,
  onDownload,
  onResend,
  onDelete,
  onBulkDownload,
  onBulkDelete,
  hasFilters = false,
  onClearFilters
}) => {
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');

  const sortedDocuments = useMemo(() => {
    if (!documents.length) return [];

    return [...documents].sort((a, b) => {
      let aValue = a[sortBy];
      let bValue = b[sortBy];

      // Manejo especial para diferentes tipos de datos
      switch (sortBy) {
        case 'type':
          aValue = fileTypeUtils.getFileType(a.filename);
          bValue = fileTypeUtils.getFileType(b.filename);
          break;
        case 'client':
          aValue = a.client?.name || '';
          bValue = b.client?.name || '';
          break;
        case 'session':
          aValue = a.session?.title || '';
          bValue = b.session?.title || '';
          break;
        case 'size':
          aValue = a.size || 0;
          bValue = b.size || 0;
          break;
        case 'createdAt':
          aValue = new Date(a.createdAt);
          bValue = new Date(b.createdAt);
          break;
      }

      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }, [documents, sortBy, sortOrder]);

  const handleSort = (key, order) => {
    setSortBy(key);
    setSortOrder(order);
  };

  const handleSelectAll = (checked) => {
    if (checked) {
      onDocumentsSelect(sortedDocuments.map(doc => doc.id));
    } else {
      onDocumentsSelect([]);
    }
  };

  const isAllSelected = sortedDocuments.length > 0 && selectedDocuments.length === sortedDocuments.length;
  const isPartiallySelected = selectedDocuments.length > 0 && selectedDocuments.length < sortedDocuments.length;

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <TableHeader
            sortBy={sortBy}
            sortOrder={sortOrder}
            onSort={handleSort}
          />
          <LoadingSkeleton />
        </table>
      </div>
    );
  }

  if (sortedDocuments.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <EmptyState
          hasFilters={hasFilters}
          onClearFilters={onClearFilters}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Toolbar de acciones masivas */}
      {selectedDocuments.length > 0 && (
        <BulkToolbar
          selectedCount={selectedDocuments.length}
          onDownload={() => onBulkDownload(selectedDocuments)}
          onDelete={() => onBulkDelete(selectedDocuments)}
          onClear={() => onDocumentsSelect([])}
        />
      )}

      {/* Tabla */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="w-12 px-6 py-3">
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    ref={(input) => {
                      if (input) input.indeterminate = isPartiallySelected;
                    }}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                </th>
                
                {SORT_OPTIONS.map((option) => {
                  const getSortIcon = () => {
                    if (sortBy !== option.key) return null;
                    return sortOrder === 'asc' ? (
                      <ChevronUpIcon className="w-4 h-4" />
                    ) : (
                      <ChevronDownIcon className="w-4 h-4" />
                    );
                  };

                  return (
                    <th
                      key={option.key}
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                      onClick={() => handleSort(option.key, sortBy === option.key && sortOrder === 'asc' ? 'desc' : 'asc')}
                    >
                      <div className="flex items-center gap-1">
                        {option.label}
                        {getSortIcon()}
                      </div>
                    </th>
                  );
                })}
                
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            
            <tbody className="bg-white divide-y divide-gray-200">
              {sortedDocuments.map((document) => (
                <DocumentRow
                  key={document.id}
                  document={document}
                  isSelected={selectedDocuments.includes(document.id)}
                  onSelect={(selected) => {
                    if (selected) {
                      onDocumentSelect([...selectedDocuments, document.id]);
                    } else {
                      onDocumentSelect(selectedDocuments.filter(id => id !== document.id));
                    }
                  }}
                  onPreview={() => onPreview(document)}
                  onDownload={() => onDownload(document)}
                  onResend={() => onResend(document)}
                  onDelete={() => onDelete(document)}
                />
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Información de resultados */}
      <div className="flex items-center justify-between text-sm text-gray-500">
        <span>
          Mostrando {sortedDocuments.length} de {documents.length} documentos
        </span>
        
        {selectedDocuments.length > 0 && (
          <span>
            {selectedDocuments.length} seleccionado{selectedDocuments.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>
    </div>
  );
};

export default DocumentsTable;