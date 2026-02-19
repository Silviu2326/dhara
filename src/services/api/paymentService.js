import { apiClient } from '../config/apiClient';
import { ENDPOINTS } from '../config/endpoints';
import { logger } from '../utils/logger';
import { cache } from '../utils/cache';
import { errorHandler } from '../utils/errorHandler';
import { privacy } from '../utils/privacy';
import { security } from '../utils/security';
import { auditService } from '../utils/auditService';

class PaymentService {
  constructor() {
    this.baseEndpoint = 'payments';
    this.cachePrefix = 'payment_';
    this.cacheTags = ['payments', 'transactions', 'billing'];
    this.defaultCacheTTL = 300;
    this.isInitialized = false;

    this.paymentStates = {
      PENDING: 'pending',
      PROCESSING: 'processing',
      COMPLETED: 'completed',
      FAILED: 'failed',
      CANCELLED: 'cancelled',
      REFUNDED: 'refunded',
      DISPUTED: 'disputed',
      PARTIALLY_REFUNDED: 'partially_refunded',
      EXPIRED: 'expired'
    };

    this.paymentMethods = {
      CREDIT_CARD: 'credit_card',
      DEBIT_CARD: 'debit_card',
      BANK_TRANSFER: 'bank_transfer',
      PAYPAL: 'paypal',
      APPLE_PAY: 'apple_pay',
      GOOGLE_PAY: 'google_pay',
      STRIPE: 'stripe',
      MERCADO_PAGO: 'mercado_pago',
      OXXO: 'oxxo',
      SPEI: 'spei',
      CASH: 'cash'
    };

    this.paymentTypes = {
      SESSION: 'session',
      PACKAGE: 'package',
      SUBSCRIPTION: 'subscription',
      DEPOSIT: 'deposit',
      FINE: 'fine',
      REFUND: 'refund',
      ADJUSTMENT: 'adjustment'
    };

    this.currencies = {
      USD: 'USD',
      EUR: 'EUR',
      MXN: 'MXN',
      COP: 'COP',
      ARS: 'ARS',
      CLP: 'CLP',
      PEN: 'PEN',
      BRL: 'BRL'
    };

    this.paymentProviders = {
      STRIPE: 'stripe',
      PAYPAL: 'paypal',
      MERCADO_PAGO: 'mercado_pago',
      OPENPAY: 'openpay',
      WOMPI: 'wompi',
      CULQI: 'culqi',
      PAGSEGURO: 'pagseguro'
    };

    this.disputeStates = {
      OPENED: 'opened',
      UNDER_REVIEW: 'under_review',
      EVIDENCE_REQUIRED: 'evidence_required',
      RESOLVED: 'resolved',
      LOST: 'lost',
      WON: 'won',
      ACCEPTED: 'accepted'
    };

    this.refundReasons = {
      CUSTOMER_REQUEST: 'customer_request',
      DUPLICATE_CHARGE: 'duplicate_charge',
      FRAUDULENT: 'fraudulent',
      SUBSCRIPTION_CANCELLATION: 'subscription_cancellation',
      ORDER_CHANGE: 'order_change',
      SERVICE_NOT_PROVIDED: 'service_not_provided',
      TECHNICAL_ERROR: 'technical_error'
    };

    this.invoiceStates = {
      DRAFT: 'draft',
      PENDING: 'pending',
      SENT: 'sent',
      PAID: 'paid',
      OVERDUE: 'overdue',
      CANCELLED: 'cancelled',
      REFUNDED: 'refunded'
    };

    this.receiptTypes = {
      PAYMENT: 'payment',
      REFUND: 'refund',
      ADJUSTMENT: 'adjustment',
      CREDIT_NOTE: 'credit_note'
    };

    this.fraudRiskLevels = {
      LOW: 'low',
      MEDIUM: 'medium',
      HIGH: 'high',
      BLOCKED: 'blocked'
    };
  }

  async initialize() {
    if (this.isInitialized) return;

    try {
      logger.info('Initializing PaymentService');

      // Initialize payment providers
      await this.initializePaymentProviders();

      // Setup periodic payment status updates
      this.setupPeriodicStatusUpdates();

      this.isInitialized = true;
    } catch (error) {
      logger.error('Failed to initialize PaymentService', error);
      throw error;
    }
  }

