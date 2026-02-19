import React, { useState } from 'react';
import { BarChart3, CheckCircle, Smartphone } from 'lucide-react';

export const QuickActionsBar = ({ 
  onMarkAllAsRead, 
  onDeleteRead, 
  onTestPush,
  unreadCount = 0,
  readCount = 0,
  loading = false
}) => {
  const [actionLoading, setActionLoading] = useState(null);

  const handleMarkAllAsRead = async () => {
    if (unreadCount === 0) return;
    
    if (window.confirm(`¿Marcar todas las ${unreadCount} notificaciones como leídas?`)) {
      setActionLoading('markAll');
      try {
        await onMarkAllAsRead();
      } finally {
        setActionLoading(null);
      }
    }
  };

  const handleDeleteRead = async () => {
    if (readCount === 0) return;
    
    if (window.confirm(`¿Eliminar todas las ${readCount} notificaciones leídas? Esta acción no se puede deshacer.`)) {
      setActionLoading('deleteRead');
      try {
        await onDeleteRead();
      } finally {
        setActionLoading(null);
      }
    }
  };

  const handleTestPush = async () => {
    setActionLoading('testPush');
    try {
      await onTestPush();
    } finally {
      setActionLoading(null);
    }
  };

  const isLoading = loading || actionLoading !== null;

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-3">
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Mark all as read */}
        <button
          onClick={handleMarkAllAsRead}
          disabled={isLoading || unreadCount === 0}
          className="flex-1 sm:flex-none px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm font-medium"
        >
          {actionLoading === 'markAll' ? (
            <>
              <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Marcando...
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Marcar todo como leído
              {unreadCount > 0 && (
                <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
                  {unreadCount}
                </span>
              )}
            </>
          )}
        </button>

        {/* Delete read notifications */}
        <button
          onClick={handleDeleteRead}
          disabled={isLoading || readCount === 0}
          className="flex-1 sm:flex-none px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm font-medium"
        >
          {actionLoading === 'deleteRead' ? (
            <>
              <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Eliminando...
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Eliminar leídas
              {readCount > 0 && (
                <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                  {readCount}
                </span>
              )}
            </>
          )}
        </button>

        {/* Test push notification */}
        <button
          onClick={handleTestPush}
          disabled={isLoading}
          className="flex-1 sm:flex-none px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm font-medium"
        >
          {actionLoading === 'testPush' ? (
            <>
              <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Enviando...
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM4 19h6v-7a1 1 0 011-1h4a1 1 0 011 1v7h6M4 10l8-6 8 6v9a1 1 0 01-1 1H5a1 1 0 01-1-1v-9z" />
              </svg>
              Prueba Push
            </>
          )}
        </button>
      </div>

      {/* Action summary */}
      <div className="mt-3 text-xs text-gray-500 flex flex-wrap gap-4">
        <span className="flex items-center gap-1">
          <BarChart3 className="w-3 h-3" />
          {unreadCount} sin leer
        </span>
        <span className="flex items-center gap-1">
          <CheckCircle className="w-3 h-3" />
          {readCount} leídas
        </span>
        <span className="flex items-center gap-1">
          <Smartphone className="w-3 h-3" />
          Notificaciones push disponibles
        </span>
      </div>
    </div>
  );
};