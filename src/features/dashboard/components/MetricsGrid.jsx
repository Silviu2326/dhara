import React from 'react';
import { MetricCard } from './MetricCard';
import { Euro, Calendar, MessageCircle, Star } from 'lucide-react';

export const MetricsGrid = ({ metrics }) => {
  const defaultMetrics = {
    monthlyIncome: '€2,340',
    weeklyAppointments: 12,
    unreadMessages: 3,
    averageRating: 4.9,
    ...metrics
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <MetricCard
        title="Ingresos este mes"
        value={defaultMetrics.monthlyIncome}
        icon={Euro}
        color="text-sage"
        ariaLabel={`Ingresos de este mes: ${defaultMetrics.monthlyIncome}`}
      />
      
      <MetricCard
        title="Sesiones esta semana"
        value={defaultMetrics.weeklyAppointments}
        icon={Calendar}
        color="text-sage"
        ariaLabel={`Sesiones agendadas esta semana: ${defaultMetrics.weeklyAppointments}`}
      />
      
      <MetricCard
        title="Mensajes sin leer"
        value={defaultMetrics.unreadMessages}
        icon={MessageCircle}
        color={defaultMetrics.unreadMessages > 0 ? 'text-orange-500' : 'text-sage'}
        ariaLabel={`Mensajes sin leer: ${defaultMetrics.unreadMessages}`}
      />
      
      <MetricCard
        title="Valoración media"
        value={`${defaultMetrics.averageRating} ★`}
        icon={Star}
        color="text-sage"
        ariaLabel={`Valoración media: ${defaultMetrics.averageRating} estrellas`}
      />
    </div>
  );
};