  async initializePaymentProviders() {
    try {
      const response = await apiClient.get(ENDPOINTS.payments.getProviders);
      this.availableProviders = response.data.providers || [];
      logger.info('Payment providers initialized', {
        providers: this.availableProviders.map(p => p.name)
      });
    } catch (error) {
      logger.warn('Failed to initialize payment providers', error);
      this.availableProviders = [];
    }
  }

  async createPayment(paymentData, options = {}) {
    try {
      const {
        encryptSensitiveData = true,
        validateFraud = true,
        requireConfirmation = false,
        createInvoice = true,
        createAuditLog = true
      } = options;

      logger.info('Creating payment', {
        amount: paymentData.amount,
        currency: paymentData.currency,
        paymentMethod: paymentData.paymentMethod,
        payerId: paymentData.payerId,
        recipientId: paymentData.recipientId
      });

      // Validate payment data
      this.validatePaymentData(paymentData);

      // Fraud detection
      if (validateFraud) {
        const fraudCheck = await this.checkFraudRisk(paymentData);
        if (fraudCheck.riskLevel === this.fraudRiskLevels.BLOCKED) {
          throw errorHandler.createValidationError(
            'Payment blocked due to fraud risk',
            fraudCheck.reasons
          );
        }
        paymentData.fraudRisk = fraudCheck;
      }

      let processedData = {
        ...paymentData,
        paymentId: security.generateSecureId('pay_'),
        status: requireConfirmation ? this.paymentStates.PENDING : this.paymentStates.PROCESSING,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        attemptCount: 0
      };

      // Calculate fees and taxes
      const feeCalculation = await this.calculateFees(processedData);
      processedData.fees = feeCalculation.fees;
      processedData.taxes = feeCalculation.taxes;
      processedData.netAmount = feeCalculation.netAmount;

      if (encryptSensitiveData) {
        const encryptionKey = await privacy.generateEncryptionKey(
          paymentData.payerId,
          processedData.paymentId
        );

        processedData = await privacy.encryptSensitiveData(processedData, encryptionKey);
        processedData._encryptionKeyId = processedData.paymentId;
      }

      const sanitizedData = privacy.sanitizeForLogging(processedData);
      logger.info('Creating payment with sanitized data', { data: sanitizedData });

      const response = await apiClient.post(
        ENDPOINTS.payments.create,
        processedData
      );

      const payment = response.data;

      // Create invoice if requested
      if (createInvoice) {
        await this.createInvoice(payment.id, {
          dueDate: paymentData.dueDate,
          description: paymentData.description
        });
      }

      // Process payment immediately if not requiring confirmation
      if (!requireConfirmation) {
        await this.processPayment(payment.id);
      }

      this.invalidateCache(['payments', 'transactions'], paymentData.payerId);

      if (createAuditLog) {
        await auditService.logEvent({
          eventType: 'create',
          entityType: 'payment',
          entityId: payment.id,
          action: 'create_payment',
          details: {
            amount: paymentData.amount,
            currency: paymentData.currency,
            paymentMethod: paymentData.paymentMethod,
            payerId: paymentData.payerId,
            recipientId: paymentData.recipientId
          },
          userId: paymentData.createdBy || paymentData.payerId
        });
      }

      privacy.logDataAccess(
        paymentData.payerId,
        'payment',
        'create',
        { paymentId: payment.id }
      );

      logger.info('Payment created successfully', {
        paymentId: payment.id,
        amount: paymentData.amount,
        currency: paymentData.currency
      });

      return payment;
    } catch (error) {
      logger.error('Failed to create payment', error);
      throw errorHandler.handle(error);
    }
  }

