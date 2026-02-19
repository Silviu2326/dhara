import React, { useState } from 'react';
import { Card } from '../../../components/Card';
import { ReplyForm } from './ReplyForm';
import { Star, MessageSquare, Calendar, User, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export const ReviewCard = ({ review, onReply }) => {
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    id,
    clientName,
    clientAvatar,
    rating,
    comment,
    sessionDate,
    createdAt,
    response,
    responseDate,
    canEdit = true
  } = review;

  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, index) => (
      <Star
        key={index}
        className={`h-4 w-4 ${
          index < rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
        }`}
      />
    ));
  };

  const handleReply = async (replyText) => {
    setIsSubmitting(true);
    try {
      await onReply(id, replyText);
      setShowReplyForm(false);
    } catch (error) {
      console.error('Error al enviar respuesta:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (date) => {
    try {
      return format(new Date(date), 'dd MMM yyyy', { locale: es });
    } catch {
      return date;
    }
  };

  return (
    <Card className="space-y-4">
      {/* Header con información del cliente */}
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          {clientAvatar ? (
            <img
              src={clientAvatar}
              alt={clientName}
              className="h-10 w-10 rounded-full object-cover"
            />
          ) : (
            <div className="h-10 w-10 rounded-full bg-sage/10 flex items-center justify-center">
              <User className="h-5 w-5 text-sage" />
            </div>
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-deep truncate">{clientName}</h4>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Calendar className="h-4 w-4" />
              <span>{formatDate(sessionDate)}</span>
            </div>
          </div>
          
          <div className="flex items-center gap-2 mt-1">
            <div className="flex items-center gap-1">
              {renderStars(rating)}
            </div>
            <span className="text-sm text-gray-600">({rating}/5)</span>
            <span className="text-xs text-gray-400">•</span>
            <span className="text-xs text-gray-400">{formatDate(createdAt)}</span>
          </div>
        </div>
      </div>

      {/* Comentario de la reseña */}
      {comment && (
        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-gray-700 leading-relaxed">{comment}</p>
        </div>
      )}

      {/* Estado de respuesta */}
      <div className="border-t pt-4">
        {response ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-sage" />
              <span className="text-sm font-medium text-sage">Tu respuesta:</span>
            </div>
            <div className="bg-sage/5 border-l-4 border-sage rounded-r-lg p-4">
              <p className="text-gray-700">{response}</p>
              <p className="text-xs text-gray-500 mt-2">
                Respondido el {formatDate(responseDate)}
                {canEdit && (
                  <span className="ml-2">
                    • <button
                      onClick={() => setShowReplyForm(true)}
                      className="text-sage hover:underline"
                    >
                      Editar
                    </button>
                  </span>
                )}
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                  Sin responder
                </span>
                {rating <= 3 && (
                  <span className="text-xs text-red-600 font-medium flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    Requiere atención
                  </span>
                )}
              </div>
              <button
                onClick={() => setShowReplyForm(true)}
                className="text-sm text-sage hover:text-sage/80 font-medium"
              >
                Responder
              </button>
            </div>
            
            {showReplyForm && (
              <ReplyForm
                onSubmit={handleReply}
                onCancel={() => setShowReplyForm(false)}
                isSubmitting={isSubmitting}
                existingResponse={response}
              />
            )}
          </div>
        )}
      </div>
    </Card>
  );
};