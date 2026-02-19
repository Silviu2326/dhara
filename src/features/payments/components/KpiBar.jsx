import React from 'react';
import { KpiCard } from './KpiCard';
import { Euro, TrendingUp, Clock, CreditCard } from 'lucide-react';

export const KpiBar = ({ stats, loading = false }) => {
  const {
    monthlyRevenue = 0,
    yearlyRevenue = 0,
    lastPayment = null,
    pendingPayouts = 0,
    trends = {}
  } = stats || {};

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Sin pagos';
    try {
      return new Intl.DateTimeFormat('es-ES', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
      }).format(new Date(dateString));
    } catch {
      return dateString;
    }
  };

  const kpiData = [
    {
      title: 'Ingresos este mes',
      value: (
        <div className="flex flex-col">
          <div className="flex items-baseline gap-2">
            <span>{formatCurrency(monthlyRevenue / 1.21)}</span>
            <span className="text-xs font-normal text-gray-500">Neto</span>
          </div>
          <div className="flex items-baseline gap-2 text-sm text-gray-400 font-normal">
            <span>{formatCurrency(monthlyRevenue)}</span>
            <span className="text-xs">Bruto</span>
          </div>
        </div>
      ),
      subtitle: 'IVA 21% incluido',
      icon: Euro,
      trend: trends.monthly
    },
    {
      title: 'Ingresos año en curso',
      value: formatCurrency(yearlyRevenue),
      subtitle: 'Facturación anual',
      icon: TrendingUp,
      trend: trends.yearly
    },
    {
      title: 'Último cobro',
      value: lastPayment ? formatCurrency(lastPayment.amount) : '€0,00',
      subtitle: lastPayment ? formatDate(lastPayment.date) : 'Sin pagos recientes',
      icon: CreditCard,
      trend: null
    },
    {
      title: 'Pendiente transferencia',
      value: formatCurrency(pendingPayouts),
      subtitle: 'Saldo disponible',
      icon: Clock,
      trend: null
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {kpiData.map((kpi, index) => (
        <KpiCard key={index} {...kpi} loading={loading} />
      ))}
    </div>
  );
};