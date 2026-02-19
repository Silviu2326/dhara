import React, { useState } from 'react';
import { Button } from '../../../components/Button';
import { MapPin, Briefcase } from 'lucide-react';

const WorkExperience = ({ experiences = [], onChange, isEditing, editButton = null }) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingExperience, setEditingExperience] = useState(null);
  const [formData, setFormData] = useState({
    position: '',
    company: '',
    location: '',
    startDate: '',
    endDate: '',
    isCurrent: false,
    description: '',
    achievements: []
  });

  const resetForm = () => {
    setFormData({
      position: '',
      company: '',
      location: '',
      startDate: '',
      endDate: '',
      isCurrent: false,
      description: '',
      achievements: []
    });
    setEditingExperience(null);
    setShowAddForm(false);
  };

  const handleAddExperience = () => {
    setFormData({
      position: '',
      company: '',
      location: '',
      startDate: '',
      endDate: '',
      isCurrent: false,
      description: '',
      achievements: []
    });
    setEditingExperience(null);
    setShowAddForm(true);
  };

  const handleEditExperience = (experience) => {
    setFormData(experience);
    setEditingExperience(experience.id);
    setShowAddForm(true);
  };

  const handleSaveExperience = () => {
    if (!formData.position.trim() || !formData.company.trim() || !formData.startDate) {
      alert('Por favor, completa los campos obligatorios: puesto, empresa y fecha de inicio.');
      return;
    }

    if (!formData.isCurrent && !formData.endDate) {
      alert('Por favor, especifica la fecha de fin o marca como trabajo actual.');
      return;
    }

    const newExperience = {
      ...formData,
      id: editingExperience || Date.now(),
      endDate: formData.isCurrent ? null : formData.endDate
    };

    let updatedExperiences;
    if (editingExperience) {
      updatedExperiences = experiences.map(exp => 
        exp.id === editingExperience ? newExperience : exp
      );
    } else {
      updatedExperiences = [...experiences, newExperience];
    }

    // Ordenar por fecha de inicio (más reciente primero)
    updatedExperiences.sort((a, b) => {
      const dateA = new Date(a.startDate);
      const dateB = new Date(b.startDate);
      return dateB - dateA;
    });

    onChange(updatedExperiences);
    resetForm();
  };

  const handleDeleteExperience = (experienceId) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar esta experiencia?')) {
      const updatedExperiences = experiences.filter(exp => exp.id !== experienceId);
      onChange(updatedExperiences);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleAddAchievement = () => {
    setFormData(prev => ({
      ...prev,
      achievements: [...prev.achievements, '']
    }));
  };

  const handleUpdateAchievement = (index, value) => {
    setFormData(prev => ({
      ...prev,
      achievements: prev.achievements.map((achievement, i) => 
        i === index ? value : achievement
      )
    }));
  };

  const handleRemoveAchievement = (index) => {
    setFormData(prev => ({
      ...prev,
      achievements: prev.achievements.filter((_, i) => i !== index)
    }));
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', { 
      year: 'numeric', 
      month: 'long'
    });
  };

  const calculateDuration = (startDate, endDate) => {
    const start = new Date(startDate);
    const end = endDate ? new Date(endDate) : new Date();
    
    const diffTime = Math.abs(end - start);
    const diffMonths = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 30));
    
    if (diffMonths < 12) {
      return `${diffMonths} ${diffMonths === 1 ? 'mes' : 'meses'}`;
    } else {
      const years = Math.floor(diffMonths / 12);
      const months = diffMonths % 12;
      let duration = `${years} ${years === 1 ? 'año' : 'años'}`;
      if (months > 0) {
        duration += ` y ${months} ${months === 1 ? 'mes' : 'meses'}`;
      }
      return duration;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-deep">Experiencia Profesional</h3>
          <p className="text-sm text-gray-600 mt-1">
            Agrega tu historial laboral y logros profesionales
          </p>
        </div>
        <div className="flex items-center gap-2">
          {editButton}
          {isEditing && (
            <Button
              onClick={handleAddExperience}
              className="bg-sage text-white hover:bg-sage/90"
            >
              + Agregar Experiencia
            </Button>
          )}
        </div>
      </div>

      {/* Lista de experiencias */}
      <div className="space-y-4">
        {experiences.map((experience, index) => (
          <div key={experience.id} className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-semibold text-deep">{experience.position}</h4>
                  {experience.isCurrent && (
                    <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                      Actual
                    </span>
                  )}
                </div>
                <p className="text-sage font-medium mb-1">{experience.company}</p>
                {experience.location && (
                  <p className="text-sm text-gray-600 mb-2"><MapPin className="h-4 w-4 inline" /> {experience.location}</p>
                )}
                <p className="text-sm text-gray-500 mb-3">
                  {formatDate(experience.startDate)} - {experience.isCurrent ? 'Presente' : formatDate(experience.endDate)}
                  <span className="ml-2 text-gray-400">
                    ({calculateDuration(experience.startDate, experience.endDate)})
                  </span>
                </p>
                
                {experience.description && (
                  <p className="text-sm text-gray-700 mb-3">{experience.description}</p>
                )}
                
                {experience.achievements && experience.achievements.length > 0 && (
                  <div>
                    <h5 className="text-sm font-medium text-gray-700 mb-2">Logros destacados:</h5>
                    <ul className="list-disc list-inside space-y-1">
                      {experience.achievements.map((achievement, achievementIndex) => (
                        <li key={achievementIndex} className="text-sm text-gray-600">
                          {achievement}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
              
              {isEditing && (
                <div className="flex gap-2 ml-4">
                  <button
                    onClick={() => handleEditExperience(experience)}
                    className="text-sage hover:text-sage/80 text-sm"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => handleDeleteExperience(experience.id)}
                    className="text-red-600 hover:text-red-800 text-sm"
                  >
                    Eliminar
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}

        {experiences.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <div className="mx-auto w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
              <Briefcase className="h-6 w-6 text-gray-400" />
            </div>
            <p>No hay experiencias registradas</p>
            {isEditing && (
              <p className="text-sm mt-1">Haz clic en "Agregar Experiencia" para comenzar</p>
            )}
          </div>
        )}
      </div>

      {/* Formulario de agregar/editar */}
      {showAddForm && isEditing && (
        <div className="border border-gray-200 rounded-lg p-6 bg-gray-50">
          <h4 className="font-medium text-deep mb-4">
            {editingExperience ? 'Editar Experiencia' : 'Nueva Experiencia'}
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Puesto *
              </label>
              <input
                type="text"
                value={formData.position}
                onChange={(e) => handleInputChange('position', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sage focus:border-transparent"
                placeholder="Ej: Psicólogo Clínico Senior"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Empresa *
              </label>
              <input
                type="text"
                value={formData.company}
                onChange={(e) => handleInputChange('company', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sage focus:border-transparent"
                placeholder="Ej: Hospital Universitario La Fe"
              />
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Ubicación
            </label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) => handleInputChange('location', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sage focus:border-transparent"
              placeholder="Ej: Valencia, España"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fecha de Inicio *
              </label>
              <input
                type="month"
                value={formData.startDate}
                onChange={(e) => handleInputChange('startDate', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sage focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fecha de Fin
              </label>
              <input
                type="month"
                value={formData.endDate}
                onChange={(e) => handleInputChange('endDate', e.target.value)}
                disabled={formData.isCurrent}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sage focus:border-transparent disabled:bg-gray-100"
              />
            </div>
          </div>

          <div className="mb-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.isCurrent}
                onChange={(e) => {
                  handleInputChange('isCurrent', e.target.checked);
                  if (e.target.checked) {
                    handleInputChange('endDate', '');
                  }
                }}
                className="mr-2"
              />
              <span className="text-sm text-gray-700">Trabajo actual</span>
            </label>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Descripción
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sage focus:border-transparent"
              placeholder="Describe tus responsabilidades y funciones principales..."
            />
          </div>

          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Logros Destacados
              </label>
              <Button
                onClick={handleAddAchievement}
                variant="outline"
                className="text-xs"
              >
                + Agregar Logro
              </Button>
            </div>
            
            <div className="space-y-2">
              {formData.achievements.map((achievement, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    type="text"
                    value={achievement}
                    onChange={(e) => handleUpdateAchievement(index, e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sage focus:border-transparent"
                    placeholder="Ej: Implementé un nuevo protocolo que redujo los tiempos de espera en un 30%"
                  />
                  <button
                    onClick={() => handleRemoveAchievement(index)}
                    className="text-red-600 hover:text-red-800 px-2"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              onClick={handleSaveExperience}
              className="bg-sage text-white hover:bg-sage/90"
            >
              {editingExperience ? 'Actualizar' : 'Guardar'} Experiencia
            </Button>
            <Button
              onClick={resetForm}
              variant="outline"
            >
              Cancelar
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export { WorkExperience };