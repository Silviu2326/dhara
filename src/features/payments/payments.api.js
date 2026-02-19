import { paymentService } from '../../services/api/paymentService';
import { subscriptionService } from '../../services/api/subscriptionService';
import { clientService } from '../../services/api/clientService';
import { notificationService } from '../../services/api/notificationService';

// Simulate API delay for better UX
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export const getPayments = async (filters = {}) => {
  try {
    await delay(200);

    // Transform filters to match service expectations
    const serviceFilters = {
      status: filters.status === 'all' ? null : filters.status,
      paymentMethod: filters.method === 'all' ? null : filters.method,
      dateFrom: filters.dateRange?.startDate,
      dateTo: filters.dateRange?.endDate,
      page: filters.page || 1,
      limit: filters.limit || 10,
      sortBy: filters.sortBy || 'createdAt',
      sortOrder: filters.sortOrder || 'desc'
    };

    // Add search functionality if provided
    if (filters.search) {
      serviceFilters.search = filters.search;
    }

    const result = await paymentService.getPayments(serviceFilters, {
      decryptSensitiveData: false,
      includeStatistics: false
    });


    return {
      payments: result.payments || [],
      total: result.pagination?.total || 0,
      page: result.pagination?.page || 1,
      totalPages: Math.ceil((result.pagination?.total || 0) / (filters.limit || 10))
    };
  } catch (error) {
    console.error('Error fetching payments:', error);


    throw error;
  }
};

export const getPaymentStats = async (period = 'month') => {
  try {
    await delay(200);

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    // Get financial statistics from service
    const [monthlyStats, yearlyStats] = await Promise.all([
      paymentService.getFinancialStatistics({
        dateFrom: startOfMonth.toISOString(),
        dateTo: now.toISOString(),
        groupBy: 'day',
        includeComparisons: true
      }),
      paymentService.getFinancialStatistics({
        dateFrom: startOfYear.toISOString(),
        dateTo: now.toISOString(),
        groupBy: 'month',
        includeComparisons: true
      })
    ]);

    // Get recent payments for last payment info
    const recentPayments = await paymentService.getPayments({
      status: 'completed',
      page: 1,
      limit: 1,
      sortBy: 'createdAt',
      sortOrder: 'desc'
    });

    const lastPayment = recentPayments.payments?.[0];

    // Get payout data
    let pendingPayouts = 0;
    try {
      const payoutData = await subscriptionService.getPayoutData();
      pendingPayouts = payoutData.availableBalance || 0;
    } catch (payoutError) {
      console.warn('Could not fetch payout data:', payoutError.message);
    }


    return {
      monthlyRevenue: monthlyStats.totalRevenue || 0,
      yearlyRevenue: yearlyStats.totalRevenue || 0,
      lastPayment: lastPayment ? {
        amount: lastPayment.amount,
        date: lastPayment.createdAt
      } : null,
      pendingPayouts,
      trends: {
        monthly: monthlyStats.trends?.current || { type: 'neutral', value: '0%', label: 'vs mes anterior' },
        yearly: yearlyStats.trends?.current || { type: 'neutral', value: '0%', label: 'vs año anterior' }
      }
    };
  } catch (error) {
    console.error('Error fetching payment stats:', error);


    // Return fallback data to prevent UI crashes
    return {
      monthlyRevenue: 0,
      yearlyRevenue: 0,
      lastPayment: null,
      pendingPayouts: 0,
      trends: {
        monthly: { type: 'neutral', value: '0%', label: 'vs mes anterior' },
        yearly: { type: 'neutral', value: '0%', label: 'vs año anterior' }
      }
    };
  }
};

export const getPayoutData = async () => {
  try {
    await delay(200);

    // Get payout data from subscription service
    const payoutData = await subscriptionService.getPayoutData();


    return payoutData;
  } catch (error) {
    console.error('Error fetching payout data:', error);


    // Return fallback data
    return {
      availableBalance: 0,
      nextPayoutDate: null,
      canRequestImmediate: false,
      minimumPayout: 10,
      processingDays: 2,
      payoutHistory: []
    };
  }
};

export const requestPayout = async (payoutData = {}) => {
  try {
    await delay(500);

    // Request payout through subscription service
    const result = await subscriptionService.requestPayout(payoutData);

    // Send notification about payout request
    try {
      await notificationService.createNotification({
        type: 'payout_requested',
        title: 'Transferencia solicitada',
        message: 'Tu solicitud de transferencia ha sido procesada. Recibirás el dinero en los próximos días hábiles.',
        metadata: {
          payoutId: result.payoutId,
          amount: payoutData.amount
        },
        channels: ['push', 'email'],
        priority: 'normal'
      });
    } catch (notificationError) {
      console.warn('Error sending payout notification:', notificationError.message);
    }


    return result;
  } catch (error) {
    console.error('Error requesting payout:', error);


    throw error;
  }
};

export const refundPayment = async (paymentId, reason = '') => {
  try {
    await delay(500);

    // Process refund through payment service
    const refund = await paymentService.refundPayment(paymentId, {
      notes: reason,
      requestedBy: 'therapist' // This should come from auth context
    }, {
      reason: paymentService.refundReasons.CUSTOMER_REQUEST,
      notifyCustomer: true
    });

    // Send additional notification
    try {
      await notificationService.createNotification({
        type: 'refund_processed',
        title: 'Reembolso procesado',
        message: `El reembolso de ${refund.amount}€ ha sido procesado correctamente.`,
        metadata: {
          paymentId,
          refundId: refund.id,
          amount: refund.amount,
          reason
        },
        channels: ['push', 'email'],
        priority: 'normal'
      });
    } catch (notificationError) {
      console.warn('Error sending refund notification:', notificationError.message);
    }


    return {
      success: true,
      message: 'Reembolso procesado correctamente',
      refundId: refund.id,
      estimatedDays: 3
    };
  } catch (error) {
    console.error('Error processing refund:', error);


    throw error;
  }
};

