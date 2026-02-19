import React, { useState } from "react";

export const ChatHeader = ({
  client,
  nextSession,
  onViewProfile,
  onStartVideoCall,
  onMoreOptions,
  isOnline = false,
}) => {
  const [showDropdown, setShowDropdown] = useState(false);

  if (!client) {
    return (
      <div className="bg-white border-b border-gray-200 px-3 sm:px-4 py-2 sm:py-3">
        <div className="flex items-center space-x-2 sm:space-x-3">
          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gray-200 rounded-full animate-pulse" />
          <div className="flex-1">
            <div className="h-3 sm:h-4 bg-gray-200 rounded w-24 sm:w-32 mb-1 animate-pulse" />
            <div className="h-2 sm:h-3 bg-gray-200 rounded w-16 sm:w-24 animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  const formatNextSession = (timestamp) => {
    if (!timestamp) return null;

    const sessionDate = new Date(timestamp);
    const now = new Date();
    const diffInHours = Math.floor((sessionDate - now) / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInHours < 1) return "En menos de 1 hora";
    if (diffInHours < 24) return `En ${diffInHours} horas`;
    if (diffInDays === 1) return "Mañana";
    if (diffInDays < 7) return `En ${diffInDays} días`;

    return sessionDate.toLocaleDateString("es-ES", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getSessionUrgency = (timestamp) => {
    if (!timestamp) return null;

    const sessionDate = new Date(timestamp);
    const now = new Date();
    const diffInHours = Math.floor((sessionDate - now) / (1000 * 60 * 60));

    if (diffInHours < 2) return "urgent";
    if (diffInHours < 24) return "soon";
    return "normal";
  };

  const sessionUrgency = getSessionUrgency(nextSession);
  const sessionText = formatNextSession(nextSession);

  return (
    <div className="bg-white border-b border-gray-200 px-3 sm:px-4 py-2 sm:py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2 sm:space-x-3 flex-1 min-w-0">
          <div className="relative flex-shrink-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 bg-gradient-to-br from-sage-400 to-sage-600 rounded-full flex items-center justify-center text-white font-medium text-xs sm:text-sm">
              {client.avatar ? (
                <img
                  src={client.avatar}
                  alt={client.name || "Cliente"}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                (client.name || "Unknown")
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .substring(0, 2)
                  .toUpperCase()
              )}
            </div>
            <div
              className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full border-2 border-white ${isOnline ? "bg-green-500" : "bg-gray-400"}`}
            />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-1 sm:space-x-2">
              <h2 className="text-base sm:text-lg font-semibold text-gray-900 truncate">
                {client.name}
              </h2>
              {isOnline && (
                <span className="inline-flex items-center px-1.5 sm:px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  <span className="hidden sm:inline">En línea</span>
                  <span className="sm:hidden">●</span>
                </span>
              )}
            </div>
            {sessionText && (
              <div
                className={`flex items-center space-x-1 text-xs sm:text-sm ${sessionUrgency === "urgent" ? "text-red-600" : sessionUrgency === "soon" ? "text-orange-600" : "text-gray-600"}`}
              >
                <svg
                  className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                <span className="truncate">{sessionText}</span>
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center space-x-1 sm:space-x-2">
          <button
            onClick={onViewProfile}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
            title="Ver ficha"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
          </button>
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
            title="Más opciones"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export const ChatHeaderMobile = ({
  client,
  nextSession,
  onViewProfile,
  onBack,
}) => {
  if (!client) return null;

  return (
    <div className="bg-white border-b border-gray-200 px-4 py-3">
      <div className="flex items-center space-x-3">
        <button
          onClick={onBack}
          className="p-1 -ml-1 text-gray-500 hover:text-gray-700"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>
        <div className="w-10 h-10 bg-gradient-to-br from-sage-400 to-sage-600 rounded-full flex items-center justify-center text-white font-medium">
          {client.name
            ? client.name
                .split(" ")
                .map((n) => n[0])
                .join("")
                .substring(0, 2)
                .toUpperCase()
            : "?"}
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-base font-semibold text-gray-900 truncate">
            {client.name}
          </h2>
          <p className="text-sm text-gray-600 truncate">{client.email}</p>
        </div>
        <button
          onClick={onViewProfile}
          className="p-2 text-gray-400 hover:text-gray-600"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
            />
          </svg>
        </button>
      </div>
    </div>
  );
};
