import React, { useState } from 'react';
import {
  XMarkIcon,
  ExclamationTriangleIcon,
  ChatBubbleLeftRightIcon,
  ClockIcon,
  TagIcon
} from '@heroicons/react/24/outline';
import { Button } from '../../../components/Button';
import { Card } from '../../../components/Card';
import noteService from '../../../services/api/noteService';

const CreateNoteModal = ({
  isOpen,
  onClose,
  client,
  currentUser = { id: '68ce20c17931a40b74af366a', role: 'therapist' }, // Default para testing
  onNoteCreated
}) => {
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    noteType: 'general',
    category: 'therapy',
    visibility: 'shared',
    priority: 'normal',
    status: 'active',
    isEmergency: false,
    requiresResponse: false,
    tags: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  const noteTypes = noteService.getNoteTypes();
  const categories = noteService.getNoteCategories();
  const visibilityOptions = noteService.getVisibilityOptions();
  const priorityOptions = noteService.getPriorityOptions();

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: null
      }));
    }

    // Auto-set emergency flag for urgent priority
    if (field === 'priority' && value === 'urgent') {
      setFormData(prev => ({
        ...prev,
        isEmergency: true
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = 'El título es requerido';
    } else if (formData.title.length > 200) {
      newErrors.title = 'El título no puede exceder 200 caracteres';
    }

    if (!formData.content.trim()) {
      newErrors.content = 'El contenido es requerido';
    } else if (formData.content.length < 5) {
      newErrors.content = 'El contenido debe tener al menos 5 caracteres';
    } else if (formData.content.length > 5000) {
      newErrors.content = 'El contenido no puede exceder 5000 caracteres';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Prepare note data
      const authorType = currentUser.role === 'therapist' ? 'therapist' : 'client';
      const tags = formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);

      const noteData = {
        title: formData.title.trim(),
        content: formData.content.trim(),
        clientId: client.id,
        therapistId: currentUser.role === 'therapist' ? currentUser.id : '68ce20c17931a40b74af366a', // ID del terapeuta
        noteType: formData.noteType,
        category: formData.category,
        visibility: formData.visibility,
        priority: formData.priority,
        status: formData.status,
        isEmergency: formData.isEmergency,
        requiresResponse: formData.requiresResponse,
        tags: tags
      };

      console.log('Creating note:', noteData);

      const response = await noteService.createNote(noteData);

      if (response.success) {
        console.log('✅ Note created successfully:', response.note);

        // Reset form
        setFormData({
          title: '',
          content: '',
          noteType: 'general',
          category: 'therapy',
          visibility: 'shared',
          priority: 'normal',
          status: 'active',
          isEmergency: false,
          requiresResponse: false,
          tags: ''
        });

        // Notify parent component
        if (onNoteCreated) {
          onNoteCreated(response.note);
        }

        onClose();
      } else {
        console.error('❌ Failed to create note:', response.error);
        setErrors({ submit: response.error });
      }
    } catch (error) {
      console.error('❌ Error creating note:', error);
      setErrors({ submit: 'Error interno al crear la nota. Inténtalo de nuevo.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Nueva nota</h2>
            <p className="text-sm text-gray-600">Cliente: {client?.name}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-md transition-colors"
          >
            <XMarkIcon className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Título <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              placeholder="Título de la nota..."
              className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-primary focus:border-primary ${
                errors.title ? 'border-red-300' : 'border-gray-300'
              }`}
              maxLength={200}
            />
            {errors.title && (
              <p className="mt-1 text-sm text-red-600">{errors.title}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              {formData.title.length}/200 caracteres
            </p>
          </div>

          {/* Content */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Contenido <span className="text-red-500">*</span>
            </label>
            <textarea
              value={formData.content}
              onChange={(e) => handleInputChange('content', e.target.value)}
              placeholder="Escribe el contenido de la nota..."
              rows={6}
              className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-primary focus:border-primary ${
                errors.content ? 'border-red-300' : 'border-gray-300'
              }`}
              maxLength={5000}
            />
            {errors.content && (
              <p className="mt-1 text-sm text-red-600">{errors.content}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              {formData.content.length}/5000 caracteres
            </p>
          </div>

          {/* Row 1: Type and Category */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo de nota
              </label>
              <select
                value={formData.noteType}
                onChange={(e) => handleInputChange('noteType', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-primary"
              >
                {noteTypes.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Categoría
              </label>
              <select
                value={formData.category}
                onChange={(e) => handleInputChange('category', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-primary"
              >
                {categories.map(category => (
                  <option key={category.value} value={category.value}>
                    {category.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Row 2: Visibility and Priority */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Visibilidad
              </label>
              <select
                value={formData.visibility}
                onChange={(e) => handleInputChange('visibility', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-primary"
              >
                {visibilityOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Prioridad
              </label>
              <select
                value={formData.priority}
                onChange={(e) => handleInputChange('priority', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-primary"
              >
                {priorityOptions.map(priority => (
                  <option key={priority.value} value={priority.value}>
                    {priority.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <TagIcon className="h-4 w-4 inline mr-1" />
              Etiquetas
            </label>
            <input
              type="text"
              value={formData.tags}
              onChange={(e) => handleInputChange('tags', e.target.value)}
              placeholder="Separar con comas: ansiedad, terapia, progreso..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-primary"
            />
            <p className="mt-1 text-xs text-gray-500">
              Separar múltiples etiquetas con comas
            </p>
          </div>

          {/* Options */}
          <div className="space-y-3">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="isEmergency"
                checked={formData.isEmergency}
                onChange={(e) => handleInputChange('isEmergency', e.target.checked)}
                className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
              />
              <label htmlFor="isEmergency" className="ml-2 block text-sm text-gray-700">
                <ExclamationTriangleIcon className="h-4 w-4 inline mr-1 text-red-500" />
                Marcar como emergencia
              </label>
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="requiresResponse"
                checked={formData.requiresResponse}
                onChange={(e) => handleInputChange('requiresResponse', e.target.checked)}
                className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
              />
              <label htmlFor="requiresResponse" className="ml-2 block text-sm text-gray-700">
                <ClockIcon className="h-4 w-4 inline mr-1 text-amber-500" />
                Requiere respuesta
              </label>
            </div>
          </div>

          {/* Error Message */}
          {errors.submit && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <p className="text-sm text-red-600">{errors.submit}</p>
            </div>
          )}
        </form>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="primary"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="flex items-center gap-2"
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Creando...
              </>
            ) : (
              'Crear nota'
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CreateNoteModal;