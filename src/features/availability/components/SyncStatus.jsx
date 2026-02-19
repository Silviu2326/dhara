import React from 'react';
import { CheckCircle, XCircle, AlertCircle, RefreshCw, Calendar, Clock } from 'lucide-react';

const StatusIndicator = ({ status, lastSync, nextSync, error }) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'connected':
        return {
          icon: CheckCircle,
          color: 'text-green-600',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
          title: 'Conectado',
          description: 'Sincronización activa con Google Calendar'
        };
      case 'syncing':
        return {
          icon: RefreshCw,
          color: 'text-blue-600',
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200',
          title: 'Sincronizando',
          description: 'Actualizando eventos...',
          animate: true
        };
      case 'error':
        return {
          icon: XCircle,
          color: 'text-red-600',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          title: 'Error de conexión',
          description: error || 'No se pudo sincronizar con Google Calendar'
        };
      case 'warning':
        return {
          icon: AlertCircle,
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-200',
          title: 'Atención requerida',
          description: 'La sincronización necesita reautorización'
        };
      default:
        return {
          icon: XCircle,
          color: 'text-gray-600',
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200',
          title: 'Desconectado',
          description: 'Google Calendar no está conectado'
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  return (
    <div className={`p-3 rounded-lg border ${config.bgColor} ${config.borderColor}`}>
      <div className="flex items-start space-x-3">
        <Icon 
          className={`h-5 w-5 ${config.color} flex-shrink-0 mt-0.5 ${
            config.animate ? 'animate-spin' : ''
          }`} 
          aria-hidden="true" 
        />
        <div className="flex-1 min-w-0">
          <div className={`text-sm font-medium ${config.color}`}>
            {config.title}
          </div>
          <div className="text-xs text-gray-600 mt-1">
            {config.description}
          </div>
          
          {/* Sync timestamps */}
          {(lastSync || nextSync) && (
            <div className="mt-2 space-y-1">
              {lastSync && (
                <div className="flex items-center text-xs text-gray-500">
                  <Clock className="h-3 w-3 mr-1" />
                  <span>Última sync: {lastSync}</span>
                </div>
              )}
              {nextSync && status === 'connected' && (
                <div className="flex items-center text-xs text-gray-500">
                  <Calendar className="h-3 w-3 mr-1" />
                  <span>Próxima sync: {nextSync}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export const SyncStatus = ({ 
  status = 'disconnected',
  lastSync = null,
  nextSync = null,
  error = null,
  onConnect,
  onDisconnect,
  onRetry,
  onReauthorize,
  loading = false,
  className = '' 
}) => {
  const renderActionButton = () => {
    if (loading) {
      return (
        <button 
          disabled 
          className="w-full mt-3 px-3 py-2 text-sm bg-gray-100 text-gray-400 rounded-md cursor-not-allowed"
        >
          <RefreshCw className="h-4 w-4 animate-spin inline mr-2" />
          Procesando...
        </button>
      );
    }

    switch (status) {
      case 'connected':
        return (
          <button
            onClick={onDisconnect}
            className="w-full mt-3 px-3 py-2 text-sm bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors duration-200"
          >
            Desconectar Google Calendar
          </button>
        );
      
      case 'error':
        return (
          <button
            onClick={onRetry}
            className="w-full mt-3 px-3 py-2 text-sm bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors duration-200"
          >
            Reintentar conexión
          </button>
        );
      
      case 'warning':
        return (
          <button
            onClick={onReauthorize}
            className="w-full mt-3 px-3 py-2 text-sm bg-yellow-100 text-yellow-700 rounded-md hover:bg-yellow-200 transition-colors duration-200"
          >
            Reautorizar acceso
          </button>
        );
      
      default:
        return (
          <button
            onClick={onConnect}
            className="w-full mt-3 px-3 py-2 text-sm bg-sage text-white rounded-md hover:bg-sage/90 transition-colors duration-200"
          >
            Conectar Google Calendar
          </button>
        );
    }
  };

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-900">Sincronización</h3>
        {status === 'connected' && (
          <div className="flex items-center text-xs text-green-600">
            <div className="w-2 h-2 bg-green-500 rounded-full mr-1 animate-pulse"></div>
            Activo
          </div>
        )}
      </div>
      
      <StatusIndicator 
        status={status}
        lastSync={lastSync}
        nextSync={nextSync}
        error={error}
      />
      
      {renderActionButton()}
      
      {/* Sync Info */}
      {status === 'connected' && (
        <div className="text-xs text-gray-500 space-y-1">
          <div>• Los eventos se sincronizan automáticamente cada 15 minutos</div>
          <div>• Solo se importan eventos marcados como "ocupado"</div>
          <div>• Los cambios en Dhara se reflejan en Google Calendar</div>
        </div>
      )}
      
      {status === 'disconnected' && (
        <div className="text-xs text-gray-500 space-y-1">
          <div>• Conecta tu Google Calendar para evitar dobles reservas</div>
          <div>• Sincronización bidireccional automática</div>
          <div>• Tus datos permanecen privados y seguros</div>
        </div>
      )}
    </div>
  );
};