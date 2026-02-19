import React from 'react';
import { MetricsGrid } from './components/MetricsGrid';
import { AlertsList } from './components/AlertsList';
import { MiniCalendar } from './components/MiniCalendar';
import { IncomeChart } from './components/IncomeChart';
import { QuickActions } from './components/QuickActions';
import { Loader } from '../../components/Loader';
import { ErrorBoundary } from '../../components/ErrorBoundary';
import { useDashboardData } from './hooks/useDashboardData';

export const Dashboard = () => {
  const { data: dashboardData, loading: isLoading, error, refresh } = useDashboardData();

  if (isLoading) {
    return <Loader />;
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600">Error al cargar el dashboard: {error}</p>
        <button
          onClick={refresh}
          className="mt-4 px-4 py-2 bg-sage text-white rounded hover:bg-sage/90"
        >
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
          <h1 className="text-2xl sm:text-3xl font-bold text-deep">Dashboard</h1>
          <p className="text-sm sm:text-base text-gray-600">Bienvenido al panel de control profesional</p>
        </div>

        {/* Métricas principales - Grid responsive */}
        <MetricsGrid metrics={dashboardData.metrics} />

        {/* Grid principal */}
        <div className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
          {/* Alertas - Ocupa más espacio en desktop */}
          <div className="lg:col-span-2 xl:col-span-2 order-1">
            <AlertsList alerts={dashboardData.alerts} />
          </div>

          {/* Mini calendario */}
          <div className="lg:col-span-1 order-2">
            <MiniCalendar appointments={dashboardData.appointments} />
          </div>

          {/* Acciones rápidas */}
          <div className="lg:col-span-1 order-3">
            <QuickActions onDataRefresh={refresh} />
          </div>
        </div>

        {/* Gráfico de ingresos - Ancho completo */}
        <div className="w-full order-4">
          <IncomeChart data={dashboardData.incomeData} />
        </div>
      </div>
    </ErrorBoundary>
  );
};