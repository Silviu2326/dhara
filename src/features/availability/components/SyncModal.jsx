import React, { useState, useEffect } from "react";
import {
  X,
  Calendar,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  ExternalLink,
} from "lucide-react";
import {
  syncExternalCalendar,
  getExternalCalendarStatus,
} from "../availability.api.js";

const CALENDAR_PROVIDERS = [
  {
    id: "google",
    name: "Google Calendar",
    icon: "🔗",
    description: "Sincroniza con tu calendario de Google",
    color: "bg-blue-500",
    textColor: "text-blue-700",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-200",
  },
  {
    id: "outlook",
    name: "Microsoft Outlook",
    icon: "📧",
    description: "Conecta con Outlook y Office 365",
    color: "bg-blue-600",
    textColor: "text-blue-700",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-200",
  },
  {
    id: "apple",
    name: "Apple Calendar",
    icon: "🍎",
    description: "Sincroniza con iCloud Calendar",
    color: "bg-gray-800",
    textColor: "text-gray-700",
    bgColor: "bg-gray-50",
    borderColor: "border-gray-200",
  },
  {
    id: "caldav",
    name: "CalDAV",
    icon: "🔗",
    description: "Conecta cualquier calendario compatible con CalDAV",
    color: "bg-green-600",
    textColor: "text-green-700",
    bgColor: "bg-green-50",
    borderColor: "border-green-200",
  },
];