export const downloadInvoice = async (paymentId) => {
  try {
    await delay(300);

    // Get payment details first
    const payment = await paymentService.getPayment(paymentId, {
      includeInvoice: true,
      decryptSensitiveData: false
    });

    if (!payment.invoice) {
      // Create invoice if it doesn't exist
      await paymentService.createInvoice(paymentId, {
        description: payment.description || 'Therapy Session',
        dueDate: payment.createdAt
      });
    }

    // Generate download URL (this would typically be handled by the backend)
    const downloadUrl = `/api/payments/${paymentId}/invoice/download`;
    const filename = `factura-${paymentId}.pdf`;


    return {
      success: true,
      downloadUrl,
      filename
    };
  } catch (error) {
    console.error('Error downloading invoice:', error);


    throw error;
  }
};

export const exportPayments = async (filters = {}, format = 'csv') => {
  try {
    await delay(800);

    // Get all payments matching filters for export
    const exportFilters = {
      ...filters,
      page: 1,
      limit: 1000, // Large limit for export
      status: filters.status === 'all' ? null : filters.status,
      paymentMethod: filters.method === 'all' ? null : filters.method
    };

    const paymentsData = await paymentService.getPayments(exportFilters, {
      decryptSensitiveData: false,
      includeStatistics: false
    });

    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `pagos-${timestamp}.${format}`;

    // This would typically be handled by a dedicated export service
    const downloadUrl = `/api/payments/export?format=${format}&timestamp=${timestamp}`;


    return {
      success: true,
      downloadUrl,
      filename,
      recordCount: paymentsData.payments?.length || 0
    };
  } catch (error) {
    console.error('Error exporting payments:', error);


    throw error;
  }
};

export const updatePaymentMethod = async (paymentMethodData) => {
  try {
    await delay(500);

    // This would typically update user payment preferences

    return {
      success: true,
      message: 'Método de pago actualizado correctamente'
    };
  } catch (error) {
    console.error('Error updating payment method:', error);


    throw error;
  }
};

/**
 * Get clients list for payment creation
 * @returns {Promise<Array>} List of clients
 */
export const getClientsForPayment = async () => {
  try {
    await delay(200);

    const clients = await clientService.getClients({
      includeBasicInfo: true,
      includeContactInfo: true,
      status: 'active',
      limit: 100
    });


    return clients.clients || [];
  } catch (error) {
    console.error('Error fetching clients for payment:', error);


    // Return empty array to prevent UI crashes
    return [];
  }
};

/**
 * Initialize payment services
 * @returns {Promise<boolean>} Initialization success
 */
export const initializePaymentServices = async () => {
  try {
    // Initialize all required services
    await Promise.all([
      paymentService.initialize?.(),
      subscriptionService.initialize?.(),
      clientService.initialize?.(),
      notificationService.initialize?.()
    ].filter(Boolean));

    console.log('Payment services initialized successfully');
    return true;
  } catch (error) {
    console.error('Error initializing payment services:', error);
    return false;
  }
};

export const createPayment = async (paymentData) => {
  try {
    await delay(800);

    // Get client information if clientId is provided
    let clientInfo = null;
    if (paymentData.clientId) {
      try {
        clientInfo = await clientService.getClientById(paymentData.clientId, {
          includeBasicInfo: true
        });
      } catch (clientError) {
        console.warn('Could not fetch client info:', clientError.message);
      }
    }

    // Prepare payment data for service
    const servicePaymentData = {
      amount: parseFloat(paymentData.amount),
      currency: paymentData.currency || 'EUR',
      paymentMethod: paymentData.paymentMethod,
      description: paymentData.description,
      dueDate: paymentData.dueDate,
      payerId: paymentData.clientId,
      recipientId: 'therapist', // This should come from auth context
      metadata: {
        clientName: paymentData.clientName,
        clientEmail: paymentData.clientEmail,
        sessionType: paymentData.sessionType,
        notes: paymentData.notes
      }
    };

    // Create payment through service
    const payment = await paymentService.createPayment(servicePaymentData, {
      requireConfirmation: false,
      createInvoice: true,
      validateFraud: true
    });

    // Send notification to client if email provided
    if (paymentData.clientEmail) {
      try {
        await notificationService.createNotification({
          type: 'payment_created',
          title: 'Nuevo cobro generado',
          message: `Se ha generado un cobro de ${paymentData.amount}€ por ${paymentData.description}.`,
          recipientEmail: paymentData.clientEmail,
          metadata: {
            paymentId: payment.id,
            amount: paymentData.amount,
            description: paymentData.description
          },
          channels: ['email'],
          priority: 'normal'
        });
      } catch (notificationError) {
        console.warn('Error sending payment notification:', notificationError.message);
      }
    }


    return {
      success: true,
      message: 'Cobro creado correctamente',
      payment: {
        id: payment.id,
        date: payment.createdAt,
        clientName: paymentData.clientName,
        clientEmail: paymentData.clientEmail,
        concept: paymentData.description,
        amount: payment.amount,
        fee: payment.fees || 0,
        method: payment.paymentMethod,
        status: payment.status,
        transactionId: payment.providerTransactionId,
        taxRate: 0.21,
        currency: payment.currency,
        dueDate: payment.dueDate
      }
    };
  } catch (error) {
    console.error('Error creating payment:', error);


    throw error;
  }
};