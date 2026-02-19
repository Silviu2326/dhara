import React, { useState } from 'react';
import { Card } from '../../../components/Card';
import { StarChips } from './StarChips';
import { RespondedSwitch } from './RespondedSwitch';
import { SortSelect } from './SortSelect';
import { Calendar, Filter, X } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export const ReviewsFilter = ({ filters, onFiltersChange, isMobile = false }) => {
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isExpanded, setIsExpanded] = useState(!isMobile);

  const handleRatingToggle = (rating) => {
    if (rating === null) {
      onFiltersChange({ ...filters, ratings: [] });
      return;
    }
    
    const newRatings = filters.ratings?.includes(rating)
      ? filters.ratings.filter(r => r !== rating)
      : [...(filters.ratings || []), rating];
    
    onFiltersChange({ ...filters, ratings: newRatings });
  };

  const handleDateRangeChange = (field, value) => {
    onFiltersChange({
      ...filters,
      dateRange: {
        ...filters.dateRange,
        [field]: value
      }
    });
  };

  const clearFilters = () => {
    onFiltersChange({
      ratings: [],
      responded: 'all',
      sortBy: 'newest',
      dateRange: { start: '', end: '' }
    });
  };

  const hasActiveFilters = 
    filters.ratings?.length > 0 ||
    filters.responded !== 'all' ||
    filters.dateRange?.start ||
    filters.dateRange?.end;

  if (isMobile) {
    return (
      <div className="mb-6">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center justify-between w-full p-4 bg-white border border-gray-200 rounded-lg"
        >
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-gray-500" />
            <span className="font-medium">Filtros</span>
            {hasActiveFilters && (
              <span className="bg-sage text-white text-xs px-2 py-1 rounded-full">
                Activos
              </span>
            )}
          </div>
          <X className={`h-5 w-5 text-gray-500 transition-transform ${
            isExpanded ? 'rotate-45' : ''
          }`} />
        </button>
        
        {isExpanded && (
          <Card className="mt-2">
            <FilterContent
              filters={filters}
              onFiltersChange={onFiltersChange}
              handleRatingToggle={handleRatingToggle}
              handleDateRangeChange={handleDateRangeChange}
              clearFilters={clearFilters}
              hasActiveFilters={hasActiveFilters}
              showDatePicker={showDatePicker}
              setShowDatePicker={setShowDatePicker}
            />
          </Card>
        )}
      </div>
    );
  }

  return (
    <Card className="mb-6">
      <FilterContent
        filters={filters}
        onFiltersChange={onFiltersChange}
        handleRatingToggle={handleRatingToggle}
        handleDateRangeChange={handleDateRangeChange}
        clearFilters={clearFilters}
        hasActiveFilters={hasActiveFilters}
        showDatePicker={showDatePicker}
        setShowDatePicker={setShowDatePicker}
      />
    </Card>
  );
};

const FilterContent = ({
  filters,
  onFiltersChange,
  handleRatingToggle,
  handleDateRangeChange,
  clearFilters,
  hasActiveFilters,
  showDatePicker,
  setShowDatePicker
}) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-deep">Filtros</h3>
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            Limpiar filtros
          </button>
        )}
      </div>

      {/* Rango de fechas */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">Rango de fechas:</span>
        </div>
        <div className="flex gap-2">
          <input
            type="date"
            value={filters.dateRange?.start || ''}
            onChange={(e) => handleDateRangeChange('start', e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sage"
            placeholder="Desde"
          />
          <input
            type="date"
            value={filters.dateRange?.end || ''}
            onChange={(e) => handleDateRangeChange('end', e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sage"
            placeholder="Hasta"
          />
        </div>
      </div>

      {/* Filtros de puntuación */}
      <StarChips
        selectedRatings={filters.ratings || []}
        onRatingToggle={handleRatingToggle}
      />

      {/* Filtros de respuesta y ordenación */}
      <div className="flex flex-wrap gap-4">
        <RespondedSwitch
          value={filters.responded || 'all'}
          onChange={(value) => onFiltersChange({ ...filters, responded: value })}
        />
        <SortSelect
          value={filters.sortBy || 'newest'}
          onChange={(value) => onFiltersChange({ ...filters, sortBy: value })}
        />
      </div>
    </div>
  );
};