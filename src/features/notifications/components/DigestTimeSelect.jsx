import React, { useState } from 'react';
import { Sunrise, Sun, Sunset, Moon, Mail } from 'lucide-react';

export const DigestTimeSelect = ({ digestTimes = [], onChange }) => {
  const [newTime, setNewTime] = useState('08:00');

  const addDigestTime = () => {
    if (!digestTimes.includes(newTime)) {
      const updatedTimes = [...digestTimes, newTime].sort();
      onChange(updatedTimes);
    }
  };

  const removeDigestTime = (timeToRemove) => {
    const updatedTimes = digestTimes.filter(time => time !== timeToRemove);
    onChange(updatedTimes);
  };

  const formatTime = (time) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const getTimeIcon = (time) => {
    const hour = parseInt(time.split(':')[0]);
    if (hour >= 6 && hour < 12) return Sunrise; // Morning
    if (hour >= 12 && hour < 18) return Sun; // Afternoon
    if (hour >= 18 && hour < 22) return Sunset; // Evening
    return Moon; // Night
  };

  const presetTimes = [
    { time: '08:00', label: 'Mañana' },
    { time: '12:00', label: 'Mediodía' },
    { time: '18:00', label: 'Tarde' },
    { time: '20:00', label: 'Noche' }
  ];

  return (
    <div className="space-y-4">
      {/* Description */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h5 className="text-sm font-medium text-gray-900 mb-2 flex items-center gap-2">
          <Mail className="w-4 h-4" />
          Resumen por email
        </h5>
        <p className="text-xs text-gray-600">
          Recibe un resumen de todas las notificaciones del día en los horarios seleccionados.
        </p>
      </div>

      {/* Current digest times */}
      {digestTimes.length > 0 && (
        <div>
          <p className="text-sm font-medium text-gray-700 mb-3">Horarios configurados:</p>
          <div className="space-y-2">
            {digestTimes.map((time, index) => (
              <div key={index} className="flex items-center justify-between bg-blue-50 rounded-lg p-3">
                <div className="flex items-center gap-2">
                  {React.createElement(getTimeIcon(time), { className: "w-5 h-5 text-gray-600" })}
                  <span className="text-sm font-medium text-gray-900">
                    {formatTime(time)}
                  </span>
                  <span className="text-xs text-gray-500">({time})</span>
                </div>
                <button
                  onClick={() => removeDigestTime(time)}
                  className="text-red-600 hover:text-red-800 p-1 rounded hover:bg-red-100"
                  aria-label={`Eliminar horario ${formatTime(time)}`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add new time */}
      <div>
        <p className="text-sm font-medium text-gray-700 mb-3">Agregar nuevo horario:</p>
        <div className="flex gap-2">
          <input
            type="time"
            value={newTime}
            onChange={(e) => setNewTime(e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <button
            onClick={addDigestTime}
            disabled={digestTimes.includes(newTime)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Agregar
          </button>
        </div>
      </div>

      {/* Preset times */}
      <div>
        <p className="text-sm font-medium text-gray-700 mb-3">Horarios sugeridos:</p>
        <div className="grid grid-cols-2 gap-2">
          {presetTimes.map((preset) => (
            <button
              key={preset.time}
              onClick={() => setNewTime(preset.time)}
              disabled={digestTimes.includes(preset.time)}
              className="flex items-center gap-2 px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {React.createElement(getTimeIcon(preset.time), { className: "w-4 h-4" })}
              <span>{preset.label}</span>
              <span className="text-xs text-gray-500">({formatTime(preset.time)})</span>
            </button>
          ))}
        </div>
      </div>

      {/* Limits and info */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
        <div className="flex items-start gap-2">
          <svg className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="text-xs text-yellow-800">
            <p className="font-medium">Información sobre resúmenes:</p>
            <ul className="mt-1 space-y-1 list-disc list-inside">
              <li>Máximo 4 horarios de resumen por día</li>
              <li>Solo se envían si hay notificaciones nuevas</li>
              <li>Incluye un resumen de actividad y notificaciones pendientes</li>
              <li>Se puede desactivar individualmente por categoría</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Quick actions */}
      {digestTimes.length > 0 && (
        <div className="flex gap-2">
          <button
            onClick={() => onChange(['08:00', '20:00'])}
            className="px-3 py-2 text-xs bg-green-100 text-green-700 rounded-lg hover:bg-green-200"
          >
            Configuración estándar (8:00 AM, 8:00 PM)
          </button>
          <button
            onClick={() => onChange([])}
            className="px-3 py-2 text-xs bg-red-100 text-red-700 rounded-lg hover:bg-red-200"
          >
            Desactivar todos
          </button>
        </div>
      )}
    </div>
  );
};