import React from 'react';
import {
  XMarkIcon,
  CreditCardIcon,
  CalendarIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  DocumentArrowDownIcon
} from '@heroicons/react/24/outline';

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
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
    <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${config.color}`}>
      <Icon className="h-4 w-4" />
      {config.label}
    </span>
  );
};

const getPaymentMethodIcon = (method) => {
  switch (method) {
    case 'card':
      return <CreditCardIcon className="h-5 w-5" />;
    case 'transfer':
      return <div className="h-5 w-5 bg-blue-500 rounded text-white text-xs flex items-center justify-center font-bold">T</div>;
    case 'cash':
      return <div className="h-5 w-5 bg-green-500 rounded text-white text-xs flex items-center justify-center font-bold">€</div>;
    default:
      return <CreditCardIcon className="h-5 w-5" />;
  }
};

const getPaymentMethodLabel = (method) => {
  const methods = {
    card: 'Tarjeta de Crédito',
    transfer: 'Transferencia Bancaria',
    cash: 'Efectivo',
    paypal: 'PayPal',
    stripe: 'Stripe'
  };
  return methods[method] || method;
};

export const PaymentDetailsModal = ({
  isOpen,
  onClose,
  payment,
  onDownloadInvoice
}) => {
  if (!isOpen || !payment) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <CreditCardIcon className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Detalles del Pago</h2>
              <p className="text-sm text-gray-500">#{payment.invoiceNumber || payment.id}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Status and Amount */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-3xl font-bold text-gray-900">
                {formatCurrency(payment.amount, payment.currency)}
              </p>
              <p className="text-sm text-gray-500 mt-1">Importe del pago</p>
            </div>
            {getStatusBadge(payment.status)}
          </div>

          {/* Payment Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-sm font-medium text-gray-900 mb-3">Información del Pago</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <CalendarIcon className="h-4 w-4 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Fecha</p>
                      <p className="text-sm text-gray-600">{formatDate(payment.date || payment.createdAt)}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {getPaymentMethodIcon(payment.method)}
                    <div>
                      <p className="text-sm font-medium text-gray-900">Método de Pago</p>
                      <p className="text-sm text-gray-600">{getPaymentMethodLabel(payment.method)}</p>
                      {payment.last4 && (
                        <p className="text-xs text-gray-500">Terminada en •••• {payment.last4}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Additional Info */}
              {(payment.description || payment.notes) && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-gray-900 mb-2">Descripción</h3>
                  <p className="text-sm text-gray-600">{payment.description || payment.notes}</p>
                </div>
              )}
            </div>

            {/* Right Column */}
            <div className="space-y-4">
              {/* Transaction Details */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-sm font-medium text-gray-900 mb-3">Detalles de la Transacción</h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">ID de Transacción:</span>
                    <span className="font-mono text-gray-900">{payment.id}</span>
                  </div>

                  {payment.invoiceNumber && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Número de Factura:</span>
                      <span className="font-mono text-gray-900">{payment.invoiceNumber}</span>
                    </div>
                  )}

                  {payment.currency && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Moneda:</span>
                      <span className="text-gray-900">{payment.currency}</span>
                    </div>
                  )}

                  {payment.fees && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Comisiones:</span>
                      <span className="text-gray-900">{formatCurrency(payment.fees, payment.currency)}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Client Info */}
              {payment.client && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-gray-900 mb-2">Cliente</h3>
                  <p className="text-sm text-gray-600">{payment.client.name}</p>
                  {payment.client.email && (
                    <p className="text-xs text-gray-500">{payment.client.email}</p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Status Timeline */}
          {payment.statusHistory && payment.statusHistory.length > 0 && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-900 mb-3">Historial de Estados</h3>
              <div className="space-y-2">
                {payment.statusHistory.map((history, index) => (
                  <div key={index} className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">{history.status}</span>
                    <span className="text-gray-500">{formatDate(history.date)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
          <div className="text-xs text-gray-500">
            Última actualización: {formatDate(payment.updatedAt || payment.date)}
          </div>
          <div className="flex gap-3">
            {payment.invoiceUrl && onDownloadInvoice && (
              <button
                onClick={() => onDownloadInvoice(payment)}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
              >
                <DocumentArrowDownIcon className="h-4 w-4" />
                Descargar Factura
              </button>
            )}
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};