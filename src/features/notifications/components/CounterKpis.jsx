import React from 'react';
import { KpiCard } from './KpiCard';

export const CounterKpis = ({ stats, loading = false }) => {
  const kpis = [
    {
      title: 'Sin leer',
      value: stats?.unreadCount || 0,
      subtitle: 'Notificaciones pendientes',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM4 19h6v-7a1 1 0 011-1h4a1 1 0 011 1v7h6M4 10l8-6 8 6v9a1 1 0 01-1 1H5a1 1 0 01-1-1v-9z" />
        </svg>
      ),
      color: 'red'
    },
    {
      title: 'Esta semana',
      value: stats?.weeklyCount || 0,
      subtitle: 'Nuevas notificaciones',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
      color: 'orange'
    },
    {
      title: 'Importantes',
      value: stats?.importantCount || 0,
      subtitle: 'Requieren atención',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
      ),
      color: 'purple'
    },
    {
      title: 'Total',
      value: stats?.totalCount || 0,
      subtitle: 'Todas las notificaciones',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM4 19h6v-7a1 1 0 011-1h4a1 1 0 011 1v7h6M4 10l8-6 8 6v9a1 1 0 01-1 1H5a1 1 0 01-1-1v-9z" />
        </svg>
      ),
      color: 'blue'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {kpis.map((kpi, index) => (
        <KpiCard
          key={index}
          title={kpi.title}
          value={kpi.value}
          subtitle={kpi.subtitle}
          icon={kpi.icon}
          color={kpi.color}
          loading={loading}
        />
      ))}
    </div>
  );
};