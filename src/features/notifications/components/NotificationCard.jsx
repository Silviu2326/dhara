import React, { useState } from 'react';
import {
  Calendar,
  MessageCircle,
  FileText,
  CreditCard,
  Settings,
  Star,
  Bell
} from 'lucide-react';

const getNotificationIcon = (type) => {
  const icons = {
    appointment: Calendar,
    message: MessageCircle,
    document: FileText,
    payment: CreditCard,
    system: Settings,
    important: Star,
    default: Bell
  };
  const IconComponent = icons[type] || icons.default;
  return <IconComponent className="w-5 h-5" />;
};

const getTypeColor = (type) => {
  const colors = {
    appointment: 'bg-blue-100 text-blue-800',
    message: 'bg-green-100 text-green-800',
    document: 'bg-purple-100 text-purple-800',
    payment: 'bg-yellow-100 text-yellow-800',
    system: 'bg-gray-100 text-gray-800',
    important: 'bg-red-100 text-red-800'
  };
  return colors[type] || colors.system;
};

const formatRelativeTime = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);
  
  if (diffInSeconds < 60) return 'Hace un momento';
  if (diffInSeconds < 3600) return `Hace ${Math.floor(diffInSeconds / 60)} min`;
  if (diffInSeconds < 86400) return `Hace ${Math.floor(diffInSeconds / 3600)} h`;
  if (diffInSeconds < 604800) return `Hace ${Math.floor(diffInSeconds / 86400)} días`;
  
  return date.toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

export const NotificationCard = ({ 
  notification, 
  onMarkAsRead, 
  onDelete, 
  onView 
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleMarkAsRead = async () => {
    if (notification.isRead) return;
    
    setIsLoading(true);
    try {
      await onMarkAsRead(notification.id);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm('¿Estás seguro de que quieres eliminar esta notificación?')) {
      setIsLoading(true);
      try {
        await onDelete(notification.id);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleView = () => {
    onView(notification);
    if (!notification.isRead) {
      handleMarkAsRead();
    }
  };

  return (
    <div
      className={`bg-white border rounded-lg p-3 hover:shadow-md transition-all duration-200 ${
        !notification.isRead ? 'border-blue-200 bg-blue-50/30' : 'border-gray-200'
      } ${isLoading ? 'opacity-50' : ''}`}
      role="listitem"
      aria-live="polite"
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
          !notification.isRead ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
        }`}>
          {getNotificationIcon(notification.type)}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              {/* Title and unread indicator */}
              <div className="flex items-center gap-2 mb-1">
                <h3 className={`text-sm font-medium truncate ${
                  !notification.isRead ? 'text-gray-900' : 'text-gray-700'
                }`}>
                  {notification.title}
                </h3>
                {!notification.isRead && (
                  <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" aria-label="No leída" />
                )}
                {notification.isImportant && (
                  <Star className="w-3 h-3 text-red-500" aria-label="Importante" />
                )}
              </div>

              {/* Summary */}
              <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                {notification.summary}
              </p>

              {/* Metadata */}
              <div className="flex items-center gap-3 text-xs text-gray-500">
                <span className={`px-2 py-1 rounded-full ${getTypeColor(notification.type)}`}>
                  {notification.type}
                </span>
                <span>{formatRelativeTime(notification.createdAt)}</span>
                {notification.source && (
                  <span>• {notification.source}</span>
                )}
              </div>
            </div>

            {/* Actions menu */}
            <div className="relative flex-shrink-0">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600"
                aria-label="Opciones de notificación"
                disabled={isLoading}
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                </svg>
              </button>

              {isMenuOpen && (
                <>
                  <div 
                    className="fixed inset-0 z-10" 
                    onClick={() => setIsMenuOpen(false)}
                    aria-hidden="true"
                  />
                  <div className="absolute right-0 z-20 w-48 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg py-1">
                    <button
                      onClick={() => {
                        handleView();
                        setIsMenuOpen(false);
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      Ver detalles
                    </button>
                    
                    {!notification.isRead && (
                      <button
                        onClick={() => {
                          handleMarkAsRead();
                          setIsMenuOpen(false);
                        }}
                        className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Marcar como leída
                      </button>
                    )}
                    
                    <button
                      onClick={() => {
                        handleDelete();
                        setIsMenuOpen(false);
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      Eliminar
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Quick action buttons for mobile */}
      <div className="md:hidden mt-3 flex gap-2">
        <button
          onClick={handleView}
          className="flex-1 px-3 py-2 text-xs bg-blue-50 text-blue-700 rounded hover:bg-blue-100"
          disabled={isLoading}
        >
          Ver
        </button>
        {!notification.isRead && (
          <button
            onClick={handleMarkAsRead}
            className="px-3 py-2 text-xs bg-gray-50 text-gray-700 rounded hover:bg-gray-100"
            disabled={isLoading}
          >
            Marcar leída
          </button>
        )}
      </div>
    </div>
  );
};