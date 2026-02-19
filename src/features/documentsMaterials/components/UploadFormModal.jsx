import React, { useState, useEffect } from 'react';
import {
  XMarkIcon,
  CloudArrowUpIcon,
  TagIcon,
  UserIcon,
  DocumentTextIcon,
  PaperAirplaneIcon
} from '@heroicons/react/24/outline';
import { UploadZone } from './UploadZone';
import { ClientSelect } from './ClientSelect';

const PREDEFINED_TAGS = [
  { id: 'ejercicios', label: '#ejercicios', color: 'blue' },
  { id: 'tarea', label: '#tarea', color: 'green' },
  { id: 'lectura', label: '#lectura', color: 'purple' },
  { id: 'audio', label: '#audio', color: 'pink' },
  { id: 'video', label: '#video', color: 'indigo' },
  { id: 'plantilla', label: '#plantilla', color: 'yellow' },
  { id: 'evaluacion', label: '#evaluación', color: 'red' },
  { id: 'recurso', label: '#recurso', color: 'gray' }
];

const TagInput = ({ tags, onTagsChange }) => {
  const [inputValue, setInputValue] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);

  const filteredSuggestions = PREDEFINED_TAGS.filter(tag =>
    !tags.includes(tag.id) &&
    tag.label.toLowerCase().includes(inputValue.toLowerCase())
  );

  const addTag = (tagId) => {
    if (!tags.includes(tagId)) {
      onTagsChange([...tags, tagId]);
    }
    setInputValue('');
    setShowSuggestions(false);
  };

  const removeTag = (tagId) => {
    onTagsChange(tags.filter(id => id !== tagId));
  };

  const handleInputKeyDown = (e) => {
    if (e.key === 'Enter' && inputValue.trim()) {
      e.preventDefault();
      const customTag = inputValue.trim().toLowerCase().replace(/^#/, '');
      if (!tags.includes(customTag)) {
        onTagsChange([...tags, customTag]);
      }
      setInputValue('');
      setShowSuggestions(false);
    }
  };

  const getTagColor = (tagId) => {
    const predefined = PREDEFINED_TAGS.find(tag => tag.id === tagId);
    return predefined ? predefined.color : 'gray';
  };

  const getTagStyles = (color) => {
    const styles = {
      blue: 'bg-blue-100 text-blue-800 border-blue-200',
      green: 'bg-green-100 text-green-800 border-green-200',
      purple: 'bg-purple-100 text-purple-800 border-purple-200',
      pink: 'bg-pink-100 text-pink-800 border-pink-200',
      indigo: 'bg-indigo-100 text-indigo-800 border-indigo-200',
      yellow: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      red: 'bg-red-100 text-red-800 border-red-200',
      gray: 'bg-gray-100 text-gray-800 border-gray-200'
    };
    return styles[color] || styles.gray;
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        Etiquetas
      </label>
      
      {/* Tags seleccionadas */}
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {tags.map((tagId) => {
            const predefined = PREDEFINED_TAGS.find(tag => tag.id === tagId);
            const label = predefined ? predefined.label : `#${tagId}`;
            const color = getTagColor(tagId);
            
            return (
              <span
                key={tagId}
                className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${
                  getTagStyles(color)
                }`}
              >
                {label}
                <button
                  onClick={() => removeTag(tagId)}
                  className="hover:text-red-600 transition-colors"
                >
                  <XMarkIcon className="w-3 h-3" />
                </button>
              </span>
            );
          })}
        </div>
      )}
      
      {/* Input de etiquetas */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <TagIcon className="w-4 h-4 text-gray-400" />
        </div>
        
        <input
          type="text"
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
            setShowSuggestions(true);
          }}
          onKeyDown={handleInputKeyDown}
          onFocus={() => setShowSuggestions(true)}
          placeholder="Escribe una etiqueta o selecciona una sugerencia..."
          className="block w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
        />
        
        {/* Sugerencias */}
        {showSuggestions && filteredSuggestions.length > 0 && (
          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-32 overflow-y-auto">
            {filteredSuggestions.map((tag) => (
              <button
                key={tag.id}
                onClick={() => addTag(tag.id)}
                className="w-full px-3 py-2 text-left hover:bg-gray-50 transition-colors flex items-center gap-2"
              >
                <span className={`inline-block w-2 h-2 rounded-full bg-${tag.color}-500`}></span>
                <span className="text-sm">{tag.label}</span>
              </button>
            ))}
          </div>
        )}
      </div>
      
      <p className="text-xs text-gray-500">
        Presiona Enter para agregar una etiqueta personalizada
      </p>
    </div>
  );
};

export const UploadFormModal = ({ isOpen, onClose, onUpload }) => {
  const [formData, setFormData] = useState({
    title: '',
    tags: [],
    client: null,
    sendToClient: false,
    description: '',
    files: []
  });
  const [isUploading, setIsUploading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (!isOpen) {
      // Reset form when modal closes
      setFormData({
        title: '',
        tags: [],
        client: null,
        sendToClient: false,
        description: '',
        files: []
      });
      setErrors({});
      setIsUploading(false);
    }
  }, [isOpen]);

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.title.trim()) {
      newErrors.title = 'El título es obligatorio';
    }
    
    if (formData.files.length === 0) {
      newErrors.files = 'Debes seleccionar al menos un archivo';
    }
    
    if (formData.sendToClient && !formData.client) {
      newErrors.client = 'Debes seleccionar un cliente para enviar el archivo';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsUploading(true);
    
    try {
      await onUpload(formData);
      onClose();
    } catch (error) {
      console.error('Error uploading files:', error);
      setErrors({ submit: 'Error al subir los archivos. Inténtalo de nuevo.' });
    } finally {
      setIsUploading(false);
    }
  };

  const handleFilesSelected = (files) => {
    setFormData(prev => ({ ...prev, files }));
    if (errors.files) {
      setErrors(prev => ({ ...prev, files: undefined }));
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        {/* Backdrop */}
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
          onClick={onClose}
        />
        
        {/* Modal */}
        <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b">
            <div className="flex items-center gap-2">
              <CloudArrowUpIcon className="w-6 h-6 text-blue-600" />
              <h2 className="text-xl font-semibold text-gray-900">
                Subir documentos
              </h2>
            </div>
            
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>
          
          {/* Content */}
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Título */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Título *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <DocumentTextIcon className="w-4 h-4 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  placeholder="Nombre descriptivo para los documentos..."
                  className={`block w-full pl-9 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.title ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
              </div>
              {errors.title && (
                <p className="mt-1 text-sm text-red-600">{errors.title}</p>
              )}
            </div>
            
            {/* Etiquetas */}
            <TagInput
              tags={formData.tags}
              onTagsChange={(tags) => handleInputChange('tags', tags)}
            />
            
            {/* Cliente */}
            <div>
              <ClientSelect
                selectedClient={formData.client}
                onClientChange={(client) => handleInputChange('client', client)}
              />
              {errors.client && (
                <p className="mt-1 text-sm text-red-600">{errors.client}</p>
              )}
            </div>
            
            {/* Enviar al cliente */}
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="sendToClient"
                checked={formData.sendToClient}
                onChange={(e) => handleInputChange('sendToClient', e.target.checked)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="sendToClient" className="flex items-center gap-2 text-sm text-gray-700">
                <PaperAirplaneIcon className="w-4 h-4" />
                Enviar notificación al cliente
              </label>
            </div>
            
            {/* Descripción */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Descripción (opcional)
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Descripción adicional o instrucciones..."
                rows={3}
                className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
              />
            </div>
            
            {/* Zona de subida */}
            <div>
              <UploadZone
                onFilesSelected={handleFilesSelected}
                maxFiles={5}
              />
              {errors.files && (
                <p className="mt-1 text-sm text-red-600">{errors.files}</p>
              )}
            </div>
            
            {/* Error de envío */}
            {errors.submit && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-600">{errors.submit}</p>
              </div>
            )}
            
            {/* Botones */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <button
                type="button"
                onClick={onClose}
                disabled={isUploading}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              
              <button
                type="submit"
                disabled={isUploading || formData.files.length === 0}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isUploading ? (
                  <>
                    <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                    Subiendo...
                  </>
                ) : (
                  <>
                    <CloudArrowUpIcon className="w-4 h-4" />
                    Subir {formData.files.length > 0 ? `(${formData.files.length})` : ''}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};