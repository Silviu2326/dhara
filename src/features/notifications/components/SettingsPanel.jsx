import React, { useState } from 'react';
import { CategoryToggle } from './CategoryToggle';
import { QuietHoursPicker } from './QuietHoursPicker';
import { DigestTimeSelect } from './DigestTimeSelect';

export const SettingsPanel = ({ 
  settings, 
  onSettingsChange, 
  loading = false,
  className = '' 
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleSettingChange = (key, value) => {
    const newSettings = { ...settings, [key]: value };
    onSettingsChange(newSettings);
  };

  const handleCategoryChange = (category, type, enabled) => {
    const newCategories = {
      ...settings.categories,
      [category]: {
        ...settings.categories[category],
        [type]: enabled
      }
    };
    handleSettingChange('categories', newCategories);
  };

  const handleQuietHoursChange = (quietHours) => {
    handleSettingChange('quietHours', quietHours);
  };

  const handleDigestTimeChange = (digestTimes) => {
    handleSettingChange('digestTimes', digestTimes);
  };

  const resetToDefaults = () => {
    if (window.confirm('¿Restaurar configuración por defecto? Se perderán los cambios actuales.')) {
      const defaultSettings = {
        categories: {
          appointment: { email: true, push: true },
          message: { email: true, push: true },
          document: { email: true, push: false },
          payment: { email: true, push: true },
          system: { email: false, push: false }
        },
        quietHours: {
          enabled: false,
          startTime: '22:00',
          endTime: '07:00'
        },
        digestTimes: ['08:00', '20:00']
      };
      onSettingsChange(defaultSettings);
    }
  };

  if (loading) {
    return (
      <div className={`bg-white border border-gray-200 rounded-lg p-6 ${className}`}>
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="space-y-3">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="flex justify-between items-center">
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                <div className="flex gap-2">
                  <div className="h-6 w-12 bg-gray-200 rounded"></div>
                  <div className="h-6 w-12 bg-gray-200 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white border border-gray-200 rounded-lg ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium text-gray-900">Configuración de Notificaciones</h3>
            <p className="text-sm text-gray-500 mt-1">
              Personaliza cómo y cuándo recibir notificaciones
            </p>
          </div>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="md:hidden p-2 rounded-lg hover:bg-gray-100"
            aria-label={isExpanded ? 'Contraer configuración' : 'Expandir configuración'}
          >
            <svg
              className={`w-5 h-5 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className={`${isExpanded ? 'block' : 'hidden md:block'}`}>
        <div className="p-6 space-y-6">
          {/* Category toggles */}
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-4">Notificaciones por Categoría</h4>
            <div className="space-y-3">
              {Object.entries(settings.categories || {}).map(([category, config]) => (
                <CategoryToggle
                  key={category}
                  category={category}
                  config={config}
                  onChange={handleCategoryChange}
                />
              ))}
            </div>
          </div>

          {/* Quiet hours */}
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-4">Horario de Silencio</h4>
            <QuietHoursPicker
              quietHours={settings.quietHours}
              onChange={handleQuietHoursChange}
            />
          </div>

          {/* Digest times */}
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-4">Resumen Diario</h4>
            <DigestTimeSelect
              digestTimes={settings.digestTimes}
              onChange={handleDigestTimeChange}
            />
          </div>

          {/* Additional settings */}
          <div className="border-t border-gray-200 pt-6">
            <h4 className="text-sm font-medium text-gray-900 mb-4">Configuración Adicional</h4>
            <div className="space-y-3">
              <label className="flex items-center justify-between">
                <div>
                  <span className="text-sm text-gray-700">Sonido de notificación</span>
                  <p className="text-xs text-gray-500">Reproducir sonido al recibir notificaciones</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.playSound || false}
                  onChange={(e) => handleSettingChange('playSound', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
              </label>

              <label className="flex items-center justify-between">
                <div>
                  <span className="text-sm text-gray-700">Notificaciones en navegador</span>
                  <p className="text-xs text-gray-500">Mostrar notificaciones del navegador</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.browserNotifications || false}
                  onChange={(e) => handleSettingChange('browserNotifications', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
              </label>

              <label className="flex items-center justify-between">
                <div>
                  <span className="text-sm text-gray-700">Agrupar notificaciones</span>
                  <p className="text-xs text-gray-500">Agrupar notificaciones similares</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.groupNotifications || false}
                  onChange={(e) => handleSettingChange('groupNotifications', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
              </label>
            </div>
          </div>

          {/* Action buttons */}
          <div className="border-t border-gray-200 pt-6 flex flex-col sm:flex-row gap-3">
            <button
              onClick={resetToDefaults}
              disabled={isSaving}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
            >
              Restaurar por defecto
            </button>
            
            <div className="flex gap-2 sm:ml-auto">
              <button
                type="button"
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={isSaving}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 flex items-center gap-2"
              >
                {isSaving ? (
                  <>
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Guardando...
                  </>
                ) : (
                  'Guardar cambios'
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};