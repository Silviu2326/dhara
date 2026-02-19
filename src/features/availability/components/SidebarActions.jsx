import React from "react";
import {
  Plus,
  Copy,
  RefreshCw,
  Calendar,
  Clock,
  X,
  Menu,
  BarChart3,
} from "lucide-react";

const ActionButton = ({
  icon: Icon,
  label,
  description,
  onClick,
  variant = "primary",
  disabled = false,
  loading = false,
  className = "",
}) => {
  const baseClasses = `
    w-full flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3 rounded-lg border transition-all duration-200
    focus:outline-none focus:ring-2 focus:ring-offset-2
    disabled:opacity-50 disabled:cursor-not-allowed active:scale-95
  `;

  const variantClasses = {
    primary: `
      bg-sage text-white border-sage hover:bg-sage/90 
      focus:ring-sage shadow-sm hover:shadow-md
    `,
    secondary: `
      bg-white text-gray-700 border-gray-300 hover:bg-gray-50 
      focus:ring-gray-500 hover:border-gray-400
    `,
    outline: `
      bg-transparent text-sage border-sage hover:bg-sage/5 
      focus:ring-sage
    `,
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      aria-label={label}
    >
      <div className="flex-shrink-0">
        {loading ? (
          <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-2 border-current border-t-transparent" />
        ) : (
          <Icon className="h-4 w-4 sm:h-5 sm:w-5" aria-hidden="true" />
        )}
      </div>
      <div className="flex-1 text-left min-w-0">
        <div className="font-medium text-xs sm:text-sm truncate">{label}</div>
        {description && (
          <div
            className={`text-[10px] sm:text-xs truncate ${variant === "primary" ? "text-white/80" : "text-gray-500"}`}
          >
            {description}
          </div>
        )}
      </div>
    </button>
  );
};

export const SidebarActions = ({
  onCreateSlot,
  onCreateAbsence,
  onCopyLastWeek,
  onSyncGoogle,
  onOpenSyncModal,
  syncStatus = "disconnected",
  loading = false,
  availabilitySlots = [],
  appointments = [],
  absences = [],
  isDrawer = false,
  onClose,
  className = "",
}) => {
  const actions = [
    {
      id: "new-availability",
      icon: Plus,
      label: "Nuevo bloque",
      description: "Crear disponibilidad",
      onClick: onCreateSlot,
      variant: "primary",
    },
    {
      id: "new-absence",
      icon: X,
      label: "Ausencia",
      description: "Bloquear tiempo",
      onClick: onCreateAbsence,
      variant: "outline",
    },
    {
      id: "copy-week",
      icon: Copy,
      label: "Copiar semana",
      description: "Duplicar horarios",
      onClick: onCopyLastWeek,
      variant: "secondary",
      loading: loading,
    },
    {
      id: "sync-calendar",
      icon: RefreshCw,
      label: "Sincronizar",
      description: "Calendarios externos",
      onClick: onOpenSyncModal,
      variant: "secondary",
    },
  ];

  // Calcular estadísticas
  const totalAvailableHours = availabilitySlots.reduce((sum, slot) => {
    try {
      const start = new Date(`2024-01-01T${slot.startTime}`);
      const end = new Date(`2024-01-01T${slot.endTime}`);
      return sum + (end - start) / (1000 * 60 * 60);
    } catch {
      return sum;
    }
  }, 0);

  const totalBookedHours = appointments.reduce((sum, apt) => {
    try {
      const start = new Date(`2024-01-01T${apt.startTime}`);
      const end = new Date(`2024-01-01T${apt.endTime}`);
      return sum + (end - start) / (1000 * 60 * 60);
    } catch {
      return sum;
    }
  }, 0);

  const occupancyPercentage =
    totalAvailableHours > 0
      ? Math.round((totalBookedHours / totalAvailableHours) * 100)
      : 0;

  return (
    <div
      className={`
      ${
        isDrawer
          ? "fixed inset-0 z-50 lg:relative lg:inset-auto lg:z-auto"
          : "sticky top-4 lg:top-6"
      } 
      ${className}
    `}
    >
      {/* Drawer Overlay with backdrop blur */}
      {isDrawer && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Content */}
      <div
        className={`
        bg-white rounded-lg lg:rounded-xl border border-gray-200 shadow-lg lg:shadow-sm
        ${
          isDrawer
            ? "fixed right-0 top-0 h-full w-[85vw] max-w-[320px] lg:relative lg:w-full lg:h-auto lg:max-w-none transform transition-transform duration-300 ease-out"
            : "w-full"
        }
      `}
      >
        {/* Header (in drawer mode) */}
        <div className="flex items-center justify-between p-3 sm:p-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-blue-100 rounded-lg">
              <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-semibold text-gray-900">
                Acciones
              </h3>
              <p className="text-[10px] sm:text-xs text-gray-500 hidden xs:block">
                gestión rápida
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 sm:p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors lg:hidden"
            aria-label="Cerrar panel"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Actions - compact grid on mobile */}
        <div className="p-2 sm:p-3 space-y-1.5 sm:space-y-2">
          {actions.map((action) => (
            <ActionButton
              key={action.id}
              icon={action.icon}
              label={action.label}
              description={action.description}
              onClick={action.onClick}
              variant={action.variant}
              loading={action.loading}
            />
          ))}
        </div>

        {/* Quick Stats - horizontal on mobile */}
        <div className="border-t border-gray-100 px-3 sm:px-4 py-2 sm:py-3">
          <h4 className="text-[10px] sm:text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">
            Resumen
          </h4>
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-gray-50 rounded-lg p-2">
              <div className="text-lg sm:text-xl font-bold text-sage">
                {availabilitySlots.length}
              </div>
              <div className="text-[10px] text-gray-500">Bloques</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-2">
              <div className="text-lg sm:text-xl font-bold text-blue-600">
                {Math.round(totalAvailableHours)}h
              </div>
              <div className="text-[10px] text-gray-500">Disponibles</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-2">
              <div className="text-lg sm:text-xl font-bold text-deep">
                {Math.round(totalBookedHours)}h
              </div>
              <div className="text-[10px] text-gray-500">Reservadas</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-2">
              <div
                className={`text-lg sm:text-xl font-bold ${
                  occupancyPercentage >= 75
                    ? "text-red-500"
                    : occupancyPercentage >= 50
                      ? "text-yellow-500"
                      : occupancyPercentage >= 25
                        ? "text-green-500"
                        : "text-gray-500"
                }`}
              >
                {occupancyPercentage}%
              </div>
              <div className="text-[10px] text-gray-500">Ocupación</div>
            </div>
          </div>
          {syncStatus === "connected" && (
            <div className="mt-2 flex items-center gap-1.5 text-xs text-green-600 bg-green-50 rounded-lg px-2 py-1.5">
              <RefreshCw className="h-3 w-3" />
              <span>Sincronización activa</span>
            </div>
          )}
        </div>

        {/* Tips - compact */}
        <div className="border-t border-gray-100 px-3 sm:px-4 py-2 sm:py-3 bg-gray-50 rounded-b-lg lg:rounded-b-xl">
          <div className="flex items-start gap-2">
            <span className="text-sm">💡</span>
            <p className="text-[10px] sm:text-xs text-gray-600 leading-tight">
              Mantén bloques de disponibilidad regulares para facilitar la
              reserva a tus clientes.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
