import React from 'react';
import { Card } from '../../../components/Card';

export const KpiCard = ({ title, value, subtitle, icon: Icon, trend }) => {
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-deep mt-1">{value}</p>
          {subtitle && (
            <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
          )}
        </div>
        {Icon && (
          <div className="p-3 bg-sage/10 rounded-lg">
            <Icon className="h-6 w-6 text-sage" />
          </div>
        )}
      </div>
      {trend && (
        <div className="mt-3 flex items-center text-sm">
          <span className={`font-medium ${
            trend.type === 'positive' ? 'text-green-600' : 
            trend.type === 'negative' ? 'text-red-600' : 'text-gray-600'
          }`}>
            {trend.value}
          </span>
          <span className="text-gray-500 ml-1">{trend.label}</span>
        </div>
      )}
    </Card>
  );
};