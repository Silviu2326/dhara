 import React, { useState } from 'react';
import { Card } from '../../../components/Card';
import { Button } from '../../../components/Button';
import { MapPin, Phone, Mail, Clock } from 'lucide-react';

const WorkLocationsManager = ({ locations = [], onChange, isEditing, editButton = null }) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingLocation, setEditingLocation] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    city: '',
    postalCode: '',
    phone: '',
    email: '',
    schedule: {
      monday: { enabled: false, start: '09:00', end: '17:00' },
      tuesday: { enabled: false, start: '09:00', end: '17:00' },
      wednesday: { enabled: false, start: '09:00', end: '17:00' },
      thursday: { enabled: false, start: '09:00', end: '17:00' },
      friday: { enabled: false, start: '09:00', end: '17:00' },
      saturday: { enabled: false, start: '09:00', end: '14:00' },
      sunday: { enabled: false, start: '09:00', end: '14:00' }
    },
    isPrimary: false
  });

  const daysOfWeek = [
    { key: 'monday', label: 'Lunes' },
    { key: 'tuesday', label: 'Martes' },
    { key: 'wednesday', label: 'Miércoles' },
    { key: 'thursday', label: 'Jueves' },
    { key: 'friday', label: 'Viernes' },
    { key: 'saturday', label: 'Sábado' },
    { key: 'sunday', label: 'Domingo' }
  ];

  const resetForm = () => {
    setFormData({
      name: '',
      address: '',
      city: '',
      postalCode: '',
      phone: '',
      email: '',
      schedule: {
        monday: { enabled: false, start: '09:00', end: '17:00' },
        tuesday: { enabled: false, start: '09:00', end: '17:00' },
        wednesday: { enabled: false, start: '09:00', end: '17:00' },
        thursday: { enabled: false, start: '09:00', end: '17:00' },
        friday: { enabled: false, start: '09:00', end: '17:00' },
        saturday: { enabled: false, start: '09:00', end: '14:00' },
        sunday: { enabled: false, start: '09:00', end: '14:00' }
      },
      isPrimary: false
    });
    setEditingLocation(null);
    setShowAddForm(false);
  };

  const handleAddLocation = () => {
    setFormData({
      name: '',
      address: '',
      city: '',
      postalCode: '',
      phone: '',
      email: '',
      schedule: {
        monday: { enabled: false, start: '09:00', end: '17:00' },
        tuesday: { enabled: false, start: '09:00', end: '17:00' },
        wednesday: { enabled: false, start: '09:00', end: '17:00' },
        thursday: { enabled: false, start: '09:00', end: '17:00' },
        friday: { enabled: false, start: '09:00', end: '17:00' },
        saturday: { enabled: false, start: '09:00', end: '14:00' },
        sunday: { enabled: false, start: '09:00', end: '14:00' }
      },
      isPrimary: false
    });
    setEditingLocation(null);
    setShowAddForm(true);
  };

  const handleEditLocation = (location) => {
    setFormData(location);
    setEditingLocation(location.id);
    setShowAddForm(true);
  };

  const handleSaveLocation = () => {
    if (!formData.name.trim() || !formData.address.trim() || !formData.city.trim()) {
      alert('Por favor, completa los campos obligatorios: nombre, dirección y ciudad.');
      return;
    }

    const newLocation = {
      ...formData,
      id: editingLocation || Date.now()
    };

    let updatedLocations;
    if (editingLocation) {
      updatedLocations = locations.map(loc => 
        loc.id === editingLocation ? newLocation : loc
      );
    } else {
      updatedLocations = [...locations, newLocation];
    }

    // Si se marca como principal, desmarcar las demás
    if (newLocation.isPrimary) {
      updatedLocations = updatedLocations.map(loc => ({
        ...loc,
        isPrimary: loc.id === newLocation.id
      }));
    }

    onChange(updatedLocations);
    resetForm();
  };

  const handleDeleteLocation = (locationId) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar esta ubicación?')) {
      const updatedLocations = locations.filter(loc => loc.id !== locationId);
      onChange(updatedLocations);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleScheduleChange = (day, field, value) => {
    setFormData(prev => ({
      ...prev,
      schedule: {
        ...prev.schedule,
        [day]: {
          ...prev.schedule[day],
          [field]: value
        }
      }
    }));
  };

  const formatAddress = (address) => {
    if (typeof address === 'string') {
      return address;
    }
    if (typeof address === 'object' && address) {
      const parts = [];
      if (address.street) parts.push(address.street);
      if (address.number) parts.push(address.number);
      if (address.floor) parts.push(`, ${address.floor}`);
      if (address.apartment) parts.push(`, ${address.apartment}`);
      return parts.join(' ').trim();
    }
    return '';
  };

  const getActiveSchedule = (schedule) => {
    if (!schedule || typeof schedule !== 'object') {
      return 'Sin horario definido';
    }

    const activeDays = Object.entries(schedule)
      .filter(([_, dayData]) => dayData && dayData.enabled)
      .map(([day, dayData]) => {
        const dayLabel = daysOfWeek.find(d => d.key === day)?.label;
        return `${dayLabel}: ${dayData.start}-${dayData.end}`;
      });
    return activeDays.length > 0 ? activeDays.join(', ') : 'Sin horario definido';
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-deep">Ubicaciones de Trabajo</h3>
          <p className="text-sm text-gray-600 mt-1">
            Gestiona los diferentes centros donde ofreces tus servicios
          </p>
        </div>
        <div className="flex items-center gap-2">
          {editButton}
          {isEditing && (
            <Button
              onClick={handleAddLocation}
              className="bg-sage text-white hover:bg-sage/90"
            >
              + Agregar Ubicación
            </Button>
          )}
        </div>
      </div>

      {/* Lista de ubicaciones */}
      <div className="space-y-3">
        {Array.isArray(locations) && locations.map((location) => (
          <div key={location.id} className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h4 className="font-medium text-deep">{location.name || 'Sin nombre'}</h4>
                  {location.isPrimary && (
                    <span className="bg-sage text-white text-xs px-2 py-1 rounded-full">
                      Principal
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-600 mb-1">
                  <MapPin className="h-4 w-4 inline" /> {formatAddress(location.address)}, {location.city || ''} {location.postalCode || ''}
                </p>
                {location.phone && (
                  <p className="text-sm text-gray-600 mb-1"><Phone className="h-4 w-4 inline" /> {location.phone}</p>
                )}
                {location.email && (
                  <p className="text-sm text-gray-600 mb-1"><Mail className="h-4 w-4 inline" /> {location.email}</p>
                )}
                <p className="text-sm text-gray-500">
                  <Clock className="h-4 w-4 inline" /> {getActiveSchedule(location.schedule)}
                </p>
              </div>
              {isEditing && (
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEditLocation(location)}
                    className="text-sage hover:text-sage/80 text-sm"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => handleDeleteLocation(location.id)}
                    className="text-red-600 hover:text-red-800 text-sm"
                  >
                    Eliminar
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}

        {(!Array.isArray(locations) || locations.length === 0) && (
          <div className="text-center py-8 text-gray-500">
            <p>No hay ubicaciones configuradas</p>
            {isEditing && (
              <p className="text-sm mt-1">Haz clic en "Agregar Ubicación" para comenzar</p>
            )}
          </div>
        )}
      </div>

      {/* Formulario de agregar/editar */}
      {showAddForm && isEditing && (
        <div className="border border-gray-200 rounded-lg p-6 bg-gray-50">
          <h4 className="font-medium text-deep mb-4">
            {editingLocation ? 'Editar Ubicación' : 'Nueva Ubicación'}
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre del Centro *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sage focus:border-transparent"
                placeholder="Ej: Centro de Psicología Valencia"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Teléfono
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sage focus:border-transparent"
                placeholder="Ej: +34 963 123 456"
              />
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Dirección *
            </label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => handleInputChange('address', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sage focus:border-transparent"
              placeholder="Ej: Calle Mayor, 123, 2º A"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ciudad *
              </label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => handleInputChange('city', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sage focus:border-transparent"
                placeholder="Ej: Valencia"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Código Postal
              </label>
              <input
                type="text"
                value={formData.postalCode}
                onChange={(e) => handleInputChange('postalCode', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sage focus:border-transparent"
                placeholder="Ej: 46001"
              />
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email de contacto
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sage focus:border-transparent"
              placeholder="Ej: contacto@centro.com"
            />
          </div>

          <div className="mb-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.isPrimary}
                onChange={(e) => handleInputChange('isPrimary', e.target.checked)}
                className="mr-2"
              />
              <span className="text-sm text-gray-700">Marcar como ubicación principal</span>
            </label>
          </div>

          {/* Horarios */}
          <div className="mb-6">
            <h5 className="font-medium text-gray-700 mb-3">Horarios de Atención</h5>
            <div className="space-y-2">
              {daysOfWeek.map((day) => (
                <div key={day.key} className="flex items-center gap-4">
                  <label className="flex items-center min-w-[100px]">
                    <input
                      type="checkbox"
                      checked={formData.schedule[day.key].enabled}
                      onChange={(e) => handleScheduleChange(day.key, 'enabled', e.target.checked)}
                      className="mr-2"
                    />
                    <span className="text-sm">{day.label}</span>
                  </label>
                  
                  {formData.schedule[day.key].enabled && (
                    <div className="flex items-center gap-2">
                      <input
                        type="time"
                        value={formData.schedule[day.key].start}
                        onChange={(e) => handleScheduleChange(day.key, 'start', e.target.value)}
                        className="px-2 py-1 border border-gray-300 rounded text-sm"
                      />
                      <span className="text-sm text-gray-500">a</span>
                      <input
                        type="time"
                        value={formData.schedule[day.key].end}
                        onChange={(e) => handleScheduleChange(day.key, 'end', e.target.value)}
                        className="px-2 py-1 border border-gray-300 rounded text-sm"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              onClick={handleSaveLocation}
              className="bg-sage text-white hover:bg-sage/90"
            >
              {editingLocation ? 'Actualizar' : 'Guardar'} Ubicación
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

export { WorkLocationsManager };