  async processPayment(paymentId, options = {}) {
    try {
      const {
        provider = null,
        confirmationCode = null,
        createAuditLog = true
      } = options;

      logger.info('Processing payment', { paymentId, provider });

      const payment = await this.getPayment(paymentId, { decryptSensitiveData: false });

      const processingData = {
        payment_id: paymentId,
        provider: provider || this.selectPaymentProvider(payment),
        confirmation_code: confirmationCode,
        processed_at: new Date().toISOString()
      };

      const response = await apiClient.post(
        ENDPOINTS.payments.process.replace(':paymentId', paymentId),
        processingData
      );

      const processedPayment = response.data;

      // Update payment status
      await this.updatePaymentStatus(paymentId, {
        status: processedPayment.status,
        providerTransactionId: processedPayment.providerTransactionId,
        processedAt: new Date().toISOString()
      });

      // Handle post-processing tasks
      if (processedPayment.status === this.paymentStates.COMPLETED) {
        await this.handleSuccessfulPayment(paymentId);
      } else if (processedPayment.status === this.paymentStates.FAILED) {
        await this.handleFailedPayment(paymentId, processedPayment.failureReason);
      }

      this.invalidateCache(['payments', 'transactions'], payment.payerId);

      if (createAuditLog) {
        await auditService.logEvent({
          eventType: 'update',
          entityType: 'payment',
          entityId: paymentId,
          action: 'process_payment',
          details: {
            provider: processingData.provider,
            status: processedPayment.status,
            providerTransactionId: processedPayment.providerTransactionId
          },
          userId: payment.payerId
        });
      }

      logger.info('Payment processed successfully', {
        paymentId,
        status: processedPayment.status,
        provider: processingData.provider
      });

      return processedPayment;
    } catch (error) {
      logger.error('Failed to process payment', { paymentId, error });
      throw errorHandler.handle(error);
    }
  }

  async getPayment(paymentId, options = {}) {
    try {
      const {
        decryptSensitiveData = true,
        includeTransactions = false,
        includeInvoice = false,
        includeReceipts = false
      } = options;

      const cacheKey = `${this.cachePrefix}${paymentId}`;
      let payment = cache.get(cacheKey);

      if (!payment) {
        logger.info('Fetching payment from API', { paymentId });

        const params = {
          include_transactions: includeTransactions,
          include_invoice: includeInvoice,
          include_receipts: includeReceipts
        };

        const response = await apiClient.get(
          ENDPOINTS.payments.getById.replace(':id', paymentId),
          { params }
        );

        payment = response.data;
        cache.set(cacheKey, payment, this.defaultCacheTTL, this.cacheTags);
      }

      if (decryptSensitiveData && payment._encryptionKeyId) {
        try {
          const encryptionKey = await privacy.generateEncryptionKey(
            payment.payerId,
            payment._encryptionKeyId
          );
          payment = await privacy.decryptSensitiveData(payment, encryptionKey);
        } catch (decryptError) {
          logger.warn('Failed to decrypt payment data', {
            paymentId,
            error: decryptError.message
          });
        }
      }

      privacy.logDataAccess(
        payment.payerId,
        'payment',
        'read',
        { paymentId }
      );

      return payment;
    } catch (error) {
      logger.error('Failed to get payment', { paymentId, error });
      throw errorHandler.handle(error);
    }
  }

