import React, { useState } from "react";
import { SearchBar } from "./SearchBar";
import { TagSelect } from "./TagSelect";
import { StatusSelect } from "./StatusSelect";
import { SortSelect } from "./SortSelect";
import { Button } from "../../../components/Button";
import {
  XMarkIcon,
  FunnelIcon,
  ArrowDownTrayIcon,
} from "@heroicons/react/24/outline";

// Opciones para los nuevos filtros
const THERAPY_TYPES = [
  { value: "individual", label: "Terapia Individual" },
  { value: "couple", label: "Terapia de Pareja" },
  { value: "family", label: "Terapia Familiar" },
  { value: "group", label: "Terapia Grupal" },
  { value: "emdr", label: "EMDR" },
  { value: "cbt", label: "Terapia Cognitivo-Conductual" },
];

const SATISFACTION_LEVELS = [
  { value: "excellent", label: "Excelente (4.5-5.0)", min: 4.5, max: 5.0 },
  { value: "good", label: "Bueno (3.5-4.4)", min: 3.5, max: 4.4 },
  { value: "average", label: "Regular (2.5-3.4)", min: 2.5, max: 3.4 },
  { value: "poor", label: "Bajo (1.0-2.4)", min: 1.0, max: 2.4 },
  { value: "no_rating", label: "Sin valoración", min: null, max: null },
];

const SESSION_FREQUENCY = [
  { value: "high", label: "Alta (>15 sesiones)", min: 16 },
  { value: "medium", label: "Media (6-15 sesiones)", min: 6, max: 15 },
  { value: "low", label: "Baja (1-5 sesiones)", min: 1, max: 5 },
  { value: "none", label: "Sin sesiones", min: 0, max: 0 },
];

export const ClientsFilter = ({
  onSearchChange,
  onTagsChange,
  onStatusChange,
  onSortChange,
  onClearFilters,
  onTherapyTypeChange,
  onSatisfactionChange,
  onFrequencyChange,
  onExportCSV,
  searchValue = "",
  selectedTags = [],
  selectedStatus = "all",
  selectedSort = "name_asc",
  selectedTherapyType = "all",
  selectedSatisfaction = "all",
  selectedFrequency = "all",
}) => {
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  const hasActiveFilters =
    searchValue ||
    selectedTags.length > 0 ||
    selectedStatus !== "all" ||
    selectedSort !== "name_asc" ||
    selectedTherapyType !== "all" ||
    selectedSatisfaction !== "all" ||
    selectedFrequency !== "all";

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 sm:p-4 mb-4 sm:mb-6">
      <div className="space-y-3 sm:space-y-4">
        {/* Fila principal de filtros */}
        <div className="flex flex-col gap-3 sm:gap-4">
          {/* Búsqueda */}
          <div className="flex-1">
            <SearchBar
              value={searchValue}
              onChange={onSearchChange}
              placeholder="Buscar por nombre, email o ID..."
            />
          </div>

          {/* Filtros básicos */}
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 lg:gap-4">
            <div className="min-w-[140px] sm:min-w-[180px]">
              <TagSelect selectedTags={selectedTags} onChange={onTagsChange} />
            </div>

            <div className="min-w-[120px] sm:min-w-[140px]">
              <StatusSelect value={selectedStatus} onChange={onStatusChange} />
            </div>

            <div className="min-w-[140px] sm:min-w-[160px]">
              <SortSelect value={selectedSort} onChange={onSortChange} />
            </div>

            {/* Botones de acción */}
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                className="flex items-center gap-1 sm:gap-2 whitespace-nowrap"
              >
                <FunnelIcon className="h-4 w-4" />
                <span className="hidden sm:inline">Filtros</span>
              </Button>

              {onExportCSV && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onExportCSV}
                  className="flex items-center gap-1 sm:gap-2 whitespace-nowrap"
                >
                  <ArrowDownTrayIcon className="h-4 w-4" />
                  <span className="hidden sm:inline">Exportar</span>
                </Button>
              )}

              {/* Limpiar filtros */}
              {hasActiveFilters && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onClearFilters}
                  className="flex items-center gap-1 sm:gap-2 whitespace-nowrap"
                >
                  <XMarkIcon className="h-4 w-4" />
                  <span className="hidden sm:inline">Limpiar</span>
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Filtros avanzados */}
        {showAdvancedFilters && (
          <div className="pt-3 sm:pt-4 border-t border-gray-200">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {/* Tipo de terapia */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de terapia
                </label>
                <select
                  value={selectedTherapyType}
                  onChange={(e) => onTherapyTypeChange?.(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value="all">Todos los tipos</option>
                  {THERAPY_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Nivel de satisfacción */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nivel de satisfacción
                </label>
                <select
                  value={selectedSatisfaction}
                  onChange={(e) => onSatisfactionChange?.(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value="all">Todos los niveles</option>
                  {SATISFACTION_LEVELS.map((level) => (
                    <option key={level.value} value={level.value}>
                      {level.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Frecuencia de sesiones */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Frecuencia de sesiones
                </label>
                <select
                  value={selectedFrequency}
                  onChange={(e) => onFrequencyChange?.(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value="all">Todas las frecuencias</option>
                  {SESSION_FREQUENCY.map((freq) => (
                    <option key={freq.value} value={freq.value}>
                      {freq.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Indicador de filtros activos */}
      {hasActiveFilters && (
        <div className="mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-gray-100">
          <div className="flex flex-wrap gap-1 sm:gap-2 text-xs sm:text-sm text-gray-600">
            {searchValue && (
              <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded-md">
                Búsqueda: "{searchValue}"
              </span>
            )}
            {selectedTags.length > 0 && (
              <span className="bg-green-50 text-green-700 px-2 py-1 rounded-md">
                Tags: {selectedTags.length} seleccionados
              </span>
            )}
            {selectedStatus !== "all" && (
              <span className="bg-purple-50 text-purple-700 px-2 py-1 rounded-md">
                Estado: {selectedStatus}
              </span>
            )}
            {selectedTherapyType !== "all" && (
              <span className="bg-indigo-50 text-indigo-700 px-2 py-1 rounded-md">
                Terapia:{" "}
                {
                  THERAPY_TYPES.find((t) => t.value === selectedTherapyType)
                    ?.label
                }
              </span>
            )}
            {selectedSatisfaction !== "all" && (
              <span className="bg-yellow-50 text-yellow-700 px-2 py-1 rounded-md">
                Satisfacción:{" "}
                {
                  SATISFACTION_LEVELS.find(
                    (s) => s.value === selectedSatisfaction,
                  )?.label
                }
              </span>
            )}
            {selectedFrequency !== "all" && (
              <span className="bg-pink-50 text-pink-700 px-2 py-1 rounded-md">
                Frecuencia:{" "}
                {
                  SESSION_FREQUENCY.find((f) => f.value === selectedFrequency)
                    ?.label
                }
              </span>
            )}
            {selectedSort !== "name_asc" && (
              <span className="bg-orange-50 text-orange-700 px-2 py-1 rounded-md">
                Orden: {selectedSort}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
