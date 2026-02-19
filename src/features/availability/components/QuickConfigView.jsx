import React, { useState } from "react";
import { Card } from "../../../components/Card";
import {
  Clock,
  MapPin,
  Copy,
  Trash2,
  Settings,
  Zap,
  Calendar,
  CheckCircle,
} from "lucide-react";

const TEMPLATE_PRESETS = [
  {
    id: "weekday_standard",
    name: "Lunes a Viernes (9-17h)",
    description: "Horario estándar de oficina",
    icon: Clock,
    pattern: {
      days: ["monday", "tuesday", "wednesday", "thursday", "friday"],
      startTime: "09:00",
      endTime: "17:00",
      breakStart: "13:00",
      breakEnd: "14:00",
    },
  },
  {
    id: "weekend_flexible",
    name: "Fin de Semana",
    description: "Sábados y domingos flexibles",
    icon: Calendar,
    pattern: {
      days: ["saturday", "sunday"],
      startTime: "10:00",
      endTime: "18:00",
    },
  },
  {
    id: "evening_hours",
    name: "Horario Nocturno",
    description: "Tardes y noches",
    icon: Settings,
    pattern: {
      days: ["monday", "tuesday", "wednesday", "thursday"],
      startTime: "16:00",
      endTime: "22:00",
    },
  },
  {
    id: "intensive_morning",
    name: "Mañanas Intensivas",
    description: "Solo mañanas con alta densidad",
    icon: Zap,
    pattern: {
      days: ["monday", "tuesday", "wednesday", "thursday", "friday"],
      startTime: "07:00",
      endTime: "13:00",
    },
  },
];

const BULK_ACTIONS = [
  { id: "duplicate_week", label: "Duplicar Semana", icon: Copy },
  { id: "duplicate_month", label: "Duplicar Mes", icon: Calendar },
  {
    id: "delete_selected",
    label: "Eliminar Seleccionados",
    icon: Trash2,
    danger: true,
  },
  { id: "change_location", label: "Cambiar Ubicación", icon: MapPin },
  { id: "adjust_times", label: "Ajustar Horarios", icon: Clock },
];

