import React, { useState, useMemo } from 'react';
import { Card } from '../../../components/Card';
import { 
  Calendar, 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Clock, 
  DollarSign,
  Activity,
  BarChart3,
  PieChart,
  ArrowUp,
  ArrowDown,
  Minus
} from 'lucide-react';

const AdvancedAnalytics = ({ bookings, dateRange = 'week' }) => {
  const [activeChart, setActiveChart] = useState('trends');
  const [selectedPeriod, setSelectedPeriod] = useState(dateRange);

  // Debug: Log analytics data
  React.useEffect(() => {
    console.log('🔍 AdvancedAnalytics - Received bookings:', bookings);
    console.log('🔍 AdvancedAnalytics - Bookings count:', bookings?.length);
    console.log('🔍 AdvancedAnalytics - First booking:', bookings?.[0]);
    console.log('🔍 AdvancedAnalytics - Date range:', dateRange);
  }, [bookings, dateRange]);

  // Calculate analytics data
  const analytics = useMemo(() => {
    console.log('🔍 AdvancedAnalytics - Starting analytics calculation');
    console.log('🔍 AdvancedAnalytics - Input bookings:', bookings?.length, bookings);

    if (!bookings || bookings.length === 0) {
      console.log('🔍 AdvancedAnalytics - No bookings data, returning empty analytics');
      return {
        currentRevenue: 0,
        previousRevenue: 0,
        currentTotal: 0,
        previousTotal: 0,
        currentCompleted: 0,
        previousCompleted: 0,
        currentCancellation: 0,
        previousCancellation: 0,
        currentNoShow: 0,
        previousNoShow: 0,
        revenueChange: 0,
        totalChange: 0,
        completionChange: 0,
        cancellationChange: 0,
        noShowChange: 0,
        dailyTrends: [],
        therapyTypes: {},
        statusDistribution: {}
      };
    }

    const now = new Date();
    const periods = {
      week: 7,
      month: 30,
      quarter: 90
    };

    const daysToAnalyze = periods[selectedPeriod] || 7;
    const currentPeriodStart = new Date(now.getTime() - (daysToAnalyze * 24 * 60 * 60 * 1000));
    const previousPeriodStart = new Date(currentPeriodStart.getTime() - (daysToAnalyze * 24 * 60 * 60 * 1000));

    console.log('🔍 AdvancedAnalytics - Period analysis:', {
      selectedPeriod,
      daysToAnalyze,
      currentPeriodStart: currentPeriodStart.toISOString(),
      previousPeriodStart: previousPeriodStart.toISOString(),
      now: now.toISOString()
    });

    // Current period bookings
    const currentBookings = bookings.filter(booking => {
      const bookingDate = new Date(booking.date);
      return bookingDate >= currentPeriodStart && bookingDate <= now;
    });

    // Previous period bookings
    const previousBookings = bookings.filter(booking => {
      const bookingDate = new Date(booking.date);
      return bookingDate >= previousPeriodStart && bookingDate < currentPeriodStart;
    });

    console.log('🔍 AdvancedAnalytics - Filtered bookings:', {
      total: bookings.length,
      current: currentBookings.length,
      previous: previousBookings.length
    });

    // Calculate metrics
    const currentRevenue = currentBookings
      .filter(b => b.status === 'completed' && b.paymentStatus === 'paid')
      .reduce((sum, b) => sum + (b.amount || 0), 0);

    const previousRevenue = previousBookings
      .filter(b => b.status === 'completed' && b.paymentStatus === 'paid')
      .reduce((sum, b) => sum + (b.amount || 0), 0);

    const currentTotal = currentBookings.length;
    const previousTotal = previousBookings.length;

    const currentCompleted = currentBookings.filter(b => b.status === 'completed').length;
    const previousCompleted = previousBookings.filter(b => b.status === 'completed').length;

    const currentCancellation = currentBookings.filter(b => b.status === 'cancelled').length;
    const previousCancellation = previousBookings.filter(b => b.status === 'cancelled').length;

    const currentNoShow = currentBookings.filter(b => b.status === 'no_show').length;
    const previousNoShow = previousBookings.filter(b => b.status === 'no_show').length;

    // Calculate percentage changes
    const calculateChange = (current, previous) => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return ((current - previous) / previous) * 100;
    };

    // Daily trends for chart
    const dailyTrends = [];
    for (let i = daysToAnalyze - 1; i >= 0; i--) {
      const date = new Date(now.getTime() - (i * 24 * 60 * 60 * 1000));
      const dateStr = date.toISOString().split('T')[0];
      const dayBookings = currentBookings.filter(b => b.date === dateStr);
      
      dailyTrends.push({
        date: dateStr,
        total: dayBookings.length,
        completed: dayBookings.filter(b => b.status === 'completed').length,
        cancelled: dayBookings.filter(b => b.status === 'cancelled').length,
        revenue: dayBookings
          .filter(b => b.status === 'completed' && b.paymentStatus === 'paid')
          .reduce((sum, b) => sum + (b.amount || 0), 0)
      });
    }

    // Hourly distribution
    const hourlyDistribution = {};
    currentBookings.forEach(booking => {
      const hour = parseInt(booking.startTime.split(':')[0]);
      hourlyDistribution[hour] = (hourlyDistribution[hour] || 0) + 1;
    });

    // Therapy type distribution
    const therapyDistribution = {};
    currentBookings.forEach(booking => {
      therapyDistribution[booking.therapyType] = (therapyDistribution[booking.therapyType] || 0) + 1;
    });

    // Status distribution
    const statusDistribution = {};
    currentBookings.forEach(booking => {
      statusDistribution[booking.status] = (statusDistribution[booking.status] || 0) + 1;
    });

    return {
      current: {
        total: currentTotal,
        completed: currentCompleted,
        revenue: currentRevenue,
        cancellation: currentCancellation,
        noShow: currentNoShow,
        completionRate: currentTotal > 0 ? (currentCompleted / currentTotal * 100) : 0,
        cancellationRate: currentTotal > 0 ? (currentCancellation / currentTotal * 100) : 0,
        averageValue: currentCompleted > 0 ? (currentRevenue / currentCompleted) : 0
      },
      previous: {
        total: previousTotal,
        completed: previousCompleted,
        revenue: previousRevenue,
        cancellation: previousCancellation,
        noShow: previousNoShow,
        completionRate: previousTotal > 0 ? (previousCompleted / previousTotal * 100) : 0,
        cancellationRate: previousTotal > 0 ? (previousCancellation / previousTotal * 100) : 0
      },
      changes: {
        total: calculateChange(currentTotal, previousTotal),
        revenue: calculateChange(currentRevenue, previousRevenue),
        completed: calculateChange(currentCompleted, previousCompleted),
        cancellation: calculateChange(currentCancellation, previousCancellation),
        completionRate: calculateChange(
          currentTotal > 0 ? (currentCompleted / currentTotal * 100) : 0,
          previousTotal > 0 ? (previousCompleted / previousTotal * 100) : 0
        )
      },
      trends: dailyTrends,
      distributions: {
        hourly: hourlyDistribution,
        therapy: therapyDistribution,
        status: statusDistribution
      }
    };
  }, [bookings, selectedPeriod]);

  const getChangeIcon = (change) => {
    if (change > 0) return <ArrowUp className="h-4 w-4 text-green-600" />;
    if (change < 0) return <ArrowDown className="h-4 w-4 text-red-600" />;
    return <Minus className="h-4 w-4 text-gray-400" />;
  };

  const getChangeColor = (change) => {
    if (change > 0) return 'text-green-600';
    if (change < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  const formatChange = (change) => {
    return `${change > 0 ? '+' : ''}${change.toFixed(1)}%`;
  };

  // Simple chart component
  const SimpleBarChart = ({ data, maxHeight = 100 }) => {
    const maxValue = Math.max(...data.map(d => d.value));
    
    return (
      <div className="flex items-end space-x-1 h-24">
        {data.map((item, index) => (
          <div key={index} className="flex flex-col items-center flex-1">
            <div 
              className="w-full bg-blue-500 rounded-t-sm transition-all duration-300 hover:bg-blue-600"
              style={{ 
                height: `${(item.value / maxValue) * maxHeight}px`,
                minHeight: item.value > 0 ? '4px' : '0px'
              }}
              title={`${item.label}: ${item.value}`}
            />
            <div className="text-xs text-gray-500 mt-1 transform rotate-45 origin-left">
              {item.label}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const SimplePieChart = ({ data }) => {
    const total = data.reduce((sum, d) => sum + d.value, 0);
    const colors = ['bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-red-500', 'bg-purple-500'];
    
    return (
      <div className="space-y-2">
        {data.map((item, index) => {
          const percentage = total > 0 ? (item.value / total * 100) : 0;
          return (
            <div key={index} className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${colors[index % colors.length]}`} />
              <span className="text-sm text-gray-700 flex-1">{item.label}</span>
              <span className="text-sm font-medium">{item.value}</span>
              <span className="text-xs text-gray-500">({percentage.toFixed(1)}%)</span>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Period Selector */}
      <div className="flex items-center space-x-4">
        <h3 className="text-lg font-semibold text-gray-900">Analytics Avanzado</h3>
        <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
          {[
            { key: 'week', label: '7 días' },
            { key: 'month', label: '30 días' },
            { key: 'quarter', label: '90 días' }
          ].map(period => (
            <button
              key={period.key}
              onClick={() => setSelectedPeriod(period.key)}
              className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                selectedPeriod === period.key
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {period.label}
            </button>
          ))}
        </div>
      </div>

      {/* Enhanced Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Appointments */}
        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Calendar className="h-8 w-8 text-blue-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-500">Citas Totales</p>
                  <p className="text-2xl font-semibold text-gray-900">{analytics.current.total}</p>
                </div>
              </div>
              <div className="flex items-center">
                {getChangeIcon(analytics.changes.total)}
                <span className={`text-sm font-medium ml-1 ${getChangeColor(analytics.changes.total)}`}>
                  {formatChange(analytics.changes.total)}
                </span>
              </div>
            </div>
          </div>
        </Card>

        {/* Revenue */}
        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <DollarSign className="h-8 w-8 text-green-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-500">Ingresos</p>
                  <p className="text-2xl font-semibold text-gray-900">€{analytics.current.revenue.toFixed(0)}</p>
                </div>
              </div>
              <div className="flex items-center">
                {getChangeIcon(analytics.changes.revenue)}
                <span className={`text-sm font-medium ml-1 ${getChangeColor(analytics.changes.revenue)}`}>
                  {formatChange(analytics.changes.revenue)}
                </span>
              </div>
            </div>
          </div>
        </Card>

        {/* Completion Rate */}
        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Activity className="h-8 w-8 text-purple-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-500">Tasa Completado</p>
                  <p className="text-2xl font-semibold text-gray-900">{analytics.current.completionRate.toFixed(1)}%</p>
                </div>
              </div>
              <div className="flex items-center">
                {getChangeIcon(analytics.changes.completionRate)}
                <span className={`text-sm font-medium ml-1 ${getChangeColor(analytics.changes.completionRate)}`}>
                  {formatChange(analytics.changes.completionRate)}
                </span>
              </div>
            </div>
          </div>
        </Card>

        {/* Average Value */}
        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <TrendingUp className="h-8 w-8 text-yellow-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-500">Valor Promedio</p>
                  <p className="text-2xl font-semibold text-gray-900">€{analytics.current.averageValue.toFixed(0)}</p>
                </div>
              </div>
              <div className="text-sm text-gray-500">
                por cita
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Trends Chart */}
        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-medium text-gray-900">Tendencias Diarias</h4>
              <BarChart3 className="h-5 w-5 text-gray-400" />
            </div>
            <SimpleBarChart 
              data={analytics.trends.map(trend => ({
                label: new Date(trend.date).getDate().toString(),
                value: trend.total
              }))}
            />
            <div className="mt-3 text-xs text-gray-500">
              Citas por día en los últimos {selectedPeriod === 'week' ? '7 días' : selectedPeriod === 'month' ? '30 días' : '90 días'}
            </div>
          </div>
        </Card>

        {/* Status Distribution */}
        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-medium text-gray-900">Estado de Citas</h4>
              <PieChart className="h-5 w-5 text-gray-400" />
            </div>
            <SimplePieChart 
              data={Object.entries(analytics.distributions.status).map(([status, count]) => ({
                label: status === 'upcoming' ? 'Próximas' : 
                       status === 'completed' ? 'Completadas' :
                       status === 'cancelled' ? 'Canceladas' :
                       status === 'no_show' ? 'No asistió' : status,
                value: count
              }))}
            />
          </div>
        </Card>

        {/* Hourly Distribution */}
        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-medium text-gray-900">Distribución Horaria</h4>
              <Clock className="h-5 w-5 text-gray-400" />
            </div>
            <SimpleBarChart 
              data={Object.entries(analytics.distributions.hourly)
                .sort(([a], [b]) => parseInt(a) - parseInt(b))
                .map(([hour, count]) => ({
                  label: `${hour}:00`,
                  value: count
                }))}
            />
            <div className="mt-3 text-xs text-gray-500">
              Citas por hora del día
            </div>
          </div>
        </Card>

        {/* Therapy Types */}
        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-medium text-gray-900">Tipos de Terapia</h4>
              <Users className="h-5 w-5 text-gray-400" />
            </div>
            <SimplePieChart 
              data={Object.entries(analytics.distributions.therapy).map(([therapy, count]) => ({
                label: therapy,
                value: count
              }))}
            />
          </div>
        </Card>
      </div>

      {/* Insights */}
      <Card>
        <div className="p-6">
          <h4 className="text-lg font-medium text-gray-900 mb-4">💡 Insights Inteligentes</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {analytics.changes.total > 10 && (
              <div className="p-3 bg-green-50 rounded-lg">
                <p className="text-sm font-medium text-green-800">📈 Crecimiento Fuerte</p>
                <p className="text-xs text-green-600 mt-1">
                  Tus citas han aumentado {analytics.changes.total.toFixed(1)}% comparado al período anterior
                </p>
              </div>
            )}
            
            {analytics.current.cancellationRate > 15 && (
              <div className="p-3 bg-yellow-50 rounded-lg">
                <p className="text-sm font-medium text-yellow-800">⚠️ Muchas Cancelaciones</p>
                <p className="text-xs text-yellow-600 mt-1">
                  Tasa de cancelación del {analytics.current.cancellationRate.toFixed(1)}%. Considera implementar recordatorios.
                </p>
              </div>
            )}
            
            {analytics.current.completionRate > 90 && (
              <div className="p-3 bg-blue-50 rounded-lg">
                <p className="text-sm font-medium text-blue-800">🎯 Excelente Servicio</p>
                <p className="text-xs text-blue-600 mt-1">
                  Tasa de completado del {analytics.current.completionRate.toFixed(1)}%. ¡Excelente trabajo!
                </p>
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
};

export { AdvancedAnalytics };