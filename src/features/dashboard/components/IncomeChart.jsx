import React from 'react';
import { Card } from '../../../components/Card';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Legend } from 'recharts';

export const IncomeChart = ({ data }) => {
  // Usar solo los datos reales de la API
  const chartData = data || [];

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const total = payload.reduce((sum, entry) => sum + entry.value, 0);
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="text-sm font-medium text-deep mb-2">{`${label}`}</p>
          {payload.map((entry, index) => (
            <p key={index} className="text-xs" style={{ color: entry.color }}>
              {`${getStatusLabel(entry.dataKey)}: €${entry.value.toLocaleString()}`}
            </p>
          ))}
          <div className="border-t mt-2 pt-2">
            <p className="text-sm font-semibold text-deep">
              {`Total: €${total.toLocaleString()}`}
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  const getStatusLabel = (status) => {
    const labels = {
      completed: 'Completados',
      pending: 'Pendientes',
      processing: 'Procesando',
      failed: 'Fallidos',
      cancelled: 'Cancelados'
    };
    return labels[status] || status;
  };

  // Si no hay datos, mostrar mensaje
  if (!chartData || chartData.length === 0) {
    return (
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base sm:text-lg font-semibold text-deep">Ingresos Mensuales</h2>
          <span className="text-sm text-gray-500">Últimos 6 meses</span>
        </div>
        <div className="h-80 flex items-center justify-center">
          <div className="text-center">
            <p className="text-gray-500">No hay datos de ingresos disponibles</p>
            <p className="text-sm text-gray-400 mt-2">Los datos aparecerán cuando haya pagos registrados</p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-deep">Ingresos Mensuales</h2>
        <span className="text-sm text-gray-500">Últimos 6 meses</span>
      </div>

      <div className="h-64 sm:h-80" role="img" aria-label="Gráfico de barras mostrando ingresos mensuales por estado de pago">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <XAxis
              dataKey="month"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: '#6B7280' }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: '#6B7280' }}
              tickFormatter={(value) => `€${value.toLocaleString()}`}
              label={{ value: 'Ingresos (€)', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: '#6B7280', fontSize: '12px' } }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ paddingTop: '20px' }}
              iconType="rect"
            />

            {/* Barras apiladas por estado */}
            <Bar
              dataKey="completed"
              stackId="payments"
              name="Completados"
              fill="#22C55E"
              radius={[0, 0, 0, 0]}
              className="hover:opacity-80 transition-opacity"
            />
            <Bar
              dataKey="processing"
              stackId="payments"
              name="Procesando"
              fill="#3B82F6"
              radius={[0, 0, 0, 0]}
              className="hover:opacity-80 transition-opacity"
            />
            <Bar
              dataKey="pending"
              stackId="payments"
              name="Pendientes"
              fill="#F59E0B"
              radius={[4, 4, 0, 0]}
              className="hover:opacity-80 transition-opacity"
            />
            <Bar
              dataKey="failed"
              stackId="payments"
              name="Fallidos"
              fill="#EF4444"
              radius={[0, 0, 0, 0]}
              className="hover:opacity-80 transition-opacity"
            />
            <Bar
              dataKey="cancelled"
              stackId="payments"
              name="Cancelados"
              fill="#6B7280"
              radius={[0, 0, 0, 0]}
              className="hover:opacity-80 transition-opacity"
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
      
      {/* Descripción oculta para accesibilidad */}
      <div className="sr-only">
        Gráfico de barras apiladas que muestra los ingresos mensuales por estado de pago de los últimos 6 meses.
        {chartData.map((item, index) => {
          const total = (item.completed || 0) + (item.pending || 0) + (item.processing || 0) + (item.failed || 0) + (item.cancelled || 0);
          return `${item.month}: Total €${total.toLocaleString()}${index < chartData.length - 1 ? ', ' : '.'}`;
        }).join('')}
      </div>
    </Card>
  );
};