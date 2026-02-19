import React, { useState } from "react";
import { ClientRow } from "./ClientRow";
import { ChevronUpIcon, ChevronDownIcon } from "@heroicons/react/24/outline";

const TABLE_COLUMNS = [
  { key: "name", label: "Nombre", sortable: true },
  { key: "email", label: "Email", sortable: true },
  { key: "lastSession", label: "Última sesión", sortable: true },
  { key: "sessionCount", label: "Nº sesiones", sortable: true },
  { key: "rating", label: "Valoración", sortable: true },
  { key: "actions", label: "Acciones", sortable: false },
];

export const ClientsTable = ({
  clients = [],
  isLoading = false,
  onClientClick,
  onChatClick,
  onNewBookingClick,
  onUploadDocClick,
  onDeleteClick,
  onViewClientDrawer,
  sortBy,
  sortOrder,
  onSort,
}) => {
  const [selectedClients, setSelectedClients] = useState([]);

  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedClients(clients.map((client) => client.id));
    } else {
      setSelectedClients([]);
    }
  };

  const handleSelectClient = (clientId, checked) => {
    if (checked) {
      setSelectedClients((prev) => [...prev, clientId]);
    } else {
      setSelectedClients((prev) => prev.filter((id) => id !== clientId));
    }
  };

  const handleSort = (columnKey) => {
    if (onSort) {
      const newOrder =
        sortBy === columnKey && sortOrder === "asc" ? "desc" : "asc";
      onSort(columnKey, newOrder);
    }
  };

  const getSortIcon = (columnKey) => {
    if (sortBy !== columnKey) return null;
    return sortOrder === "asc" ? (
      <ChevronUpIcon className="h-4 w-4" />
    ) : (
      <ChevronDownIcon className="h-4 w-4" />
    );
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-4 sm:p-6">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/4 mb-3 sm:mb-4"></div>
            <div className="space-y-2 sm:space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-12 bg-gray-100 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (clients.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-8 sm:p-12 text-center">
          <div className="mx-auto h-10 sm:h-12 w-10 sm:w-12 text-gray-400 mb-3 sm:mb-4">
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1}
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
          </div>
          <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">
            No hay clientes
          </h3>
          <p className="text-gray-500 text-sm sm:text-base mb-3 sm:mb-4">
            No se encontraron clientes que coincidan con los filtros aplicados.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      {/* Desktop Table */}
      <div className="hidden lg:block">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={
                      selectedClients.length === clients.length &&
                      clients.length > 0
                    }
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                  />
                </th>
                {TABLE_COLUMNS.map((column) => (
                  <th
                    key={column.key}
                    scope="col"
                    className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${
                      column.sortable ? "cursor-pointer hover:bg-gray-100" : ""
                    }`}
                    onClick={() => column.sortable && handleSort(column.key)}
                  >
                    <div className="flex items-center gap-1">
                      {column.label}
                      {column.sortable && (
                        <span className="text-gray-400">
                          {getSortIcon(column.key)}
                        </span>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {clients.map((client) => (
                <ClientRow
                  key={client.id}
                  client={client}
                  isSelected={selectedClients.includes(client.id)}
                  onSelect={(checked) => handleSelectClient(client.id, checked)}
                  onClick={() => onClientClick?.(client)}
                  onChatClick={() => onChatClick?.(client)}
                  onNewBookingClick={() => onNewBookingClick?.(client)}
                  onUploadDocClick={() => onUploadDocClick?.(client)}
                  onDeleteClick={() => onDeleteClick?.(client)}
                  onViewDrawer={() =>
                    onViewClientDrawer && onViewClientDrawer(client)
                  }
                  variant="desktop"
                />
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Cards */}
      <div className="lg:hidden">
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">
              {clients.length} cliente{clients.length !== 1 ? "s" : ""}
            </span>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={
                  selectedClients.length === clients.length &&
                  clients.length > 0
                }
                onChange={(e) => handleSelectAll(e.target.checked)}
                className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
              />
              <span className="text-sm text-gray-600">Seleccionar todos</span>
            </label>
          </div>
        </div>

        <div className="divide-y divide-gray-200">
          {clients.map((client) => (
            <ClientRow
              key={client.id}
              client={client}
              isSelected={selectedClients.includes(client.id)}
              onSelect={(checked) => handleSelectClient(client.id, checked)}
              onClick={() => onClientClick?.(client)}
              onChatClick={() => onChatClick?.(client)}
              onNewBookingClick={() => onNewBookingClick?.(client)}
              onUploadDocClick={() => onUploadDocClick?.(client)}
              onDeleteClick={() => onDeleteClick?.(client)}
              onViewDrawer={() =>
                onViewClientDrawer && onViewClientDrawer(client)
              }
              variant="mobile"
            />
          ))}
        </div>
      </div>

      {/* Bulk actions */}
      {selectedClients.length > 0 && (
        <div className="bg-primary bg-opacity-5 border-t border-primary border-opacity-20 px-6 py-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-primary">
              {selectedClients.length} cliente
              {selectedClients.length !== 1 ? "s" : ""} seleccionado
              {selectedClients.length !== 1 ? "s" : ""}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setSelectedClients([])}
                className="text-sm text-gray-600 hover:text-gray-800"
              >
                Cancelar
              </button>
              <button className="text-sm text-primary hover:text-primary-dark font-medium">
                Acciones en lote
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