const ConnectionStatus = ({
  provider,
  status,
  onConnect,
  onDisconnect,
  loading,
}) => {
  const getStatusIcon = () => {
    switch (status) {
      case "connected":
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case "error":
        return <AlertCircle className="h-5 w-5 text-red-600" />;
      case "connecting":
        return <RefreshCw className="h-5 w-5 text-blue-600 animate-spin" />;
      default:
        return <Calendar className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusText = () => {
    switch (status) {
      case "connected":
        return "Conectado";
      case "error":
        return "Error de conexión";
      case "connecting":
        return "Conectando...";
      default:
        return "No conectado";
    }
  };

  const getActionButton = () => {
    if (status === "connected") {
      return (
        <button
          onClick={() => onDisconnect(provider.id)}
          disabled={loading}
          className="px-3 py-1 text-sm text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md transition-colors duration-200"
        >
          Desconectar
        </button>
      );
    }

    return (
      <button
        onClick={() => onConnect(provider.id)}
        disabled={loading || status === "connecting"}
        className={`
          px-3 py-1 text-sm text-white rounded-md transition-colors duration-200
          ${provider.color} hover:opacity-90 disabled:opacity-50
          flex items-center space-x-1
        `}
      >
        {status === "connecting" ? (
          <RefreshCw className="h-3 w-3 animate-spin" />
        ) : (
          <ExternalLink className="h-3 w-3" />
        )}
        <span>Conectar</span>
      </button>
    );
  };

  return (
    <div
      className={`
      border rounded-lg p-4 transition-all duration-200
      ${provider.borderColor} ${provider.bgColor}
    `}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="text-2xl">{provider.icon}</div>
          <div>
            <h3 className="font-medium text-gray-900">{provider.name}</h3>
            <p className="text-sm text-gray-600">{provider.description}</p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            {getStatusIcon()}
            <span
              className={`text-sm font-medium ${
                status === "connected"
                  ? "text-green-600"
                  : status === "error"
                    ? "text-red-600"
                    : status === "connecting"
                      ? "text-blue-600"
                      : "text-gray-500"
              }`}
            >
              {getStatusText()}
            </span>
          </div>
          {getActionButton()}
        </div>
      </div>

      {status === "error" && (
        <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-700">
            No se pudo conectar con {provider.name}. Verifica tus credenciales e
            inténtalo de nuevo.
          </p>
        </div>
      )}
    </div>
  );
};

export const SyncModal = ({
  isOpen,
  onClose,
  connections = {},
  onConnect,
  onDisconnect,
  loading = false,
  therapistId = "current_therapist_id",
}) => {
  const [syncSettings, setSyncSettings] = useState({
    syncDirection: "bidirectional", // 'import', 'export', 'bidirectional'
    conflictResolution: "manual", // 'manual', 'local', 'remote'
    syncFrequency: "realtime", // 'realtime', 'hourly', 'daily'
  });
  const [connectionStatuses, setConnectionStatuses] = useState({});
  const [isConnecting, setIsConnecting] = useState({});
  const [syncErrors, setSyncErrors] = useState({});

  // Load current connection statuses when modal opens
  useEffect(() => {
    const loadConnectionStatuses = async () => {
      if (isOpen && therapistId) {
        try {
          const status = await getExternalCalendarStatus(therapistId);
          setConnectionStatuses(status.connectedProviders || {});
        } catch (error) {
          console.error("Error loading connection statuses:", error);
        }
      }
    };

    loadConnectionStatuses();
  }, [isOpen, therapistId]);

  if (!isOpen) return null;

  const handleConnect = async (providerId) => {
    setIsConnecting((prev) => ({ ...prev, [providerId]: true }));
    setSyncErrors((prev) => ({ ...prev, [providerId]: null }));

    try {
      const syncConfig = {
        provider: providerId,
        settings: {
          syncDirection: syncSettings.syncDirection,
          conflictResolution: syncSettings.conflictResolution,
          syncFrequency: syncSettings.syncFrequency,
        },
      };

      const result = await syncExternalCalendar(therapistId, syncConfig);

      if (result.success) {
        setConnectionStatuses((prev) => ({
          ...prev,
          [providerId]: "connected",
        }));
        // Call parent callback if provided
        await onConnect?.(providerId, syncSettings);
      } else {
        setConnectionStatuses((prev) => ({ ...prev, [providerId]: "error" }));
        setSyncErrors((prev) => ({
          ...prev,
          [providerId]: result.error || "Error desconocido",
        }));
      }
    } catch (error) {
      console.error("Error connecting to provider:", error);
      setConnectionStatuses((prev) => ({ ...prev, [providerId]: "error" }));
      setSyncErrors((prev) => ({
        ...prev,
        [providerId]: error.message || "Error de conexión",
      }));
    } finally {
      setIsConnecting((prev) => ({ ...prev, [providerId]: false }));
    }
  };

  const handleDisconnect = async (providerId) => {
    setIsConnecting((prev) => ({ ...prev, [providerId]: true }));
    setSyncErrors((prev) => ({ ...prev, [providerId]: null }));

    try {
      // Here you would call a disconnect API if available
      // For now, we'll simulate disconnection
      setConnectionStatuses((prev) => ({
        ...prev,
        [providerId]: "disconnected",
      }));
      await onDisconnect?.(providerId);
    } catch (error) {
      console.error("Error disconnecting from provider:", error);
      setSyncErrors((prev) => ({
        ...prev,
        [providerId]: error.message || "Error al desconectar",
      }));
    } finally {
      setIsConnecting((prev) => ({ ...prev, [providerId]: false }));
    }
  };

  const getProviderStatus = (providerId) => {
    if (isConnecting[providerId]) return "connecting";
    return (
      connectionStatuses[providerId] ||
      connections[providerId] ||
      "disconnected"
    );
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-2 px-2 sm:pt-4 sm:px-4 pb-4 sm:pb-20 text-center sm:block sm:p-0">
        {/* Overlay */}
        <div
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          onClick={onClose}
        />

        {/* Modal - full screen on mobile */}
        <div className="inline-block align-bottom bg-white rounded-t-2xl sm:rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full h-[85vh] sm:h-auto sm:max-h-[90vh]">
          {/* Header */}
          <div className="bg-white px-3 py-3 sm:px-6 sm:py-4 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <h3 className="text-base sm:text-lg font-medium text-gray-900 flex items-center">
                <RefreshCw className="h-4 w-4 sm:h-5 sm:w-5 mr-1 sm:mr-2 text-sage" />
                <span className="hidden sm:inline">Sincronización</span>
                <span className="sm:hidden">Sync</span>
              </h3>
              <button
                onClick={onClose}
                className="p-1.5 sm:p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                <X className="h-5 w-5 sm:h-6 sm:w-6" />
              </button>
            </div>
            <p className="mt-1 text-xs sm:text-sm text-gray-600 hidden sm:block">
              Conecta tus calendarios externos para mantener sincronizada tu
              disponibilidad
            </p>
          </div>

          {/* Scrollable content */}
          <div className="overflow-y-auto h-[calc(85vh-60px)] sm:max-h-[60vh] px-3 py-3 sm:px-6 sm:py-4">
            {/* Calendar Providers */}
            <div>
              <h4 className="text-xs sm:text-sm font-medium text-gray-900 mb-3 sm:mb-4">
                Proveedores
              </h4>
              <div className="space-y-2 sm:space-y-3">
                {CALENDAR_PROVIDERS.map((provider) => (
                  <div key={provider.id}>
                    <ConnectionStatus
                      provider={provider}
                      status={getProviderStatus(provider.id)}
                      onConnect={handleConnect}
                      onDisconnect={handleDisconnect}
                      loading={loading || isConnecting[provider.id]}
                    />
                    {syncErrors[provider.id] && (
                      <div className="mt-1.5 sm:mt-2 p-2 bg-red-50 border border-red-200 rounded-md">
                        <p className="text-xs sm:text-sm text-red-700">
                          {syncErrors[provider.id]}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Sync Settings */}
            <div className="border-t border-gray-200 mt-4 pt-4 sm:pt-6">
              <h4 className="text-xs sm:text-sm font-medium text-gray-900 mb-3 sm:mb-4">
                Configuración
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                {/* Sync Direction */}
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                    Dirección
                  </label>
                  <select
                    value={syncSettings.syncDirection}
                    onChange={(e) =>
                      setSyncSettings((prev) => ({
                        ...prev,
                        syncDirection: e.target.value,
                      }))
                    }
                    className="w-full px-2 sm:px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sage focus:border-sage text-sm"
                  >
                    <option value="bidirectional">Bidireccional</option>
                    <option value="import">Importar</option>
                    <option value="export">Exportar</option>
                  </select>
                </div>

                {/* Conflict Resolution */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Resolución de conflictos
                  </label>
                  <select
                    value={syncSettings.conflictResolution}
                    onChange={(e) =>
                      setSyncSettings((prev) => ({
                        ...prev,
                        conflictResolution: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sage focus:border-sage"
                  >
                    <option value="manual">Preguntar siempre</option>
                    <option value="local">Priorizar local</option>
                    <option value="remote">Priorizar remoto</option>
                  </select>
                </div>

                {/* Sync Frequency */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Frecuencia de sincronización
                  </label>
                  <select
                    value={syncSettings.syncFrequency}
                    onChange={(e) =>
                      setSyncSettings((prev) => ({
                        ...prev,
                        syncFrequency: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sage focus:border-sage"
                  >
                    <option value="realtime">Tiempo real</option>
                    <option value="hourly">Cada hora</option>
                    <option value="daily">Diariamente</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Info */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start space-x-2">
                <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                <div className="text-sm text-blue-800">
                  <p className="font-medium mb-1">Información importante:</p>
                  <ul className="list-disc list-inside space-y-1 text-blue-700">
                    <li>
                      La sincronización puede tardar unos minutos en completarse
                    </li>
                    <li>Los eventos existentes no se duplicarán</li>
                    <li>
                      Puedes desconectar cualquier calendario en cualquier
                      momento
                    </li>
                    <li>
                      Los cambios se reflejarán según la frecuencia configurada
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-3 py-3 sm:px-6 sm:py-3 border-t border-gray-200 flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sage transition-colors duration-200"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
