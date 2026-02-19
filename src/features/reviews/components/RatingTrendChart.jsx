import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import { Card } from '../../../components/Card';
import { TrendingUp, TrendingDown, Minus, Star } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export const RatingTrendChart = ({ data = [], loading = false }) => {
  if (loading) {
    return (
      <Card>
        <div className="h-80 flex items-center justify-center">
          <div className="animate-pulse space-y-4 w-full">
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card>
        <div className="h-80 flex items-center justify-center">
          <div className="text-center">
            <TrendingUp className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-600 mb-2">
              Sin datos suficientes
            </h3>
            <p className="text-gray-500 text-sm">
              Necesitas al menos 7 días de reseñas para ver la tendencia.
            </p>
          </div>
        </div>
      </Card>
    );
  }

  // Calcular tendencia
  const firstValue = data[0]?.rating || 0;
  const lastValue = data[data.length - 1]?.rating || 0;
  const trend = lastValue - firstValue;
  const trendPercentage = firstValue > 0 ? ((trend / firstValue) * 100).toFixed(1) : 0;

  const getTrendIcon = () => {
    if (trend > 0.1) return <TrendingUp className="h-4 w-4 text-green-600" />;
    if (trend < -0.1) return <TrendingDown className="h-4 w-4 text-red-600" />;
    return <Minus className="h-4 w-4 text-gray-600" />;
  };

  const getTrendColor = () => {
    if (trend > 0.1) return 'text-green-600';
    if (trend < -0.1) return 'text-red-600';
    return 'text-gray-600';
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const date = new Date(label);
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="text-sm font-medium text-gray-800">
            {format(date, 'dd MMM yyyy', { locale: es })}
          </p>
          <p className="text-sm text-sage">
            <span className="font-medium">Valoración promedio: </span>
            <div className="flex items-center gap-1">
              <span className="font-bold">{payload[0].value.toFixed(1)}</span>
              <Star className="h-3 w-3 fill-current" />
            </div>
          </p>
        </div>
      );
    }
    return null;
  };

  const formatXAxisDate = (tickItem) => {
    const date = new Date(tickItem);
    return format(date, 'dd MMM', { locale: es });
  };

  return (
    <Card>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-deep">
              Tendencia de Valoraciones
            </h3>
            <p className="text-sm text-gray-600">
              Media móvil de 30 días
            </p>
          </div>
          
          {/* Indicador de tendencia */}
          <div className="flex items-center gap-2">
            {getTrendIcon()}
            <div className="text-right">
              <div className={`text-sm font-medium ${getTrendColor()}`}>
                {trend > 0 ? '+' : ''}{trend.toFixed(2)}
              </div>
              <div className="text-xs text-gray-500">
                {trendPercentage > 0 ? '+' : ''}{trendPercentage}%
              </div>
            </div>
          </div>
        </div>

        {/* Gráfico */}
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={data}
              margin={{
                top: 5,
                right: 30,
                left: 20,
                bottom: 5,
              }}
            >
              <CartesianGrid 
                strokeDasharray="3 3" 
                stroke="#f0f0f0"
                vertical={false}
              />
              <XAxis 
                dataKey="date"
                tickFormatter={formatXAxisDate}
                stroke="#6b7280"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis 
                domain={[1, 5]}
                stroke="#6b7280"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => value}
              />
              <Tooltip content={<CustomTooltip />} />
              <Line 
                type="monotone" 
                dataKey="rating" 
                stroke="#10b981" 
                strokeWidth={3}
                dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: '#10b981', strokeWidth: 2 }}
                connectNulls={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Información adicional */}
        <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-100">
          <div className="text-center">
            <div className="text-lg font-bold text-deep">
              {Math.max(...data.map(d => d.rating)).toFixed(1)}
            </div>
            <div className="text-xs text-gray-500">Máximo</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-deep">
              {(data.reduce((sum, d) => sum + d.rating, 0) / data.length).toFixed(1)}
            </div>
            <div className="text-xs text-gray-500">Promedio</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-deep">
              {Math.min(...data.map(d => d.rating)).toFixed(1)}
            </div>
            <div className="text-xs text-gray-500">Mínimo</div>
          </div>
        </div>
      </div>
    </Card>
  );
};