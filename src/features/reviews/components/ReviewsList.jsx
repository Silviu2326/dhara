import React, { useState } from 'react';
import { ReviewCard } from './ReviewCard';
import { Loader } from '../../../components/Loader';
import {
  MessageSquare,
  Star,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  RefreshCw,
  Filter,
  Search,
  Clock,
  Eye,
  EyeOff,
  Lightbulb
} from 'lucide-react';

export const ReviewsList = ({
  reviews = [],
  loading = false,
  error = null,
  onReply,
  onModerate,
  pagination = {},
  alerts = [],
  moderationLoading = false,
  onRefresh
}) => {
  const [hiddenReviews, setHiddenReviews] = useState(new Set());
  const [selectedReviews, setSelectedReviews] = useState(new Set());
  const [bulkModerationAction, setBulkModerationAction] = useState('');

  const {
    current = 1,
    total = 1,
    hasNext = false,
    hasPrevious = false,
    onChange = () => {}
  } = pagination;

  // Filter reviews to show only visible ones
  const visibleReviews = reviews.filter(review => !hiddenReviews.has(review.id));

  // Get alerts for current reviews
  const currentAlerts = alerts.filter(alert =>
    reviews.some(review => review.id === alert.data?.reviewId)
  );

  const toggleReviewVisibility = (reviewId) => {
    setHiddenReviews(prev => {
      const newSet = new Set(prev);
      if (newSet.has(reviewId)) {
        newSet.delete(reviewId);
      } else {
        newSet.add(reviewId);
      }
      return newSet;
    });
  };

  const toggleReviewSelection = (reviewId) => {
    setSelectedReviews(prev => {
      const newSet = new Set(prev);
      if (newSet.has(reviewId)) {
        newSet.delete(reviewId);
      } else {
        newSet.add(reviewId);
      }
      return newSet;
    });
  };

  const handleBulkModeration = async () => {
    if (!bulkModerationAction || selectedReviews.size === 0) return;

    const promises = Array.from(selectedReviews).map(reviewId =>
      onModerate?.(reviewId, bulkModerationAction, 'Bulk moderation action')
    );

    try {
      await Promise.all(promises);
      setSelectedReviews(new Set());
      setBulkModerationAction('');
    } catch (error) {
      console.error('Bulk moderation failed:', error);
    }
  };

  if (loading && reviews.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader />
        <span className="ml-3 text-gray-600">Cargando reseñas...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md mx-auto">
          <div className="flex items-center justify-center w-12 h-12 bg-red-100 rounded-full mx-auto mb-4">
            <MessageSquare className="h-6 w-6 text-red-600" />
          </div>
          <h3 className="text-lg font-semibold text-red-800 mb-2">
            Error al cargar reseñas
          </h3>
          <p className="text-red-600 text-sm mb-4">
            {error.message || 'Ha ocurrido un error inesperado'}
          </p>
          <div className="flex gap-2 justify-center">
            <button
              onClick={() => window.location.reload()}
              className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-red-700 transition-colors"
            >
              Reintentar
            </button>
            {onRefresh && (
              <button
                onClick={onRefresh}
                className="bg-gray-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-gray-700 transition-colors flex items-center gap-2"
              >
                <RefreshCw className="h-3 w-3" />
                Refrescar
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (reviews.length === 0) {
    return <EmptyState />;
  }

  return (
    <div className="space-y-6">
      {/* Alerts Summary */}
      {currentAlerts.length > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="h-4 w-4 text-orange-600" />
            <span className="font-medium text-orange-900">
              {currentAlerts.length} reseña{currentAlerts.length !== 1 ? 's' : ''} requiere{currentAlerts.length === 1 ? '' : 'n'} atención
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {currentAlerts.slice(0, 4).map(alert => (
              <div key={alert.id} className="text-sm text-orange-800 bg-orange-100 rounded p-2">
                {alert.message} - {alert.data?.clientName}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bulk Actions */}
      {selectedReviews.size > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-blue-900">
              {selectedReviews.size} reseña{selectedReviews.size !== 1 ? 's' : ''} seleccionada{selectedReviews.size !== 1 ? 's' : ''}
            </span>
            <div className="flex items-center gap-2">
              <select
                value={bulkModerationAction}
                onChange={(e) => setBulkModerationAction(e.target.value)}
                className="px-3 py-1 text-sm border border-blue-300 rounded"
              >
                <option value="">Seleccionar acción...</option>
                <option value="approve">Aprobar todas</option>
                <option value="flag">Marcar para revisión</option>
                <option value="block">Bloquear todas</option>
              </select>
              <button
                onClick={handleBulkModeration}
                disabled={!bulkModerationAction || moderationLoading}
                className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              >
                Aplicar
              </button>
              <button
                onClick={() => setSelectedReviews(new Set())}
                className="px-3 py-1 text-sm bg-gray-600 text-white rounded hover:bg-gray-700"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lista de reseñas */}
      <div className="space-y-4">
        {visibleReviews.map((review) => {
          const reviewAlert = alerts.find(alert => alert.data?.reviewId === review.id);
          const isSelected = selectedReviews.has(review.id);

          return (
            <div
              key={review.id}
              id={`review-${review.id}`}
              className={`relative ${reviewAlert ? 'ring-2 ring-orange-200' : ''}`}
            >
              {/* Selection checkbox for bulk actions */}
              <div className="absolute top-3 left-3 z-10">
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => toggleReviewSelection(review.id)}
                  className="rounded border-gray-300 text-sage focus:ring-sage"
                />
              </div>

              {/* Alert indicator */}
              {reviewAlert && (
                <div className="absolute top-3 right-3 z-10">
                  <div className="bg-orange-500 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    {reviewAlert.priority === 'critical' ? 'Crítico' :
                     reviewAlert.priority === 'high' ? 'Alto' : 'Medio'}
                  </div>
                </div>
              )}

              <ReviewCard
                review={review}
                onReply={onReply}
                onModerate={onModerate}
                alert={reviewAlert}
                moderationLoading={moderationLoading}
                className={isSelected ? 'ring-2 ring-blue-200' : ''}
              />

              {/* Quick actions */}
              <div className="absolute bottom-3 right-3 flex gap-1">
                <button
                  onClick={() => toggleReviewVisibility(review.id)}
                  className="p-1 text-gray-400 hover:text-gray-600 bg-white rounded shadow-sm"
                  title="Ocultar/Mostrar reseña"
                >
                  <EyeOff className="h-3 w-3" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Hidden reviews indicator */}
      {hiddenReviews.size > 0 && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">
              {hiddenReviews.size} reseña{hiddenReviews.size !== 1 ? 's' : ''} oculta{hiddenReviews.size !== 1 ? 's' : ''}
            </span>
            <button
              onClick={() => setHiddenReviews(new Set())}
              className="text-sm text-sage hover:text-sage/80 flex items-center gap-1"
            >
              <Eye className="h-3 w-3" />
              Mostrar todas
            </button>
          </div>
        </div>
      )}

      {/* Pagination Controls */}
      {total > 1 && (
        <div className="flex items-center justify-between pt-6 border-t border-gray-200">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span>Página {current} de {total}</span>
            {loading && (
              <>
                <div className="w-px h-4 bg-gray-300" />
                <div className="flex items-center gap-1">
                  <RefreshCw className="h-3 w-3 animate-spin" />
                  <span>Cargando...</span>
                </div>
              </>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onChange(current - 1)}
              disabled={!hasPrevious || loading}
              className="flex items-center gap-1 px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="h-4 w-4" />
              Anterior
            </button>

            {/* Page numbers */}
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, total) }, (_, i) => {
                let pageNum;
                if (total <= 5) {
                  pageNum = i + 1;
                } else if (current <= 3) {
                  pageNum = i + 1;
                } else if (current >= total - 2) {
                  pageNum = total - 4 + i;
                } else {
                  pageNum = current - 2 + i;
                }

                return (
                  <button
                    key={pageNum}
                    onClick={() => onChange(pageNum)}
                    disabled={loading}
                    className={`w-8 h-8 text-sm rounded ${
                      pageNum === current
                        ? 'bg-sage text-white'
                        : 'border border-gray-300 hover:bg-gray-50'
                    } disabled:opacity-50`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => onChange(current + 1)}
              disabled={!hasNext || loading}
              className="flex items-center gap-1 px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Siguiente
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Lista completa - información de estado */}
      <div className="text-center text-sm text-gray-500 pt-4">
        {visibleReviews.length > 0 && (
          <div className="flex items-center justify-center gap-4">
            <span>
              Mostrando {visibleReviews.length} de {reviews.length} reseñas en esta página
            </span>
            {hiddenReviews.size > 0 && (
              <span className="text-orange-600">
                ({hiddenReviews.size} ocultas)
              </span>
            )}
            {currentAlerts.length > 0 && (
              <span className="text-orange-600 flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />
                {currentAlerts.length} requieren atención
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const EmptyState = () => {
  return (
    <div className="text-center py-12">
      <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-lg p-8 max-w-md mx-auto">
        <div className="flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mx-auto mb-4">
          <Star className="h-8 w-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-800 mb-2">
          No hay reseñas aún
        </h3>
        <p className="text-gray-600 text-sm mb-6">
          Cuando tus clientes dejen reseñas después de las sesiones, aparecerán aquí.
        </p>
        <div className="space-y-2 text-xs text-gray-500">
          <p className="flex items-center justify-center gap-2">
            <Lightbulb className="h-3 w-3 text-yellow-500" />
            Las reseñas ayudan a:
          </p>
          <ul className="list-disc list-inside space-y-1 text-left max-w-xs mx-auto">
            <li>Mejorar tu reputación profesional</li>
            <li>Atraer nuevos clientes</li>
            <li>Recibir feedback valioso</li>
            <li>Identificar áreas de mejora</li>
            <li>Demostrar calidad del servicio</li>
          </ul>
        </div>
      </div>
    </div>
  );
};