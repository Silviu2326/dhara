import React from 'react';
import { 
  EyeIcon, 
  ChatBubbleLeftIcon, 
  PlusIcon, 
  DocumentArrowUpIcon, 
  TrashIcon,
  StarIcon,
  CalendarIcon,
  EnvelopeIcon,
  PhoneIcon,
  WindowIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';

const formatDate = (dateString) => {
  if (!dateString) return 'Nunca';
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now - date);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 1) return 'Ayer';
  if (diffDays < 7) return `Hace ${diffDays} días`;
  if (diffDays < 30) return `Hace ${Math.ceil(diffDays / 7)} semanas`;
  if (diffDays < 365) return `Hace ${Math.ceil(diffDays / 30)} meses`;
  
  return date.toLocaleDateString('es-ES', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  });
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

const RatingStars = ({ rating, size = 'sm' }) => {
  const sizeClasses = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4'
  };
  
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <div key={star}>
          {star <= rating ? (
            <StarIconSolid className={`${sizeClasses[size]} text-yellow-400`} />
          ) : (
            <StarIcon className={`${sizeClasses[size]} text-gray-300`} />
          )}
        </div>
      ))}
      <span className="ml-1 text-xs text-gray-600">({rating || 0})</span>
    </div>
  );
};

const ActionButton = ({ icon: Icon, onClick, tooltip, variant = 'default', disabled = false }) => {
  const variants = {
    default: 'text-gray-400 hover:text-gray-600',
    primary: 'text-primary hover:text-primary-dark',
    success: 'text-green-600 hover:text-green-700',
    danger: 'text-red-600 hover:text-red-700'
  };
  
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={tooltip}
      className={`p-1 rounded-md transition-colors ${variants[variant]} ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-100'}`}
    >
      <Icon className="h-4 w-4" />
    </button>
  );
};

const DesktopRow = ({ 
  client, 
  isSelected, 
  onSelect, 
  onClick, 
  onViewDrawer,
  onChatClick, 
  onNewBookingClick, 
  onUploadDocClick, 
  onDeleteClick 
}) => {
  return (
    <tr className={`hover:bg-gray-50 ${isSelected ? 'bg-blue-50' : ''}`}>
      <td className="px-6 py-4 whitespace-nowrap">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={(e) => onSelect(e.target.checked)}
          className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
        />
      </td>
      
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center cursor-pointer" onClick={onClick}>
          <div className="flex-shrink-0 h-10 w-10">
            {client.avatar ? (
              <img className="h-10 w-10 rounded-full object-cover" src={client.avatar} alt={client.name} />
            ) : (
              <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                <span className="text-sm font-medium text-gray-700">
                  {client.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                </span>
              </div>
            )}
          </div>
          <div className="ml-4">
            <div className="text-sm font-medium text-gray-900">{client.name}</div>
            <div className="text-sm text-gray-500">ID: {client.id}</div>
          </div>
        </div>
      </td>
      
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm text-gray-900">{client.email}</div>
        {client.phone && (
          <div className="text-sm text-gray-500">{client.phone}</div>
        )}
      </td>
      
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm text-gray-900">{formatDate(client.lastSession)}</div>
        {getStatusBadge(client.status)}
      </td>
      
      <td className="px-6 py-4 whitespace-nowrap text-center">
        <span className="text-sm font-medium text-gray-900">{client.sessionCount || 0}</span>
      </td>
      
      <td className="px-6 py-4 whitespace-nowrap">
        <RatingStars rating={client.rating} />
      </td>
      
      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
        <div className="flex items-center gap-1">
          <ActionButton
            icon={EyeIcon}
            onClick={onClick}
            tooltip="Ver página de detalle"
            variant="primary"
          />
          {onViewDrawer && (
            <ActionButton
              icon={WindowIcon}
              onClick={onViewDrawer}
              tooltip="Ver en panel lateral"
              variant="default"
            />
          )}
          <ActionButton
            icon={ChatBubbleLeftIcon}
            onClick={onChatClick}
            tooltip="Abrir chat"
            variant="default"
          />
          <ActionButton
            icon={PlusIcon}
            onClick={onNewBookingClick}
            tooltip="Nueva cita"
            variant="success"
          />
          <ActionButton
            icon={DocumentArrowUpIcon}
            onClick={onUploadDocClick}
            tooltip="Subir documento"
            variant="default"
          />
          <ActionButton
            icon={TrashIcon}
            onClick={onDeleteClick}
            tooltip="Eliminar cliente"
            variant="danger"
          />
        </div>
      </td>
    </tr>
  );
};

const MobileCard = ({ 
  client, 
  isSelected, 
  onSelect, 
  onClick, 
  onViewDrawer,
  onChatClick, 
  onNewBookingClick, 
  onUploadDocClick, 
  onDeleteClick 
}) => {
  return (
    <div className={`p-4 ${isSelected ? 'bg-blue-50' : ''}`}>
      <div className="flex items-start gap-3">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={(e) => onSelect(e.target.checked)}
          className="mt-1 h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
        />
        
        <div className="flex-shrink-0">
          {client.avatar ? (
            <img className="h-12 w-12 rounded-full object-cover" src={client.avatar} alt={client.name} />
          ) : (
            <div className="h-12 w-12 rounded-full bg-gray-300 flex items-center justify-center">
              <span className="text-sm font-medium text-gray-700">
                {client.name.split(' ').map(n => n[0]).join('').toUpperCase()}
              </span>
            </div>
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div className="cursor-pointer" onClick={onClick}>
              <h3 className="text-sm font-medium text-gray-900 truncate">{client.name}</h3>
              <p className="text-sm text-gray-500">ID: {client.id}</p>
            </div>
            {getStatusBadge(client.status)}
          </div>
          
          <div className="mt-2 space-y-1">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <EnvelopeIcon className="h-4 w-4" />
              <span className="truncate">{client.email}</span>
            </div>
            
            {client.phone && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <PhoneIcon className="h-4 w-4" />
                <span>{client.phone}</span>
              </div>
            )}
            
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <CalendarIcon className="h-4 w-4" />
              <span>Última sesión: {formatDate(client.lastSession)}</span>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-600">
                  {client.sessionCount || 0} sesiones
                </span>
                <RatingStars rating={client.rating} size="sm" />
              </div>
            </div>
          </div>
          
          <div className="mt-3 flex items-center gap-2 flex-wrap">
            <ActionButton
              icon={EyeIcon}
              onClick={onClick}
              tooltip="Ver página de detalle"
              variant="primary"
            />
            {onViewDrawer && (
              <ActionButton
                icon={WindowIcon}
                onClick={onViewDrawer}
                tooltip="Ver en panel lateral"
                variant="default"
              />
            )}
            <ActionButton
              icon={ChatBubbleLeftIcon}
              onClick={onChatClick}
              tooltip="Abrir chat"
              variant="default"
            />
            <ActionButton
              icon={PlusIcon}
              onClick={onNewBookingClick}
              tooltip="Nueva cita"
              variant="success"
            />
            <ActionButton
              icon={DocumentArrowUpIcon}
              onClick={onUploadDocClick}
              tooltip="Subir documento"
              variant="default"
            />
            <ActionButton
              icon={TrashIcon}
              onClick={onDeleteClick}
              tooltip="Eliminar cliente"
              variant="danger"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export const ClientRow = ({ variant = 'desktop', ...props }) => {
  return variant === 'desktop' ? (
    <DesktopRow {...props} />
  ) : (
    <MobileCard {...props} />
  );
};