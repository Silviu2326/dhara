import React, { useState } from 'react';
import {
  DocumentTextIcon,
  ChatBubbleLeftRightIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  UserIcon,
  EyeIcon,
  PlusIcon,
  FunnelIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';
import { Button } from '../../../components/Button';
import { Card } from '../../../components/Card';

const NotePriorityBadge = ({ priority }) => {
  const getColors = () => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'normal':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'low':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getColors()}`}>
      {priority === 'urgent' && <ExclamationTriangleIcon className="w-3 h-3 mr-1" />}
      {priority.charAt(0).toUpperCase() + priority.slice(1)}
    </span>
  );
};

const NoteTypeBadge = ({ noteType }) => {
  const getColors = () => {
    switch (noteType) {
      case 'progress':
        return 'bg-green-100 text-green-800';
      case 'concern':
        return 'bg-yellow-100 text-yellow-800';
      case 'achievement':
        return 'bg-purple-100 text-purple-800';
      case 'reminder':
        return 'bg-indigo-100 text-indigo-800';
      case 'homework':
        return 'bg-pink-100 text-pink-800';
      case 'reflection':
        return 'bg-cyan-100 text-cyan-800';
      case 'goal':
        return 'bg-emerald-100 text-emerald-800';
      case 'question':
        return 'bg-amber-100 text-amber-800';
      case 'feedback':
        return 'bg-teal-100 text-teal-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getColors()}`}>
      {noteType}
    </span>
  );
};

const VisibilityIcon = ({ visibility }) => {
  switch (visibility) {
    case 'private':
      return <EyeIcon className="w-4 h-4 text-gray-400" title="Privada" />;
    case 'therapist_only':
      return <UserIcon className="w-4 h-4 text-blue-500" title="Solo terapeuta" />;
    case 'client_only':
      return <UserIcon className="w-4 h-4 text-green-500" title="Solo cliente" />;
    case 'shared':
      return <ChatBubbleLeftRightIcon className="w-4 h-4 text-purple-500" title="Compartida" />;
    case 'restricted':
      return <ExclamationTriangleIcon className="w-4 h-4 text-red-500" title="Restringida" />;
    default:
      return <EyeIcon className="w-4 h-4 text-gray-400" />;
  }
};

