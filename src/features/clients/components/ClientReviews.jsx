import React, { useState } from 'react';
import { 
  StarIcon, 
  ChatBubbleLeftRightIcon,
  CalendarIcon,
  EyeIcon,
  PencilIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';
import { Button } from '../../../components/Button';

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

const RatingStars = ({ rating, size = 'md', showNumber = true }) => {
  const sizeClasses = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5'
  };
  
  return (
    <div className="flex items-center gap-1">
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((star) => (
          <div key={star}>
            {star <= rating ? (
              <StarIconSolid className={`${sizeClasses[size]} text-yellow-400`} />
            ) : (
              <StarIcon className={`${sizeClasses[size]} text-gray-300`} />
            )}
          </div>
        ))}
      </div>
      {showNumber && (
        <span className="text-sm font-medium text-gray-700">({rating}/5)</span>
      )}
    </div>
  );
};

const ReviewCard = ({ review, onReply, onViewDetails }) => {
  const [showFullComment, setShowFullComment] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [showReplyForm, setShowReplyForm] = useState(false);
  
  const commentPreview = review.comment?.length > 200 
    ? review.comment.substring(0, 200) + '...' 
    : review.comment;
  
  const handleSubmitReply = () => {
    if (replyText.trim()) {
      onReply(review.id, replyText.trim());
      setReplyText('');
      setShowReplyForm(false);
    }
  };
  
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-sm transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <CalendarIcon className="h-4 w-4 text-gray-400" />
            <span className="text-sm text-gray-600">{formatDate(review.date)}</span>
          </div>
          {review.sessionId && (
            <span className="text-sm text-gray-500">• Sesión #{review.sessionId}</span>
          )}
        </div>
        <RatingStars rating={review.rating} size="md" />
      </div>
      
      {/* Categorías de valoración */}
      {review.categories && (
        <div className="mb-4">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {Object.entries(review.categories).map(([category, rating]) => (
              <div key={category} className="flex items-center justify-between text-sm">
                <span className="text-gray-600 capitalize">{category}:</span>
                <RatingStars rating={rating} size="sm" showNumber={false} />
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Comentario */}
      {review.comment && (
        <div className="mb-4">
          <p className="text-gray-700 leading-relaxed">
            {showFullComment ? review.comment : commentPreview}
          </p>
          {review.comment.length > 200 && (
            <button
              onClick={() => setShowFullComment(!showFullComment)}
              className="text-primary hover:text-primary-dark text-sm font-medium mt-2"
            >
              {showFullComment ? 'Ver menos' : 'Ver más'}
            </button>
          )}
        </div>
      )}
      
      {/* Respuesta existente */}
      {review.reply && (
        <div className="bg-blue-50 rounded-lg p-4 mb-4">
          <div className="flex items-center gap-2 mb-2">
            <ChatBubbleLeftRightIcon className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-900">Tu respuesta</span>
            <span className="text-xs text-blue-600">{formatDate(review.reply.date)}</span>
          </div>
          <p className="text-blue-800 text-sm leading-relaxed">{review.reply.text}</p>
        </div>
      )}
      
      {/* Formulario de respuesta */}
      {showReplyForm && (
        <div className="border-t border-gray-200 pt-4">
          <textarea
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            placeholder="Escribe tu respuesta al cliente..."
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary resize-none"
          />
          <div className="flex items-center gap-2 mt-3">
            <Button
              size="sm"
              onClick={handleSubmitReply}
              disabled={!replyText.trim()}
            >
              Enviar respuesta
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setShowReplyForm(false);
                setReplyText('');
              }}
            >
              Cancelar
            </Button>
          </div>
        </div>
      )}
      
      {/* Acciones */}
      <div className="flex items-center gap-2 pt-4 border-t border-gray-100">
        <button
          onClick={() => onViewDetails(review)}
          className="flex items-center gap-1 px-2 py-1 text-xs text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded"
        >
          <EyeIcon className="h-3 w-3" />
          Ver detalles
        </button>
        
        {!review.reply && (
          <button
            onClick={() => setShowReplyForm(!showReplyForm)}
            className="flex items-center gap-1 px-2 py-1 text-xs text-primary hover:text-primary-dark hover:bg-primary hover:bg-opacity-5 rounded"
          >
            <ChatBubbleLeftRightIcon className="h-3 w-3" />
            Responder
          </button>
        )}
        
        {review.reply && (
          <button
            onClick={() => setShowReplyForm(!showReplyForm)}
            className="flex items-center gap-1 px-2 py-1 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded"
          >
            <PencilIcon className="h-3 w-3" />
            Editar respuesta
          </button>
        )}
      </div>
    </div>
  );
};

const ReviewsSummary = ({ reviews }) => {
  const totalReviews = reviews.length;
  const averageRating = totalReviews > 0 
    ? reviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews 
    : 0;
  
  const ratingDistribution = [5, 4, 3, 2, 1].map(rating => {
    const count = reviews.filter(review => review.rating === rating).length;
    const percentage = totalReviews > 0 ? (count / totalReviews) * 100 : 0;
    return { rating, count, percentage };
  });
  
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
      <h4 className="text-lg font-semibold text-gray-900 mb-4">Resumen de valoraciones</h4>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Puntuación promedio */}
        <div className="text-center">
          <div className="text-4xl font-bold text-gray-900 mb-2">
            {averageRating.toFixed(1)}
          </div>
          <RatingStars rating={Math.round(averageRating)} size="lg" showNumber={false} />
          <p className="text-sm text-gray-600 mt-2">
            Basado en {totalReviews} valoracion{totalReviews !== 1 ? 'es' : ''}
          </p>
        </div>
        
        {/* Distribución de puntuaciones */}
        <div className="space-y-2">
          {ratingDistribution.map(({ rating, count, percentage }) => (
            <div key={rating} className="flex items-center gap-3">
              <span className="text-sm font-medium text-gray-700 w-8">
                {rating}★
              </span>
              <div className="flex-1 bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-yellow-400 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${percentage}%` }}
                />
              </div>
              <span className="text-sm text-gray-600 w-8 text-right">
                {count}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export const ClientReviews = ({ 
  clientId, 
  reviews = [],
  onReply,
  onViewDetails
}) => {
  const [filter, setFilter] = useState('all'); // all, 5, 4, 3, 2, 1, replied, unreplied
  
  const filteredReviews = reviews.filter(review => {
    if (filter === 'all') return true;
    if (filter === 'replied') return !!review.reply;
    if (filter === 'unreplied') return !review.reply;
    if (typeof filter === 'number') return review.rating === filter;
    return true;
  });
  
  const sortedReviews = filteredReviews.sort((a, b) => new Date(b.date) - new Date(a.date));
  
  const getFilterCount = (filterType) => {
    return reviews.filter(review => {
      if (filterType === 'all') return true;
      if (filterType === 'replied') return !!review.reply;
      if (filterType === 'unreplied') return !review.reply;
      if (typeof filterType === 'number') return review.rating === filterType;
      return true;
    }).length;
  };
  
  if (reviews.length === 0) {
    return (
      <div className="text-center py-12">
        <StarIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No hay valoraciones</h3>
        <p className="text-gray-500">Este cliente aún no ha dejado valoraciones.</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* Resumen */}
      <ReviewsSummary reviews={reviews} />
      
      {/* Filtros */}
      <div className="flex flex-wrap gap-2">
        {[
          { key: 'all', label: 'Todas' },
          { key: 5, label: '5 estrellas' },
          { key: 4, label: '4 estrellas' },
          { key: 3, label: '3 estrellas' },
          { key: 2, label: '2 estrellas' },
          { key: 1, label: '1 estrella' },
          { key: 'unreplied', label: 'Sin responder' },
          { key: 'replied', label: 'Respondidas' }
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
      
      {/* Lista de valoraciones */}
      <div className="space-y-4">
        {sortedReviews.map((review) => (
          <ReviewCard
            key={review.id}
            review={review}
            onReply={onReply}
            onViewDetails={onViewDetails}
          />
        ))}
      </div>
      
      {filteredReviews.length === 0 && reviews.length > 0 && (
        <div className="text-center py-8">
          <p className="text-gray-500">No hay valoraciones que coincidan con el filtro seleccionado.</p>
        </div>
      )}
    </div>
  );
};