import React, { useState } from 'react';
import { X, Plus, Minus, ChevronUp, ChevronDown } from 'lucide-react';
import { Button } from '../../../components/Button';

export const CreatePlanModal = ({ isOpen, onClose, onSave, initialData = null, isEditing = false }) => {
  const [formData, setFormData] = useState({
    name: '',
    type: 'ansiedad',
    description: '',
    duration: 12,
    sessionsPerWeek: 1,
    objectives: [''],
    techniques: [''],
    homework: ['']
  });

  // Efecto para cargar datos iniciales cuando se edita
  React.useEffect(() => {
    if (isEditing && initialData) {
      setFormData({
        name: initialData.name || '',
        type: initialData.type || 'ansiedad',
        description: initialData.description || '',
        duration: initialData.duration || 12,
        sessionsPerWeek: initialData.sessionsPerWeek || 1,
        objectives: initialData.objectives?.length ? initialData.objectives : [''],
        techniques: initialData.techniques?.length ? initialData.techniques : [''],
        homework: initialData.homework?.length ? initialData.homework : ['']
      });
    } else if (!isEditing) {
      // Reset form when creating new plan
      setFormData({
        name: '',
        type: 'ansiedad',
        description: '',
        duration: 12,
        sessionsPerWeek: 1,
        objectives: [''],
        techniques: [''],
        homework: ['']
      });
    }
  }, [isEditing, initialData, isOpen]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const planTypes = [
    { value: 'ansiedad', label: 'Ansiedad' },
    { value: 'depresion', label: 'Depresión' },
    { value: 'pareja', label: 'Terapia de Pareja' },
    { value: 'trauma', label: 'Trauma' },
    { value: 'adicciones', label: 'Adicciones' },
    { value: 'infantil', label: 'Terapia Infantil' },
    { value: 'familiar', label: 'Terapia Familiar' },
    { value: 'otro', label: 'Otro' }
  ];

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'El nombre del plan es requerido';
    } else if (formData.name.trim().length < 3) {
      newErrors.name = 'El nombre debe tener al menos 3 caracteres';
    }
    
    if (!formData.description.trim()) {
      newErrors.description = 'La descripción es requerida';
    } else if (formData.description.trim().length < 10) {
      newErrors.description = 'La descripción debe tener al menos 10 caracteres';
    } else if (formData.description.trim().length > 2000) {
      newErrors.description = 'La descripción no puede exceder 2000 caracteres';
    }
    
    if (formData.duration < 1 || formData.duration > 104) {
      newErrors.duration = 'La duración debe estar entre 1 y 104 semanas';
    }
    
    if (formData.sessionsPerWeek < 1 || formData.sessionsPerWeek > 7) {
      newErrors.sessionsPerWeek = 'Las sesiones por semana deben estar entre 1 y 7';
    }
    
    const validObjectives = formData.objectives.filter(obj => obj.trim() && obj.trim().length >= 5);
    if (validObjectives.length === 0) {
      newErrors.objectives = 'Debe incluir al menos un objetivo con 5 o más caracteres';
    }
    
    const invalidObjectives = formData.objectives.filter(obj => obj.trim() && obj.trim().length < 5 && obj.trim().length > 0);
    if (invalidObjectives.length > 0) {
      newErrors.objectives = 'Cada objetivo debe tener al menos 5 caracteres';
    }
    
    const validTechniques = formData.techniques.filter(tech => tech.trim() && tech.trim().length >= 3);
    if (validTechniques.length === 0) {
      newErrors.techniques = 'Debe incluir al menos una técnica con 3 o más caracteres';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);
    try {
      const planData = {
        ...formData,
        totalSessions: formData.duration * formData.sessionsPerWeek,
        objectives: formData.objectives.filter(obj => obj.trim()),
        techniques: formData.techniques.filter(tech => tech.trim()),
        homework: formData.homework.filter(hw => hw.trim())
      };
      
      await onSave(planData);
      handleClose();
    } catch (error) {
      setErrors({ submit: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      name: '',
      type: 'ansiedad',
      description: '',
      duration: 12,
      sessionsPerWeek: 1,
      objectives: [''],
      techniques: [''],
      homework: ['']
    });
    setErrors({});
    onClose();
  };

  const addArrayItem = (field) => {
    setFormData(prev => ({
      ...prev,
      [field]: [...prev[field], '']
    }));
  };

  const removeArrayItem = (field, index) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index)
    }));
  };

  const updateArrayItem = (field, index, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].map((item, i) => i === index ? value : item)
    }));
  };

  const moveArrayItem = (field, index, direction) => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= formData[field].length) return;
    
    setFormData(prev => {
      const newArray = [...prev[field]];
      [newArray[index], newArray[newIndex]] = [newArray[newIndex], newArray[index]];
      return {
        ...prev,
        [field]: newArray
      };
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            {isEditing ? 'Editar Plan Terapéutico' : 'Crear Nuevo Plan Terapéutico'}
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Información básica */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nombre del Plan *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.name ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Ej: Plan de Ansiedad Generalizada"
              />
              {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo de Plan *
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {planTypes.map(type => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Descripción *
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.description ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Describe el propósito y enfoque del plan terapéutico..."
            />
            {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description}</p>}
          </div>

          {/* Duración y frecuencia */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Duración (semanas) *
              </label>
              <input
                type="number"
                min="1"
                max="52"
                value={formData.duration}
                onChange={(e) => setFormData(prev => ({ ...prev, duration: parseInt(e.target.value) || 1 }))}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.duration ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.duration && <p className="text-red-500 text-sm mt-1">{errors.duration}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sesiones por semana *
              </label>
              <input
                type="number"
                min="1"
                max="7"
                value={formData.sessionsPerWeek}
                onChange={(e) => setFormData(prev => ({ ...prev, sessionsPerWeek: parseInt(e.target.value) || 1 }))}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.sessionsPerWeek ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.sessionsPerWeek && <p className="text-red-500 text-sm mt-1">{errors.sessionsPerWeek}</p>}
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600">
              <strong>Total de sesiones:</strong> {formData.duration * formData.sessionsPerWeek} sesiones
            </p>
          </div>

          {/* Objetivos */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Objetivos del Plan *
            </label>
            {formData.objectives.map((objective, index) => (
              <div key={index} className="flex gap-2 mb-2">
                <div className="flex flex-col gap-1">
                  <button
                    type="button"
                    onClick={() => moveArrayItem('objectives', index, 'up')}
                    disabled={index === 0}
                    className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    title="Mover arriba"
                  >
                    <ChevronUp className="w-3 h-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => moveArrayItem('objectives', index, 'down')}
                    disabled={index === formData.objectives.length - 1}
                    className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    title="Mover abajo"
                  >
                    <ChevronDown className="w-3 h-3" />
                  </button>
                </div>
                <input
                  type="text"
                  value={objective}
                  onChange={(e) => updateArrayItem('objectives', index, e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ej: Reducir niveles de ansiedad"
                />
                {formData.objectives.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeArrayItem('objectives', index)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={() => addArrayItem('objectives')}
              className="flex items-center gap-2 text-blue-600 hover:text-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Agregar objetivo
            </button>
            {errors.objectives && <p className="text-red-500 text-sm mt-1">{errors.objectives}</p>}
          </div>

          {/* Técnicas */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Técnicas Terapéuticas *
            </label>
            {formData.techniques.map((technique, index) => (
              <div key={index} className="flex gap-2 mb-2">
                <div className="flex flex-col gap-1">
                  <button
                    type="button"
                    onClick={() => moveArrayItem('techniques', index, 'up')}
                    disabled={index === 0}
                    className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    title="Mover arriba"
                  >
                    <ChevronUp className="w-3 h-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => moveArrayItem('techniques', index, 'down')}
                    disabled={index === formData.techniques.length - 1}
                    className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    title="Mover abajo"
                  >
                    <ChevronDown className="w-3 h-3" />
                  </button>
                </div>
                <input
                  type="text"
                  value={technique}
                  onChange={(e) => updateArrayItem('techniques', index, e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ej: Terapia Cognitivo-Conductual"
                />
                {formData.techniques.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeArrayItem('techniques', index)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={() => addArrayItem('techniques')}
              className="flex items-center gap-2 text-blue-600 hover:text-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Agregar técnica
            </button>
            {errors.techniques && <p className="text-red-500 text-sm mt-1">{errors.techniques}</p>}
          </div>

          {/* Tareas */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tareas para Casa
            </label>
            {formData.homework.map((hw, index) => (
              <div key={index} className="flex gap-2 mb-2">
                <div className="flex flex-col gap-1">
                  <button
                    type="button"
                    onClick={() => moveArrayItem('homework', index, 'up')}
                    disabled={index === 0}
                    className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    title="Mover arriba"
                  >
                    <ChevronUp className="w-3 h-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => moveArrayItem('homework', index, 'down')}
                    disabled={index === formData.homework.length - 1}
                    className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    title="Mover abajo"
                  >
                    <ChevronDown className="w-3 h-3" />
                  </button>
                </div>
                <input
                  type="text"
                  value={hw}
                  onChange={(e) => updateArrayItem('homework', index, e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ej: Diario de pensamientos"
                />
                {formData.homework.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeArrayItem('homework', index)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={() => addArrayItem('homework')}
              className="flex items-center gap-2 text-blue-600 hover:text-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Agregar tarea
            </button>
          </div>

          {errors.submit && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-600 text-sm">{errors.submit}</p>
            </div>
          )}

          {/* Botones */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading}
            >
              {loading 
                ? (isEditing ? 'Guardando...' : 'Creando...') 
                : (isEditing ? 'Guardar Cambios' : 'Crear Plan')
              }
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};