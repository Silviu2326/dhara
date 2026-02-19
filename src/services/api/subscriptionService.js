import { apiClient } from '../config/apiClient';
import { ENDPOINTS } from '../config/endpoints';
import { errorHandler } from '../utils/errorHandler';
import { logger } from '../utils/logger';
import { cache, apiCache } from '../utils/cache';
import { privacy, encryptSensitiveData, decryptSensitiveData } from '../utils/privacy';
import { security, generateSecureId } from '../utils/security';
import { auditService } from '../utils/auditService';

class SubscriptionService {
  constructor() {
    this.cachePrefix = 'subscription_';
    this.cacheTimeout = 60 * 60 * 1000; // 1 hora
    this.maxRetries = 3;
    this.auditContext = 'subscription_service';

    // Estados de suscripción
    this.subscriptionStatus = {
      ACTIVE: 'active',
      INACTIVE: 'inactive',
      PENDING: 'pending',
      CANCELLED: 'cancelled',
      EXPIRED: 'expired',
      SUSPENDED: 'suspended',
      TRIAL: 'trial',
      PAST_DUE: 'past_due'
    };

    // Planes de suscripción
    this.subscriptionPlans = {
      BASIC: 'basic',
      PROFESSIONAL: 'professional',
      PREMIUM: 'premium',
      ENTERPRISE: 'enterprise',
      TRIAL: 'trial'
    };

    // Frecuencias de facturación
    this.billingFrequencies = {
      MONTHLY: 'monthly',
      QUARTERLY: 'quarterly',
      SEMI_ANNUAL: 'semi_annual',
      ANNUAL: 'annual',
      WEEKLY: 'weekly'
    };

    // Estados de facturación
    this.billingStatus = {
      PENDING: 'pending',
      PAID: 'paid',
      FAILED: 'failed',
      REFUNDED: 'refunded',
      DISPUTED: 'disputed',
      CANCELLED: 'cancelled'
    };

    // Límites por plan - Adaptado para plataforma de terapeutas
    this.planLimits = {
      basic: {
        maxClients: 25,
        maxSessions: 100, // por mes
        maxStorage: 2048, // 2GB - para documentos terapéuticos
        videoCallMinutes: 1000, // 16+ horas de videoterapia
        supportLevel: 'email',
        integrations: ['calendar_basic', 'google_calendar'],
        features: [
          'gestión_clientes_básica',
          'planificación_sesiones',
          'plantillas_planes_terapéuticos',
          'notas_sesión',
          'recordatorios_automáticos',
          'informes_básicos'
        ],
        therapyTools: [
          'escalas_evaluación_básicas',
          'plantillas_tareas',
          'seguimiento_progreso_simple'
        ],
        securityFeatures: [
          'encriptación_datos',
          'cumplimiento_rgpd_básico',
          'backup_semanal'
        ]
      },
      professional: {
        maxClients: 100,
        maxSessions: -1, // ilimitadas
        maxStorage: 10240, // 10GB
        videoCallMinutes: 3000, // 50 horas de videoterapia
        supportLevel: 'priority',
        integrations: [
          'calendar_advanced',
          'google_calendar',
          'outlook',
          'payment_gateways',
          'video_conferencing',
          'whatsapp_business'
        ],
        features: [
          'gestión_clientes_avanzada',
          'planes_terapéuticos_personalizados',
          'biblioteca_técnicas_terapéuticas',
          'seguimiento_progreso_detallado',
          'informes_profesionales',
          'facturación_integrada',
          'gestión_documentos',
          'recordatorios_inteligentes',
          'dashboard_analítico'
        ],
        therapyTools: [
          'escalas_evaluación_completas',
          'herramientas_tcc',
          'técnicas_mindfulness',
          'ejercicios_exposición',
          'plantillas_emdr',
          'cuestionarios_personalizados',
          'seguimiento_tareas_terapéuticas',
          'biblioteca_recursos_cliente'
        ],
        securityFeatures: [
          'encriptación_avanzada',
          'cumplimiento_rgpd_completo',
          'backup_diario',
          'auditoria_accesos',
          'firma_digital_consentimientos'
        ]
      },
      premium: {
        maxClients: 500,
        maxSessions: -1,
        maxStorage: 51200, // 50GB
        videoCallMinutes: -1, // ilimitados
        supportLevel: 'premium',
        integrations: [
          'all_calendar_systems',
          'erp_healthcare',
          'insurance_systems',
          'telehealth_platforms',
          'ai_transcription',
          'research_databases'
        ],
        features: [
          'gestión_clínica_completa',
          'ia_análisis_progreso',
          'marca_personalizada',
          'api_access',
          'multi_ubicación',
          'gestión_equipo_terapeutas',
          'reporting_avanzado',
          'integración_sistemas_sanitarios',
          'telemedicina_avanzada'
        ],
        therapyTools: [
          'ia_recomendaciones_tratamiento',
          'análisis_sentimientos_sesiones',
          'biblioteca_completa_técnicas',
          'simulaciones_vr_terapéuticas',
          'biofeedback_integration',
          'assessment_automatizados',
          'predicción_riesgo_abandono',
          'personalización_ia_ejercicios'
        ],
        securityFeatures: [
          'encriptación_nivel_hospitalario',
          'cumplimiento_hipaa_completo',
          'backup_tiempo_real',
          'monitoreo_seguridad_24_7',
          'autenticación_biométrica',
          'blockchain_historiales'
        ]
      },
      enterprise: {
        maxClients: -1, // ilimitado
        maxSessions: -1,
        maxStorage: -1,
        videoCallMinutes: -1,
        supportLevel: 'dedicated',
        integrations: [
          'sistemas_hospitalarios_completos',
          'his_ris_pacs',
          'investigación_clínica',
          'regulatory_compliance',
          'multi_tenant_architecture'
        ],
        features: [
          'plataforma_clínica_empresarial',
          'desarrollo_personalizado',
          'sso_avanzado',
          'gestión_multicentro',
          'compliance_regulatorio',
          'formación_especializada',
          'consultoría_implementación',
          'sla_garantizado_99_9'
        ],
        therapyTools: [
          'investigación_clínica_integrada',
          'ia_diagnóstico_asistido',
          'análisis_big_data_salud_mental',
          'medicina_personalizada',
          'genomica_psiquiátrica',
          'realidad_virtual_terapéutica',
          'neuroimagen_funcional'
        ],
        securityFeatures: [
          'certificación_iso_27001',
          'cumplimiento_regulatorio_global',
          'infraestructura_dedicada',
          'disaster_recovery_completo',
          'pentesting_regular',
          'compliance_officer_dedicado'
        ]
      }
    };

    // Razones de cancelación
    this.cancellationReasons = {
      COST: 'cost',
      NOT_USING: 'not_using',
      MISSING_FEATURES: 'missing_features',
      POOR_SUPPORT: 'poor_support',
      SWITCHING_PROVIDER: 'switching_provider',
      TEMPORARY_PAUSE: 'temporary_pause',
      OTHER: 'other'
    };

    // Tipos de cambio de plan
    this.planChangeTypes = {
      UPGRADE: 'upgrade',
      DOWNGRADE: 'downgrade',
      LATERAL: 'lateral'
    };

    this.initialized = false;
  }

