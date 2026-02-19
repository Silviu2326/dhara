import React, { useState } from 'react';
import { Card } from '../../../components/Card';
import { Wallet, Calendar, Send, ChevronDown, ChevronUp, AlertCircle, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export const PayoutPanel = ({ 
  payoutData, 
  loading = false, 
  onRequestPayout 
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isRequesting, setIsRequesting] = useState(false);

  if (loading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="h-20 bg-gray-200 rounded"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
          </div>
        </div>
      </Card>
    );
  }

  const {
    availableBalance = 0,
    nextPayoutDate = null,
    canRequestImmediate = false,
    payoutHistory = [],
    minimumPayout = 10,
    processingDays = 2
  } = payoutData || {};

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'No programada';
    try {
      return format(new Date(dateString), 'dd MMMM yyyy', { locale: es });
    } catch {
      return dateString;
    }
  };

  const handleRequestPayout = async () => {
    setIsRequesting(true);
    try {
      await onRequestPayout();
    } finally {
      setIsRequesting(false);
    }
  };

  const canRequest = availableBalance >= minimumPayout && canRequestImmediate && !isRequesting;

  return (
    <Card className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-green-100 rounded-lg">
            <Wallet className="h-6 w-6 text-green-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Transferencias
            </h3>
            <p className="text-sm text-gray-500">
              Gestión de cobros y transferencias
            </p>
          </div>
        </div>
        
        {/* Botón expandir en móvil */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="md:hidden p-2 text-gray-400 hover:text-gray-600 rounded-lg"
          aria-label="Expandir panel de transferencias"
        >
          {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
        </button>
      </div>

      {/* Contenido principal */}
      <div className={`space-y-6 ${isExpanded ? 'block' : 'hidden md:block'}`}>
        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Saldo disponible */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-800">Saldo disponible</p>
                <p className="text-2xl font-bold text-green-900 mt-1">
                  {formatCurrency(availableBalance)}
                </p>
                <p className="text-xs text-green-600 mt-1">
                  Mínimo: {formatCurrency(minimumPayout)}
                </p>
              </div>
              <Wallet className="h-8 w-8 text-green-600" />
            </div>
          </div>

          {/* Próxima transferencia */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-800">Próxima transferencia</p>
                <p className="text-lg font-semibold text-blue-900 mt-1">
                  {formatDate(nextPayoutDate)}
                </p>
                <p className="text-xs text-blue-600 mt-1">
                  Automática ({processingDays} días hábiles)
                </p>
              </div>
              <Calendar className="h-8 w-8 text-blue-600" />
            </div>
          </div>

          {/* Transferencia inmediata */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-800">Transferencia inmediata</p>
                <div className="mt-2">
                  {canRequest ? (
                    <button
                      onClick={handleRequestPayout}
                      disabled={isRequesting}
                      className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-white bg-sage rounded-lg hover:bg-sage/90 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Send className="h-4 w-4" />
                      {isRequesting ? 'Solicitando...' : 'Solicitar'}
                    </button>
                  ) : (
                    <div className="text-xs text-gray-500">
                      {availableBalance < minimumPayout ? (
                        <div className="flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          Saldo insuficiente
                        </div>
                      ) : !canRequestImmediate ? (
                        <div className="flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          No disponible
                        </div>
                      ) : (
                        'No disponible'
                      )}
                    </div>
                  )}
                </div>
              </div>
              <Send className="h-8 w-8 text-gray-400" />
            </div>
          </div>
        </div>

        {/* Información adicional */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <CheckCircle className="h-5 w-5 text-blue-600 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">Información sobre transferencias</p>
              <ul className="space-y-1 text-blue-700">
                <li>• Las transferencias automáticas se procesan cada {processingDays} días hábiles</li>
                <li>• Importe mínimo para transferencia: {formatCurrency(minimumPayout)}</li>
                <li>• Las transferencias inmediatas están sujetas a disponibilidad</li>
                <li>• Los fondos se transfieren a tu cuenta bancaria registrada</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Histórico de transferencias */}
        {payoutHistory && payoutHistory.length > 0 && (
          <div>
            <h4 className="font-medium text-gray-900 mb-4">Histórico de transferencias</h4>
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Fecha
                      </th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Importe
                      </th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Estado
                      </th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Tipo
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {payoutHistory.slice(0, 5).map((payout, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {formatDate(payout.date)}
                        </td>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">
                          {formatCurrency(payout.amount)}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            payout.status === 'completed' ? 'bg-green-100 text-green-800' :
                            payout.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            payout.status === 'failed' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {payout.status === 'completed' ? 'Completada' :
                             payout.status === 'pending' ? 'Pendiente' :
                             payout.status === 'failed' ? 'Fallida' : payout.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {payout.type === 'automatic' ? 'Automática' : 'Inmediata'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {payoutHistory.length > 5 && (
                <div className="px-4 py-3 bg-gray-50 text-center">
                  <button className="text-sm text-sage hover:text-sage/80 font-medium">
                    Ver todas las transferencias ({payoutHistory.length})
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};