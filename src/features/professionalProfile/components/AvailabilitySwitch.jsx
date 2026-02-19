import React from 'react';
import { UserCheck, UserX, Info } from 'lucide-react';

export const AvailabilitySwitch = ({ isAvailable = false, onChange, isEditing = false }) => {
  const handleToggle = () => {
    if (isEditing && onChange) {
      onChange(!isAvailable);
    }
  };

  const handleKeyDown = (e) => {
    if (isEditing && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      handleToggle();
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        {isAvailable ? (
          <UserCheck className="h-5 w-5 text-sage" />
        ) : (
          <UserX className="h-5 w-5 text-gray-400" />
        )}
        <h3 className="text-lg font-semibold text-deep">Disponibilidad</h3>
      </div>

      <div className="bg-gray-50 p-4 rounded-lg">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h4 className="text-sm font-medium text-gray-900 mb-1">
              ¿Acepta nuevos clientes?
            </h4>
            <p className="text-sm text-gray-600">
              {isAvailable 
                ? 'Tu perfil se mostrará como disponible para nuevos clientes'
                : 'Tu perfil se mostrará como no disponible para nuevos clientes'
              }
            </p>
          </div>
          
          {/* Toggle Switch */}
          <div className="ml-4">
            <button
              type="button"
              onClick={handleToggle}
              onKeyDown={handleKeyDown}
              disabled={!isEditing}
              className={`
                relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-sage focus:ring-offset-2
                ${isAvailable ? 'bg-sage' : 'bg-gray-300'}
                ${isEditing ? 'cursor-pointer' : 'cursor-default opacity-75'}
              `}
              role="switch"
              aria-checked={isAvailable}
              aria-label="Alternar disponibilidad para nuevos clientes"
            >
              <span
                className={`
                  inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                  ${isAvailable ? 'translate-x-6' : 'translate-x-1'}
                `}
              />
            </button>
          </div>
        </div>

        {/* Estado actual */}
        <div className={`mt-3 p-3 rounded-md ${
          isAvailable 
            ? 'bg-green-50 border border-green-200' 
            : 'bg-yellow-50 border border-yellow-200'
        }`}>
          <div className="flex items-start space-x-2">
            <Info className={`h-4 w-4 mt-0.5 ${
              isAvailable ? 'text-green-600' : 'text-yellow-600'
            }`} />
            <div className="text-sm">
              <p className={`font-medium ${
                isAvailable ? 'text-green-800' : 'text-yellow-800'
              }`}>
                {isAvailable ? 'Disponible para nuevos clientes' : 'No disponible para nuevos clientes'}
              </p>
              <p className={`mt-1 ${
                isAvailable ? 'text-green-700' : 'text-yellow-700'
              }`}>
                {isAvailable 
                  ? 'Los usuarios podrán encontrarte en las búsquedas y solicitar citas contigo.'
                  : 'Tu perfil no aparecerá en las búsquedas de nuevos terapeutas. Los clientes existentes podrán seguir accediendo.'
                }
              </p>
            </div>
          </div>
        </div>

        {/* Información adicional sobre el estado */}
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
          <div className="flex items-start space-x-2">
            <Info className="h-4 w-4 text-blue-600 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-medium">¿Cómo funciona?</p>
              <ul className="mt-1 space-y-1 text-blue-700">
                <li>• <strong>Disponible:</strong> Tu perfil aparece en búsquedas y puedes recibir nuevas solicitudes</li>
                <li>• <strong>No disponible:</strong> Solo tus clientes actuales pueden acceder a tu perfil</li>
                <li>• Puedes cambiar este estado en cualquier momento según tu capacidad</li>
              </ul>
            </div>
          </div>
        </div>
      </div>


    </div>
  );
};