import React, { useState } from 'react';
import { 
  CreditCardIcon, 
  CalendarIcon, 
  DocumentArrowDownIcon,
  EyeIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

const formatCurrency = (amount, currency = 'EUR') => {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: currency
  }).format(amount);
};

const getStatusBadge = (status) => {
  const statusConfig = {
    paid: { 
      label: 'Pagado', 
      color: 'bg-green-100 text-green-800',
      icon: CheckCircleIcon
    },
    pending: { 
      label: 'Pendiente', 
      color: 'bg-yellow-100 text-yellow-800',
      icon: ClockIcon
    },
    failed: { 
      label: 'Fallido', 
      color: 'bg-red-100 text-red-800',
      icon: XCircleIcon
    },
    refunded: { 
      label: 'Reembolsado', 
      color: 'bg-blue-100 text-blue-800',
      icon: ExclamationTriangleIcon
    },
    cancelled: { 
      label: 'Cancelado', 
      color: 'bg-gray-100 text-gray-800',
      icon: XCircleIcon
    }
  };
  
  const config = statusConfig[status] || statusConfig.pending;
  const Icon = config.icon;
  
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
      <Icon className="h-3 w-3" />
      {config.label}
    </span>
  );
};

const getPaymentMethodIcon = (method) => {
  switch (method) {
    case 'card':
      return <CreditCardIcon className="h-4 w-4" />;
    case 'transfer':
      return <div className="h-4 w-4 bg-blue-500 rounded text-white text-xs flex items-center justify-center font-bold">T</div>;
    case 'cash':
      return <div className="h-4 w-4 bg-green-500 rounded text-white text-xs flex items-center justify-center font-bold">€</div>;
    default:
      return <CreditCardIcon className="h-4 w-4" />;
  }
};

const getPaymentMethodLabel = (method) => {
  const methods = {
    card: 'Tarjeta',
    transfer: 'Transferencia',
    cash: 'Efectivo',
    paypal: 'PayPal',
    stripe: 'Stripe'
  };
  return methods[method] || method;
};

const PaymentRow = ({ payment, onViewDetails, onDownloadInvoice }) => {
  return (
    <tr className="hover:bg-gray-50">
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center gap-2">
          <CalendarIcon className="h-4 w-4 text-gray-400" />
          <div>
            <div className="text-sm font-medium text-gray-900">
              {formatDate(payment.date)}
            </div>
            <div className="text-sm text-gray-500">
              #{payment.invoiceNumber}
            </div>
          </div>
        </div>
      </td>
      
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm font-medium text-gray-900">
          {formatCurrency(payment.amount, payment.currency)}
        </div>
        {payment.description && (
          <div className="text-sm text-gray-500">{payment.description}</div>
        )}
      </td>
      
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center gap-2">
          {getPaymentMethodIcon(payment.method)}
          <span className="text-sm text-gray-900">
            {getPaymentMethodLabel(payment.method)}
          </span>
        </div>
        {payment.last4 && (
          <div className="text-sm text-gray-500">•••• {payment.last4}</div>
        )}
      </td>
      
      <td className="px-6 py-4 whitespace-nowrap">
        {getStatusBadge(payment.status)}
      </td>
      
      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
        <div className="flex items-center gap-1 justify-end">
          <button
            onClick={() => onViewDetails(payment)}
            className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
            title="Ver detalles"
          >
            <EyeIcon className="h-4 w-4" />
          </button>
          
          {payment.invoiceUrl && (
            <button
              onClick={() => onDownloadInvoice(payment)}
              className="p-1 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded"
              title="Descargar factura"
            >
              <DocumentArrowDownIcon className="h-4 w-4" />
            </button>
          )}
        </div>
      </td>
    </tr>
  );
};

