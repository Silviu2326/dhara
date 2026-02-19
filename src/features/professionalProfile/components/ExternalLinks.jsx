import React, { useState } from 'react';
import { Button } from '../../../components/Button';
import { Globe, Edit, Briefcase, Camera, BookOpen, Twitter, Youtube, Music, Link, ExternalLink } from 'lucide-react';

const ExternalLinks = ({ links = [], onChange, isEditing, editButton = null }) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingLink, setEditingLink] = useState(null);
  const [formData, setFormData] = useState({
    type: 'website',
    label: '',
    url: ''
  });

  const linkTypes = [
    { value: 'website', label: 'Página Web', icon: Globe, placeholder: 'https://mipaginaweb.com' },
    { value: 'blog', label: 'Blog', icon: Edit, placeholder: 'https://miblog.com' },
    { value: 'linkedin', label: 'LinkedIn', icon: Briefcase, placeholder: 'https://linkedin.com/in/usuario' },
    { value: 'instagram', label: 'Instagram', icon: Camera, placeholder: 'https://instagram.com/usuario' },
    { value: 'facebook', label: 'Facebook', icon: BookOpen, placeholder: 'https://facebook.com/usuario' },
    { value: 'twitter', label: 'Twitter/X', icon: Twitter, placeholder: 'https://twitter.com/usuario' },
    { value: 'youtube', label: 'YouTube', icon: Youtube, placeholder: 'https://youtube.com/c/usuario' },
    { value: 'tiktok', label: 'TikTok', icon: Music, placeholder: 'https://tiktok.com/@usuario' },
    { value: 'other', label: 'Otro', icon: Link, placeholder: 'https://ejemplo.com' }
  ];

  const resetForm = () => {
    setFormData({ type: 'website', label: '', url: '' });
    setEditingLink(null);
    setShowAddForm(false);
  };

  const handleAddLink = () => {
    setFormData({ type: 'website', label: '', url: '' });
    setEditingLink(null);
    setShowAddForm(true);
  };

  const handleEditLink = (link) => {
    setFormData(link);
    setEditingLink(link.id);
    setShowAddForm(true);
  };

  const handleSaveLink = () => {
    if (!formData.url.trim()) {
      alert('Por favor, ingresa una URL válida.');
      return;
    }

    // Validar formato de URL
    try {
      new URL(formData.url);
    } catch {
      alert('Por favor, ingresa una URL válida (debe incluir http:// o https://)');
      return;
    }

    const selectedType = linkTypes.find(type => type.value === formData.type);
    const newLink = {
      ...formData,
      id: editingLink || Date.now(),
      label: formData.label.trim() || selectedType.label
    };

    let updatedLinks;
    if (editingLink) {
      updatedLinks = links.map(link => 
        link.id === editingLink ? newLink : link
      );
    } else {
      updatedLinks = [...links, newLink];
    }

    onChange(updatedLinks);
    resetForm();
  };

  const handleDeleteLink = (linkId) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este enlace?')) {
      const updatedLinks = links.filter(link => link.id !== linkId);
      onChange(updatedLinks);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const getLinkIcon = (type) => {
    const linkType = linkTypes.find(t => t.value === type);
    const IconComponent = linkType ? linkType.icon : Link;
    return <IconComponent className="h-4 w-4" />;
  };

  const getLinkLabel = (type) => {
    const linkType = linkTypes.find(t => t.value === type);
    return linkType ? linkType.label : 'Enlace';
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-deep">Enlaces Externos</h3>
          <p className="text-sm text-gray-600 mt-1">
            Agrega enlaces a tus redes sociales, página web o blog profesional
          </p>
        </div>
        <div className="flex items-center gap-2">
          {editButton}
          {isEditing && (
            <Button
              onClick={handleAddLink}
              className="bg-sage text-white hover:bg-sage/90"
            >
              + Agregar Enlace
            </Button>
          )}
        </div>
      </div>

      {/* Lista de enlaces */}
      <div className="space-y-3">
        {links.map((link) => (
          <div key={link.id} className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{getLinkIcon(link.type)}</span>
                <div>
                  <h4 className="font-medium text-deep">{link.label}</h4>
                  <a 
                    href={link.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-sm text-sage hover:text-sage/80 break-all"
                  >
                    {link.url}
                  </a>
                </div>
              </div>
              {isEditing && (
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEditLink(link)}
                    className="text-sage hover:text-sage/80 text-sm"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => handleDeleteLink(link.id)}
                    className="text-red-600 hover:text-red-800 text-sm"
                  >
                    Eliminar
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}

        {links.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <div className="mx-auto w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
              <ExternalLink className="h-6 w-6 text-gray-400" />
            </div>
            <p>No hay enlaces configurados</p>
            {isEditing && (
              <p className="text-sm mt-1">Haz clic en "Agregar Enlace" para comenzar</p>
            )}
          </div>
        )}
      </div>

      {/* Formulario de agregar/editar */}
      {showAddForm && isEditing && (
        <div className="border border-gray-200 rounded-lg p-6 bg-gray-50">
          <h4 className="font-medium text-deep mb-4">
            {editingLink ? 'Editar Enlace' : 'Nuevo Enlace'}
          </h4>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tipo de Enlace
              </label>
              <select
                value={formData.type}
                onChange={(e) => handleInputChange('type', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sage focus:border-transparent"
              >
                {linkTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Etiqueta Personalizada (opcional)
              </label>
              <input
                type="text"
                value={formData.label}
                onChange={(e) => handleInputChange('label', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sage focus:border-transparent"
                placeholder={`Ej: Mi ${getLinkLabel(formData.type)}`}
              />
              <p className="text-xs text-gray-500 mt-1">
                Si no especificas una etiqueta, se usará "{getLinkLabel(formData.type)}"
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                URL *
              </label>
              <input
                type="url"
                value={formData.url}
                onChange={(e) => handleInputChange('url', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sage focus:border-transparent"
                placeholder={linkTypes.find(t => t.value === formData.type)?.placeholder || 'https://ejemplo.com'}
              />
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <Button
              onClick={handleSaveLink}
              className="bg-sage text-white hover:bg-sage/90"
            >
              {editingLink ? 'Actualizar' : 'Guardar'} Enlace
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

export { ExternalLinks };