  async getPayments(filters = {}, options = {}) {
    try {
      const {
        payerId = null,
        recipientId = null,
        status = null,
        paymentMethod = null,
        dateFrom = null,
        dateTo = null,
        minAmount = null,
        maxAmount = null,
        currency = null,
        page = 1,
        limit = 20,
        sortBy = 'createdAt',
        sortOrder = 'desc',
        includeStatistics = false,
        decryptSensitiveData = false
      } = { ...filters, ...options };

      const params = {
        payer_id: payerId,
        recipient_id: recipientId,
        status,
        payment_method: paymentMethod,
        date_from: dateFrom,
        date_to: dateTo,
        min_amount: minAmount,
        max_amount: maxAmount,
        currency,
        page,
        limit,
        sort_by: sortBy,
        sort_order: sortOrder,
        include_statistics: includeStatistics
      };

      const cacheKey = `${this.cachePrefix}list_${security.generateHash(params)}`;
      let response = cache.get(cacheKey);

      if (!response) {
        logger.info('Fetching payments from API', { filters: params });

        response = await apiClient.get(ENDPOINTS.payments.getAll, { params });
        cache.set(cacheKey, response.data, this.defaultCacheTTL, this.cacheTags);
      } else {
        response = { data: response };
      }

      let payments = response.data.payments || response.data;

      if (decryptSensitiveData) {
        payments = await Promise.all(
          payments.map(async (payment) => {
            if (payment._encryptionKeyId) {
              try {
                const encryptionKey = await privacy.generateEncryptionKey(
                  payment.payerId,
                  payment._encryptionKeyId
                );
                return await privacy.decryptSensitiveData(payment, encryptionKey);
              } catch (error) {
                logger.warn('Failed to decrypt payment data', {
                  paymentId: payment.id,
                  error: error.message
                });
                return payment;
              }
            }
            return payment;
          })
        );
      }

      // Transform payments to include client name for the UI
      payments = payments.map(payment => ({
        ...payment,
        clientName: payment.client?.name || 'Cliente no encontrado',
        clientEmail: payment.client?.email || '',
        date: payment.createdAt || payment.paymentDate,
        fee: payment.fees || 0
      }));

      return {
        payments,
        pagination: {
          page,
          limit,
          total: response.data.total || payments.length,
          hasMore: response.data.hasMore || false
        },
        filters: params,
        statistics: response.data.statistics || null
      };
    } catch (error) {
      logger.error('Failed to get payments', { filters, error });
      throw errorHandler.handle(error);
    }
  }

  async refundPayment(paymentId, refundData, options = {}) {
    try {
      const {
        createAuditLog = true,
        notifyCustomer = true,
        reason = this.refundReasons.CUSTOMER_REQUEST
      } = options;

      logger.info('Processing refund', {
        paymentId,
        amount: refundData.amount,
        reason
      });

      const payment = await this.getPayment(paymentId, { decryptSensitiveData: false });

      if (payment.status !== this.paymentStates.COMPLETED) {
        throw errorHandler.createValidationError(
          'Cannot refund payment that is not completed',
          { currentStatus: payment.status }
        );
      }

      const refundPayload = {
        payment_id: paymentId,
        amount: refundData.amount || payment.amount,
        reason,
        notes: refundData.notes,
        refund_id: security.generateSecureId('ref_'),
        requested_at: new Date().toISOString(),
        requested_by: refundData.requestedBy
      };

      const response = await apiClient.post(
        ENDPOINTS.payments.refund.replace(':paymentId', paymentId),
        refundPayload
      );

      const refund = response.data;

      // Update payment status
      const newStatus = refund.amount >= payment.amount ?
        this.paymentStates.REFUNDED :
        this.paymentStates.PARTIALLY_REFUNDED;

      await this.updatePaymentStatus(paymentId, {
        status: newStatus,
        refundAmount: (payment.refundAmount || 0) + refund.amount,
        lastRefundAt: new Date().toISOString()
      });

      // Create refund receipt
      await this.createReceipt(paymentId, {
        type: this.receiptTypes.REFUND,
        amount: refund.amount,
        refundId: refund.id
      });

      // Notify customer
      if (notifyCustomer) {
        await this.notifyRefundProcessed(paymentId, refund);
      }

      this.invalidateCache(['payments', 'transactions'], payment.payerId);

      if (createAuditLog) {
        await auditService.logEvent({
          eventType: 'update',
          entityType: 'payment',
          entityId: paymentId,
          action: 'refund_payment',
          details: {
            refundId: refund.id,
            amount: refund.amount,
            reason,
            requestedBy: refundData.requestedBy
          },
          userId: refundData.requestedBy || payment.payerId
        });
      }

      logger.info('Refund processed successfully', {
        paymentId,
        refundId: refund.id,
        amount: refund.amount
      });

      return refund;
    } catch (error) {
      logger.error('Failed to process refund', { paymentId, error });
      throw errorHandler.handle(error);
    }
  }

