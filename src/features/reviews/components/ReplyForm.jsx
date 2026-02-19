import React, { useState, useEffect } from 'react';
import { Send, X, Lightbulb, Info, Keyboard, MessageSquare } from 'lucide-react';
import { AutoResponseModal } from './AutoResponseModal';

export const ReplyForm = ({ 
  onSubmit, 
  onCancel, 
  isSubmitting = false, 
  existingResponse = '' 
}) => {
  const [response, setResponse] = useState(existingResponse);
  const [charCount, setCharCount] = useState(existingResponse.length);
  const [showAutoResponseModal, setShowAutoResponseModal] = useState(false);
  const maxChars = 500;

  useEffect(() => {
    setResponse(existingResponse);
    setCharCount(existingResponse.length);
  }, [existingResponse]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (response.trim() && response.length <= maxChars) {
      onSubmit(response.trim());
    }
  };

  const handleAutoResponseSelect = (text) => {
    setResponse(text);
    setCharCount(text.length);
    setShowAutoResponseModal(false);
  };

  const handleKeyDown = (e) => {
    // Atajo Cmd/Ctrl + Enter para enviar
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleChange = (e) => {
    const value = e.target.value;
    if (value.length <= maxChars) {
      setResponse(value);
      setCharCount(value.length);
    }
  };

  const isValid = response.trim().length > 0 && response.length <= maxChars;

  return (
    <form onSubmit={handleSubmit} role="form" className="space-y-3">
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => setShowAutoResponseModal(true)}
          className="text-sm text-sage hover:text-sage/80 font-medium flex items-center gap-1 transition-colors"
        >
          <MessageSquare className="h-4 w-4" />
          Respuestas automáticas
        </button>
      </div>

      <div className="relative">
        <textarea
          value={response}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder="Escribe tu respuesta profesional y empática..."
          className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-sage focus:border-transparent"
          rows={4}
          disabled={isSubmitting}
          aria-label="Respuesta a la reseña"
          aria-describedby="char-count response-help"
        />
        
        {/* Contador de caracteres */}
        <div 
          id="char-count"
          className={`absolute bottom-2 right-2 text-xs ${
            charCount > maxChars * 0.9 
              ? charCount >= maxChars 
                ? 'text-red-500' 
                : 'text-orange-500'
              : 'text-gray-400'
          }`}
        >
          {charCount}/{maxChars}
        </div>
      </div>

      {/* Texto de ayuda */}
      <p id="response-help" className="text-xs text-gray-500">
        <div className="flex items-start gap-2">
          <Lightbulb className="h-4 w-4 text-sage mt-0.5 flex-shrink-0" />
          <div>
            <strong>Tip:</strong> Sé profesional, empático y constructivo. Usa
            <span className="inline-flex items-center gap-1 mx-1">
              <Keyboard className="h-3 w-3" />
              <span className="text-xs bg-gray-100 px-1 rounded">Cmd+Enter</span>
            </span>
            (Mac) o
            <span className="inline-flex items-center gap-1 mx-1">
              <Keyboard className="h-3 w-3" />
              <span className="text-xs bg-gray-100 px-1 rounded">Ctrl+Enter</span>
            </span>
            (PC) para enviar rápidamente.
          </div>
        </div>
      </p>

      {/* Botones de acción */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onCancel}
          className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
          disabled={isSubmitting}
        >
          <X className="h-4 w-4" />
          Cancelar
        </button>
        
        <button
          type="submit"
          disabled={!isValid || isSubmitting}
          className={`flex items-center gap-2 px-6 py-2 rounded-lg font-medium transition-all ${
            isValid && !isSubmitting
              ? 'bg-sage text-white hover:bg-sage/90 shadow-sm'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          {isSubmitting ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              Enviando...
            </>
          ) : (
            <>
              <Send className="h-4 w-4" />
              {existingResponse ? 'Actualizar respuesta' : 'Publicar respuesta'}
            </>
          )}
        </button>
      </div>

      {/* Información adicional */}
      {!existingResponse && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-xs text-blue-700">
            <div className="flex items-center gap-2">
              <Info className="h-3 w-3 text-blue-500" />
              <span>Podrás editar tu respuesta durante los próximos 7 días después de publicarla.</span>
            </div>
          </p>
        </div>
      )}

      {showAutoResponseModal && (
        <AutoResponseModal
          onSelect={handleAutoResponseSelect}
          onClose={() => setShowAutoResponseModal(false)}
        />
      )}
    </form>
  );
};