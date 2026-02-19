import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, FileText } from 'lucide-react';
import { Button } from '../../../components/Button';
import { MarkdownPreview } from './MarkdownPreview';

export const AboutEditor = ({ value = '', onChange, isEditing = false, maxLength = 1000 }) => {
  const [showPreview, setShowPreview] = useState(false);
  const [text, setText] = useState(value);

  // Sincronizar estado local cuando cambie la prop value
  useEffect(() => {
    setText(value);
  }, [value]);

  const handleTextChange = (e) => {
    const newText = e.target.value;
    if (newText.length <= maxLength) {
      setText(newText);
      if (onChange) {
        onChange(newText);
      }
    }
  };

  const remainingChars = maxLength - text.length;
  const isNearLimit = remainingChars <= 100;
  const isAtLimit = remainingChars <= 0;

  if (!isEditing) {
    return (
      <div className="space-y-3">
        <div className="flex items-center space-x-2">
          <FileText className="h-5 w-5 text-sage" />
          <h3 className="text-lg font-semibold text-deep">Sobre mí</h3>
        </div>
        {text ? (
          <MarkdownPreview content={text} />
        ) : (
          <p className="text-gray-500 italic">No hay información disponible</p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <FileText className="h-5 w-5 text-sage" />
          <h3 className="text-lg font-semibold text-deep">Sobre mí</h3>
        </div>
        
        <Button
          onClick={() => setShowPreview(!showPreview)}
          className="bg-gray-100 text-gray-700 hover:bg-gray-200 px-3 py-1 rounded-md flex items-center space-x-2 text-sm"
          aria-label={showPreview ? 'Ocultar vista previa' : 'Mostrar vista previa'}
        >
          {showPreview ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          <span>{showPreview ? 'Ocultar' : 'Vista previa'}</span>
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {/* Editor */}
        <div className="space-y-2">
          <label htmlFor="about-textarea" className="block text-sm font-medium text-gray-700">
            Descripción profesional
          </label>
          <textarea
            id="about-textarea"
            value={text}
            onChange={handleTextChange}
            placeholder="Cuéntanos sobre tu experiencia, enfoque terapéutico, especialidades...\n\nPuedes usar Markdown para formato:\n- **negrita**\n- *cursiva*\n- [enlaces](https://ejemplo.com)\n- Listas con -"
            className={`
              w-full h-40 px-3 py-2 border rounded-lg resize-none focus:ring-2 focus:ring-sage focus:border-transparent
              ${isAtLimit ? 'border-red-300' : isNearLimit ? 'border-yellow-300' : 'border-gray-300'}
            `}
            aria-describedby="char-count about-help"
            aria-invalid={isAtLimit}
          />
          
          <div className="flex justify-between items-center text-sm">
            <div id="about-help" className="text-gray-500">
              Admite formato Markdown básico
            </div>
            <div 
              id="char-count"
              className={`
                font-medium
                ${isAtLimit ? 'text-red-600' : isNearLimit ? 'text-yellow-600' : 'text-gray-500'}
              `}
            >
              {text.length}/{maxLength}
            </div>
          </div>
        </div>

        {/* Vista previa */}
        {showPreview && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-700">Vista previa</h4>
            <div className="border border-gray-200 rounded-lg p-4 bg-gray-50 min-h-[160px]">
              {text ? (
                <MarkdownPreview content={text} />
              ) : (
                <p className="text-gray-400 italic">Escribe algo para ver la vista previa...</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Consejos de formato */}
      <details className="text-sm text-gray-600">
        <summary className="cursor-pointer hover:text-gray-800 font-medium">
          Consejos de formato Markdown
        </summary>
        <div className="mt-2 space-y-1 pl-4 border-l-2 border-gray-200">
          <p><code className="bg-gray-100 px-1 rounded">**texto**</code> para <strong>negrita</strong></p>
          <p><code className="bg-gray-100 px-1 rounded">*texto*</code> para <em>cursiva</em></p>
          <p><code className="bg-gray-100 px-1 rounded">[texto](url)</code> para enlaces</p>
          <p><code className="bg-gray-100 px-1 rounded">- elemento</code> para listas</p>
          <p><code className="bg-gray-100 px-1 rounded"># Título</code> para encabezados</p>
        </div>
      </details>
    </div>
  );
};