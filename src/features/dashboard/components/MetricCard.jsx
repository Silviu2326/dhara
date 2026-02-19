import React from 'react';
import { Card } from '../../../components/Card';

export const MetricCard = ({ title, value, icon: Icon, color = 'text-sage', ariaLabel }) => {
  return (
    <Card 
      className="hover:shadow-md transition-shadow duration-200"
      aria-label={ariaLabel || `${title}: ${value}`}
    >
      <div className="flex items-center justify-between">
        <div className="min-w-0 flex-1">
          <h3 className="text-xs sm:text-sm font-medium text-gray-600 mb-1 truncate">{title}</h3>
          <p className={`text-xl sm:text-2xl font-bold ${color}`}>{value}</p>
        </div>
        {Icon && (
          <div className={`p-2 rounded-lg bg-gray-50 flex-shrink-0 ml-2`}>
            <Icon className={`h-5 w-5 sm:h-6 sm:w-6 ${color}`} />
          </div>
        )}
      </div>
    </Card>
  );
};