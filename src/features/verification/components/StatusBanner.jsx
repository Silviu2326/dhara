import React from 'react';
import { CheckCircle, Clock, XCircle, Circle } from 'lucide-react';

const STATUS_CONFIG = {
  approved: {
    icon: CheckCircle,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    text: 'Aprobado',
    description: 'Tu verificación ha sido aprobada exitosamente'
  },
  pending: {
    icon: Clock,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-200',
    text: 'En revisión',
    description: 'Tus documentos están siendo revisados por nuestro equipo',
    estimatedTime: '2-3 días hábiles',
    supportContact: 'soporte@empresa.com'
  },
  rejected: {
    icon: XCircle,
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    text: 'Rechazado',
    description: 'Tu verificación ha sido rechazada. Revisa los comentarios del revisor'
  },
  not_submitted: {
    icon: Circle,
    color: 'text-gray-600',
    bgColor: 'bg-gray-50',
    borderColor: 'border-gray-200',
    text: 'Sin enviar',
    description: 'Aún no has enviado tus documentos para verificación'
  }
};

export const StatusBanner = ({ status = 'not_submitted', className = '' }) => {
  const config = STATUS_CONFIG[status];
  const Icon = config.icon;

  return (
    <div
      className={`p-6 rounded-lg border-2 ${config.bgColor} ${config.borderColor} ${className}`}
      role="status"
      aria-live="polite"
    >
      <div className="flex items-center space-x-4">
        <Icon
          className={`h-8 w-8 ${config.color}`}
          aria-hidden="true"
        />
        <div className="flex-1">
          <h3 className={`text-xl font-semibold ${config.color}`}>
            {config.text}
          </h3>
          <p className="text-gray-700 mt-1">
            {config.description}
          </p>
          {status === 'pending' && (
            <div className="mt-3 text-sm text-gray-600">
              <p className="font-medium">⏱️ Tiempo estimado: 2-5 días hábiles</p>
              <p className="mt-1">
                📞 ¿Necesitas ayuda? Contacta a soporte:
                <a href="mailto:info@dharadimensionhumana.es" className="text-yellow-700 underline hover:text-yellow-900 ml-1">
                  info@dharadimensionhumana.es
                </a>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};