const PaymentCard = ({ payment, onViewDetails, onDownloadInvoice }) => {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <CalendarIcon className="h-4 w-4 text-gray-400" />
          <span className="text-sm font-medium text-gray-900">
            {formatDate(payment.date)}
          </span>
        </div>
        {getStatusBadge(payment.status)}
      </div>
      
      <div className="space-y-2 mb-3">
        <div className="flex items-center justify-between">
          <span className="text-lg font-semibold text-gray-900">
            {formatCurrency(payment.amount, payment.currency)}
          </span>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            {getPaymentMethodIcon(payment.method)}
            {getPaymentMethodLabel(payment.method)}
            {payment.last4 && <span>•••• {payment.last4}</span>}
          </div>
        </div>
        
        <div className="text-sm text-gray-500">
          Factura #{payment.invoiceNumber}
        </div>
        
        {payment.description && (
          <div className="text-sm text-gray-600">{payment.description}</div>
        )}
      </div>
      
      <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
        <button
          onClick={() => onViewDetails(payment)}
          className="flex items-center gap-1 px-2 py-1 text-xs text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded"
        >
          <EyeIcon className="h-3 w-3" />
          Detalles
        </button>
        
        {payment.invoiceUrl && (
          <button
            onClick={() => onDownloadInvoice(payment)}
            className="flex items-center gap-1 px-2 py-1 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded"
          >
            <DocumentArrowDownIcon className="h-3 w-3" />
            Factura PDF
          </button>
        )}
      </div>
    </div>
  );
};

export const ClientPaymentsTable = ({ 
  clientId, 
  payments = [],
  onViewDetails,
  onDownloadInvoice
}) => {
  const [filter, setFilter] = useState('all'); // all, paid, pending, failed, refunded
  
  const filteredPayments = payments.filter(payment => {
    if (filter === 'all') return true;
    return payment.status === filter;
  });
  
  const sortedPayments = filteredPayments.sort((a, b) => new Date(b.date) - new Date(a.date));
  
  const getFilterCount = (filterType) => {
    if (filterType === 'all') return payments.length;
    return payments.filter(payment => payment.status === filterType).length;
  };
  
  const getTotalAmount = () => {
    return payments
      .filter(payment => payment.status === 'paid')
      .reduce((total, payment) => total + payment.amount, 0);
  };
  
  const getPendingAmount = () => {
    return payments
      .filter(payment => payment.status === 'pending')
      .reduce((total, payment) => total + payment.amount, 0);
  };
  
  if (payments.length === 0) {
    return (
      <div className="text-center py-12">
        <CreditCardIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No hay pagos</h3>
        <p className="text-gray-500">Este cliente aún no tiene historial de pagos.</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* Header con resumen */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-green-50 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <CheckCircleIcon className="h-5 w-5 text-green-600" />
            <span className="text-sm font-medium text-green-900">Total pagado</span>
          </div>
          <div className="text-2xl font-bold text-green-900 mt-1">
            {formatCurrency(getTotalAmount())}
          </div>
        </div>
        
        <div className="bg-yellow-50 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <ClockIcon className="h-5 w-5 text-yellow-600" />
            <span className="text-sm font-medium text-yellow-900">Pendiente</span>
          </div>
          <div className="text-2xl font-bold text-yellow-900 mt-1">
            {formatCurrency(getPendingAmount())}
          </div>
        </div>
        
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <CreditCardIcon className="h-5 w-5 text-blue-600" />
            <span className="text-sm font-medium text-blue-900">Total transacciones</span>
          </div>
          <div className="text-2xl font-bold text-blue-900 mt-1">
            {payments.length}
          </div>
        </div>
      </div>
      
      {/* Filtros */}
      <div className="flex flex-wrap gap-2">
        {[
          { key: 'all', label: 'Todos' },
          { key: 'paid', label: 'Pagados' },
          { key: 'pending', label: 'Pendientes' },
          { key: 'failed', label: 'Fallidos' },
          { key: 'refunded', label: 'Reembolsados' }
        ].map(({ key, label }) => {
          const count = getFilterCount(key);
          const isActive = filter === key;
          
          return (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {label} ({count})
            </button>
          );
        })}
      </div>
      
      {/* Tabla desktop */}
      <div className="hidden md:block bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Fecha
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Importe
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Método
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Estado
              </th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sortedPayments.map((payment) => (
              <PaymentRow
                key={payment.id}
                payment={payment}
                onViewDetails={onViewDetails}
                onDownloadInvoice={onDownloadInvoice}
              />
            ))}
          </tbody>
        </table>
      </div>
      
      {/* Cards mobile */}
      <div className="md:hidden space-y-4">
        {sortedPayments.map((payment) => (
          <PaymentCard
            key={payment.id}
            payment={payment}
            onViewDetails={onViewDetails}
            onDownloadInvoice={onDownloadInvoice}
          />
        ))}
      </div>
      
      {filteredPayments.length === 0 && payments.length > 0 && (
        <div className="text-center py-8">
          <p className="text-gray-500">No hay pagos que coincidan con el filtro seleccionado.</p>
        </div>
      )}
    </div>
  );
};