  async handleDispute(paymentId, disputeData, options = {}) {
    try {
      const {
        createAuditLog = true,
        autoRespond = false
      } = options;

      logger.info('Handling payment dispute', {
        paymentId,
        disputeReason: disputeData.reason,
        autoRespond
      });

      const payment = await this.getPayment(paymentId, { decryptSensitiveData: false });

      const disputePayload = {
        payment_id: paymentId,
        dispute_id: security.generateSecureId('dis_'),
        reason: disputeData.reason,
        description: disputeData.description,
        amount: disputeData.amount || payment.amount,
        evidence: disputeData.evidence || [],
        status: this.disputeStates.OPENED,
        opened_at: new Date().toISOString(),
        provider_dispute_id: disputeData.providerDisputeId
      };

      const response = await apiClient.post(
        ENDPOINTS.payments.handleDispute.replace(':paymentId', paymentId),
        disputePayload
      );

      const dispute = response.data;

      // Update payment status
      await this.updatePaymentStatus(paymentId, {
        status: this.paymentStates.DISPUTED,
        disputeId: dispute.id,
        disputedAt: new Date().toISOString()
      });

      // Auto-respond with evidence if enabled
      if (autoRespond && disputeData.evidence && disputeData.evidence.length > 0) {
        await this.submitDisputeEvidence(dispute.id, disputeData.evidence);
      }

      this.invalidateCache(['payments', 'transactions'], payment.payerId);

      if (createAuditLog) {
        await auditService.logEvent({
          eventType: 'create',
          entityType: 'payment_dispute',
          entityId: dispute.id,
          action: 'handle_dispute',
          details: {
            paymentId,
            reason: disputeData.reason,
            amount: dispute.amount
          },
          userId: payment.payerId
        });
      }

      logger.info('Payment dispute handled successfully', {
        paymentId,
        disputeId: dispute.id
      });

      return dispute;
    } catch (error) {
      logger.error('Failed to handle payment dispute', { paymentId, error });
      throw errorHandler.handle(error);
    }
  }

  async createInvoice(paymentId, invoiceData, options = {}) {
    try {
      const { createAuditLog = true } = options;

      logger.info('Creating invoice', { paymentId, invoiceData });

      const payment = await this.getPayment(paymentId, { decryptSensitiveData: false });

      const invoicePayload = {
        payment_id: paymentId,
        invoice_id: security.generateSecureId('inv_'),
        invoice_number: this.generateInvoiceNumber(),
        amount: payment.amount,
        currency: payment.currency,
        due_date: invoiceData.dueDate,
        description: invoiceData.description,
        status: this.invoiceStates.PENDING,
        created_at: new Date().toISOString(),
        line_items: this.generateLineItems(payment)
      };

      const response = await apiClient.post(
        ENDPOINTS.payments.createInvoice.replace(':paymentId', paymentId),
        invoicePayload
      );

      const invoice = response.data;

      if (createAuditLog) {
        await auditService.logEvent({
          eventType: 'create',
          entityType: 'invoice',
          entityId: invoice.id,
          action: 'create_invoice',
          details: {
            paymentId,
            invoiceNumber: invoice.invoiceNumber,
            amount: invoice.amount
          },
          userId: payment.payerId
        });
      }

      logger.info('Invoice created successfully', {
        paymentId,
        invoiceId: invoice.id,
        invoiceNumber: invoice.invoiceNumber
      });

      return invoice;
    } catch (error) {
      logger.error('Failed to create invoice', { paymentId, error });
      throw errorHandler.handle(error);
    }
  }

  async createReceipt(paymentId, receiptData, options = {}) {
    try {
      const { createAuditLog = false } = options;

      logger.info('Creating receipt', { paymentId, receiptData });

      const payment = await this.getPayment(paymentId, { decryptSensitiveData: false });

      const receiptPayload = {
        payment_id: paymentId,
        receipt_id: security.generateSecureId('rec_'),
        receipt_number: this.generateReceiptNumber(),
        type: receiptData.type || this.receiptTypes.PAYMENT,
        amount: receiptData.amount || payment.amount,
        currency: payment.currency,
        created_at: new Date().toISOString(),
        template: receiptData.template || 'default'
      };

      const response = await apiClient.post(
        ENDPOINTS.payments.createReceipt.replace(':paymentId', paymentId),
        receiptPayload
      );

      const receipt = response.data;

      if (createAuditLog) {
        await auditService.logEvent({
          eventType: 'create',
          entityType: 'receipt',
          entityId: receipt.id,
          action: 'create_receipt',
          details: {
            paymentId,
            receiptNumber: receipt.receiptNumber,
            type: receipt.type
          },
          userId: payment.payerId
        });
      }

      logger.info('Receipt created successfully', {
        paymentId,
        receiptId: receipt.id,
        receiptNumber: receipt.receiptNumber
      });

      return receipt;
    } catch (error) {
      logger.error('Failed to create receipt', { paymentId, error });
      throw errorHandler.handle(error);
    }
  }

