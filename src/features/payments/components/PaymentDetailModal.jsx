import React, { useEffect } from 'react';
import { X, Download, RotateCcw, CreditCard, Calendar, User, FileText, AlertTriangle } from 'lucide-react';
import { StatusBadge } from './StatusSelect';
import { PaymentMethodIcon } from './MethodSelect';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export const PaymentDetailModal = ({ 
  payment, 
  isOpen, 
  onClose, 
  onDownloadInvoice, 
  onRefund 
}) => {
  // Cerrar modal con ESC
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen || !payment) return null;

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const formatDate = (dateString) => {
    try {
      return format(new Date(dateString), 'dd MMMM yyyy, HH:mm', { locale: es });
    } catch {
      return dateString;
    }
  };

  const calculateNet = () => {
    const base = payment.amount || 0;
    const fee = payment.fee || 0;
    return base - fee;
  };

  const calculateTax = () => {
    const base = payment.amount || 0;
    const taxRate = payment.taxRate || 0.21; // 21% IVA por defecto
    return (base / (1 + taxRate)) * taxRate;
  };

  const calculateBaseAmount = () => {
    const total = payment.amount || 0;
    const taxRate = payment.taxRate || 0.21;
    return total / (1 + taxRate);
  };

  const canRefund = payment.status === 'paid' && !payment.refunded;
  const hasInvoice = payment.status === 'paid';

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Overlay */}
        <div 
          className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
          onClick={onClose}
        ></div>

        {/* Modal */}
        <div className="inline-block w-full max-w-2xl p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-lg">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-sage/10 rounded-lg">
                <CreditCard className="h-6 w-6 text-sage" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Detalle del pago
                </h3>
                <p className="text-sm text-gray-500 font-mono">{payment.id}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
              aria-label="Cerrar modal"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Contenido */}
          <div className="space-y-6">
            {/* Información del cliente */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <User className="h-4 w-4 text-gray-600" />
                <h4 className="font-medium text-gray-900">Información del cliente</h4>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Nombre</label>
                  <p className="text-gray-900">{payment.clientName}</p>
                </div>
                {payment.clientEmail && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">Email</label>
                    <p className="text-gray-900">{payment.clientEmail}</p>
                  </div>
                )}
                {payment.clientPhone && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">Teléfono</label>
                    <p className="text-gray-900">{payment.clientPhone}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Detalles del pago */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Calendar className="h-4 w-4 text-gray-600" />
                  <h4 className="font-medium text-gray-900">Detalles del pago</h4>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Fecha</label>
                    <p className="text-gray-900">{formatDate(payment.date)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Estado</label>
                    <div className="mt-1">
                      <StatusBadge status={payment.status} />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Método de pago</label>
                    <div className="flex items-center gap-2 mt-1">
                      <PaymentMethodIcon method={payment.method} />
                      <span className="text-gray-900 capitalize">{payment.method}</span>
                    </div>
                  </div>
                  {payment.transactionId && (
                    <div>
                      <label className="text-sm font-medium text-gray-600">ID Transacción</label>
                      <p className="text-gray-900 font-mono text-sm">{payment.transactionId}</p>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-3">
                  <FileText className="h-4 w-4 text-gray-600" />
                  <h4 className="font-medium text-gray-900">Desglose económico</h4>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Base imponible:</span>
                    <span className="font-medium">{formatCurrency(calculateBaseAmount())}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">IVA ({((payment.taxRate || 0.21) * 100).toFixed(0)}%):</span>
                    <span className="font-medium">{formatCurrency(calculateTax())}</span>
                  </div>
                  <div className="flex justify-between border-t pt-2">
                    <span className="text-sm font-medium text-gray-900">Total:</span>
                    <span className="font-bold text-lg">{formatCurrency(payment.amount)}</span>
                  </div>
                  <div className="flex justify-between text-red-600">
                    <span className="text-sm">Comisión pasarela:</span>
                    <span className="font-medium">-{formatCurrency(payment.fee || 0)}</span>
                  </div>
                  <div className="flex justify-between border-t pt-2 bg-green-50 -mx-3 px-3 py-2 rounded">
                    <span className="text-sm font-medium text-green-800">Importe neto:</span>
                    <span className="font-bold text-green-800">{formatCurrency(calculateNet())}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Concepto */}
            <div>
              <label className="text-sm font-medium text-gray-600">Concepto</label>
              <p className="text-gray-900 mt-1 p-3 bg-gray-50 rounded-lg">{payment.concept}</p>
            </div>

            {/* Información adicional */}
            {payment.notes && (
              <div>
                <label className="text-sm font-medium text-gray-600">Notas</label>
                <p className="text-gray-900 mt-1 p-3 bg-gray-50 rounded-lg">{payment.notes}</p>
              </div>
            )}

            {/* Alertas */}
            {payment.status === 'failed' && (
              <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
                <div>
                  <h5 className="font-medium text-red-800">Pago fallido</h5>
                  <p className="text-sm text-red-700 mt-1">
                    {payment.failureReason || 'El pago no pudo ser procesado. Contacta con el cliente para intentar nuevamente.'}
                  </p>
                </div>
              </div>
            )}

            {payment.refunded && (
              <div className="flex items-start gap-3 p-4 bg-orange-50 border border-orange-200 rounded-lg">
                <RotateCcw className="h-5 w-5 text-orange-600 mt-0.5" />
                <div>
                  <h5 className="font-medium text-orange-800">Pago reembolsado</h5>
                  <p className="text-sm text-orange-700 mt-1">
                    Reembolsado el {payment.refundDate ? formatDate(payment.refundDate) : 'fecha no disponible'}
                  </p>
                  {payment.refundReason && (
                    <p className="text-sm text-orange-700 mt-1">
                      Motivo: {payment.refundReason}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Acciones */}
          <div className="flex items-center justify-end gap-3 mt-8 pt-6 border-t border-gray-200">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-sage focus:border-transparent"
            >
              Cerrar
            </button>
            
            {hasInvoice && (
              <button
                onClick={() => onDownloadInvoice(payment)}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-700 bg-blue-50 border border-blue-300 rounded-lg hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <Download className="h-4 w-4" />
                Descargar factura
              </button>
            )}
            
            {canRefund && (
              <button
                onClick={() => onRefund(payment)}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-orange-600 border border-transparent rounded-lg hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              >
                <RotateCcw className="h-4 w-4" />
                Reembolsar
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};