  async initialize() {
    if (this.initialized) return;

    try {
      await auditService.logEvent({
        eventType: 'system_change',
        entityType: 'service',
        entityId: 'subscription_service',
        action: 'initialize',
        details: { timestamp: new Date().toISOString() }
      });

      this.initialized = true;
      logger.info('SubscriptionService initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize SubscriptionService:', error);
      throw error;
    }
  }

  // Validación de datos de suscripción
  validateSubscriptionData(subscriptionData) {
    const requiredFields = ['userId', 'planId', 'billingFrequency'];
    const missingFields = requiredFields.filter(field => !subscriptionData[field]);

    if (missingFields.length > 0) {
      throw errorHandler.createValidationError(
        `Missing required fields: ${missingFields.join(', ')}`
      );
    }

    // Validar plan
    if (!Object.values(this.subscriptionPlans).includes(subscriptionData.planId)) {
      throw errorHandler.createValidationError(
        `Invalid subscription plan: ${subscriptionData.planId}`
      );
    }

    // Validar frecuencia de facturación
    if (!Object.values(this.billingFrequencies).includes(subscriptionData.billingFrequency)) {
      throw errorHandler.createValidationError(
        `Invalid billing frequency: ${subscriptionData.billingFrequency}`
      );
    }

    return true;
  }