const NoteCard = ({ note, onViewNote, onAddResponse }) => {
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const truncateContent = (content, maxLength = 150) => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '...';
  };

  return (
    <Card className="p-4 hover:shadow-md transition-shadow">
      <div className="space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-medium text-gray-900 text-sm">{note.title}</h3>
              {note.isEmergency && (
                <ExclamationTriangleIcon className="w-4 h-4 text-red-500" />
              )}
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <span className={`font-medium ${note.authorType === 'therapist' ? 'text-blue-600' : 'text-green-600'}`}>
                {note.authorType === 'therapist' ? 'Terapeuta' : 'Cliente'}
              </span>
              <span>•</span>
              <span>{formatDate(note.date)}</span>
              <span>•</span>
              <VisibilityIcon visibility={note.visibility} />
            </div>
          </div>
          <div className="flex items-center gap-1">
            <NotePriorityBadge priority={note.priority} />
          </div>
        </div>

        {/* Content */}
        <p className="text-gray-700 text-sm leading-relaxed">
          {truncateContent(note.content)}
        </p>

        {/* Tags and Type */}
        <div className="flex items-center gap-2 flex-wrap">
          <NoteTypeBadge noteType={note.noteType} />
          {note.tags && note.tags.map((tag, index) => (
            <span key={index} className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-gray-100 text-gray-700">
              {tag}
            </span>
          ))}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
          <div className="flex items-center gap-4 text-xs text-gray-500">
            {note.responseCount > 0 && (
              <span className="flex items-center gap-1">
                <ChatBubbleLeftRightIcon className="w-3 h-3" />
                {note.responseCount} respuesta{note.responseCount !== 1 ? 's' : ''}
                {note.hasUnreadResponses && (
                  <span className="w-2 h-2 bg-red-500 rounded-full ml-1"></span>
                )}
              </span>
            )}
            {note.requiresResponse && (
              <span className="flex items-center gap-1 text-amber-600">
                <ClockIcon className="w-3 h-3" />
                Requiere respuesta
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => onViewNote(note)}
              className="text-xs"
            >
              Ver detalles
            </Button>
            {note.requiresResponse && (
              <Button
                size="sm"
                variant="primary"
                onClick={() => onAddResponse(note)}
                className="text-xs"
              >
                Responder
              </Button>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
};

const FilterBar = ({ filters, onFiltersChange }) => {
  return (
    <div className="bg-gray-50 rounded-lg p-4 space-y-3">
      <div className="flex items-center gap-4">
        {/* Search */}
        <div className="flex-1 relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar en notas..."
            value={filters.search || ''}
            onChange={(e) => onFiltersChange({ ...filters, search: e.target.value })}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-primary focus:border-primary"
          />
        </div>

        {/* Author Type Filter */}
        <select
          value={filters.authorType || ''}
          onChange={(e) => onFiltersChange({ ...filters, authorType: e.target.value })}
          className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-primary focus:border-primary"
        >
          <option value="">Todos los autores</option>
          <option value="therapist">Terapeuta</option>
          <option value="client">Cliente</option>
        </select>

        {/* Priority Filter */}
        <select
          value={filters.priority || ''}
          onChange={(e) => onFiltersChange({ ...filters, priority: e.target.value })}
          className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-primary focus:border-primary"
        >
          <option value="">Todas las prioridades</option>
          <option value="urgent">Urgente</option>
          <option value="high">Alta</option>
          <option value="normal">Normal</option>
          <option value="low">Baja</option>
        </select>

        {/* Note Type Filter */}
        <select
          value={filters.noteType || ''}
          onChange={(e) => onFiltersChange({ ...filters, noteType: e.target.value })}
          className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-primary focus:border-primary"
        >
          <option value="">Todos los tipos</option>
          <option value="progress">Progreso</option>
          <option value="concern">Preocupación</option>
          <option value="achievement">Logro</option>
          <option value="reminder">Recordatorio</option>
          <option value="homework">Tarea</option>
          <option value="reflection">Reflexión</option>
          <option value="goal">Objetivo</option>
          <option value="question">Pregunta</option>
          <option value="feedback">Retroalimentación</option>
        </select>
      </div>
    </div>
  );
};

const StatsCards = ({ stats, isLoading }) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
      <Card className="p-3">
        <div className="text-center">
          <div className="text-lg font-semibold text-gray-900">
            {isLoading ? '...' : stats.totalNotes}
          </div>
          <div className="text-xs text-gray-500">Total notas</div>
        </div>
      </Card>
      <Card className="p-3">
        <div className="text-center">
          <div className="text-lg font-semibold text-blue-600">
            {isLoading ? '...' : stats.therapistNotes}
          </div>
          <div className="text-xs text-gray-500">Del terapeuta</div>
        </div>
      </Card>
      <Card className="p-3">
        <div className="text-center">
          <div className="text-lg font-semibold text-green-600">
            {isLoading ? '...' : stats.clientNotes}
          </div>
          <div className="text-xs text-gray-500">Del cliente</div>
        </div>
      </Card>
      <Card className="p-3">
        <div className="text-center">
          <div className="text-lg font-semibold text-red-600">
            {isLoading ? '...' : stats.emergencyNotes}
          </div>
          <div className="text-xs text-gray-500">Emergencias</div>
        </div>
      </Card>
      <Card className="p-3">
        <div className="text-center">
          <div className="text-lg font-semibold text-amber-600">
            {isLoading ? '...' : stats.pendingResponses}
          </div>
          <div className="text-xs text-gray-500">Pendientes</div>
        </div>
      </Card>
    </div>
  );
};

export const ClientNotesSection = ({
  clientId,
  clientNotes = [],
  stats = {},
  isLoading = false,
  onCreateNote,
  onViewNote,
  onAddResponse,
  onRefresh
}) => {
  const [filters, setFilters] = useState({
    search: '',
    authorType: '',
    priority: '',
    noteType: ''
  });
  const [showFilters, setShowFilters] = useState(false);

  // Filter notes based on current filters
  const filteredNotes = clientNotes.filter(note => {
    if (filters.search && !note.title.toLowerCase().includes(filters.search.toLowerCase()) &&
        !note.content.toLowerCase().includes(filters.search.toLowerCase())) {
      return false;
    }
    if (filters.authorType && note.authorType !== filters.authorType) {
      return false;
    }
    if (filters.priority && note.priority !== filters.priority) {
      return false;
    }
    if (filters.noteType && note.noteType !== filters.noteType) {
      return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <StatsCards stats={stats} isLoading={isLoading} />

      {/* Header with Actions */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-gray-900">Notas del cliente</h3>
          <p className="text-sm text-gray-600">
            Gestiona las notas entre terapeuta y cliente con controles de visibilidad
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2"
          >
            <FunnelIcon className="h-4 w-4" />
            Filtros
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={onCreateNote}
            className="flex items-center gap-2"
          >
            <PlusIcon className="h-4 w-4" />
            Nueva nota
          </Button>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <FilterBar filters={filters} onFiltersChange={setFilters} />
      )}

      {/* Notes List */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <Card key={i} className="p-4 animate-pulse">
              <div className="space-y-3">
                <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                <div className="h-3 bg-gray-200 rounded w-full"></div>
                <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                <div className="flex gap-2">
                  <div className="h-6 bg-gray-200 rounded w-16"></div>
                  <div className="h-6 bg-gray-200 rounded w-12"></div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : filteredNotes.length > 0 ? (
        <div className="space-y-4">
          {filteredNotes.map((note) => (
            <NoteCard
              key={note.id}
              note={note}
              onViewNote={onViewNote}
              onAddResponse={onAddResponse}
            />
          ))}
        </div>
      ) : (
        <Card className="p-12 text-center">
          <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {clientNotes.length === 0 ? 'No hay notas' : 'No se encontraron notas'}
          </h3>
          <p className="text-gray-600 mb-4">
            {clientNotes.length === 0
              ? 'Aún no se han creado notas para este cliente. Crea la primera nota para comenzar.'
              : 'No hay notas que coincidan con los filtros aplicados.'
            }
          </p>
          {clientNotes.length === 0 && (
            <Button
              variant="primary"
              onClick={onCreateNote}
              className="flex items-center gap-2 mx-auto"
            >
              <PlusIcon className="h-4 w-4" />
              Crear primera nota
            </Button>
          )}
          {clientNotes.length > 0 && (
            <Button
              variant="outline"
              onClick={() => setFilters({ search: '', authorType: '', priority: '', noteType: '' })}
              className="mx-auto"
            >
              Limpiar filtros
            </Button>
          )}
        </Card>
      )}
    </div>
  );
};