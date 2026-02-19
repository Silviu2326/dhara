import React from 'react';
import { Send, RefreshCw, CheckCircle } from 'lucide-react';
import { Loader } from '../../../components/Loader';

const getButtonConfig = (status, isSubmitting) => {
  if (isSubmitting) {
    return {
      icon: Loader,
      text: 'Enviando...',
      disabled: true,
      className: 'bg-gray-400 cursor-not-allowed'
    };
  }

  switch (status) {
    case 'not_submitted':
      return {
        icon: Send,
        text: 'Enviar para Verificación',
        disabled: false,
        className: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'
      };
    case 'rejected':
      return {
        icon: RefreshCw,
        text: 'Reenviar para Verificación',
        disabled: false,
        className: 'bg-orange-600 hover:bg-orange-700 focus:ring-orange-500'
      };
    case 'approved':
      return {
        icon: CheckCircle,
        text: 'Verificación Aprobada',
        disabled: true,
        className: 'bg-green-600 cursor-not-allowed'
      };
    case 'pending':
    default:
      return {
        icon: Send,
        text: 'En Revisión',
        disabled: true,
        className: 'bg-gray-400 cursor-not-allowed'
      };
  }
};

export const SubmitButton = ({
  status = 'not_submitted',
  isSubmitting = false,
  canSubmit = false,
  onSubmit,
  diplomaCount = 0,
  hasInsurance = false,
  totalSubmittedDocs = 0,
  requiredDocs = 3,
  className = ''
}) => {
  const config = getButtonConfig(status, isSubmitting);
  const Icon = config.icon;

  // Determine if button should be disabled
  const isDisabled = config.disabled || !canSubmit || (diplomaCount === 0 || !hasInsurance);

  // Get appropriate styling
  const buttonClassName = isDisabled
    ? 'bg-gray-400 cursor-not-allowed'
    : config.className;

  const handleClick = () => {
    if (!isDisabled && onSubmit) {
      onSubmit();
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Submit button */}
      <button
        onClick={handleClick}
        disabled={isDisabled}
        className={`
          w-full flex items-center justify-center px-6 py-3 border border-transparent 
          text-base font-medium rounded-lg text-white transition-colors duration-200
          focus:outline-none focus:ring-2 focus:ring-offset-2
          ${buttonClassName}
        `}
        aria-describedby="submit-requirements"
      >
        {isSubmitting ? (
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
            <span>{config.text}</span>
          </div>
        ) : (
          <div className="flex items-center space-x-2">
            <Icon className="h-5 w-5" aria-hidden="true" />
            <span>{config.text}</span>
          </div>
        )}
      </button>

      {/* Requirements check */}
      <div id="submit-requirements" className="text-sm space-y-2">
        {status === 'not_submitted' || status === 'rejected' ? (
          <div className="space-y-1">
            <p className="font-medium text-gray-700">Requisitos para enviar:</p>
            <div className="space-y-1 ml-4">
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${diplomaCount > 0 ? 'bg-green-500' : 'bg-gray-300'
                  }`} />
                <span className={diplomaCount > 0 ? 'text-green-700' : 'text-gray-600'}>
                  Al menos 1 diploma o título ({diplomaCount} preparado{diplomaCount !== 1 ? 's' : ''})
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${totalSubmittedDocs >= requiredDocs ? 'bg-green-500' : 'bg-gray-300'
                  }`} />
                <span className={totalSubmittedDocs >= requiredDocs ? 'text-green-700' : 'text-gray-600'}>
                  Documentos enviados ({totalSubmittedDocs}/{requiredDocs})
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${hasInsurance ? 'bg-green-500' : 'bg-gray-300'
                  }`} />
                <span className={hasInsurance ? 'text-green-700' : 'text-gray-600'}>
                  Seguro de responsabilidad civil
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center">
            {status === 'pending' && (
              <p className="text-gray-600">
                Tu solicitud está siendo revisada por nuestro equipo. Te notificaremos cuando esté lista.
              </p>
            )}
            {status === 'approved' && (
              <p className="text-green-700">
                ¡Felicitaciones! Tu verificación profesional ha sido aprobada.
              </p>
            )}
          </div>
        )}
      </div>

      {/* Progress indicator for pending */}
      {status === 'pending' && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <div className="animate-pulse w-3 h-3 bg-yellow-400 rounded-full" />
            <div className="flex-1">
              <p className="text-sm font-medium text-yellow-800">
                Verificación en progreso
              </p>
              <p className="text-xs text-yellow-700 mb-2">
                Tiempo estimado de revisión: 2-5 días hábiles
              </p>
              <div className="text-xs text-yellow-700">
                <p className="font-medium">¿Necesitas ayuda?</p>
                <p>Contacta a soporte: <a href="mailto:info@dharadimensionhumana.es" className="underline hover:text-yellow-900">info@dharadimensionhumana.es</a></p>
                <p>WhatsApp: <a href="https://wa.me/1234567890" className="underline hover:text-yellow-900" target="_blank" rel="noopener noreferrer">+1 (234) 567-8900</a></p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};