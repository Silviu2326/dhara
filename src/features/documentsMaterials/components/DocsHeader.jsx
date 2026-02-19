import React, { useState } from 'react';
import { MagnifyingGlassIcon, FunnelIcon } from '@heroicons/react/24/outline';
import { ClientSelect } from './ClientSelect';
import { SearchBar } from './SearchBar';
import { TypeChips } from './TypeChips';
import { StorageBar } from './StorageBar';

export const DocsHeader = ({
  clients,
  selectedClient,
  onClientSelect,
  searchTerm,
  onSearch,
  selectedTypes,
  onTypeFilter,
  documents,
  storageUsed = 0,
  storageLimit = 5368709120
}) => {
  const [showFilters, setShowFilters] = useState(false);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-4">
      {/* Primera fila: Cliente y Búsqueda */}
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="flex-1 lg:max-w-xs">
          <ClientSelect
            clients={clients}
            selectedClient={selectedClient}
            onClientSelect={onClientSelect}
          />
        </div>
        
        <div className="flex-1">
          <SearchBar
            searchTerm={searchTerm}
            onSearch={onSearch}
            placeholder="Buscar por título, etiqueta o tipo..."
          />
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`px-4 py-2 rounded-lg border transition-colors ${
              showFilters
                ? 'bg-blue-50 border-blue-200 text-blue-700'
                : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            <FunnelIcon className="w-5 h-5" />
          </button>
          
          <button
            onClick={() => {}}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Subir archivo
          </button>
        </div>
      </div>

      {/* Segunda fila: Filtros (condicional) */}
      {showFilters && (
        <div className="border-t pt-4">
          <TypeChips
            selectedTypes={selectedTypes}
            onTypeFilter={onTypeFilter}
          />
        </div>
      )}

      {/* Tercera fila: Indicador de almacenamiento */}
      <div className="border-t pt-4">
        <StorageBar
          used={storageUsed}
          limit={storageLimit}
        />
      </div>
    </div>
  );
};

export const DocsHeaderMobile = ({
  selectedClient,
  onClientChange,
  searchTerm,
  onSearchChange,
  selectedTypes,
  onTypesChange,
  storageUsed,
  storageLimit,
  onUpload
}) => {
  const [showFilters, setShowFilters] = useState(false);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 space-y-3">
      {/* Cliente */}
      <ClientSelect
        selectedClient={selectedClient}
        onClientChange={onClientChange}
        compact
      />
      
      {/* Búsqueda y botones */}
      <div className="flex gap-2">
        <div className="flex-1">
          <SearchBar
            searchTerm={searchTerm}
            onSearchChange={onSearchChange}
            placeholder="Buscar..."
            compact
          />
        </div>
        
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`p-2 rounded-lg border transition-colors ${
            showFilters
              ? 'bg-blue-50 border-blue-200 text-blue-700'
              : 'bg-white border-gray-300 text-gray-700'
          }`}
        >
          <FunnelIcon className="w-5 h-5" />
        </button>
        
        <button
          onClick={onUpload}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium text-sm"
        >
          Subir
        </button>
      </div>

      {/* Filtros */}
      {showFilters && (
        <TypeChips
          selectedTypes={selectedTypes}
          onTypesChange={onTypesChange}
          compact
        />
      )}

      {/* Almacenamiento */}
      <StorageBar
        used={storageUsed}
        limit={storageLimit}
        compact
      />
    </div>
  );
};