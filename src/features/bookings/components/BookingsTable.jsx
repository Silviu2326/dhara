import React, { useState, useMemo } from "react";
import { ChevronUp, ChevronDown, MoreHorizontal, Eye } from "lucide-react";
import { BookingRow } from "./BookingRow";
import { StatusBadge } from "./StatusBadge";

const SORT_FIELDS = {
  date: { label: "Fecha", key: "date" },
  time: { label: "Hora", key: "startTime" },
  client: { label: "Cliente", key: "clientName" },
  therapy: { label: "Terapia", key: "therapyType" },
  status: { label: "Estado", key: "status" },
  created: { label: "Creada", key: "createdAt" },
};

const TABLE_HEADERS = [
  { key: "date", label: "Fecha", sortable: true, width: "w-32" },
  { key: "time", label: "Hora", sortable: true, width: "w-24" },
  { key: "client", label: "Cliente", sortable: true, width: "w-48" },
  { key: "therapy", label: "Terapia", sortable: true, width: "w-40" },
  { key: "status", label: "Estado", sortable: true, width: "w-32" },
  { key: "actions", label: "Acciones", sortable: false, width: "w-32" },
];

export const BookingsTable = ({
  bookings = [],
  loading = false,
  onBookingClick,
  onReschedule,
  onCancel,
  onStartChat,
  onJoinMeet,
  selectedBookingId = null,
  sortBy = "date",
  sortOrder = "desc",
  onSort,
  className = "",
}) => {
  const [hoveredRow, setHoveredRow] = useState(null);

  // Sort bookings
  const sortedBookings = useMemo(() => {
    if (!bookings.length) return [];

    return [...bookings].sort((a, b) => {
      let aValue = a[SORT_FIELDS[sortBy]?.key || sortBy];
      let bValue = b[SORT_FIELDS[sortBy]?.key || sortBy];

      // Handle different data types
      if (sortBy === "date") {
        aValue = new Date(a.date + " " + a.startTime);
        bValue = new Date(b.date + " " + b.startTime);
      } else if (sortBy === "created") {
        aValue = new Date(a.createdAt);
        bValue = new Date(b.createdAt);
      } else if (typeof aValue === "string") {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (aValue < bValue) return sortOrder === "asc" ? -1 : 1;
      if (aValue > bValue) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });
  }, [bookings, sortBy, sortOrder]);

  const handleSort = (field) => {
    if (!SORT_FIELDS[field]) return;

    const newOrder = sortBy === field && sortOrder === "asc" ? "desc" : "asc";
    onSort?.(field, newOrder);
  };

  const handleRowClick = (booking, event) => {
    // Don't trigger row click if clicking on action buttons
    if (event.target.closest("[data-action-button]")) {
      return;
    }
    onBookingClick?.(booking);
  };

  const getSortIcon = (field) => {
    if (sortBy !== field) return null;
    return sortOrder === "asc" ? (
      <ChevronUp className="h-4 w-4" />
    ) : (
      <ChevronDown className="h-4 w-4" />
    );
  };

  if (loading) {
    return (
      <div
        className={`bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden ${className}`}
      >
        {/* Loading header */}
        <div className="bg-gray-50 border-b border-gray-200">
          <div className="grid grid-cols-6 gap-4 px-6 py-3">
            {TABLE_HEADERS.map((header) => (
              <div
                key={header.key}
                className="h-5 bg-gray-200 rounded animate-pulse"
              ></div>
            ))}
          </div>
        </div>

        {/* Loading rows */}
        <div className="divide-y divide-gray-200">
          {[...Array(5)].map((_, index) => (
            <div key={index} className="grid grid-cols-6 gap-4 px-6 py-4">
              {TABLE_HEADERS.map((header) => (
                <div
                  key={header.key}
                  className="h-4 bg-gray-200 rounded animate-pulse"
                ></div>
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!sortedBookings.length) {
    return (
      <div
        className={`bg-white border border-gray-200 rounded-lg shadow-sm ${className}`}
      >
        <div className="p-12 text-center">
          <div className="mx-auto h-12 w-12 text-gray-400 mb-4">
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1}
                d="M8 7V3a2 2 0 012-2h4a2 2 0 012 2v4m-6 0V7a2 2 0 012-2h4a2 2 0 012 2v0M8 7v8a2 2 0 002 2h4a2 2 0 002-2V7M8 7H6a2 2 0 00-2 2v8a2 2 0 002 2h2m0 0h8m-8 0V9a2 2 0 012-2h4a2 2 0 012 2v8a2 2 0 01-2 2H10z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No hay reservas
          </h3>
          <p className="text-gray-500 mb-4">
            No se encontraron reservas que coincidan con los filtros aplicados.
          </p>
          <button className="text-blue-600 hover:text-blue-800 font-medium transition-colors">
            Limpiar filtros
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden ${className}`}
    >
      {/* Desktop table view */}
      <div className="hidden md:block overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {TABLE_HEADERS.map((header) => (
                <th
                  key={header.key}
                  scope="col"
                  className={`
                    px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider
                    ${header.width}
                    ${header.sortable ? "cursor-pointer hover:bg-gray-100 transition-colors" : ""}
                  `}
                  onClick={() => header.sortable && handleSort(header.key)}
                >
                  <div className="flex items-center space-x-1">
                    <span>{header.label}</span>
                    {header.sortable && (
                      <div className="flex flex-col">
                        {getSortIcon(header.key) || (
                          <div className="text-gray-300">
                            <ChevronUp className="h-3 w-3" />
                            <ChevronDown className="h-3 w-3 -mt-1" />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sortedBookings.map((booking) => (
              <BookingRow
                key={booking.id}
                booking={booking}
                isSelected={selectedBookingId === booking.id}
                isHovered={hoveredRow === booking.id}
                onMouseEnter={() => setHoveredRow(booking.id)}
                onMouseLeave={() => setHoveredRow(null)}
                onClick={(e) => handleRowClick(booking, e)}
                onReschedule={() => onReschedule?.(booking)}
                onCancel={() => onCancel?.(booking)}
                onStartChat={() => onStartChat?.(booking)}
                onJoinMeet={() => onJoinMeet?.(booking)}
                viewMode="desktop"
              />
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile card view */}
      <div className="md:hidden divide-y divide-gray-200">
        {sortedBookings.map((booking) => (
          <BookingRow
            key={booking.id}
            booking={booking}
            isSelected={selectedBookingId === booking.id}
            onClick={(e) => handleRowClick(booking, e)}
            onReschedule={() => onReschedule?.(booking)}
            onCancel={() => onCancel?.(booking)}
            onStartChat={() => onStartChat?.(booking)}
            onJoinMeet={() => onJoinMeet?.(booking)}
            viewMode="mobile"
          />
        ))}
      </div>

      {/* Table footer with summary */}
      <div className="bg-gray-50 px-4 sm:px-6 py-3 border-t border-gray-200">
        <div className="flex flex-col sm:flex-row items-center justify-between text-xs sm:text-sm text-gray-600 gap-2 sm:gap-0">
          <div>
            {sortedBookings.length} reserva
            {sortedBookings.length !== 1 ? "s" : ""}
          </div>
          <div className="flex items-center space-x-2 sm:space-x-4">
            <span className="hidden sm:inline">
              Ordenado por {SORT_FIELDS[sortBy]?.label.toLowerCase()}
            </span>
            <button
              onClick={() => handleSort(sortBy)}
              className="text-blue-600 hover:text-blue-800 transition-colors"
            >
              {sortOrder === "asc" ? "↑" : "↓"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Hook for table state management
export const useBookingsTable = (initialBookings = []) => {
  const [sortBy, setSortBy] = useState("date");
  const [sortOrder, setSortOrder] = useState("desc");
  const [selectedBookingId, setSelectedBookingId] = useState(null);

  const handleSort = (field, order) => {
    setSortBy(field);
    setSortOrder(order);
  };

  const handleBookingSelect = (booking) => {
    setSelectedBookingId(booking?.id || null);
  };

  const clearSelection = () => {
    setSelectedBookingId(null);
  };

  return {
    sortBy,
    sortOrder,
    selectedBookingId,
    handleSort,
    handleBookingSelect,
    clearSelection,
  };
};
