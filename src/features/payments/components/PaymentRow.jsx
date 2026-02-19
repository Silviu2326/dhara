import React from 'react';
import { StatusBadge } from './StatusSelect';
import { PaymentMethodBadge } from './MethodSelect';
import { Download, RotateCcw, Eye, MoreHorizontal } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export const PaymentRow = ({ payment, onViewDetail, onDownloadInvoice, onRefund }) => {
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const formatDate = (dateString) => {
    try {
      return format(new Date(dateString), 'dd/MM/yyyy HH:mm', { locale: es });
    } catch {
      return dateString;
    }
  };

  const canRefund = payment.status === 'paid' && !payment.refunded;
  const hasInvoice = payment.status === 'paid';

  return (
    <tr className="hover:bg-gray-50 border-b border-gray-200">
      {/* Fecha */}
      <td className="px-4 py-3 text-sm text-gray-900">
        {formatDate(payment.date)}
      </td>
      
      {/* ID */}
      <td className="px-4 py-3 text-sm font-mono text-gray-600">
        {payment.id}
      </td>
      
      {/* Cliente */}
      <td className="px-4 py-3 text-sm text-gray-900">
        <div>
          <div className="font-medium">{payment.clientName}</div>
          {payment.clientEmail && (
            <div className="text-gray-500 text-xs">{payment.clientEmail}</div>
          )}
        </div>
      </td>
      
      {/* Concepto */}
      <td className="px-4 py-3 text-sm text-gray-900 max-w-xs">
        <div className="truncate" title={payment.concept}>
          {payment.concept}
        </div>
      </td>
      
      {/* Importe */}
      <td className="px-4 py-3 text-sm font-medium text-gray-900">
        {formatCurrency(payment.amount)}
      </td>
      
      {/* Comisión */}
      <td className="px-4 py-3 text-sm text-gray-600">
        {formatCurrency(payment.fee || 0)}
      </td>
      
      {/* Método */}
      <td className="px-4 py-3">
        <PaymentMethodBadge method={payment.method} />
      </td>
      
      {/* Estado */}
      <td className="px-4 py-3">
        <StatusBadge status={payment.status} />
      </td>
      
      {/* Acciones */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-1">
          {/* Ver detalle */}
          <button
            onClick={() => onViewDetail(payment)}
            className="p-1 text-gray-400 hover:text-gray-600 rounded"
            title="Ver detalle"
            aria-label={`Ver detalle del pago ${payment.id}`}
          >
            <Eye className="h-4 w-4" />
          </button>
          
          {/* Descargar factura */}
          {hasInvoice && (
            <button
              onClick={() => onDownloadInvoice(payment)}
              className="p-1 text-gray-400 hover:text-blue-600 rounded"
              title="Descargar factura"
              aria-label={`Descargar factura del pago ${payment.id}`}
            >
              <Download className="h-4 w-4" />
            </button>
          )}
          
          {/* Reembolsar */}
          {canRefund && (
            <button
              onClick={() => onRefund(payment)}
              className="p-1 text-gray-400 hover:text-orange-600 rounded"
              title="Reembolsar"
              aria-label={`Reembolsar pago ${payment.id}`}
            >
              <RotateCcw className="h-4 w-4" />
            </button>
          )}
          
          {/* Más opciones */}
          <button
            className="p-1 text-gray-400 hover:text-gray-600 rounded"
            title="Más opciones"
            aria-label={`Más opciones para el pago ${payment.id}`}
          >
            <MoreHorizontal className="h-4 w-4" />
          </button>
        </div>
      </td>
    </tr>
  );
};

// Componente para vista móvil (tarjeta)
export const PaymentCard = ({ payment, onViewDetail, onDownloadInvoice, onRefund }) => {
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const formatDate = (dateString) => {
    try {
      return format(new Date(dateString), 'dd MMM yyyy, HH:mm', { locale: es });
    } catch {
      return dateString;
    }
  };

  const canRefund = payment.status === 'paid' && !payment.refunded;
  const hasInvoice = payment.status === 'paid';

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="font-medium text-gray-900">{payment.clientName}</div>
          <div className="text-sm text-gray-500 font-mono">{payment.id}</div>
        </div>
        <StatusBadge status={payment.status} />
      </div>
      
      {/* Concepto */}
      <div className="text-sm text-gray-700">
        {payment.concept}
      </div>
      
      {/* Detalles */}
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <span className="text-gray-500">Importe:</span>
          <div className="font-medium">{formatCurrency(payment.amount)}</div>
        </div>
        <div>
          <span className="text-gray-500">Comisión:</span>
          <div>{formatCurrency(payment.fee || 0)}</div>
        </div>
        <div>
          <span className="text-gray-500">Fecha:</span>
          <div>{formatDate(payment.date)}</div>
        </div>
        <div>
          <span className="text-gray-500">Método:</span>
          <div className="mt-1">
            <PaymentMethodBadge method={payment.method} />
          </div>
        </div>
      </div>
      
      {/* Acciones */}
      <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
        <button
          onClick={() => onViewDetail(payment)}
          className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          <Eye className="h-4 w-4" />
          Detalle
        </button>
        
        {hasInvoice && (
          <button
            onClick={() => onDownloadInvoice(payment)}
            className="flex items-center gap-1 px-3 py-1.5 text-sm text-blue-600 hover:text-blue-800 border border-blue-300 rounded-lg hover:bg-blue-50"
          >
            <Download className="h-4 w-4" />
            Factura
          </button>
        )}
        
        {canRefund && (
          <button
            onClick={() => onRefund(payment)}
            className="flex items-center gap-1 px-3 py-1.5 text-sm text-orange-600 hover:text-orange-800 border border-orange-300 rounded-lg hover:bg-orange-50"
          >
            <RotateCcw className="h-4 w-4" />
            Reembolsar
          </button>
        )}
      </div>
    </div>
  );
};