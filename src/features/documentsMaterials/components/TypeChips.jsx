import React from 'react';
import {
  DocumentIcon,
  PhotoIcon,
  SpeakerWaveIcon,
  VideoCameraIcon,
  DocumentTextIcon,
  ArchiveBoxIcon
} from '@heroicons/react/24/outline';

const FILE_TYPES = [
  {
    id: 'pdf',
    label: 'PDF',
    icon: DocumentIcon,
    color: 'red',
    extensions: ['pdf']
  },
  {
    id: 'image',
    label: 'Imágenes',
    icon: PhotoIcon,
    color: 'green',
    extensions: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg']
  },
  {
    id: 'audio',
    label: 'Audio',
    icon: SpeakerWaveIcon,
    color: 'purple',
    extensions: ['mp3', 'wav', 'ogg', 'm4a', 'aac']
  },
  {
    id: 'video',
    label: 'Vídeo',
    icon: VideoCameraIcon,
    color: 'blue',
    extensions: ['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm']
  },
  {
    id: 'document',
    label: 'Documentos',
    icon: DocumentTextIcon,
    color: 'indigo',
    extensions: ['doc', 'docx', 'txt', 'rtf', 'odt']
  },
  {
    id: 'other',
    label: 'Otros',
    icon: ArchiveBoxIcon,
    color: 'gray',
    extensions: ['zip', 'rar', 'xlsx', 'pptx', 'csv']
  }
];

const getChipStyles = (type, isSelected, compact = false) => {
  const baseStyles = `inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all cursor-pointer border ${
    compact ? 'px-2 py-1 text-xs' : ''
  }`;
  
  const colorStyles = {
    red: isSelected
      ? 'bg-red-100 text-red-800 border-red-200 ring-2 ring-red-500 ring-opacity-20'
      : 'bg-white text-red-600 border-red-200 hover:bg-red-50',
    green: isSelected
      ? 'bg-green-100 text-green-800 border-green-200 ring-2 ring-green-500 ring-opacity-20'
      : 'bg-white text-green-600 border-green-200 hover:bg-green-50',
    purple: isSelected
      ? 'bg-purple-100 text-purple-800 border-purple-200 ring-2 ring-purple-500 ring-opacity-20'
      : 'bg-white text-purple-600 border-purple-200 hover:bg-purple-50',
    blue: isSelected
      ? 'bg-blue-100 text-blue-800 border-blue-200 ring-2 ring-blue-500 ring-opacity-20'
      : 'bg-white text-blue-600 border-blue-200 hover:bg-blue-50',
    indigo: isSelected
      ? 'bg-indigo-100 text-indigo-800 border-indigo-200 ring-2 ring-indigo-500 ring-opacity-20'
      : 'bg-white text-indigo-600 border-indigo-200 hover:bg-indigo-50',
    gray: isSelected
      ? 'bg-gray-100 text-gray-800 border-gray-200 ring-2 ring-gray-500 ring-opacity-20'
      : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
  };
  
  return `${baseStyles} ${colorStyles[type.color]}`;
};

export const TypeChips = ({ selectedTypes = [], onTypeFilter, compact = false }) => {
  const handleTypeToggle = (typeId) => {
    const newSelectedTypes = selectedTypes.includes(typeId)
      ? selectedTypes.filter(id => id !== typeId)
      : [...selectedTypes, typeId];
    
    onTypeFilter(newSelectedTypes);
  };

  const clearAllFilters = () => {
    onTypesChange([]);
  };

  const selectAllTypes = () => {
    onTypesChange(FILE_TYPES.map(type => type.id));
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className={`font-medium text-gray-900 ${
          compact ? 'text-sm' : 'text-base'
        }`}>
          Filtrar por tipo
        </h3>
        
        <div className="flex gap-2">
          {selectedTypes.length > 0 && (
            <button
              onClick={clearAllFilters}
              className={`text-gray-500 hover:text-gray-700 transition-colors ${
                compact ? 'text-xs' : 'text-sm'
              }`}
            >
              Limpiar
            </button>
          )}
          
          {selectedTypes.length < FILE_TYPES.length && (
            <button
              onClick={selectAllTypes}
              className={`text-blue-600 hover:text-blue-700 transition-colors ${
                compact ? 'text-xs' : 'text-sm'
              }`}
            >
              Seleccionar todos
            </button>
          )}
        </div>
      </div>
      
      <div className="flex flex-wrap gap-2">
        {FILE_TYPES.map((type) => {
          const Icon = type.icon;
          const isSelected = selectedTypes.includes(type.id);
          
          return (
            <button
              key={type.id}
              onClick={() => handleTypeToggle(type.id)}
              className={getChipStyles(type, isSelected, compact)}
              aria-pressed={isSelected}
            >
              <Icon className={`${
                compact ? 'w-3 h-3' : 'w-4 h-4'
              }`} />
              <span>{type.label}</span>
              {isSelected && (
                <span className={`ml-1 ${
                  compact ? 'text-xs' : 'text-sm'
                }`}>
                  ✓
                </span>
              )}
            </button>
          );
        })}
      </div>
      
      {selectedTypes.length > 0 && (
        <div className={`text-gray-600 ${
          compact ? 'text-xs' : 'text-sm'
        }`}>
          {selectedTypes.length === 1 
            ? '1 tipo seleccionado'
            : `${selectedTypes.length} tipos seleccionados`
          }
        </div>
      )}
    </div>
  );
};

export const TypeChipsCompact = (props) => {
  return <TypeChips {...props} compact />;
};

// Utilidades para trabajar con tipos de archivo
export const fileTypeUtils = {
  getFileType: (filename) => {
    const extension = filename.split('.').pop()?.toLowerCase();
    if (!extension) return 'other';
    
    for (const type of FILE_TYPES) {
      if (type.extensions.includes(extension)) {
        return type.id;
      }
    }
    
    return 'other';
  },
  
  getFileTypeInfo: (typeId) => {
    return FILE_TYPES.find(type => type.id === typeId) || FILE_TYPES.find(type => type.id === 'other');
  },
  
  getFileTypeByExtension: (extension) => {
    const ext = extension.toLowerCase().replace('.', '');
    return FILE_TYPES.find(type => type.extensions.includes(ext)) || FILE_TYPES.find(type => type.id === 'other');
  },
  
  filterDocumentsByTypes: (documents, selectedTypes) => {
    if (!selectedTypes || selectedTypes.length === 0) {
      return documents;
    }
    
    return documents.filter(doc => {
      const fileType = fileTypeUtils.getFileType(doc.filename);
      return selectedTypes.includes(fileType);
    });
  },
  
  getTypeStats: (documents) => {
    const stats = {};
    
    FILE_TYPES.forEach(type => {
      stats[type.id] = {
        ...type,
        count: 0,
        size: 0
      };
    });
    
    documents.forEach(doc => {
      const fileType = fileTypeUtils.getFileType(doc.filename);
      if (stats[fileType]) {
        stats[fileType].count++;
        stats[fileType].size += doc.size || 0;
      }
    });
    
    return stats;
  }
};

export { FILE_TYPES };