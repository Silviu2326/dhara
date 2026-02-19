import React from 'react';
import { Edit, Save, X, Eye } from 'lucide-react';
import { Button } from '../../../components/Button';

export const HeaderActions = ({
  isEditing,
  isSaving,
  hasChanges,
  onEdit,
  onSave,
  onQuickSave,
  onCancel,
  onPreview
}) => {
  return (
    <>
      {/* Botones principales en el header */}
      <div className="flex items-center space-x-3">
        {/* Botón Vista Previa */}
        <Button
          onClick={onPreview}
          disabled={isSaving}
          className="bg-gray-100 text-gray-700 hover:bg-gray-200 px-4 py-2 rounded-lg flex items-center space-x-2"
          aria-label="Ver vista previa pública"
        >
          <Eye className="h-4 w-4" />
          <span className="hidden sm:inline">Vista previa</span>
        </Button>

        {isEditing ? (
          <>
            {/* Botón Cancelar */}
            <Button
              onClick={onCancel}
              disabled={isSaving}
              className="bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 px-4 py-2 rounded-lg flex items-center space-x-2"
              aria-label="Cancelar edición"
            >
              <X className="h-4 w-4" />
              <span className="hidden sm:inline">Cancelar</span>
            </Button>

            {/* Botón Guardar en modo edición */}
            <Button
              onClick={onSave}
              disabled={isSaving || !hasChanges}
              className={`
                px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors
                ${hasChanges
                  ? 'bg-sage text-white hover:bg-sage/90'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }
              `}
              aria-label="Guardar cambios"
            >
              <Save className="h-4 w-4" />
              <span>
                {isSaving ? 'Guardando...' : 'Guardar'}
              </span>
            </Button>
          </>
        ) : (
          /* Botón Editar */
          <Button
            onClick={onEdit}
            className="bg-sage text-white hover:bg-sage/90 px-4 py-2 rounded-lg flex items-center space-x-2"
            aria-label="Editar perfil"
          >
            <Edit className="h-4 w-4" />
            <span>Editar perfil</span>
          </Button>
        )}
      </div>

      {/* Botón de guardar flotante cuando hay cambios y no estamos en modo edición */}
      {!isEditing && hasChanges && (
        <div className="fixed bottom-6 right-6 z-50">
          <Button
            onClick={onQuickSave || onSave}
            disabled={isSaving}
            className="bg-sage text-white hover:bg-sage/90 shadow-lg hover:shadow-xl px-6 py-3 rounded-lg flex items-center space-x-2 transition-all duration-200 transform hover:scale-105"
            aria-label="Guardar cambios"
          >
            <Save className="h-5 w-5" />
            <span className="font-medium">
              {isSaving ? 'Guardando...' : 'Guardar cambios'}
            </span>
          </Button>
        </div>
      )}
    </>
  );
};

// Componente adicional para mostrar el estado de guardado
export const SaveStatus = ({ isSaving, lastSaved, hasUnsavedChanges }) => {
  if (isSaving) {
    return (
      <div className="flex items-center space-x-2 text-sm text-gray-600">
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-sage"></div>
        <span>Guardando cambios...</span>
      </div>
    );
  }

  if (hasUnsavedChanges) {
    return (
      <div className="flex items-center space-x-2 text-sm text-yellow-600">
        <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
        <span>Cambios sin guardar</span>
      </div>
    );
  }

  if (lastSaved) {
    const timeAgo = getTimeAgo(lastSaved);
    return (
      <div className="flex items-center space-x-2 text-sm text-green-600">
        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
        <span>Guardado {timeAgo}</span>
      </div>
    );
  }

  return null;
};

// Función auxiliar para calcular tiempo transcurrido
const getTimeAgo = (timestamp) => {
  const now = new Date();
  const saved = new Date(timestamp);
  const diffInSeconds = Math.floor((now - saved) / 1000);

  if (diffInSeconds < 60) {
    return 'hace un momento';
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `hace ${minutes} min`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `hace ${hours} h`;
  } else {
    const days = Math.floor(diffInSeconds / 86400);
    return `hace ${days} día${days > 1 ? 's' : ''}`;
  }
};