import React, { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';
import { Button } from '../../../components/Button';

export const CredentialModal = ({ credential, onSave, onClose, isOpen }) => {
  const [formData, setFormData] = useState({
    title: '',
    institution: '',
    year: '',
    description: ''
  });
  const [errors, setErrors] = useState({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (credential) {
      setFormData({
        title: credential.title || '',
        institution: credential.institution || '',
        year: credential.year || '',
        description: credential.description || ''
      });
    } else {
      setFormData({
        title: '',
        institution: '',
        year: '',
        description: ''
      });
    }
    setErrors({});
  }, [credential, isOpen]);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = 'El título es obligatorio';
    }

    if (!formData.institution.trim()) {
      newErrors.institution = 'La institución es obligatoria';
    }

    if (!formData.year.trim()) {
      newErrors.year = 'El año es obligatorio';
    } else {
      const yearNum = parseInt(formData.year);
      const currentYear = new Date().getFullYear();
      if (isNaN(yearNum) || yearNum < 1950 || yearNum > currentYear) {
        newErrors.year = `El año debe estar entre 1950 y ${currentYear}`;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSaving(true);

    try {
      // Simular delay de guardado
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const credentialData = {
        ...formData,
        title: formData.title.trim(),
        institution: formData.institution.trim(),
        year: formData.year.trim(),
        description: formData.description.trim()
      };

      if (credential) {
        credentialData.id = credential.id;
      }

      onSave(credentialData);
    } catch (error) {
      console.error('Error saving credential:', error);
      alert('Error al guardar la credencial. Inténtalo de nuevo.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Limpiar error del campo cuando el usuario empiece a escribir
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div 
        className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto"
        onKeyDown={handleKeyDown}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-deep">
            {credential ? 'Editar Credencial' : 'Añadir Credencial'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Cerrar modal"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Título */}
          <div>
            <label htmlFor="credential-title" className="block text-sm font-medium text-gray-700 mb-1">
              Título / Certificación *
            </label>
            <input
              id="credential-title"
              type="text"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              placeholder="ej. Máster en Psicología Clínica"
              className={`
                w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-sage focus:border-transparent
                ${errors.title ? 'border-red-300' : 'border-gray-300'}
              `}
              aria-invalid={!!errors.title}
              aria-describedby={errors.title ? 'title-error' : undefined}
            />
            {errors.title && (
              <p id="title-error" className="text-red-600 text-sm mt-1">{errors.title}</p>
            )}
          </div>

          {/* Institución */}
          <div>
            <label htmlFor="credential-institution" className="block text-sm font-medium text-gray-700 mb-1">
              Centro / Institución *
            </label>
            <input
              id="credential-institution"
              type="text"
              value={formData.institution}
              onChange={(e) => handleInputChange('institution', e.target.value)}
              placeholder="ej. Universidad Complutense de Madrid"
              className={`
                w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-sage focus:border-transparent
                ${errors.institution ? 'border-red-300' : 'border-gray-300'}
              `}
              aria-invalid={!!errors.institution}
              aria-describedby={errors.institution ? 'institution-error' : undefined}
            />
            {errors.institution && (
              <p id="institution-error" className="text-red-600 text-sm mt-1">{errors.institution}</p>
            )}
          </div>

          {/* Año */}
          <div>
            <label htmlFor="credential-year" className="block text-sm font-medium text-gray-700 mb-1">
              Año de finalización *
            </label>
            <input
              id="credential-year"
              type="number"
              min="1950"
              max={new Date().getFullYear()}
              value={formData.year}
              onChange={(e) => handleInputChange('year', e.target.value)}
              placeholder="ej. 2020"
              className={`
                w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-sage focus:border-transparent
                ${errors.year ? 'border-red-300' : 'border-gray-300'}
              `}
              aria-invalid={!!errors.year}
              aria-describedby={errors.year ? 'year-error' : undefined}
            />
            {errors.year && (
              <p id="year-error" className="text-red-600 text-sm mt-1">{errors.year}</p>
            )}
          </div>

          {/* Descripción */}
          <div>
            <label htmlFor="credential-description" className="block text-sm font-medium text-gray-700 mb-1">
              Descripción (opcional)
            </label>
            <textarea
              id="credential-description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Detalles adicionales sobre la formación..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sage focus:border-transparent resize-none"
            />
          </div>

          {/* Buttons */}
          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="bg-gray-100 text-gray-700 hover:bg-gray-200 px-4 py-2 rounded-lg"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSaving}
              className="bg-sage text-white hover:bg-sage/90 px-4 py-2 rounded-lg flex items-center space-x-2"
            >
              <Save className="h-4 w-4" />
              <span>{isSaving ? 'Guardando...' : 'Guardar'}</span>
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};