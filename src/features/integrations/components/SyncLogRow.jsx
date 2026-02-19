import React, { useState } from 'react';

const formatDate = (dateString) => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
};

const getResultBadge = (result) => {
  const badges = {
    success: {
      text: 'Éxito',
      className: 'bg-green-100 text-green-800'
    },
    partial: {
      text: 'Parcial',
      className: 'bg-yellow-100 text-yellow-800'
    },
    error: {
      text: 'Error',
      className: 'bg-red-100 text-red-800'
    }
  };

  const badge = badges[result] || badges.error;
  
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badge.className}`}>
      {badge.text}
    </span>
  );
};

export const SyncLogRow = ({ log }) => {
  const [showErrors, setShowErrors] = useState(false);
  const { date, result, eventsRead, eventsImported, errors } = log;

  return (
    <>
      <tr className="hover:bg-gray-50">
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
          {formatDate(date)}
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
          {getResultBadge(result)}
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
          <div className="flex flex-col">
            <span>{eventsImported} / {eventsRead} importados</span>
            {eventsRead > 0 && (
              <span className="text-xs text-gray-500">
                {Math.round((eventsImported / eventsRead) * 100)}% éxito
              </span>
            )}
          </div>
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm">
          {errors.length > 0 ? (
            <button
              onClick={() => setShowErrors(!showErrors)}
              className="text-red-600 hover:text-red-800 font-medium"
            >
              {errors.length} error{errors.length > 1 ? 'es' : ''}
              <svg 
                className={`inline ml-1 h-4 w-4 transition-transform ${
                  showErrors ? 'rotate-180' : ''
                }`} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          ) : (
            <span className="text-gray-400">Sin errores</span>
          )}
        </td>
      </tr>
      
      {/* Fila expandible para errores */}
      {showErrors && errors.length > 0 && (
        <tr>
          <td colSpan={4} className="px-6 py-4 bg-red-50">
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-red-800">Detalles de errores:</h4>
              <ul className="space-y-1">
                {errors.map((error, index) => (
                  <li key={index} className="text-sm text-red-700 flex items-start space-x-2">
                    <span className="text-red-400 mt-1">•</span>
                    <span>{error}</span>
                  </li>
                ))}
              </ul>
            </div>
          </td>
        </tr>
      )}
    </>
  );
};