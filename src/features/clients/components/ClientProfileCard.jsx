import React from 'react';
import { 
  PencilIcon, 
  EnvelopeIcon, 
  PhoneIcon, 
  MapPinIcon, 
  CalendarIcon,
  UserIcon,
  TagIcon,
  PlusIcon,
  ChatBubbleLeftIcon,
  DocumentArrowUpIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
import { Button } from '../../../components/Button';

const formatDate = (dateString) => {
  if (!dateString) return 'No especificado';
  return new Date(dateString).toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

const calculateAge = (birthDate) => {
  if (!birthDate) return null;
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  
  return age;
};

const getStatusBadge = (status) => {
  const statusConfig = {
    active: { label: 'Activo', color: 'bg-green-100 text-green-800' },
    inactive: { label: 'Inactivo', color: 'bg-gray-100 text-gray-800' },
    demo: { label: 'Demo', color: 'bg-blue-100 text-blue-800' }
  };
  
  const config = statusConfig[status] || statusConfig.inactive;
  
  return (
    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
      {config.label}
    </span>
  );
};

const TagBadge = ({ tag, onRemove }) => {
  const tagColors = {
    ansiedad: 'bg-red-100 text-red-800',
    depresion: 'bg-blue-100 text-blue-800',
    pareja: 'bg-pink-100 text-pink-800',
    estres: 'bg-orange-100 text-orange-800',
    trauma: 'bg-purple-100 text-purple-800',
    autoestima: 'bg-green-100 text-green-800',
    duelo: 'bg-gray-100 text-gray-800',
    adicciones: 'bg-yellow-100 text-yellow-800',
    tca: 'bg-indigo-100 text-indigo-800',
    infantil: 'bg-cyan-100 text-cyan-800',
    adolescentes: 'bg-teal-100 text-teal-800',
    familiar: 'bg-rose-100 text-rose-800'
  };
  
  const colorClass = tagColors[tag.id] || 'bg-gray-100 text-gray-800';
  
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium ${colorClass}`}>
      {tag.label || tag.id}
      {onRemove && (
        <button
          onClick={() => onRemove(tag.id)}
          className="hover:bg-black hover:bg-opacity-10 rounded-full p-0.5"
        >
          ×
        </button>
      )}
    </span>
  );
};

export const ClientProfileCard = ({ 
  client, 
  onEdit, 
  onNewBooking, 
  onUploadDocument, 
  onDelete 
}) => {
  const age = calculateAge(client.birthDate);
  
  return (
    <div className="space-y-6">
      {/* Header con avatar y acciones principales */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-6">
            <div className="relative">
              {client.avatar ? (
                <img 
                  className="h-20 w-20 rounded-full object-cover" 
                  src={client.avatar} 
                  alt={client.name} 
                />
              ) : (
                <div className="h-20 w-20 rounded-full bg-gray-300 flex items-center justify-center">
                  <span className="text-2xl font-medium text-gray-700">
                    {client.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                  </span>
                </div>
              )}
              <div className="absolute -bottom-1 -right-1">
                {getStatusBadge(client.status)}
              </div>
            </div>
            
            <div>
              <h3 className="text-2xl font-bold text-gray-900">{client.name}</h3>
              <p className="text-sm text-gray-500 mt-1">Cliente desde {formatDate(client.createdAt)}</p>
              <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                <span>{client.sessionCount || 0} sesiones</span>
                <span>•</span>
                <span>Última sesión: {formatDate(client.lastSession)}</span>
              </div>
            </div>
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={onEdit}
            className="flex items-center gap-2"
          >
            <PencilIcon className="h-4 w-4" />
            Editar
          </Button>
        </div>
      </div>

      {/* Información de contacto */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h4 className="text-lg font-semibold text-gray-900 mb-4">Información de contacto</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center gap-3">
            <EnvelopeIcon className="h-5 w-5 text-gray-400" />
            <div>
              <p className="text-sm font-medium text-gray-900">Email</p>
              <p className="text-sm text-gray-600">{client.email}</p>
            </div>
          </div>
          
          {client.phone && (
            <div className="flex items-center gap-3">
              <PhoneIcon className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm font-medium text-gray-900">Teléfono</p>
                <p className="text-sm text-gray-600">{client.phone}</p>
              </div>
            </div>
          )}
          
          {client.address && (
            <div className="flex items-center gap-3">
              <MapPinIcon className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm font-medium text-gray-900">Dirección</p>
                <p className="text-sm text-gray-600">{client.address}</p>
              </div>
            </div>
          )}
          
          {client.birthDate && (
            <div className="flex items-center gap-3">
              <CalendarIcon className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm font-medium text-gray-900">Fecha de nacimiento</p>
                <p className="text-sm text-gray-600">
                  {formatDate(client.birthDate)}
                  {age && ` (${age} años)`}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Información adicional */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h4 className="text-lg font-semibold text-gray-900 mb-4">Información adicional</h4>
        <div className="space-y-4">
          {client.gender && (
            <div className="flex items-center gap-3">
              <UserIcon className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm font-medium text-gray-900">Género</p>
                <p className="text-sm text-gray-600">{client.gender}</p>
              </div>
            </div>
          )}
          
          {client.occupation && (
            <div>
              <p className="text-sm font-medium text-gray-900 mb-1">Ocupación</p>
              <p className="text-sm text-gray-600">{client.occupation}</p>
            </div>
          )}
          
          {client.emergencyContact && (
            <div>
              <p className="text-sm font-medium text-gray-900 mb-1">Contacto de emergencia</p>
              <p className="text-sm text-gray-600">
                {client.emergencyContact.name} - {client.emergencyContact.phone}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Tags */}
      {client.tags && client.tags.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <TagIcon className="h-5 w-5" />
              Tags de terapia
            </h4>
          </div>
          <div className="flex flex-wrap gap-2">
            {client.tags.map((tag) => (
              <TagBadge key={tag.id} tag={tag} />
            ))}
          </div>
        </div>
      )}

      {/* Notas del perfil */}
      {client.profileNotes && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">Notas del perfil</h4>
          <p className="text-sm text-gray-600 whitespace-pre-wrap">{client.profileNotes}</p>
        </div>
      )}

      {/* Acciones rápidas */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h4 className="text-lg font-semibold text-gray-900 mb-4">Acciones rápidas</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onNewBooking(client)}
            className="flex items-center gap-2"
          >
            <PlusIcon className="h-4 w-4" />
            Nueva cita
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => {/* Implementar chat */}}
            className="flex items-center gap-2"
          >
            <ChatBubbleLeftIcon className="h-4 w-4" />
            Abrir chat
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => onUploadDocument(client)}
            className="flex items-center gap-2"
          >
            <DocumentArrowUpIcon className="h-4 w-4" />
            Subir doc
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => onDelete(client)}
            className="flex items-center gap-2 text-red-600 border-red-300 hover:bg-red-50"
          >
            <TrashIcon className="h-4 w-4" />
            Eliminar
          </Button>
        </div>
      </div>
    </div>
  );
};