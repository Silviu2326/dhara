import React from 'react';
import {
  Calendar,
  MessageCircle,
  FileText,
  CreditCard,
  Settings,
  Bell
} from 'lucide-react';

const categoryLabels = {
  appointment: { label: 'Citas', icon: Calendar, description: 'Recordatorios y confirmaciones de citas' },
  message: { label: 'Mensajes', icon: MessageCircle, description: 'Mensajes de clientes y chat' },
  document: { label: 'Documentos', icon: FileText, description: 'Documentos compartidos y actualizaciones' },
  payment: { label: 'Pagos', icon: CreditCard, description: 'Transacciones y facturación' },
  system: { label: 'Sistema', icon: Settings, description: 'Actualizaciones del sistema y mantenimiento' }
};

export const CategoryToggle = ({ category, config, onChange }) => {
  const categoryInfo = categoryLabels[category] || {
    label: category,
    icon: Bell,
    description: 'Configuración de notificaciones'
  };

  const handleEmailChange = (enabled) => {
    onChange(category, 'email', enabled);
  };

  const handlePushChange = (enabled) => {
    onChange(category, 'push', enabled);
  };

  return (
    <div className="flex items-center justify-between py-3 px-4 bg-gray-50 rounded-lg">
      <div className="flex items-center gap-3">
        <categoryInfo.icon className="w-5 h-5 text-gray-600" />
        <div>
          <h5 className="text-sm font-medium text-gray-900">{categoryInfo.label}</h5>
          <p className="text-xs text-gray-500">{categoryInfo.description}</p>
        </div>
      </div>
      
      <div className="flex items-center gap-4">
        {/* Email toggle */}
        <label className="flex items-center gap-2">
          <span className="text-xs text-gray-600">Email</span>
          <div className="relative">
            <input
              type="checkbox"
              checked={config?.email || false}
              onChange={(e) => handleEmailChange(e.target.checked)}
              className="sr-only"
            />
            <div
              onClick={() => handleEmailChange(!config?.email)}
              className={`w-10 h-6 rounded-full cursor-pointer transition-colors ${
                config?.email ? 'bg-blue-600' : 'bg-gray-300'
              }`}
            >
              <div
                className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform mt-1 ${
                  config?.email ? 'translate-x-5' : 'translate-x-1'
                }`}
              />
            </div>
          </div>
        </label>

        {/* Push toggle */}
        <label className="flex items-center gap-2">
          <span className="text-xs text-gray-600">Push</span>
          <div className="relative">
            <input
              type="checkbox"
              checked={config?.push || false}
              onChange={(e) => handlePushChange(e.target.checked)}
              className="sr-only"
            />
            <div
              onClick={() => handlePushChange(!config?.push)}
              className={`w-10 h-6 rounded-full cursor-pointer transition-colors ${
                config?.push ? 'bg-green-600' : 'bg-gray-300'
              }`}
            >
              <div
                className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform mt-1 ${
                  config?.push ? 'translate-x-5' : 'translate-x-1'
                }`}
              />
            </div>
          </div>
        </label>
      </div>
    </div>
  );
};