import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  KpiBar,
  PaymentsFilter,
  PaymentsTable,
  PaymentDetailModal,
  CreatePaymentModal,
  PayoutPanel,
  ExportButtons
} from './components';
import { Loader } from '../../components/Loader';
import {
  getPayments,
  getPaymentStats,
  getPayoutData,
  requestPayout,
  refundPayment,
  downloadInvoice,
  exportPayments,
  createPayment,
  getClientsForPayment,
  initializePaymentServices
} from './payments.api';

export const Payments = () => {
  const queryClient = useQueryClient();

  // State management
  const [filters, setFilters] = useState({
    status: 'all',
    method: 'all',
    search: '',
    dateRange: { startDate: null, endDate: null },
    sortBy: 'date',
    sortOrder: 'desc',
    page: 1,
    limit: 10
  });

  const [selectedPayment, setSelectedPayment] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success');
  const [servicesInitialized, setServicesInitialized] = useState(false);

  // Initialize services on component mount
  useEffect(() => {
    const initServices = async () => {
      try {
        const success = await initializePaymentServices();
        setServicesInitialized(success);
        if (!success) {
          showToast('Error al inicializar servicios de pago', 'error');
        }
      } catch (error) {
        console.error('Error initializing payment services:', error);
        setServicesInitialized(false);
        showToast('Error al inicializar servicios de pago', 'error');
      }
    };

    initServices();
  }, []);

  // Custom toast hook
  const useToast = () => {
    const showToast = (message, type = 'success') => {
      setToastMessage(message);
      setToastType(type);
      setTimeout(() => setToastMessage(''), 4000);
    };
    return { showToast };
  };

  const { showToast } = useToast();

  // Data queries
  const { data: paymentsData, isLoading: paymentsLoading, error: paymentsError } = useQuery({
    queryKey: ['payments', filters],
    queryFn: async () => {
      // Mock data for demonstration
      return {
        payments: [
          {
            id: 'pay_1',
            clientName: 'Ana García',
            amount: 50.00,
            status: 'completed',
            date: new Date().toISOString(),
            method: 'credit_card',
            description: 'Sesión de terapia individual'
          },
          {
            id: 'pay_2',
            clientName: 'Carlos Ruiz',
            amount: 75.00,
            status: 'pending',
            date: new Date(Date.now() - 86400000).toISOString(),
            method: 'bank_transfer',
            description: 'Paquete de 3 sesiones'
          },
          {
            id: 'pay_3',
            clientName: 'María López',
            amount: 60.00,
            status: 'failed',
            date: new Date(Date.now() - 172800000).toISOString(),
            method: 'credit_card',
            description: 'Consulta inicial'
          }
        ],
        total: 3,
        totalPages: 1
      };
    },
    keepPreviousData: true,
    enabled: true // Always enabled for mock data
  });

  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ['payment-stats'],
    queryFn: async () => {
      return {
        totalRevenue: 1250.00,
        pendingAmount: 350.00,
        completedPayments: 45,
        failedPayments: 2
      };
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: true
  });

  const { data: payoutData, isLoading: payoutLoading } = useQuery({
    queryKey: ['payout-data'],
    queryFn: async () => {
      return {
        availableBalance: 850.00,
        pendingBalance: 150.00,
        nextPayoutDate: new Date(Date.now() + 604800000).toISOString()
      };
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    enabled: true
  });

  // Get clients for payment creation
  const { data: clientsData } = useQuery({
    queryKey: ['clients-for-payment'],
    queryFn: getClientsForPayment,
    staleTime: 10 * 60 * 1000, // 10 minutes
    enabled: servicesInitialized
  });

  // Mutations
  const payoutMutation = useMutation({
    mutationFn: requestPayout,
    onSuccess: (data) => {
      showToast(data.message, 'success');
      queryClient.invalidateQueries(['payout-data']);
    },
    onError: (error) => {
      showToast(error.message, 'error');
    }
  });

  const refundMutation = useMutation({
    mutationFn: ({ paymentId, reason }) => refundPayment(paymentId, reason),
    onSuccess: (data) => {
      showToast(data.message, 'success');
      queryClient.invalidateQueries(['payments']);
      queryClient.invalidateQueries(['payment-stats']);
      setShowDetailModal(false);
    },
    onError: (error) => {
      showToast(error.message, 'error');
    }
  });

  const downloadMutation = useMutation({
    mutationFn: downloadInvoice,
    onSuccess: (data) => {
      // Simulate download
      const link = document.createElement('a');
      link.href = data.downloadUrl;
      link.download = data.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast('Factura descargada correctamente', 'success');
    },
    onError: (error) => {
      showToast('Error al descargar la factura', 'error');
    }
  });

  const exportMutation = useMutation({
    mutationFn: ({ filters, format }) => exportPayments(filters, format),
    onSuccess: (data) => {
      // Simulate download
      const link = document.createElement('a');
      link.href = data.downloadUrl;
      link.download = data.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast(`Archivo ${data.filename} descargado correctamente`, 'success');
    },
    onError: (error) => {
      showToast('Error al exportar los datos', 'error');
    }
  });

  const createPaymentMutation = useMutation({
    mutationFn: createPayment,
    onSuccess: (data) => {
      showToast(data.message, 'success');
      queryClient.invalidateQueries(['payments']);
      queryClient.invalidateQueries(['payment-stats']);
      setShowCreateModal(false);
    },
    onError: (error) => {
      showToast(error.message || 'Error al crear el cobro', 'error');
    }
  });

  // Event handlers
  const handleFiltersChange = (newFilters) => {
    setFilters({ ...newFilters, page: 1 }); // Reset page when filters change
  };

  const handleSort = (field, order) => {
    setFilters(prev => ({ ...prev, sortBy: field, sortOrder: order, page: 1 }));
  };

  const handleViewDetail = (payment) => {
    setSelectedPayment(payment);
    setShowDetailModal(true);
  };

  const handleDownloadInvoice = (payment) => {
    downloadMutation.mutate(payment.id);
  };

  const handleRefund = (payment) => {
    const reason = prompt('Motivo del reembolso (opcional):');
    if (reason !== null) { // User didn't cancel
      refundMutation.mutate({ paymentId: payment.id, reason });
    }
  };

  const handleRequestPayout = () => {
    payoutMutation.mutate();
  };

  const handleExportCSV = (filters) => {
    exportMutation.mutate({ filters, format: 'csv' });
  };

  const handleExportPDF = (filters) => {
    exportMutation.mutate({ filters, format: 'pdf' });
  };

  const handleCreatePayment = (paymentData) => {
    createPaymentMutation.mutate(paymentData);
  };

  // Loading state
  if (statsLoading && payoutLoading && paymentsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader />
      </div>
    );
  }

  // Error state
  if (paymentsError) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-deep">Pagos</h1>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <p className="text-red-800">Error al cargar los datos de pagos</p>
          <button 
            onClick={() => queryClient.invalidateQueries(['payments'])}
            className="mt-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-deep">Cobros</h1>
          <p className="text-gray-600 mt-1">Gestión de Cobros, ingresos y transferencias</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Crear Cobro
        </button>
      </div>

      {/* KPI Cards */}
      <KpiBar stats={statsData} loading={statsLoading} />

      {/* Filters */}
      <PaymentsFilter 
        filters={filters} 
        onFiltersChange={handleFiltersChange} 
      />

      {/* Payments Table */}
      <PaymentsTable
        payments={paymentsData?.payments}
        loading={paymentsLoading}
        onViewDetail={handleViewDetail}
        onDownloadInvoice={handleDownloadInvoice}
        onRefund={handleRefund}
        sortBy={filters.sortBy}
        sortOrder={filters.sortOrder}
        onSort={handleSort}
      />

      {/* Pagination */}
      {paymentsData && paymentsData.totalPages > 1 && (
        <div className="flex items-center justify-between bg-white border border-gray-200 rounded-lg px-4 py-3">
          <div className="text-sm text-gray-700">
            Mostrando {((filters.page - 1) * filters.limit) + 1} a {Math.min(filters.page * filters.limit, paymentsData.total)} de {paymentsData.total} resultados
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setFilters(prev => ({ ...prev, page: prev.page - 1 }))}
              disabled={filters.page <= 1}
              className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Anterior
            </button>
            <span className="px-3 py-1 text-sm">
              Página {filters.page} de {paymentsData.totalPages}
            </span>
            <button
              onClick={() => setFilters(prev => ({ ...prev, page: prev.page + 1 }))}
              disabled={filters.page >= paymentsData.totalPages}
              className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Siguiente
            </button>
          </div>
        </div>
      )}

      {/* Export Buttons */}
      <ExportButtons
        onExportCSV={handleExportCSV}
        onExportPDF={handleExportPDF}
        filters={filters}
        totalRecords={paymentsData?.total || 0}
        disabled={exportMutation.isLoading}
      />

      {/* Payout Panel */}
      <PayoutPanel
        payoutData={payoutData}
        loading={payoutLoading}
        onRequestPayout={handleRequestPayout}
      />

      {/* Payment Detail Modal */}
      <PaymentDetailModal
        payment={selectedPayment}
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        onDownloadInvoice={handleDownloadInvoice}
        onRefund={handleRefund}
      />

      {/* Create Payment Modal */}
      <CreatePaymentModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreatePayment}
      />

      {/* Toast Notifications */}
      {toastMessage && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg animate-slide-in ${
          toastType === 'success' ? 'bg-green-500 text-white' :
          toastType === 'error' ? 'bg-red-500 text-white' :
          'bg-blue-500 text-white'
        }`}>
          {toastMessage}
        </div>
      )}
    </div>
  );
};