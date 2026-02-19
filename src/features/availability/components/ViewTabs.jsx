import React from "react";
import { Calendar } from "lucide-react";

const VIEW_OPTIONS = [
  { id: "week", label: "Semana", icon: Calendar },
  { id: "month", label: "Mes", icon: Calendar },
];

const TIMEZONE_OPTIONS = [
  { value: "Europe/Madrid", label: "Madrid" },
  { value: "Europe/London", label: "Londres" },
  { value: "America/New_York", label: "NYC" },
  { value: "America/Los_Angeles", label: "LA" },
  { value: "Asia/Tokyo", label: "Tokio" },
];

export const ViewTabs = ({
  currentView = "week",
  onViewChange,
  timezone = "Europe/Madrid",
  onTimezoneChange,
  className = "",
}) => {
  return (
    <div
      className={`flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 w-full sm:w-auto ${className}`}
    >
      {/* View Tabs */}
      <div className="flex bg-gray-100 rounded-lg p-1 w-full sm:w-auto">
        {VIEW_OPTIONS.map((option) => {
          const isActive = currentView === option.id;

          return (
            <button
              key={option.id}
              onClick={() => onViewChange?.(option.id)}
              className={`
                flex items-center justify-center px-3 sm:px-4 py-1.5 sm:py-2 rounded-md text-xs sm:text-sm font-medium transition-all duration-200 flex-1 sm:flex-none
                ${
                  isActive
                    ? "bg-white text-sage shadow-sm"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                }
              `}
              aria-pressed={isActive}
              aria-label={`Vista ${option.label}`}
            >
              <span>{option.label}</span>
            </button>
          );
        })}
      </div>

      {/* Timezone Selector */}
      <div className="flex items-center gap-1 w-full sm:w-auto">
        <select
          value={timezone}
          onChange={(e) => onTimezoneChange?.(e.target.value)}
          className="
            px-2 py-1.5 border border-gray-300 rounded-md text-xs sm:text-sm
            focus:outline-none focus:ring-2 focus:ring-sage focus:border-sage
            bg-white text-gray-900 w-full min-w-[80px] sm:min-w-[120px]
          "
          aria-label="Seleccionar zona horaria"
        >
          {TIMEZONE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};
