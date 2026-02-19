import React, { useState, useRef, useEffect } from 'react';
import { ChevronDownIcon, UserIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { useClients } from '../hooks/useClients';

export const ClientSelect = ({ clients = [], selectedClient, onClientSelect, compact = false }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef(null);
  const loading = false;

  const filteredClients = clients.filter(client =>
    (client.name && client.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (client.email && client.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleClientSelect = (client) => {
    onClientSelect(client);
    setIsOpen(false);
    setSearchTerm('');
  };

  const getClientAvatar = (client) => {
    if (client.avatar) {
      return (
        <img
          src={client.avatar}
          alt={client.name || 'Cliente'}
          className={`rounded-full object-cover ${
            compact ? 'w-6 h-6' : 'w-8 h-8'
          }`}
        />
      );
    }

    const safeName = client.name || 'Unknown';
    const initials = safeName
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);

    const colors = [
      'bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-pink-500',
      'bg-indigo-500', 'bg-yellow-500', 'bg-red-500', 'bg-gray-500'
    ];
    const colorIndex = safeName.charCodeAt(0) % colors.length;

    return (
      <div className={`${colors[colorIndex]} text-white rounded-full flex items-center justify-center font-medium ${
        compact ? 'w-6 h-6 text-xs' : 'w-8 h-8 text-sm'
      }`}>
        {initials}
      </div>
    );
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <label className={`block text-sm font-medium text-gray-700 mb-1 ${
        compact ? 'text-xs' : ''
      }`}>
        Cliente
      </label>
      
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between px-3 py-2 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
          compact ? 'text-sm' : ''
        }`}
      >
        <div className="flex items-center gap-2">
          {selectedClient ? (
            <>
              {getClientAvatar(selectedClient)}
              <span className="text-gray-900 truncate">{selectedClient.name}</span>
            </>
          ) : (
            <>
              <UserIcon className={`text-gray-400 ${
                compact ? 'w-5 h-5' : 'w-6 h-6'
              }`} />
              <span className="text-gray-500">Todos los clientes</span>
            </>
          )}
        </div>
        <ChevronDownIcon className={`text-gray-400 transition-transform ${
          isOpen ? 'rotate-180' : ''
        } ${compact ? 'w-4 h-4' : 'w-5 h-5'}`} />
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-64 overflow-hidden">
          {/* Búsqueda */}
          <div className="p-2 border-b">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar cliente..."
                className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                autoFocus
              />
            </div>
          </div>

          {/* Lista de clientes */}
          <div className="max-h-48 overflow-y-auto">
            {/* Opción "Todos" */}
            <button
              onClick={() => handleClientSelect(null)}
              className={`w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-gray-50 transition-colors ${
                !selectedClient ? 'bg-blue-50 text-blue-700' : 'text-gray-900'
              }`}
            >
              <UserIcon className="w-6 h-6 text-gray-400" />
              <span>Todos los clientes</span>
            </button>

            {loading ? (
              <div className="px-3 py-8 text-center text-gray-500">
                <div className="animate-spin w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
                <p className="mt-2 text-sm">Cargando clientes...</p>
              </div>
            ) : filteredClients.length === 0 ? (
              <div className="px-3 py-8 text-center text-gray-500">
                <UserIcon className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                <p className="text-sm">
                  {searchTerm ? 'No se encontraron clientes' : 'No hay clientes disponibles'}
                </p>
              </div>
            ) : (
              filteredClients.map((client) => (
                <button
                  key={client.id}
                  onClick={() => handleClientSelect(client)}
                  className={`w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-gray-50 transition-colors ${
                    selectedClient?.id === client.id ? 'bg-blue-50 text-blue-700' : 'text-gray-900'
                  }`}
                >
                  {getClientAvatar(client)}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{client.name}</p>
                    <p className="text-sm text-gray-500 truncate">{client.email}</p>
                  </div>
                  {client.documentsCount > 0 && (
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                      {client.documentsCount}
                    </span>
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};