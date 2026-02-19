import React, { useState, useMemo } from "react";
import { Search, Calendar, Filter, X } from "lucide-react";
import { DateRangePicker } from "./DateRangePicker";
import { StatusSelect } from "./StatusSelect";
import { SearchBar } from "./SearchBar";

export const BookingsFilter = ({
  filters = {},
  onFiltersChange,
  totalBookings = 0,
  bookings = [],
  loading = false,
  className = "",
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [localFilters, setLocalFilters] = useState({
    dateRange: { start: "", end: "" },
    status: "all",
    search: "",
    ...filters,
  });

  // Calculate dynamic booking statuses based on actual data
  const bookingStatuses = useMemo(() => {
    const statusCounts = bookings.reduce((acc, booking) => {
      acc[booking.status] = (acc[booking.status] || 0) + 1;
      return acc;
    }, {});

    // Define all possible statuses with their labels
    const statusDefinitions = [
      { value: "all", label: "Todas las reservas", count: bookings.length },
      {
        value: "upcoming",
        label: "Próximas",
        count: statusCounts.upcoming || 0,
      },
      {
        value: "pending",
        label: "Pendientes",
        count: statusCounts.pending || 0,
      },
      {
        value: "completed",
        label: "Completadas",
        count: statusCounts.completed || 0,
      },
      {
        value: "cancelled",
        label: "Canceladas",
        count: statusCounts.cancelled || 0,
      },
      {
        value: "no_show",
        label: "No asistió",
        count: statusCounts.no_show || 0,
      },
      {
        value: "client_arrived",
        label: "Cliente llegó",
        count: statusCounts.client_arrived || 0,
      },
    ];

    // Filter out statuses with 0 count (except 'all')
    return statusDefinitions.filter(
      (status) => status.value === "all" || status.count > 0,
    );
  }, [bookings]);

  const handleFilterChange = (key, value) => {
    const newFilters = { ...localFilters, [key]: value };
    setLocalFilters(newFilters);
    onFiltersChange?.(newFilters);
  };

  const handleDateRangeChange = (range) => {
    handleFilterChange("dateRange", range);
  };

  const handleStatusChange = (status) => {
    handleFilterChange("status", status);
  };

  const handleSearchChange = (search) => {
    handleFilterChange("search", search);
  };

  const clearFilters = () => {
    const clearedFilters = {
      dateRange: { start: "", end: "" },
      status: "all",
      search: "",
    };
    setLocalFilters(clearedFilters);
    onFiltersChange?.(clearedFilters);
  };

  const hasActiveFilters =
    localFilters.status !== "all" ||
    localFilters.search.trim() !== "" ||
    localFilters.dateRange.start !== "" ||
    localFilters.dateRange.end !== "";

  const activeFiltersCount = [
    localFilters.status !== "all",
    localFilters.search.trim() !== "",
    localFilters.dateRange.start !== "" || localFilters.dateRange.end !== "",
  ].filter(Boolean).length;

  return (
    <div
      className={`bg-white border border-gray-200 rounded-lg shadow-sm ${className}`}
    >
      {/* Header with summary and toggle */}
      <div className="p-3 sm:p-4 border-b border-gray-200">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
          <div className="flex flex-wrap items-center gap-2 sm:gap-4">
            <h2 className="text-base sm:text-lg font-semibold text-gray-900 flex items-center">
              <Calendar className="h-5 w-5 mr-2" />
              <span className="hidden sm:inline">Reservas</span>
              <span className="sm:hidden">Reservas</span>
              {!loading && (
                <span className="ml-1 sm:ml-2 text-xs sm:text-sm font-normal text-gray-500">
                  ({totalBookings})
                </span>
              )}
            </h2>

            {hasActiveFilters && (
              <div className="flex items-center space-x-2">
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {activeFiltersCount}
                </span>
                <button
                  onClick={clearFilters}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                  title="Limpiar filtros"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center space-x-1 sm:space-x-2 px-3 py-2 text-xs sm:text-sm font-medium text-gray-700 bg-gray-50 border border-gray-300 rounded-md hover:bg-gray-100 transition-colors w-full sm:w-auto justify-center"
          >
            <Filter className="h-4 w-4" />
            <span className="hidden sm:inline">
              {isExpanded ? "Ocultar" : "Mostrar"}
            </span>
            <span className="sm:hidden">{isExpanded ? "-" : "+"}</span>
          </button>
        </div>
      </div>

      {/* Quick status filters - always visible */}
      <div className="p-3 sm:p-4 overflow-x-auto">
        <StatusSelect
          statuses={bookingStatuses}
          selectedStatus={localFilters.status}
          onStatusChange={handleStatusChange}
          loading={loading}
        />
      </div>

      {/* Expanded filters */}
      {isExpanded && (
        <div className="px-3 sm:px-4 pb-4 border-t border-gray-200">
          <div className="pt-4 space-y-4">
            {/* Search bar */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Buscar reserva
              </label>
              <SearchBar
                value={localFilters.search}
                onChange={handleSearchChange}
                placeholder="Buscar por cliente, ID de reserva, terapia..."
                loading={loading}
              />
            </div>

            {/* Date range picker */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rango de fechas
              </label>
              <DateRangePicker
                value={localFilters.dateRange}
                onChange={handleDateRangeChange}
                loading={loading}
              />
            </div>

            {/* Filter actions */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-200">
              <div className="text-sm text-gray-500">
                {hasActiveFilters
                  ? `Mostrando resultados filtrados`
                  : "Mostrando todas las reservas"}
              </div>

              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors"
                >
                  Limpiar todos los filtros
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center">
          <div className="flex items-center space-x-2 text-gray-600">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            <span className="text-sm">Aplicando filtros...</span>
          </div>
        </div>
      )}
    </div>
  );
};
