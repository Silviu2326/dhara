import React from 'react';
import { MessageSquare, AlertTriangle, Lightbulb } from 'lucide-react';

export const ReviewerComment = ({ 
  comment, 
  reviewDate,
  reviewerName = 'Equipo de Verificación',
  suggestions = [],
  className = '' 
}) => {
  if (!comment) {
    return null;
  }

  return (
    <div className={`bg-red-50 border border-red-200 rounded-lg p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-start space-x-3 mb-4">
        <div className="flex-shrink-0">
          <AlertTriangle className="h-6 w-6 text-red-600" aria-hidden="true" />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-red-800">
            Comentarios del Revisor
          </h3>
          <div className="flex items-center space-x-2 text-sm text-red-600 mt-1">
            <MessageSquare className="h-4 w-4" aria-hidden="true" />
            <span>{reviewerName}</span>
            {reviewDate && (
              <>
                <span>•</span>
                <span>
                  {new Date(reviewDate).toLocaleDateString('es-ES', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Comment content */}
      <div className="bg-white rounded-lg p-4 border border-red-200 mb-4">
        <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">
          {comment}
        </p>
      </div>

      {/* Suggestions */}
      {suggestions && suggestions.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start space-x-2 mb-3">
            <Lightbulb className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" aria-hidden="true" />
            <h4 className="text-sm font-semibold text-yellow-800">
              Sugerencias para corregir:
            </h4>
          </div>
          <ul className="space-y-2">
            {suggestions.map((suggestion, index) => (
              <li key={index} className="flex items-start space-x-2">
                <span className="text-yellow-600 mt-1.5 flex-shrink-0">•</span>
                <span className="text-sm text-yellow-800">{suggestion}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Action note */}
      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-800">
          <strong>Próximos pasos:</strong> Corrige los problemas mencionados y vuelve a subir los documentos. 
          Una vez que hagas los cambios, podrás reenviar tu solicitud de verificación.
        </p>
      </div>
    </div>
  );
};