export const QuickConfigView = ({
  onApplyTemplate,
  onBulkAction,
  selectedSlots = [],
  locations = [],
  loading = false,
}) => {
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [bulkActionData, setBulkActionData] = useState({
    location: "",
    timeAdjustment: { start: "", end: "" },
    dateRange: { start: "", end: "" },
  });

  const handleTemplateSelect = (template) => {
    setSelectedTemplate(template);
  };

  const handleApplyTemplate = () => {
    if (!selectedTemplate) return;

    onApplyTemplate({
      template: selectedTemplate,
      dateRange: bulkActionData.dateRange,
      location: bulkActionData.location || locations[0]?.id,
    });

    setSelectedTemplate(null);
    setBulkActionData({
      location: "",
      timeAdjustment: { start: "", end: "" },
      dateRange: { start: "", end: "" },
    });
  };

  const handleBulkAction = (actionId) => {
    onBulkAction({
      action: actionId,
      selectedSlots,
      data: bulkActionData,
    });
    setShowBulkActions(false);
    setBulkActionData({
      location: "",
      timeAdjustment: { start: "", end: "" },
      dateRange: { start: "", end: "" },
    });
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Template Presets */}
      <Card>
        <div className="p-3 sm:p-6">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center">
            <Zap className="h-4 w-4 sm:h-5 sm:w-5 mr-1.5 sm:mr-2 text-blue-600" />
            Plantillas Rápidas
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-6">
            {TEMPLATE_PRESETS.map((template) => {
              const IconComponent = template.icon;
              const isSelected = selectedTemplate?.id === template.id;

              return (
                <div
                  key={template.id}
                  onClick={() => handleTemplateSelect(template)}
                  className={`p-3 sm:p-4 border rounded-lg cursor-pointer transition-all duration-200 ${
                    isSelected
                      ? "border-blue-500 bg-blue-50 ring-2 ring-blue-200"
                      : "border-gray-200 hover:border-blue-300 hover:bg-gray-50"
                  }`}
                >
                  <div className="flex items-start gap-2 sm:space-x-3">
                    <div
                      className={`p-1.5 sm:p-2 rounded-md flex-shrink-0 ${
                        isSelected ? "bg-blue-100" : "bg-gray-100"
                      }`}
                    >
                      <IconComponent
                        className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${
                          isSelected ? "text-blue-600" : "text-gray-600"
                        }`}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-gray-900 text-sm sm:text-base">
                        {template.name}
                      </h4>
                      <p className="text-xs sm:text-sm text-gray-600 hidden sm:block">
                        {template.description}
                      </p>
                      <div className="mt-1 text-[10px] sm:text-xs text-gray-500">
                        {template.pattern.days.length} días •{" "}
                        {template.pattern.startTime}-{template.pattern.endTime}
                      </div>
                    </div>
                    {isSelected && (
                      <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 flex-shrink-0" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Template Configuration */}
          {selectedTemplate && (
            <div className="border-t pt-4 sm:pt-6 space-y-3 sm:space-y-4">
              <h4 className="font-medium text-gray-900 text-sm sm:text-base">
                Configurar Plantilla
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                    Inicio
                  </label>
                  <input
                    type="date"
                    className="w-full px-2 sm:px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    value={bulkActionData.dateRange.start}
                    onChange={(e) =>
                      setBulkActionData((prev) => ({
                        ...prev,
                        dateRange: { ...prev.dateRange, start: e.target.value },
                      }))
                    }
                  />
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                    Fin
                  </label>
                  <input
                    type="date"
                    className="w-full px-2 sm:px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    value={bulkActionData.dateRange.end}
                    onChange={(e) =>
                      setBulkActionData((prev) => ({
                        ...prev,
                        dateRange: { ...prev.dateRange, end: e.target.value },
                      }))
                    }
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ubicación
                  </label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={bulkActionData.location}
                    onChange={(e) =>
                      setBulkActionData((prev) => ({
                        ...prev,
                        location: e.target.value,
                      }))
                    }
                  >
                    <option value="">Seleccionar ubicación</option>
                    {locations.map((location) => (
                      <option key={location.id} value={location.id}>
                        {location.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setSelectedTemplate(null)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                  disabled={loading}
                >
                  Cancelar
                </button>
                <button
                  onClick={handleApplyTemplate}
                  disabled={
                    loading ||
                    !bulkActionData.dateRange.start ||
                    !bulkActionData.dateRange.end
                  }
                  className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? "Aplicando..." : "Aplicar Plantilla"}
                </button>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Bulk Operations */}
      <Card>
        <div className="p-6">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 flex items-center">
              <Settings className="h-4 w-4 sm:h-5 sm:w-5 mr-1.5 sm:mr-2 text-gray-600" />
              <span className="hidden sm:inline">Operaciones en Lote</span>
              <span className="sm:hidden">Operaciones</span>
            </h3>
            <span className="text-xs sm:text-sm text-gray-500">
              {selectedSlots.length} bloque
              {selectedSlots.length !== 1 ? "s" : ""} selec.
            </span>
          </div>

          {selectedSlots.length === 0 ? (
            <div className="text-center py-6 sm:py-8 text-gray-500">
              <Calendar className="h-8 w-8 sm:h-12 sm:w-12 mx-auto mb-2 sm:mb-3 text-gray-300" />
              <p className="text-xs sm:text-sm">
                Selecciona bloques para usar operaciones en lote
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 sm:gap-3">
              {BULK_ACTIONS.map((action) => {
                const IconComponent = action.icon;
                return (
                  <button
                    key={action.id}
                    onClick={() => {
                      if (action.id === "delete_selected") {
                        if (
                          confirm(
                            `¿Eliminar ${selectedSlots.length} bloque(s)?`,
                          )
                        ) {
                          handleBulkAction(action.id);
                        }
                      } else {
                        setShowBulkActions(true);
                      }
                    }}
                    className={`p-2 sm:p-3 border rounded-lg text-xs sm:text-sm font-medium transition-colors ${
                      action.danger
                        ? "border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300"
                        : "border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300"
                    }`}
                    disabled={loading}
                  >
                    <IconComponent className="h-3.5 w-3.5 sm:h-4 sm:w-4 mx-auto mb-1" />
                    <span className="hidden sm:inline">{action.label}</span>
                    <span className="sm:hidden">
                      {action.id === "duplicate_week"
                        ? "Duplicar"
                        : action.id === "duplicate_month"
                          ? "Mes"
                          : action.id === "delete_selected"
                            ? "Eliminar"
                            : action.id === "change_location"
                              ? "Ubic."
                              : action.id === "adjust_times"
                                ? "Ajustar"
                                : action.label}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Bulk Action Configuration */}
          {showBulkActions && selectedSlots.length > 0 && (
            <div className="mt-6 pt-6 border-t">
              <h4 className="font-medium text-gray-900 mb-4">
                Configurar Acción
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nueva Ubicación
                  </label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={bulkActionData.location}
                    onChange={(e) =>
                      setBulkActionData((prev) => ({
                        ...prev,
                        location: e.target.value,
                      }))
                    }
                  >
                    <option value="">Mantener ubicación actual</option>
                    {locations.map((location) => (
                      <option key={location.id} value={location.id}>
                        {location.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ajuste de Horario
                  </label>
                  <div className="flex space-x-2">
                    <input
                      type="time"
                      placeholder="Inicio"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={bulkActionData.timeAdjustment.start}
                      onChange={(e) =>
                        setBulkActionData((prev) => ({
                          ...prev,
                          timeAdjustment: {
                            ...prev.timeAdjustment,
                            start: e.target.value,
                          },
                        }))
                      }
                    />
                    <input
                      type="time"
                      placeholder="Fin"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={bulkActionData.timeAdjustment.end}
                      onChange={(e) =>
                        setBulkActionData((prev) => ({
                          ...prev,
                          timeAdjustment: {
                            ...prev.timeAdjustment,
                            end: e.target.value,
                          },
                        }))
                      }
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowBulkActions(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                  disabled={loading}
                >
                  Cancelar
                </button>
                <button
                  onClick={() => handleBulkAction("bulk_update")}
                  disabled={loading}
                  className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {loading ? "Aplicando..." : "Aplicar Cambios"}
                </button>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};
