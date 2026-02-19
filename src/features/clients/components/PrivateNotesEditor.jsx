import React, { useState, useEffect, useRef } from 'react';
import { 
  DocumentTextIcon,
  EyeIcon,
  PencilIcon,
  CheckIcon,
  ClockIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { Button } from '../../../components/Button';

// Hook para autosave
const useAutoSave = (content, onSave, delay = 2000) => {
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const timeoutRef = useRef(null);
  const lastContentRef = useRef(content);
  
  useEffect(() => {
    if (content !== lastContentRef.current) {
      setHasUnsavedChanges(true);
      
      // Limpiar timeout anterior
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      // Configurar nuevo timeout para autosave
      timeoutRef.current = setTimeout(async () => {
        setIsSaving(true);
        try {
          await onSave(content);
          setLastSaved(new Date());
          setHasUnsavedChanges(false);
          lastContentRef.current = content;
        } catch (error) {
          console.error('Error saving notes:', error);
        } finally {
          setIsSaving(false);
        }
      }, delay);
    }
    
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [content, onSave, delay]);
  
  const saveNow = async () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    setIsSaving(true);
    try {
      await onSave(content);
      setLastSaved(new Date());
      setHasUnsavedChanges(false);
      lastContentRef.current = content;
    } catch (error) {
      console.error('Error saving notes:', error);
    } finally {
      setIsSaving(false);
    }
  };
  
  return {
    isSaving,
    lastSaved,
    hasUnsavedChanges,
    saveNow
  };
};

// Componente para renderizar Markdown simple
const MarkdownRenderer = ({ content }) => {
  const renderMarkdown = (text) => {
    if (!text) return '';
    
    // Convertir markdown básico a HTML
    let html = text
      // Headers
      .replace(/^### (.*$)/gim, '<h3 class="text-lg font-semibold text-gray-900 mt-4 mb-2">$1</h3>')
      .replace(/^## (.*$)/gim, '<h2 class="text-xl font-semibold text-gray-900 mt-6 mb-3">$1</h2>')
      .replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold text-gray-900 mt-6 mb-4">$1</h1>')
      // Bold
      .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold">$1</strong>')
      // Italic
      .replace(/\*(.*?)\*/g, '<em class="italic">$1</em>')
      // Lists
      .replace(/^\* (.*$)/gim, '<li class="ml-4">• $1</li>')
      .replace(/^- (.*$)/gim, '<li class="ml-4">• $1</li>')
      // Line breaks
      .replace(/\n/g, '<br />');
    
    return html;
  };
  
  return (
    <div 
      className="prose prose-sm max-w-none text-gray-700 leading-relaxed"
      dangerouslySetInnerHTML={{ __html: renderMarkdown(content) }}
    />
  );
};

// Componente principal del editor
export const PrivateNotesEditor = ({ 
  clientId, 
  initialContent = '', 
  onSave,
  onViewHistory
}) => {
  const [content, setContent] = useState(initialContent);
  const [mode, setMode] = useState('edit'); // 'edit' | 'preview'
  const [showHelp, setShowHelp] = useState(false);
  const textareaRef = useRef(null);
  
  const { isSaving, lastSaved, hasUnsavedChanges, saveNow } = useAutoSave(
    content, 
    onSave
  );
  
  useEffect(() => {
    setContent(initialContent);
  }, [initialContent]);
  
  const formatLastSaved = (date) => {
    if (!date) return 'Nunca';
    
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'Hace un momento';
    if (minutes < 60) return `Hace ${minutes} min`;
    
    return date.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  const insertMarkdown = (syntax) => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end);
    
    let newText;
    let newCursorPos;
    
    switch (syntax) {
      case 'bold':
        newText = `**${selectedText || 'texto en negrita'}**`;
        newCursorPos = start + (selectedText ? newText.length : 2);
        break;
      case 'italic':
        newText = `*${selectedText || 'texto en cursiva'}*`;
        newCursorPos = start + (selectedText ? newText.length : 1);
        break;
      case 'header':
        newText = `## ${selectedText || 'Título'}`;
        newCursorPos = start + newText.length;
        break;
      case 'list':
        newText = `\n* ${selectedText || 'Elemento de lista'}`;
        newCursorPos = start + newText.length;
        break;
      default:
        return;
    }
    
    const newContent = content.substring(0, start) + newText + content.substring(end);
    setContent(newContent);
    
    // Restaurar posición del cursor
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };
  
  const handleKeyDown = (e) => {
    // Atajos de teclado
    if (e.ctrlKey || e.metaKey) {
      switch (e.key) {
        case 's':
          e.preventDefault();
          saveNow();
          break;
        case 'b':
          e.preventDefault();
          insertMarkdown('bold');
          break;
        case 'i':
          e.preventDefault();
          insertMarkdown('italic');
          break;
      }
    }
  };
  
  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
        <div className="flex items-center gap-2">
          {/* Botones de modo */}
          <div className="flex bg-white rounded-md border border-gray-200">
            <button
              onClick={() => setMode('edit')}
              className={`px-3 py-1 text-sm font-medium rounded-l-md transition-colors ${
                mode === 'edit'
                  ? 'bg-primary text-white'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <PencilIcon className="h-4 w-4 inline mr-1" />
              Editar
            </button>
            <button
              onClick={() => setMode('preview')}
              className={`px-3 py-1 text-sm font-medium rounded-r-md transition-colors ${
                mode === 'preview'
                  ? 'bg-primary text-white'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <EyeIcon className="h-4 w-4 inline mr-1" />
              Vista previa
            </button>
          </div>
          
          {/* Botones de formato (solo en modo edición) */}
          {mode === 'edit' && (
            <div className="flex items-center gap-1 ml-2">
              <button
                onClick={() => insertMarkdown('bold')}
                className="p-1 text-gray-600 hover:text-gray-800 hover:bg-white rounded"
                title="Negrita (Ctrl+B)"
              >
                <strong className="text-sm">B</strong>
              </button>
              <button
                onClick={() => insertMarkdown('italic')}
                className="p-1 text-gray-600 hover:text-gray-800 hover:bg-white rounded"
                title="Cursiva (Ctrl+I)"
              >
                <em className="text-sm">I</em>
              </button>
              <button
                onClick={() => insertMarkdown('header')}
                className="p-1 text-gray-600 hover:text-gray-800 hover:bg-white rounded text-sm font-bold"
                title="Título"
              >
                H
              </button>
              <button
                onClick={() => insertMarkdown('list')}
                className="p-1 text-gray-600 hover:text-gray-800 hover:bg-white rounded text-sm"
                title="Lista"
              >
                •
              </button>
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-3">
          {/* Estado de guardado */}
          <div className="flex items-center gap-2 text-sm">
            {isSaving ? (
              <>
                <ClockIcon className="h-4 w-4 text-blue-500 animate-spin" />
                <span className="text-blue-600">Guardando...</span>
              </>
            ) : hasUnsavedChanges ? (
              <>
                <ExclamationTriangleIcon className="h-4 w-4 text-amber-500" />
                <span className="text-amber-600">Cambios sin guardar</span>
              </>
            ) : (
              <>
                <CheckIcon className="h-4 w-4 text-green-500" />
                <span className="text-green-600">Guardado {formatLastSaved(lastSaved)}</span>
              </>
            )}
          </div>
          
          {/* Botones de acción */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowHelp(!showHelp)}
              className="text-sm text-gray-600 hover:text-gray-800"
            >
              ?
            </button>
            
            {hasUnsavedChanges && (
              <Button
                size="sm"
                variant="outline"
                onClick={saveNow}
                disabled={isSaving}
              >
                Guardar ahora
              </Button>
            )}
            
            <Button
              size="sm"
              variant="outline"
              onClick={onViewHistory}
            >
              Historial
            </Button>
          </div>
        </div>
      </div>
      
      {/* Ayuda de Markdown */}
      {showHelp && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-medium text-blue-900 mb-2">Formato Markdown</h4>
          <div className="grid grid-cols-2 gap-4 text-sm text-blue-800">
            <div>
              <p><code>**texto**</code> → <strong>negrita</strong></p>
              <p><code>*texto*</code> → <em>cursiva</em></p>
            </div>
            <div>
              <p><code># Título</code> → Título grande</p>
              <p><code>* elemento</code> → Lista</p>
            </div>
          </div>
          <p className="text-xs text-blue-600 mt-2">
            Atajos: Ctrl+S (guardar), Ctrl+B (negrita), Ctrl+I (cursiva)
          </p>
        </div>
      )}
      
      {/* Editor / Vista previa */}
      <div className="border border-gray-200 rounded-lg">
        {mode === 'edit' ? (
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Escribe tus notas privadas aquí...\n\nPuedes usar Markdown para formato:\n• **negrita**\n• *cursiva*\n• # Títulos\n• * Listas"
            className="w-full h-96 p-4 border-0 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary focus:ring-opacity-50 font-mono text-sm leading-relaxed"
          />
        ) : (
          <div className="p-4 min-h-96">
            {content ? (
              <MarkdownRenderer content={content} />
            ) : (
              <div className="text-center py-12 text-gray-500">
                <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <p>No hay notas para mostrar</p>
                <p className="text-sm">Cambia al modo edición para escribir notas</p>
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Información adicional */}
      <div className="text-xs text-gray-500">
        <p>Las notas se guardan automáticamente cada 2 segundos. Solo tú puedes ver estas notas.</p>
      </div>
    </div>
  );
};