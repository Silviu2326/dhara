import React from 'react';
import { Star } from 'lucide-react';

export const StarChips = ({ selectedRatings = [], onRatingToggle }) => {
  const ratings = [1, 2, 3, 4, 5];

  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, index) => (
      <Star
        key={index}
        className={`h-3 w-3 ${
          index < rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
        }`}
      />
    ));
  };

  return (
    <div className="flex flex-wrap gap-2">
      <span className="text-sm font-medium text-gray-700 self-center mr-2">
        Puntuación:
      </span>
      {ratings.map((rating) => {
        const isSelected = selectedRatings.includes(rating);
        return (
          <button
            key={rating}
            onClick={() => onRatingToggle(rating)}
            className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              isSelected
                ? 'bg-sage text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
            aria-label={`Filtrar por ${rating} estrella${rating > 1 ? 's' : ''}`}
          >
            <div className="flex items-center gap-0.5">
              {renderStars(rating)}
            </div>
            <span>{rating}</span>
          </button>
        );
      })}
      {selectedRatings.length > 0 && (
        <button
          onClick={() => onRatingToggle(null)}
          className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1"
        >
          Limpiar
        </button>
      )}
    </div>
  );
};