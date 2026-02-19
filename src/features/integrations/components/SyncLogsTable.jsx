import React, { useState, useEffect } from 'react';
import { SyncLogRow } from './SyncLogRow';
import { Loader } from '../../../components/Loader';

// Datos de ejemplo para el historial
const MOCK_SYNC_LOGS = [
  {
    id: '1',
    date: '2024-01-15T10:30:00Z',
    result: 'success',
    eventsRead: 12,
    eventsImported: 8,
    errors: []
  },
  {
    id: '2',
    date: '2024-01-15T09:15:00Z',
    result: 'success',
    eventsRead: 5,
    eventsImported: 5,
    errors: []
  },
  {
    id: '3',
    date: '2024-01-15T08:00:00Z',
    result: 'partial',
    eventsRead: 15,
    eventsImported: 12,
    errors: [
      'No se pudo importar evento "Reunión privada" - sin permisos',
      'Evento duplicado ignorado: "Cita médica"'
    ]
  },
  {
    id: '4',
    date: '2024-01-14T23:45:00Z',
    result: 'error',
    eventsRead: 0,
    eventsImported: 0,
    errors: [
      'Error de autenticación - token expirado',
      'No se pudo conectar con el servidor de Google'
    ]
  }
];

export const SyncLogsTable = ({ integrationId }) => {
  const [logs, setLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      setIsLoading(true);
      try {
        // TODO: Implementar API real
        await new Promise(resolve => setTimeout(resolve, 1000));
        setLogs(MOCK_SYNC_LOGS);
      } catch (error) {
        console.error('Error fetching sync logs:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLogs();
  }, [integrationId]);

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader />
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <div className="text-center py-8">
        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <h3 className="mt-2 text-sm font-medium text-gray-900">Sin historial</h3>
        <p className="mt-1 text-sm text-gray-500">
          No hay sincronizaciones registradas para esta integración.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-medium text-gray-900">Historial de sincronizaciones</h3>
        <p className="text-sm text-gray-500">Últimas 50 sincronizaciones</p>
      </div>

      <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
        <table className="min-w-full divide-y divide-gray-300">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Fecha
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Resultado
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Eventos
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Errores
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {logs.map((log) => (
              <SyncLogRow key={log.id} log={log} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};