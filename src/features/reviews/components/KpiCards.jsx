import React from 'react';
import { KpiCard } from './KpiCard';
import {
  Star,
  MessageSquare,
  TrendingUp,
  Clock,
  Users,
  AlertTriangle,
  CheckCircle,
  ThumbsUp
} from 'lucide-react';

export const KpiCards = ({ stats, loading = false, showAdvanced = true }) => {
  if (loading) {
    const cardCount = showAdvanced ? 6 : 3;
    return (
      <div className={`grid grid-cols-1 ${showAdvanced ? 'md:grid-cols-2 lg:grid-cols-3' : 'md:grid-cols-3'} gap-6`}>
        {Array.from({ length: cardCount }).map((_, i) => (
          <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div className="h-8 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/3"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  const {
    averageRating = 0,
    totalReviews = 0,
    last90DaysAverage = 0,
    last30DaysAverage = 0,
    responseRate = 0,
    satisfactionRate = 0,
    pendingResponses = 0,
    moderationQueue = 0,
    averageResponseTime = 0,
    repeatClients = 0,
    trend = {}
  } = stats || {};

  // Calculate satisfaction improvement from last month
  const satisfactionTrend = last30DaysAverage && last90DaysAverage
    ? {
        type: last30DaysAverage > last90DaysAverage ? 'positive' :
              last30DaysAverage < last90DaysAverage ? 'negative' : 'neutral',
        value: `${last30DaysAverage > last90DaysAverage ? '+' : ''}${Math.round((last30DaysAverage - last90DaysAverage) * 10) / 10}`,
        label: 'vs últimos 90 días'
      }
    : null;

  // Response rate trend calculation
  const responseRateTrend = responseRate >= 90
    ? { type: 'positive', value: 'Excelente', label: 'tasa de respuesta' }
    : responseRate >= 70
    ? { type: 'neutral', value: 'Buena', label: 'tasa de respuesta' }
    : { type: 'negative', value: 'Mejorable', label: 'tasa de respuesta' };

  // Base KPI cards (always shown)
  const baseKpiData = [
    {
      title: 'Valoración Media',
      value: averageRating.toFixed(1),
      subtitle: (
        <div className="flex items-center gap-1">
          <Star className="h-3 w-3 fill-current" />
          <span>de 5.0</span>
        </div>
      ),
      icon: Star,
      trend: trend?.rating,
      priority: averageRating < 3.5 ? 'critical' : averageRating < 4.0 ? 'warning' : 'good'
    },
    {
      title: 'Total Reseñas',
      value: totalReviews.toLocaleString(),
      subtitle: 'reseñas recibidas',
      icon: MessageSquare,
      trend: trend?.total,
      priority: totalReviews < 10 ? 'warning' : 'good'
    },
    {
      title: 'Últimos 30 días',
      value: last30DaysAverage > 0 ? last30DaysAverage.toFixed(1) : last90DaysAverage.toFixed(1),
      subtitle: 'promedio reciente',
      icon: TrendingUp,
      trend: satisfactionTrend || trend?.recent,
      priority: (last30DaysAverage || last90DaysAverage) < 3.5 ? 'critical' :
               (last30DaysAverage || last90DaysAverage) < 4.0 ? 'warning' : 'good'
    }
  ];

  // Advanced KPI cards (shown when showAdvanced is true)
  const advancedKpiData = [
    {
      title: 'Tasa de Respuesta',
      value: `${Math.round(responseRate)}%`,
      subtitle: `${pendingResponses} pendientes`,
      icon: CheckCircle,
      trend: responseRateTrend,
      priority: responseRate < 70 ? 'critical' : responseRate < 90 ? 'warning' : 'good'
    },
    {
      title: 'Satisfacción',
      value: `${Math.round(satisfactionRate)}%`,
      subtitle: (
        <div className="flex items-center gap-1">
          <span>reseñas positivas (4-5</span>
          <Star className="h-3 w-3 fill-current" />
          <span>)</span>
        </div>
      ),
      icon: ThumbsUp,
      trend: satisfactionRate >= 80
        ? { type: 'positive', value: 'Excelente', label: 'nivel de satisfacción' }
        : satisfactionRate >= 60
        ? { type: 'neutral', value: 'Buena', label: 'nivel de satisfacción' }
        : { type: 'negative', value: 'Mejorable', label: 'nivel de satisfacción' },
      priority: satisfactionRate < 60 ? 'critical' : satisfactionRate < 80 ? 'warning' : 'good'
    },
    {
      title: 'Tiempo de Respuesta',
      value: averageResponseTime > 0
        ? averageResponseTime < 24
          ? `${Math.round(averageResponseTime)}h`
          : `${Math.round(averageResponseTime / 24)}d`
        : 'N/A',
      subtitle: moderationQueue > 0
        ? `${moderationQueue} en moderación`
        : 'tiempo promedio',
      icon: Clock,
      trend: averageResponseTime > 0
        ? averageResponseTime <= 24
          ? { type: 'positive', value: 'Rápido', label: '≤24h' }
          : averageResponseTime <= 72
          ? { type: 'neutral', value: 'Normal', label: '≤3d' }
          : { type: 'negative', value: 'Lento', label: '>3d' }
        : null,
      priority: moderationQueue > 0 ? 'warning' :
               averageResponseTime > 72 ? 'critical' :
               averageResponseTime > 24 ? 'warning' : 'good'
    }
  ];

  const kpiData = showAdvanced
    ? [...baseKpiData, ...advancedKpiData]
    : baseKpiData;

  return (
    <>
      <div className={`grid grid-cols-1 ${
        showAdvanced
          ? 'md:grid-cols-2 lg:grid-cols-3'
          : 'md:grid-cols-3'
      } gap-6`}>
        {kpiData.map((kpi, index) => (
          <KpiCard key={index} {...kpi} />
        ))}
      </div>

      {/* Additional metrics summary for advanced view */}
      {showAdvanced && stats && (
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Repeat Clients */}
          {repeatClients > 0 && (
            <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
              <div className="flex items-center gap-2 mb-1">
                <Users className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-900">Clientes Recurrentes</span>
              </div>
              <div className="text-lg font-bold text-blue-900">{repeatClients}</div>
              <div className="text-xs text-blue-700">han vuelto para más sesiones</div>
            </div>
          )}

          {/* Moderation Queue Alert */}
          {moderationQueue > 0 && (
            <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 rounded-lg p-4 border border-yellow-200">
              <div className="flex items-center gap-2 mb-1">
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                <span className="text-sm font-medium text-yellow-900">Cola de Moderación</span>
              </div>
              <div className="text-lg font-bold text-yellow-900">{moderationQueue}</div>
              <div className="text-xs text-yellow-700">reseñas requieren revisión</div>
            </div>
          )}

          {/* Sentiment Summary */}
          {stats.sentimentSummary && (
            <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium text-green-900">Sentimiento</span>
              </div>
              <div className="text-lg font-bold text-green-900">
                {Math.round((stats.sentimentSummary.positive / (stats.sentimentSummary.positive + stats.sentimentSummary.neutral + stats.sentimentSummary.negative)) * 100)}%
              </div>
              <div className="text-xs text-green-700">comentarios positivos</div>
            </div>
          )}

          {/* Recent Activity */}
          {stats.reviewsThisMonth > 0 && (
            <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg p-4 border border-purple-200">
              <div className="flex items-center gap-2 mb-1">
                <MessageSquare className="h-4 w-4 text-purple-600" />
                <span className="text-sm font-medium text-purple-900">Este Mes</span>
              </div>
              <div className="text-lg font-bold text-purple-900">{stats.reviewsThisMonth}</div>
              <div className="text-xs text-purple-700">
                {stats.reviewsLastMonth > 0
                  ? `${stats.reviewsThisMonth > stats.reviewsLastMonth ? '+' : ''}${stats.reviewsThisMonth - stats.reviewsLastMonth} vs mes anterior`
                  : 'nuevas reseñas'
                }
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
};