  // Crear suscripción
  async createSubscription(subscriptionData, options = {}) {
    try {
      const { auditEvent = true, startTrial = false } = options;

      // Validar datos de suscripción
      this.validateSubscriptionData(subscriptionData);

      // Verificar suscripción existente activa
      const existingSubscription = await this.getActiveSubscription(subscriptionData.userId, { throwOnNotFound: false });
      if (existingSubscription) {
        throw errorHandler.createConflictError('User already has an active subscription');
      }

      // Procesar datos de suscripción
      let processedData = {
        ...subscriptionData,
        subscriptionId: security.generateSecureId('sub_'),
        status: startTrial ? this.subscriptionStatus.TRIAL : this.subscriptionStatus.PENDING,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Configurar fechas de facturación
      const now = new Date();
      if (startTrial) {
        processedData.trialStart = now.toISOString();
        processedData.trialEnd = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString(); // 14 días
        processedData.nextBillingDate = processedData.trialEnd;
      } else {
        processedData.nextBillingDate = this.calculateNextBillingDate(now, subscriptionData.billingFrequency);
      }

      // Calcular precios
      const pricing = await this.calculateSubscriptionPricing(subscriptionData.planId, subscriptionData.billingFrequency);
      processedData.pricing = pricing;

      // Encriptar datos de pago si los hay
      if (subscriptionData.paymentMethod) {
        processedData.encryptedPaymentMethod = await encryptSensitiveData(subscriptionData.paymentMethod);
        delete processedData.paymentMethod;
      }

      const response = await apiClient.post(ENDPOINTS.subscriptions.base, processedData);

      // Invalidar cache relacionado
      this.invalidateRelatedCache(subscriptionData.userId);

      // Auditoría
      if (auditEvent) {
        await auditService.logEvent({
          eventType: 'subscription_change',
          entityType: 'subscription',
          entityId: response.data.subscriptionId,
          action: 'create',
          userId: subscriptionData.userId,
          details: {
            planId: subscriptionData.planId,
            billingFrequency: subscriptionData.billingFrequency,
            status: processedData.status,
            trial: startTrial,
            pricing: pricing
          }
        });
      }

      logger.info('Subscription created', {
        subscriptionId: response.data.subscriptionId,
        userId: subscriptionData.userId,
        planId: subscriptionData.planId,
        status: processedData.status
      });

      return response.data;
    } catch (error) {
      logger.error('Error creating subscription:', error);
      throw errorHandler.handleApiError(error);
    }
  }

  // Obtener suscripción por ID
  async getSubscriptionById(subscriptionId, options = {}) {
    try {
      const { includeUsage = false, decryptPayment = false } = options;
      const cacheKey = `${this.cachePrefix}${subscriptionId}_${includeUsage}_${decryptPayment}`;

      // Verificar cache
      let subscriptionData = cache.get(cacheKey);
      if (subscriptionData) {
        return subscriptionData;
      }

      const params = { includeUsage };
      const response = await apiClient.get(`${ENDPOINTS.subscriptions.base}/${subscriptionId}`, { params });

      subscriptionData = response.data;

      // Desencriptar datos de pago si es necesario
      if (decryptPayment && subscriptionData.encryptedPaymentMethod) {
        subscriptionData.paymentMethod = await decryptSensitiveData(subscriptionData.encryptedPaymentMethod);
        delete subscriptionData.encryptedPaymentMethod;
      }

      // Guardar en cache
      cache.set(cacheKey, subscriptionData, this.cacheTimeout);

      return subscriptionData;
    } catch (error) {
      logger.error('Error getting subscription by ID:', error);
      throw errorHandler.handleApiError(error);
    }
  }

  // Obtener suscripción activa del usuario
  async getActiveSubscription(userId, options = {}) {
    try {
      const { throwOnNotFound = true } = options;
      const cacheKey = `${this.cachePrefix}active_${userId}`;

      // Verificar cache
      let subscriptionData = cache.get(cacheKey);
      if (subscriptionData) {
        return subscriptionData;
      }

      try {
        const response = await apiClient.get(`${ENDPOINTS.subscriptions.user}/${userId}/active`);
        subscriptionData = response.data;

        // Guardar en cache
        cache.set(cacheKey, subscriptionData, this.cacheTimeout);

        return subscriptionData;
      } catch (error) {
        if (error.response?.status === 404 && !throwOnNotFound) {
          return null;
        }
        throw error;
      }
    } catch (error) {
      logger.error('Error getting active subscription:', error);
      throw errorHandler.handleApiError(error);
    }
  }

  // Listar suscripciones
  async getSubscriptions(filters = {}, options = {}) {
    try {
      const {
        page = 1,
        limit = 20,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = options;

      const cacheKey = `${this.cachePrefix}list_${JSON.stringify(filters)}_${page}_${limit}_${sortBy}_${sortOrder}`;

      // Verificar cache
      let subscriptions = cache.get(cacheKey);
      if (subscriptions) {
        return subscriptions;
      }

      const params = {
        ...filters,
        page,
        limit,
        sortBy,
        sortOrder
      };

      const response = await apiClient.get(ENDPOINTS.subscriptions.base, { params });
      subscriptions = response.data;

      // Guardar en cache
      cache.set(cacheKey, subscriptions, this.cacheTimeout);

      return subscriptions;
    } catch (error) {
      logger.error('Error getting subscriptions:', error);
      throw errorHandler.handleApiError(error);
    }
  }

  // Actualizar suscripción
  async updateSubscription(subscriptionId, updateData, options = {}) {
    try {
      const { auditEvent = true } = options;

      // Procesar datos de actualización
      let processedData = {
        ...updateData,
        updatedAt: new Date().toISOString()
      };

      // Encriptar datos de pago si están incluidos
      if (updateData.paymentMethod) {
        processedData.encryptedPaymentMethod = await encryptSensitiveData(updateData.paymentMethod);
        delete processedData.paymentMethod;
      }

      const response = await apiClient.put(`${ENDPOINTS.subscriptions.base}/${subscriptionId}`, processedData);

      // Invalidar cache relacionado
      this.invalidateRelatedCache();

      // Auditoría
      if (auditEvent) {
        await auditService.logEvent({
          eventType: 'subscription_change',
          entityType: 'subscription',
          entityId: subscriptionId,
          action: 'update',
          userId: processedData.updatedBy,
          details: {
            updatedFields: Object.keys(updateData)
          }
        });
      }

      logger.info('Subscription updated', {
        subscriptionId,
        updatedFields: Object.keys(updateData)
      });

      return response.data;
    } catch (error) {
      logger.error('Error updating subscription:', error);
      throw errorHandler.handleApiError(error);
    }
  }

  // Cambiar plan de suscripción
  async changePlan(subscriptionId, newPlanId, options = {}) {
    try {
      const { auditEvent = true, immediate = false, prorated = true } = options;

      const currentSubscription = await this.getSubscriptionById(subscriptionId);
      const changeType = this.determinePlanChangeType(currentSubscription.planId, newPlanId);

      const changeData = {
        newPlanId,
        changeType,
        immediate,
        prorated,
        requestedAt: new Date().toISOString()
      };

      const response = await apiClient.post(`${ENDPOINTS.subscriptions.base}/${subscriptionId}/change-plan`, changeData);

      // Invalidar cache relacionado
      this.invalidateRelatedCache();

      // Auditoría
      if (auditEvent) {
        await auditService.logEvent({
          eventType: 'subscription_change',
          entityType: 'subscription',
          entityId: subscriptionId,
          action: `plan_${changeType}`,
          details: {
            oldPlan: currentSubscription.planId,
            newPlan: newPlanId,
            changeType,
            immediate,
            prorated
          }
        });
      }

      logger.info('Subscription plan changed', {
        subscriptionId,
        oldPlan: currentSubscription.planId,
        newPlan: newPlanId,
        changeType
      });

      return response.data;
    } catch (error) {
      logger.error('Error changing subscription plan:', error);
      throw errorHandler.handleApiError(error);
    }
  }

  // Cancelar suscripción
  async cancelSubscription(subscriptionId, cancellationData, options = {}) {
    try {
      const { auditEvent = true, immediate = false } = options;

      const cancelData = {
        ...cancellationData,
        immediate,
        cancelledAt: new Date().toISOString()
      };

      const response = await apiClient.post(`${ENDPOINTS.subscriptions.base}/${subscriptionId}/cancel`, cancelData);

      // Invalidar cache relacionado
      this.invalidateRelatedCache();

      // Auditoría
      if (auditEvent) {
        await auditService.logEvent({
          eventType: 'subscription_change',
          entityType: 'subscription',
          entityId: subscriptionId,
          action: 'cancel',
          details: {
            reason: cancellationData.reason,
            feedback: cancellationData.feedback,
            immediate
          }
        });
      }

      logger.info('Subscription cancelled', {
        subscriptionId,
        reason: cancellationData.reason,
        immediate
      });

      return response.data;
    } catch (error) {
      logger.error('Error cancelling subscription:', error);
      throw errorHandler.handleApiError(error);
    }
  }

  // Reactivar suscripción
  async reactivateSubscription(subscriptionId, options = {}) {
    try {
      const { auditEvent = true, newPlanId } = options;

      const reactivationData = {
        newPlanId,
        reactivatedAt: new Date().toISOString()
      };

      const response = await apiClient.post(`${ENDPOINTS.subscriptions.base}/${subscriptionId}/reactivate`, reactivationData);

      // Invalidar cache relacionado
      this.invalidateRelatedCache();

      // Auditoría
      if (auditEvent) {
        await auditService.logEvent({
          eventType: 'subscription_change',
          entityType: 'subscription',
          entityId: subscriptionId,
          action: 'reactivate',
          details: {
            newPlanId,
            timestamp: new Date().toISOString()
          }
        });
      }

      logger.info('Subscription reactivated', {
        subscriptionId,
        newPlanId
      });

      return response.data;
    } catch (error) {
      logger.error('Error reactivating subscription:', error);
      throw errorHandler.handleApiError(error);
    }
  }

  // Procesar facturación
  async processBilling(subscriptionId, options = {}) {
    try {
      const { auditEvent = true } = options;

      const billingData = {
        subscriptionId,
        processedAt: new Date().toISOString(),
        billingId: security.generateSecureId('bill_')
      };

      const response = await apiClient.post(`${ENDPOINTS.subscriptions.base}/${subscriptionId}/billing`, billingData);

      // Invalidar cache relacionado
      this.invalidateRelatedCache();

      // Auditoría
      if (auditEvent) {
        await auditService.logEvent({
          eventType: 'billing_change',
          entityType: 'subscription',
          entityId: subscriptionId,
          action: 'process_billing',
          details: {
            billingId: response.data.billingId,
            amount: response.data.amount,
            status: response.data.status
          }
        });
      }

      logger.info('Billing processed', {
        subscriptionId,
        billingId: response.data.billingId,
        amount: response.data.amount,
        status: response.data.status
      });

      return response.data;
    } catch (error) {
      logger.error('Error processing billing:', error);
      throw errorHandler.handleApiError(error);
    }
  }

  // Obtener historial de facturación
  async getBillingHistory(subscriptionId, options = {}) {
    try {
      const { page = 1, limit = 20, dateRange } = options;
      const cacheKey = `${this.cachePrefix}billing_${subscriptionId}_${page}_${limit}_${JSON.stringify(dateRange)}`;

      // Verificar cache
      let billingHistory = cache.get(cacheKey);
      if (billingHistory) {
        return billingHistory;
      }

      const params = {
        page,
        limit,
        dateRange: dateRange ? JSON.stringify(dateRange) : undefined
      };

      const response = await apiClient.get(`${ENDPOINTS.subscriptions.base}/${subscriptionId}/billing-history`, { params });
      billingHistory = response.data;

      // Guardar en cache
      cache.set(cacheKey, billingHistory, this.cacheTimeout);

      return billingHistory;
    } catch (error) {
      logger.error('Error getting billing history:', error);
      throw errorHandler.handleApiError(error);
    }
  }

  // Verificar límites del plan
  async checkPlanLimits(userId, limitType, currentUsage = 0) {
    try {
      const subscription = await this.getActiveSubscription(userId, { throwOnNotFound: false });

      if (!subscription) {
        return { allowed: false, reason: 'No active subscription' };
      }

      const planLimits = this.planLimits[subscription.planId];
      const limit = planLimits[limitType];

      if (limit === -1) {
        return { allowed: true, unlimited: true };
      }

      const allowed = currentUsage < limit;
      const remaining = Math.max(0, limit - currentUsage);

      return {
        allowed,
        limit,
        currentUsage,
        remaining,
        percentage: (currentUsage / limit) * 100
      };
    } catch (error) {
      logger.error('Error checking plan limits:', error);
      return { allowed: false, error: error.message };
    }
  }

  // Obtener uso actual
  async getCurrentUsage(userId, options = {}) {
    try {
      const { period = 'current_month' } = options;
      const cacheKey = `${this.cachePrefix}usage_${userId}_${period}`;

      // Verificar cache
      let usage = cache.get(cacheKey);
      if (usage) {
        return usage;
      }

      const params = { period };
      const response = await apiClient.get(`${ENDPOINTS.subscriptions.usage}/${userId}`, { params });
      usage = response.data;

      // Guardar en cache por menos tiempo
      cache.set(cacheKey, usage, 5 * 60 * 1000); // 5 minutos

      return usage;
    } catch (error) {
      logger.error('Error getting current usage:', error);
      throw errorHandler.handleApiError(error);
    }
  }

  // Obtener estadísticas de suscripción
  async getSubscriptionStatistics(filters = {}, options = {}) {
    try {
      const { dateRange, groupBy = 'plan' } = options;
      const cacheKey = `${this.cachePrefix}stats_${JSON.stringify(filters)}_${JSON.stringify(options)}`;

      // Verificar cache
      let stats = cache.get(cacheKey);
      if (stats) {
        return stats;
      }

      const params = {
        ...filters,
        dateRange: dateRange ? JSON.stringify(dateRange) : undefined,
        groupBy
      };

      const response = await apiClient.get(`${ENDPOINTS.subscriptions.base}/statistics`, { params });
      stats = response.data;

      // Guardar en cache por menos tiempo para estadísticas
      cache.set(cacheKey, stats, 10 * 60 * 1000); // 10 minutos

      return stats;
    } catch (error) {
      logger.error('Error getting subscription statistics:', error);
      throw errorHandler.handleApiError(error);
    }
  }

  // Enviar notificación de renovación
  async sendRenewalNotification(subscriptionId, options = {}) {
    try {
      const { daysBeforeRenewal = 3, auditEvent = true } = options;

      const notificationData = {
        subscriptionId,
        daysBeforeRenewal,
        sentAt: new Date().toISOString()
      };

      const response = await apiClient.post(`${ENDPOINTS.subscriptions.base}/${subscriptionId}/renewal-notification`, notificationData);

      // Auditoría
      if (auditEvent) {
        await auditService.logEvent({
          eventType: 'notification_sent',
          entityType: 'subscription',
          entityId: subscriptionId,
          action: 'renewal_notification',
          details: {
            daysBeforeRenewal,
            method: response.data.method
          }
        });
      }

      logger.info('Renewal notification sent', {
        subscriptionId,
        daysBeforeRenewal
      });

      return response.data;
    } catch (error) {
      logger.error('Error sending renewal notification:', error);
      throw errorHandler.handleApiError(error);
    }
  }

  // Utilidades
  calculateNextBillingDate(currentDate, frequency) {
    const date = new Date(currentDate);

    switch (frequency) {
      case this.billingFrequencies.WEEKLY:
        date.setDate(date.getDate() + 7);
        break;
      case this.billingFrequencies.MONTHLY:
        date.setMonth(date.getMonth() + 1);
        break;
      case this.billingFrequencies.QUARTERLY:
        date.setMonth(date.getMonth() + 3);
        break;
      case this.billingFrequencies.SEMI_ANNUAL:
        date.setMonth(date.getMonth() + 6);
        break;
      case this.billingFrequencies.ANNUAL:
        date.setFullYear(date.getFullYear() + 1);
        break;
      default:
        date.setMonth(date.getMonth() + 1);
    }

    return date.toISOString();
  }

  async calculateSubscriptionPricing(planId, frequency) {
    try {
      const response = await apiClient.get(`${ENDPOINTS.subscriptions.pricing}/${planId}/${frequency}`);
      return response.data;
    } catch (error) {
      logger.error('Error calculating subscription pricing:', error);
      throw errorHandler.handleApiError(error);
    }
  }

  determinePlanChangeType(currentPlan, newPlan) {
    const planHierarchy = {
      basic: 1,
      professional: 2,
      premium: 3,
      enterprise: 4
    };

    const currentLevel = planHierarchy[currentPlan] || 0;
    const newLevel = planHierarchy[newPlan] || 0;

    if (newLevel > currentLevel) return this.planChangeTypes.UPGRADE;
    if (newLevel < currentLevel) return this.planChangeTypes.DOWNGRADE;
    return this.planChangeTypes.LATERAL;
  }

  // Invalidar cache relacionado
  invalidateRelatedCache(userId = null) {
    try {
      if (userId) {
        // Invalidar cache específico del usuario
        const patterns = [
          `${this.cachePrefix}active_${userId}*`,
          `${this.cachePrefix}usage_${userId}*`,
          `${this.cachePrefix}list*`,
          `${this.cachePrefix}stats*`
        ];

        patterns.forEach(pattern => cache.deleteByPattern(pattern));
      } else {
        // Invalidar todo el cache de suscripciones
        cache.deleteByPattern(`${this.cachePrefix}*`);
      }

      // También invalidar cache de API relacionado
      apiCache.deleteByPattern('subscriptions*');

    } catch (error) {
      logger.error('Error invalidating cache:', error);
    }
  }

  // Limpiar cache
  clearCache() {
    try {
      cache.deleteByPattern(`${this.cachePrefix}*`);
      logger.info('SubscriptionService cache cleared');
    } catch (error) {
      logger.error('Error clearing cache:', error);
    }
  }

  // Verificar salud del servicio
  async checkHealth() {
    try {
      const healthData = {
        service: 'SubscriptionService',
        status: 'healthy',
        timestamp: new Date().toISOString(),
        cache: {
          size: cache.size(),
          enabled: true
        }
      };

      // Verificar conectividad básica
      await apiClient.get(`${ENDPOINTS.subscriptions.base}/health`);

      return healthData;
    } catch (error) {
      return {
        service: 'SubscriptionService',
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  async getPayoutData(options = {}) {
    try {
      await auditService.logEvent({
        eventType: 'read',
        entityType: 'payout_data',
        action: 'get_payout_data',
        category: 'financial'
      });

      const response = await apiClient.get(ENDPOINTS.SUBSCRIPTIONS.PAYOUT_DATA, options);
      return response.data;
    } catch (error) {
      logger.error('Failed to get payout data', { error });
      throw errorHandler.handle(error);
    }
  }
}

// Crear instancia única del servicio
export const subscriptionService = new SubscriptionService();

// Métodos de conveniencia para exportación directa
export const createSubscription = (subscriptionData, options) => subscriptionService.createSubscription(subscriptionData, options);
export const getSubscriptionById = (subscriptionId, options) => subscriptionService.getSubscriptionById(subscriptionId, options);
export const getActiveSubscription = (userId, options) => subscriptionService.getActiveSubscription(userId, options);
export const getSubscriptions = (filters, options) => subscriptionService.getSubscriptions(filters, options);
export const updateSubscription = (subscriptionId, updateData, options) => subscriptionService.updateSubscription(subscriptionId, updateData, options);
export const changePlan = (subscriptionId, newPlanId, options) => subscriptionService.changePlan(subscriptionId, newPlanId, options);
export const cancelSubscription = (subscriptionId, cancellationData, options) => subscriptionService.cancelSubscription(subscriptionId, cancellationData, options);
export const reactivateSubscription = (subscriptionId, options) => subscriptionService.reactivateSubscription(subscriptionId, options);
export const processBilling = (subscriptionId, options) => subscriptionService.processBilling(subscriptionId, options);
export const getBillingHistory = (subscriptionId, options) => subscriptionService.getBillingHistory(subscriptionId, options);
export const checkPlanLimits = (userId, limitType, currentUsage) => subscriptionService.checkPlanLimits(userId, limitType, currentUsage);
export const getCurrentUsage = (userId, options) => subscriptionService.getCurrentUsage(userId, options);
export const getSubscriptionStatistics = (filters, options) => subscriptionService.getSubscriptionStatistics(filters, options);
export const sendRenewalNotification = (subscriptionId, options) => subscriptionService.sendRenewalNotification(subscriptionId, options);
export const getPayoutData = (options) => subscriptionService.getPayoutData(options);

export default subscriptionService;