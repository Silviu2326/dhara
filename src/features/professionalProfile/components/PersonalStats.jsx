import React from 'react';
import { Users, Calendar, Star, TrendingUp, Clock, MessageSquare } from 'lucide-react';

export const PersonalStats = ({ stats = {} }) => {
  console.log('🎯 [PERSONAL STATS] Component received stats:', stats);

  // Datos por defecto si no se proporcionan
  const defaultStats = {
    totalSessions: 0,
    activeClients: 0,
    averageRating: 0,
    totalClients: 0,
    responseTime: 0, // en horas
    completionRate: 0, // porcentaje
    ...stats
  };

  console.log('📊 [PERSONAL STATS] Final defaultStats:', defaultStats);

  const formatNumber = (num) => {
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}k`;
    }
    return num.toString();
  };

  const formatResponseTime = (hours) => {
    if (hours < 1) {
      return `${Math.round(hours * 60)} min`;
    } else if (hours < 24) {
      return `${Math.round(hours)} h`;
    } else {
      return `${Math.round(hours / 24)} días`;
    }
  };

  const statItems = [
    {
      id: 'sessions',
      label: 'Sesiones impartidas',
      value: formatNumber(defaultStats.totalSessions),
      icon: Calendar,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      description: 'Total de sesiones completadas'
    },
    {
      id: 'clients',
      label: 'Clientes activos',
      value: formatNumber(defaultStats.activeClients),
      icon: Users,
      color: 'text-sage',
      bgColor: 'bg-sage/10',
      description: 'Clientes con citas programadas'
    },
    {
      id: 'rating',
      label: 'Valoración media',
      value: defaultStats.averageRating > 0 ? defaultStats.averageRating.toFixed(1) : '—',
      icon: Star,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
      description: 'Puntuación promedio de clientes',
      suffix: defaultStats.averageRating > 0 ? '/5' : ''
    },
    {
      id: 'totalClients',
      label: 'Total clientes',
      value: formatNumber(defaultStats.totalClients),
      icon: TrendingUp,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      description: 'Clientes atendidos históricamente'
    },
    {
      id: 'responseTime',
      label: 'Tiempo de respuesta',
      value: defaultStats.responseTime > 0 ? formatResponseTime(defaultStats.responseTime) : '—',
      icon: Clock,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      description: 'Tiempo promedio de respuesta a mensajes'
    },
    {
      id: 'completion',
      label: 'Tasa de finalización',
      value: defaultStats.completionRate > 0 ? `${defaultStats.completionRate}%` : '—',
      icon: MessageSquare,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
      description: 'Porcentaje de sesiones completadas'
    }
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <TrendingUp className="h-5 w-5 text-sage" />
        <h3 className="text-lg font-semibold text-deep">Métricas Personales</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {statItems.map((stat) => {
          const IconComponent = stat.icon;
          return (
            <div
              key={stat.id}
              className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between mb-3">
                <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                  <IconComponent className={`h-5 w-5 ${stat.color}`} />
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-deep">
                    {stat.value}
                    {stat.suffix && (
                      <span className="text-sm font-normal text-gray-500 ml-1">
                        {stat.suffix}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-1">
                  {stat.label}
                </h4>
                <p className="text-xs text-gray-600">
                  {stat.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Resumen adicional */}
      <div className="bg-gradient-to-r from-sage/10 to-deep/10 rounded-lg p-4">
        <h4 className="text-sm font-semibold text-deep mb-2">Resumen del mes</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="text-center">
            <div className="text-lg font-bold text-deep">
              {defaultStats.monthlySessions || 0}
            </div>
            <div className="text-gray-600">Sesiones este mes</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-deep">
              {defaultStats.newClients || 0}
            </div>
            <div className="text-gray-600">Nuevos clientes</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-deep">
              {defaultStats.monthlyRevenue ? `€${defaultStats.monthlyRevenue}` : '€0'}
            </div>
            <div className="text-gray-600">Ingresos estimados</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-deep">
              {defaultStats.satisfactionRate || 0}%
            </div>
            <div className="text-gray-600">Satisfacción</div>
          </div>
        </div>
      </div>

      {/* Nota informativa */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
        <p className="text-sm text-blue-800">
          <strong>Nota:</strong> Estas métricas se calculan automáticamente basándose en tu actividad 
          en la plataforma y las valoraciones de tus clientes. Se actualizan diariamente.
        </p>
      </div>
    </div>
  );
};