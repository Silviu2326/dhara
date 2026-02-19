import React, { useState, useEffect } from 'react';
import { Button } from '../../../components/Button';
import { reviewService } from '../../../services/api/reviewService';
import { MessageSquare, CheckCircle } from 'lucide-react';
import { demoMode, demoData } from '../../../utils/demoMode';

const FeaturedTestimonials = ({ selectedTestimonials = [], onChange, isEditing, editButton = null }) => {
  const [showSelector, setShowSelector] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedReviews, setSelectedReviews] = useState(selectedTestimonials.map(t => t.id) || []);

  // Cargar reseñas reales del backend
  useEffect(() => {
    const loadReviews = async () => {
      try {
        setLoading(true);

        const response = await demoMode.handleServiceCall(
          () => reviewService.getReviews({ therapistId: 'current', verified: true }),
          []
        );

        setReviews(response || []);
      } catch (error) {
        console.error('Error loading reviews:', error);
        setReviews([]);
      } finally {
        setLoading(false);
      }
    };

    loadReviews();
  }, []);

  const availableReviews = reviews;

  const handleToggleReview = (reviewId) => {
    setSelectedReviews(prev => {
      if (prev.includes(reviewId)) {
        return prev.filter(id => id !== reviewId);
      } else {
        if (prev.length >= 3) {
          alert('Máximo 3 testimonios destacados permitidos');
          return prev;
        }
        return [...prev, reviewId];
      }
    });
  };

  const handleSaveSelection = () => {
    const selectedTestimonials = availableReviews.filter(review => 
      selectedReviews.includes(review.id)
    );
    onChange(selectedTestimonials);
    setShowSelector(false);
  };

  const handleRemoveTestimonial = (testimonialId) => {
    const updatedTestimonials = selectedTestimonials.filter(t => t.id !== testimonialId);
    onChange(updatedTestimonials);
  };

  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, i) => (
      <span key={i} className={`text-sm ${i < rating ? 'text-yellow-400' : 'text-gray-300'}`}>
        ★
      </span>
    ));
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-deep">Testimonios Destacados</h3>
          <p className="text-sm text-gray-600 mt-1">
            Selecciona hasta 3 reseñas positivas para mostrar en tu perfil público
          </p>
        </div>
        <div className="flex items-center gap-2">
          {editButton}
          {isEditing && (
            <Button
              onClick={() => setShowSelector(true)}
              className="bg-sage text-white hover:bg-sage/90"
            >
              Seleccionar Testimonios
            </Button>
          )}
        </div>
      </div>

      {/* Lista de testimonios destacados */}
      <div className="space-y-4">
        {selectedTestimonials.map((testimonial) => (
          <div key={testimonial.id} className="border border-gray-200 rounded-lg p-4 bg-white">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-sage/10 rounded-full flex items-center justify-center">
                  <span className="text-sage font-medium text-sm">
                    {testimonial.clientName.charAt(0)}
                  </span>
                </div>
                <div>
                  <h4 className="font-medium text-deep">{testimonial.clientName}</h4>
                  <div className="flex items-center gap-2">
                    <div className="flex">{renderStars(testimonial.rating)}</div>
                    {testimonial.verified && (
                      <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
<CheckCircle className="h-3 w-3" /> Verificado
                      </span>
                    )}
                  </div>
                </div>
              </div>
              {isEditing && (
                <button
                  onClick={() => handleRemoveTestimonial(testimonial.id)}
                  className="text-red-600 hover:text-red-800 text-sm"
                >
                  Quitar
                </button>
              )}
            </div>
            
            <blockquote className="text-gray-700 italic mb-2">
              "{testimonial.comment}"
            </blockquote>
            
            <p className="text-xs text-gray-500">
              {formatDate(testimonial.date)}
            </p>
          </div>
        ))}

        {selectedTestimonials.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <div className="mx-auto w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
              <MessageSquare className="h-6 w-6 text-gray-400" />
            </div>
            <p>No hay testimonios destacados</p>
            {isEditing && (
              <p className="text-sm mt-1">Haz clic en "Seleccionar Testimonios" para comenzar</p>
            )}
          </div>
        )}
      </div>

      {/* Modal selector de testimonios */}
      {showSelector && isEditing && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-semibold text-deep">
                Seleccionar Testimonios Destacados
              </h4>
              <button
                onClick={() => setShowSelector(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            
            <p className="text-sm text-gray-600 mb-4">
              Selecciona hasta 3 reseñas para destacar en tu perfil público ({selectedReviews.length}/3)
            </p>

            <div className="space-y-3 mb-6">
              {availableReviews.map((review) => {
                const isSelected = selectedReviews.includes(review.id);
                return (
                  <div 
                    key={review.id} 
                    className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                      isSelected 
                        ? 'border-sage bg-sage/5' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => handleToggleReview(review.id)}
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggleReview(review.id)}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h5 className="font-medium text-deep">{review.clientName}</h5>
                          <div className="flex">{renderStars(review.rating)}</div>
                          {review.verified && (
                            <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
      <CheckCircle className="h-3 w-3" /> Verificado
                            </span>
                          )}
                        </div>
                        <p className="text-gray-700 text-sm mb-1">"{review.comment}"</p>
                        <p className="text-xs text-gray-500">
                          {formatDate(review.date)}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex gap-3">
              <Button
                onClick={handleSaveSelection}
                className="bg-sage text-white hover:bg-sage/90"
              >
                Guardar Selección ({selectedReviews.length})
              </Button>
              <Button
                onClick={() => {
                  setSelectedReviews(selectedTestimonials.map(t => t.id));
                  setShowSelector(false);
                }}
                variant="outline"
              >
                Cancelar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export { FeaturedTestimonials };