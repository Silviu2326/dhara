import React, { useState } from 'react';
import {
  CalendarIcon,
  ClockIcon,
  VideoCameraIcon,
  ChatBubbleLeftIcon,
  DocumentTextIcon,
  PlusIcon,
  EyeIcon,
  UserIcon
} from '@heroicons/react/24/outline';
import { Button } from '../../../components/Button';

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('es-ES', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

const formatTime = (timeString) => {
  return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit'
  });
};

const getStatusBadge = (status) => {
  const statusConfig = {
    completed: { label: 'Completada', color: 'bg-green-100 text-green-800' },
    scheduled: { label: 'Programada', color: 'bg-blue-100 text-blue-800' },
    cancelled: { label: 'Cancelada', color: 'bg-red-100 text-red-800' },
    no_show: { label: 'No asistió', color: 'bg-yellow-100 text-yellow-800' },
    in_progress: { label: 'En curso', color: 'bg-purple-100 text-purple-800' }
  };

  const config = statusConfig[status] || statusConfig.scheduled;

  return (
    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
      {config.label}
    </span>
  );
};

const getCreatorBadge = (session) => {
  // Si no tiene información del creador, no mostrar badge
  if (!session.creatorDisplay) {
    return null;
  }

  const { icon, color, shortLabel } = session.creatorDisplay;

  return (
    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${color}`} title={`Creada por ${session.createdBy}`}>
      <span className="mr-1">{icon}</span>
      {shortLabel}
    </span>
  );
};

const SessionRow = ({ session, onViewDetails, onJoinMeeting, onViewNotes }) => {
  const isUpcoming = new Date(session.date) > new Date();
  const canJoin = session.status === 'scheduled' && session.meetingLink && isUpcoming;
  
  return (
    <tr className="hover:bg-gray-50">
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center gap-2">
          <CalendarIcon className="h-4 w-4 text-gray-400" />
          <div>
            <div className="text-sm font-medium text-gray-900">
              {formatDate(session.date)}
            </div>
            <div className="text-sm text-gray-500 flex items-center gap-1">
              <ClockIcon className="h-3 w-3" />
              {formatTime(session.startTime)} - {formatTime(session.endTime)}
            </div>
          </div>
        </div>
      </td>
      
      <td className="px-6 py-4 whitespace-nowrap">
        <div>
          <div className="text-sm font-medium text-gray-900">{session.therapyType}</div>
          {session.sessionType && (
            <div className="text-sm text-gray-500">{session.sessionType}</div>
          )}
        </div>
      </td>

      <td className="px-6 py-4 whitespace-nowrap">
        <div className="space-y-1">
          {getStatusBadge(session.status)}
          {getCreatorBadge(session)}
        </div>
      </td>

      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm text-gray-900">
          {session.createdBy || 'No especificado'}
        </div>
        <div className="text-xs text-gray-500">
          {session.creatorDisplay?.label || 'Origen desconocido'}
        </div>
      </td>
      
      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
        <div className="flex items-center gap-1 justify-end">
          <button
            onClick={() => onViewDetails(session)}
            className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
            title="Ver detalles"
          >
            <EyeIcon className="h-4 w-4" />
          </button>
          
          {session.notes && (
            <button
              onClick={() => onViewNotes(session)}
              className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
              title="Ver notas"
            >
              <DocumentTextIcon className="h-4 w-4" />
            </button>
          )}
          
          {canJoin && (
            <button
              onClick={() => onJoinMeeting(session)}
              className="p-1 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded"
              title="Unirse a la sesión"
            >
              <VideoCameraIcon className="h-4 w-4" />
            </button>
          )}
          
          <button
            className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
            title="Abrir chat"
          >
            <ChatBubbleLeftIcon className="h-4 w-4" />
          </button>
        </div>
      </td>
    </tr>
  );
};

const SessionCard = ({ session, onViewDetails, onJoinMeeting, onViewNotes }) => {
  const isUpcoming = new Date(session.date) > new Date();
  const canJoin = session.status === 'scheduled' && session.meetingLink && isUpcoming;
  
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <CalendarIcon className="h-4 w-4 text-gray-400" />
            <span className="text-sm font-medium text-gray-900">
              {formatDate(session.date)}
            </span>
            {getStatusBadge(session.status)}
            {getCreatorBadge(session)}
          </div>
          
          <div className="flex items-center gap-2 mb-2">
            <ClockIcon className="h-4 w-4 text-gray-400" />
            <span className="text-sm text-gray-600">
              {formatTime(session.startTime)} - {formatTime(session.endTime)}
            </span>
          </div>
          
          <div className="mb-3">
            <div className="text-sm font-medium text-gray-900">{session.therapyType}</div>
            {session.sessionType && (
              <div className="text-sm text-gray-500">{session.sessionType}</div>
            )}
            {session.createdBy && (
              <div className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                <UserIcon className="h-3 w-3" />
                Creada por {session.createdBy}
              </div>
            )}
          </div>
        </div>
      </div>
      
      <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
        <button
          onClick={() => onViewDetails(session)}
          className="flex items-center gap-1 px-2 py-1 text-xs text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded"
        >
          <EyeIcon className="h-3 w-3" />
          Detalles
        </button>
        
        {session.notes && (
          <button
            onClick={() => onViewNotes(session)}
            className="flex items-center gap-1 px-2 py-1 text-xs text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded"
          >
            <DocumentTextIcon className="h-3 w-3" />
            Notas
          </button>
        )}
        
        {canJoin && (
          <button
            onClick={() => onJoinMeeting(session)}
            className="flex items-center gap-1 px-2 py-1 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded"
          >
            <VideoCameraIcon className="h-3 w-3" />
            Unirse
          </button>
        )}
        
        <button className="flex items-center gap-1 px-2 py-1 text-xs text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded">
          <ChatBubbleLeftIcon className="h-3 w-3" />
          Chat
        </button>
      </div>
    </div>
  );
};

export const ClientSessionsTable = ({ 
  clientId, 
  sessions = [], 
  onNewBooking,
  onViewDetails,
  onJoinMeeting,
  onViewNotes
}) => {
  const [filter, setFilter] = useState('all'); // all, upcoming, completed, cancelled
  
  const filteredSessions = sessions.filter(session => {
    if (filter === 'all') return true;
    if (filter === 'upcoming') {
      return new Date(session.date) > new Date() && session.status === 'scheduled';
    }
    if (filter === 'completed') return session.status === 'completed';
    if (filter === 'cancelled') return session.status === 'cancelled';
    return true;
  });
  
  const sortedSessions = filteredSessions.sort((a, b) => new Date(b.date) - new Date(a.date));
  
  const getFilterCount = (filterType) => {
    return sessions.filter(session => {
      if (filterType === 'all') return true;
      if (filterType === 'upcoming') {
        return new Date(session.date) > new Date() && session.status === 'scheduled';
      }
      if (filterType === 'completed') return session.status === 'completed';
      if (filterType === 'cancelled') return session.status === 'cancelled';
      return true;
    }).length;
  };
  
  if (sessions.length === 0) {
    return (
      <div className="text-center py-12">
        <CalendarIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No hay sesiones</h3>
        <p className="text-gray-500 mb-4">Este cliente aún no tiene sesiones programadas.</p>
        <Button
          onClick={() => onNewBooking?.({ id: clientId })}
          className="flex items-center gap-2"
        >
          <PlusIcon className="h-4 w-4" />
          Programar primera sesión
        </Button>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* Header con filtros */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h3 className="text-lg font-semibold text-gray-900">Historial de sesiones</h3>
          <span className="text-sm text-gray-500">({sessions.length} total)</span>
        </div>
        
        <Button
          onClick={() => onNewBooking?.({ id: clientId })}
          size="sm"
          className="flex items-center gap-2"
        >
          <PlusIcon className="h-4 w-4" />
          Nueva sesión
        </Button>
      </div>
      
      {/* Filtros */}
      <div className="flex flex-wrap gap-2">
        {[
          { key: 'all', label: 'Todas' },
          { key: 'upcoming', label: 'Próximas' },
          { key: 'completed', label: 'Completadas' },
          { key: 'cancelled', label: 'Canceladas' }
        ].map(({ key, label }) => {
          const count = getFilterCount(key);
          const isActive = filter === key;
          
          return (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {label} ({count})
            </button>
          );
        })}
      </div>
      
      {/* Tabla desktop */}
      <div className="hidden md:block bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Fecha y hora
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Terapia
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Estado
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Creado por
              </th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sortedSessions.map((session) => (
              <SessionRow
                key={session.id}
                session={session}
                onViewDetails={onViewDetails}
                onJoinMeeting={onJoinMeeting}
                onViewNotes={onViewNotes}
              />
            ))}
          </tbody>
        </table>
      </div>
      
      {/* Cards mobile */}
      <div className="md:hidden space-y-4">
        {sortedSessions.map((session) => (
          <SessionCard
            key={session.id}
            session={session}
            onViewDetails={onViewDetails}
            onJoinMeeting={onJoinMeeting}
            onViewNotes={onViewNotes}
          />
        ))}
      </div>
      
      {filteredSessions.length === 0 && sessions.length > 0 && (
        <div className="text-center py-8">
          <p className="text-gray-500">No hay sesiones que coincidan con el filtro seleccionado.</p>
        </div>
      )}
    </div>
  );
};