  async getFinancialStatistics(filters = {}, options = {}) {
    try {
      console.log('🔍 [PAYMENT SERVICE] getFinancialStatistics called');
      console.log('  - filters:', filters);
      console.log('  - options:', options);

      const {
        dateFrom = null,
        dateTo = null,
        currency = null,
        groupBy = 'day', // 'day', 'week', 'month', 'year'
        includeProjections = false,
        includeComparisons = true
      } = { ...filters, ...options };

      const params = {
        date_from: dateFrom,
        date_to: dateTo,
        currency,
        group_by: groupBy,
        include_projections: includeProjections,
        include_comparisons: includeComparisons
      };

      console.log('📋 [PAYMENT SERVICE] Prepared params:', params);

      const cacheKey = `${this.cachePrefix}stats_${security.generateHash(params)}`;
      let stats = cache.get(cacheKey);

      if (!stats) {
        console.log('🌐 [PAYMENT SERVICE] Making HTTP request to:', ENDPOINTS.payments.STATISTICS);
        logger.info('Fetching financial statistics', { params });

        const response = await apiClient.get(ENDPOINTS.payments.STATISTICS, { params });
        console.log('✅ [PAYMENT SERVICE] API response received:', response);
        stats = response.data;
        cache.set(cacheKey, stats, 600, [...this.cacheTags, 'statistics']);
      } else {
        console.log('💾 [PAYMENT SERVICE] Using cached data');
      }

      return stats;
    } catch (error) {
      logger.error('Failed to get financial statistics', { filters, error });
      throw errorHandler.handle(error);
    }
  }

