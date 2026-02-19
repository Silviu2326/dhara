import React, { useState, useEffect } from 'react';
import { SyncIntervalSelect } from './SyncIntervalSelect';
import { ImportRangeSelect } from './ImportRangeSelect';
import { EventTypeSwitches } from './EventTypeSwitches';
import { ColorMapping } from './ColorMapping';
import { SyncLogsTable } from './SyncLogsTable';
import { Button } from '../../../components/Button';

export const SettingsDrawer = ({ integration, isOpen, onClose }) => {
  const [settings, setSettings] = useState({
    syncInterval: '15', // minutos
    importRange: 'future', // 'future', 'past30', 'all'
    eventTypes: 'busy', // 'busy', 'all'
    colorMapping: {}
  });
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('settings');

  useEffect(() => {
    if (isOpen) {
      // Focus trap - enfocar el primer elemento
      const firstFocusable = document.querySelector('[data-drawer-content] button, [data-drawer-content] input, [data-drawer-content] select');
      if (firstFocusable) {
        firstFocusable.focus();
      }
    }
  }, [isOpen]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // TODO: Guardar configuración en API
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log('Configuración guardada:', settings);
      onClose();
    } catch (error) {
      console.error('Error saving settings:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Overlay */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50" 
        onClick={onClose}
      />
      
      {/* Drawer */}
      <div className="absolute right-0 top-0 h-full w-full md:w-96 bg-white shadow-xl">
        <div 
          data-drawer-content
          className="flex flex-col h-full"
          onKeyDown={handleKeyDown}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b">
            <div className="flex items-center space-x-3">
              <span className="text-2xl">{integration?.icon}</span>
              <h2 className="text-xl font-semibold text-deep">
                {integration?.name}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg"
              aria-label="Cerrar configuración"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Tabs */}
          <div className="flex border-b">
            <button
              onClick={() => setActiveTab('settings')}
              className={`px-6 py-3 text-sm font-medium border-b-2 ${
                activeTab === 'settings'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Configuración
            </button>
            <button
              onClick={() => setActiveTab('logs')}
              className={`px-6 py-3 text-sm font-medium border-b-2 ${
                activeTab === 'logs'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Historial
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {activeTab === 'settings' ? (
              <div className="space-y-6">
                <SyncIntervalSelect
                  value={settings.syncInterval}
                  onChange={(value) => setSettings(prev => ({ ...prev, syncInterval: value }))}
                />
                
                <ImportRangeSelect
                  value={settings.importRange}
                  onChange={(value) => setSettings(prev => ({ ...prev, importRange: value }))}
                />
                
                <EventTypeSwitches
                  value={settings.eventTypes}
                  onChange={(value) => setSettings(prev => ({ ...prev, eventTypes: value }))}
                />
                
                <ColorMapping
                  value={settings.colorMapping}
                  onChange={(value) => setSettings(prev => ({ ...prev, colorMapping: value }))}
                />
              </div>
            ) : (
              <SyncLogsTable integrationId={integration?.id} />
            )}
          </div>

          {/* Footer */}
          {activeTab === 'settings' && (
            <div className="p-6 border-t bg-gray-50">
              <div className="flex space-x-3">
                <Button
                  onClick={onClose}
                  variant="outline"
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex-1"
                >
                  {isSaving ? 'Guardando...' : 'Guardar'}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};