  async getTransactionHistory(filters = {}, options = {}) {
    try {
      const {
        userId = null,
        paymentId = null,
        transactionType = null,
        page = 1,
        limit = 50,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = { ...filters, ...options };

      const params = {
        user_id: userId,
        payment_id: paymentId,
        transaction_type: transactionType,
        page,
        limit,
        sort_by: sortBy,
        sort_order: sortOrder
      };

      logger.info('Fetching transaction history', { params });

      const response = await apiClient.get(ENDPOINTS.payments.getTransactionHistory, { params });

      return {
        transactions: response.data.transactions,
        pagination: {
          page,
          limit,
          total: response.data.total || 0,
          hasMore: response.data.hasMore || false
        }
      };
    } catch (error) {
      logger.error('Failed to get transaction history', { filters, error });
      throw errorHandler.handle(error);
    }
  }

  // Validation and helper methods
  validatePaymentData(paymentData) {
    const requiredFields = ['amount', 'currency', 'paymentMethod', 'payerId'];

    for (const field of requiredFields) {
      if (!paymentData[field]) {
        throw errorHandler.createValidationError(`Missing required field: ${field}`, paymentData);
      }
    }

    // Validate amount
    if (paymentData.amount <= 0) {
      throw errorHandler.createValidationError('Amount must be greater than 0');
    }

    // Validate currency
    if (!Object.values(this.currencies).includes(paymentData.currency)) {
      throw errorHandler.createValidationError('Invalid currency', {
        provided: paymentData.currency,
        valid: Object.values(this.currencies)
      });
    }

    // Validate payment method
    if (!Object.values(this.paymentMethods).includes(paymentData.paymentMethod)) {
      throw errorHandler.createValidationError('Invalid payment method', {
        provided: paymentData.paymentMethod,
        valid: Object.values(this.paymentMethods)
      });
    }

    return true;
  }

  async checkFraudRisk(paymentData) {
    try {
      const response = await apiClient.post(
        ENDPOINTS.payments.checkFraud,
        {
          amount: paymentData.amount,
          currency: paymentData.currency,
          payment_method: paymentData.paymentMethod,
          payer_id: paymentData.payerId,
          recipient_id: paymentData.recipientId,
          metadata: paymentData.metadata
        }
      );

      return response.data;
    } catch (error) {
      logger.warn('Fraud check failed, allowing payment with low risk', error);
      return {
        riskLevel: this.fraudRiskLevels.LOW,
        score: 0,
        reasons: []
      };
    }
  }

  async calculateFees(paymentData) {
    try {
      const response = await apiClient.post(
        ENDPOINTS.payments.calculateFees,
        {
          amount: paymentData.amount,
          currency: paymentData.currency,
          payment_method: paymentData.paymentMethod,
          provider: paymentData.provider
        }
      );

      return response.data;
    } catch (error) {
      logger.warn('Fee calculation failed, using default values', error);
      return {
        fees: 0,
        taxes: 0,
        netAmount: paymentData.amount
      };
    }
  }

  selectPaymentProvider(payment) {
    // Select the best provider based on payment method, amount, and availability
    const compatibleProviders = this.availableProviders.filter(provider =>
      provider.supportedMethods.includes(payment.paymentMethod) &&
      provider.supportedCurrencies.includes(payment.currency)
    );

    if (compatibleProviders.length === 0) {
      return this.paymentProviders.STRIPE; // Default fallback
    }

    // Select provider with lowest fees for this transaction
    return compatibleProviders.reduce((best, current) =>
      current.feeRate < best.feeRate ? current : best
    ).name;
  }

  async updatePaymentStatus(paymentId, statusUpdate) {
    try {
      await apiClient.patch(
        ENDPOINTS.payments.updateStatus.replace(':paymentId', paymentId),
        {
          ...statusUpdate,
          updated_at: new Date().toISOString()
        }
      );

      this.invalidatePaymentCache(paymentId);
    } catch (error) {
      logger.warn('Failed to update payment status', { paymentId, statusUpdate, error });
    }
  }

  async handleSuccessfulPayment(paymentId) {
    try {
      // Create receipt
      await this.createReceipt(paymentId, {
        type: this.receiptTypes.PAYMENT
      });

      // Notify parties
      await this.notifyPaymentSuccess(paymentId);

      // Trigger any post-payment actions
      await this.triggerPostPaymentActions(paymentId);
    } catch (error) {
      logger.warn('Failed to handle successful payment', { paymentId, error });
    }
  }

  async handleFailedPayment(paymentId, failureReason) {
    try {
      // Notify about failure
      await this.notifyPaymentFailure(paymentId, failureReason);

      // Schedule retry if applicable
      await this.schedulePaymentRetry(paymentId);
    } catch (error) {
      logger.warn('Failed to handle failed payment', { paymentId, error });
    }
  }

  async submitDisputeEvidence(disputeId, evidence) {
    try {
      await apiClient.post(
        ENDPOINTS.payments.submitDisputeEvidence.replace(':disputeId', disputeId),
        { evidence }
      );
      logger.info('Dispute evidence submitted', { disputeId });
    } catch (error) {
      logger.warn('Failed to submit dispute evidence', { disputeId, error });
    }
  }

  generateInvoiceNumber() {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const randomSuffix = Math.random().toString(36).substr(2, 6).toUpperCase();
    return `INV-${year}${month}-${randomSuffix}`;
  }

  generateReceiptNumber() {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const randomSuffix = Math.random().toString(36).substr(2, 6).toUpperCase();
    return `REC-${year}${month}-${randomSuffix}`;
  }

  generateLineItems(payment) {
    return [
      {
        description: payment.description || 'Therapy Session',
        quantity: 1,
        unitPrice: payment.amount,
        total: payment.amount
      }
    ];
  }

  // Notification methods
  async notifyPaymentSuccess(paymentId) {
    try {
      await apiClient.post(
        ENDPOINTS.payments.notifySuccess.replace(':paymentId', paymentId)
      );
    } catch (error) {
      logger.warn('Failed to notify payment success', { paymentId, error });
    }
  }

  async notifyPaymentFailure(paymentId, reason) {
    try {
      await apiClient.post(
        ENDPOINTS.payments.notifyFailure.replace(':paymentId', paymentId),
        { reason }
      );
    } catch (error) {
      logger.warn('Failed to notify payment failure', { paymentId, error });
    }
  }

  async notifyRefundProcessed(paymentId, refund) {
    try {
      await apiClient.post(
        ENDPOINTS.payments.notifyRefund.replace(':paymentId', paymentId),
        { refund }
      );
    } catch (error) {
      logger.warn('Failed to notify refund processed', { paymentId, error });
    }
  }

  async triggerPostPaymentActions(paymentId) {
    try {
      await apiClient.post(
        ENDPOINTS.payments.triggerPostActions.replace(':paymentId', paymentId)
      );
    } catch (error) {
      logger.warn('Failed to trigger post-payment actions', { paymentId, error });
    }
  }

  async schedulePaymentRetry(paymentId) {
    try {
      await apiClient.post(
        ENDPOINTS.payments.scheduleRetry.replace(':paymentId', paymentId)
      );
    } catch (error) {
      logger.warn('Failed to schedule payment retry', { paymentId, error });
    }
  }

  setupPeriodicStatusUpdates() {
    // Update payment statuses every 10 minutes
    setInterval(async () => {
      try {
        await this.updatePendingPaymentStatuses();
      } catch (error) {
        logger.error('Periodic payment status update failed', error);
      }
    }, 10 * 60 * 1000);
  }

  async updatePendingPaymentStatuses() {
    try {
      logger.debug('Updating pending payment statuses');

      const response = await apiClient.post(ENDPOINTS.payments.updatePendingStatuses);

      const { updatedCount, failedCount } = response.data;

      if (updatedCount > 0) {
        logger.info('Payment statuses updated', { updatedCount, failedCount });
      }

      return response.data;
    } catch (error) {
      logger.warn('Failed to update pending payment statuses', error);
      return null;
    }
  }

  invalidatePaymentCache(paymentId) {
    try {
      cache.delete(`${this.cachePrefix}${paymentId}`);
    } catch (error) {
      logger.warn('Failed to invalidate payment cache', { paymentId, error });
    }
  }

  invalidateCache(tags = [], specificUserId = null) {
    try {
      if (specificUserId) {
        cache.deleteByPattern(`${this.cachePrefix}*${specificUserId}*`);
      }

      tags.forEach(tag => {
        cache.deleteByTag(tag);
      });

      logger.debug('Payment service cache invalidated', { tags, specificUserId });
    } catch (error) {
      logger.warn('Failed to invalidate cache', error);
    }
  }

  clearCache() {
    try {
      cache.deleteByTag('payments');
      cache.deleteByTag('transactions');
      cache.deleteByTag('billing');
      logger.info('Payment service cache cleared');
    } catch (error) {
      logger.warn('Failed to clear payment service cache', error);
    }
  }

  getStats() {
    return {
      service: 'PaymentService',
      initialized: this.isInitialized,
      availableProviders: this.availableProviders?.length || 0,
      cacheStats: {
        payments: cache.getStatsByTag('payments'),
        transactions: cache.getStatsByTag('transactions'),
        billing: cache.getStatsByTag('billing')
      },
      constants: {
        paymentStates: this.paymentStates,
        paymentMethods: this.paymentMethods,
        paymentTypes: this.paymentTypes,
        currencies: this.currencies,
        paymentProviders: this.paymentProviders,
        disputeStates: this.disputeStates,
        refundReasons: this.refundReasons,
        invoiceStates: this.invoiceStates,
        receiptTypes: this.receiptTypes,
        fraudRiskLevels: this.fraudRiskLevels
      },
      timestamp: new Date().toISOString()
    };
  }
}

export const paymentService = new PaymentService();

export const {
  createPayment,
  processPayment,
  getPayment,
  getPayments,
  refundPayment,
  handleDispute,
  createInvoice,
  createReceipt,
  getFinancialStatistics,
  getTransactionHistory
} = paymentService;

export default paymentService;