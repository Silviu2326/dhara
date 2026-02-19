// API functions para planes de suscripción de plataforma de terapeutas

export const getCurrentPlan = async () => {
  // Simular llamada API para obtener plan actual del terapeuta
  await new Promise(resolve => setTimeout(resolve, 800));

  return {
    plan: 'professional',
    status: 'active',
    planName: 'Plan Profesional',
    features: [
      'Hasta 100 clientes activos',
      'Sesiones ilimitadas',
      'Videollamadas integradas',
      'Planes terapéuticos personalizados',
      'Herramientas de evaluación',
      'Informes de progreso detallados',
      'Soporte prioritario'
    ],
    limits: {
      maxClients: 100,
      maxSessions: -1, // ilimitado
      videoCallMinutes: 2000,
      storageGB: 5,
      supportLevel: 'priority'
    },
    billing: {
      amount: 49.99,
      currency: 'EUR',
      frequency: 'monthly',
      nextBillingDate: '2025-03-01',
      paymentMethod: '**** **** **** 1234'
    },
    usage: {
      currentClients: 32,
      sessionsThisMonth: 87,
      videoMinutesUsed: 645,
      storageUsedGB: 2.3
    },
    subscriptionDate: '2024-09-01',
    renewalDate: '2025-03-01'
  };
};

export const getAvailablePlans = async () => {
  // Simular llamada API para obtener planes disponibles
  await new Promise(resolve => setTimeout(resolve, 600));

  return [
    {
      id: 'basic',
      name: 'Plan Básico',
      description: 'Ideal para terapeutas que están comenzando su práctica',
      price: 19.99,
      currency: 'EUR',
      frequency: 'monthly',
      features: [
        'Hasta 25 clientes',
        'Hasta 100 sesiones/mes',
        'Herramientas básicas de gestión',
        'Plantillas de planes terapéuticos',
        'Soporte por email'
      ],
      limits: {
        maxClients: 25,
        maxSessions: 100,
        videoCallMinutes: 500,
        storageGB: 1,
        supportLevel: 'email'
      },
      recommended: false
    },
    {
      id: 'professional',
      name: 'Plan Profesional',
      description: 'Perfecto para terapeutas establecidos con práctica en crecimiento',
      price: 49.99,
      currency: 'EUR',
      frequency: 'monthly',
      features: [
        'Hasta 100 clientes',
        'Sesiones ilimitadas',
        'Videollamadas integradas',
        'Planes terapéuticos personalizados',
        'Herramientas de evaluación',
        'Informes de progreso detallados',
        'Soporte prioritario'
      ],
      limits: {
        maxClients: 100,
        maxSessions: -1,
        videoCallMinutes: 2000,
        storageGB: 5,
        supportLevel: 'priority'
      },
      recommended: true,
      popular: true
    },
    {
      id: 'premium',
      name: 'Plan Premium',
      description: 'Para clínicas y terapeutas con alta demanda',
      price: 99.99,
      currency: 'EUR',
      frequency: 'monthly',
      features: [
        'Hasta 500 clientes',
        'Sesiones ilimitadas',
        'Videollamadas HD ilimitadas',
        'IA para análisis de progreso',
        'Integraciones avanzadas',
        'Marca personalizada',
        'API access',
        'Soporte dedicado 24/7'
      ],
      limits: {
        maxClients: 500,
        maxSessions: -1,
        videoCallMinutes: -1,
        storageGB: 20,
        supportLevel: 'premium'
      },
      recommended: false
    },
    {
      id: 'enterprise',
      name: 'Plan Empresa',
      description: 'Solución completa para clínicas y centros de salud mental',
      price: 299.99,
      currency: 'EUR',
      frequency: 'monthly',
      features: [
        'Clientes ilimitados',
        'Multi-terapeuta',
        'Panel de administración',
        'Cumplimiento RGPD avanzado',
        'Integraciones personalizadas',
        'Formación y onboarding',
        'Soporte dedicado',
        'SLA garantizado'
      ],
      limits: {
        maxClients: -1,
        maxSessions: -1,
        videoCallMinutes: -1,
        storageGB: -1,
        supportLevel: 'dedicated'
      },
      recommended: false,
      enterprise: true
    }
  ];
};

export const upgradePlan = async (planId) => {
  // Simular llamada API para actualizar plan
  await new Promise(resolve => setTimeout(resolve, 1500));

  const planNames = {
    basic: 'Plan Básico',
    professional: 'Plan Profesional',
    premium: 'Plan Premium',
    enterprise: 'Plan Empresa'
  };

  return {
    success: true,
    message: `Plan actualizado exitosamente a ${planNames[planId]}`,
    newPlan: {
      id: planId,
      name: planNames[planId],
      effectiveDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0], // mañana
      prorationCredit: planId === 'basic' ? 0 : 15.50,
      nextBillingAmount: planId === 'basic' ? 19.99 : planId === 'professional' ? 49.99 : planId === 'premium' ? 99.99 : 299.99
    },
    transaction: {
      id: `txn_${Date.now()}`,
      type: 'plan_change',
      status: 'pending',
      processedAt: new Date().toISOString()
    }
  };
};

export const cancelPlan = async (reason, feedback) => {
  // Simular llamada API para cancelar plan
  await new Promise(resolve => setTimeout(resolve, 1200));

  return {
    success: true,
    message: 'Suscripción cancelada exitosamente',
    cancellation: {
      effectiveDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // en 30 días
      accessUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      reason: reason || 'user_request',
      feedback: feedback || '',
      refundAmount: 0, // No reembolso por cancelación voluntaria
      dataRetentionDays: 90
    },
    alternatives: [
      {
        type: 'pause_subscription',
        title: 'Pausar suscripción',
        description: 'Pausa tu plan por hasta 3 meses sin perder tus datos',
        action: 'pause'
      },
      {
        type: 'downgrade',
        title: 'Cambiar a plan básico',
        description: 'Reduce costos manteniendo funcionalidades esenciales',
        action: 'downgrade_to_basic'
      }
    ]
  };
};

export const pauseSubscription = async (months = 1) => {
  // Simular llamada API para pausar suscripción
  await new Promise(resolve => setTimeout(resolve, 1000));

  return {
    success: true,
    message: `Suscripción pausada por ${months} mes(es)`,
    pause: {
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + months * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      dataPreserved: true,
      reactivationDate: new Date(Date.now() + months * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    }
  };
};

export const getBillingHistory = async () => {
  // Simular llamada API para obtener historial de facturación
  await new Promise(resolve => setTimeout(resolve, 700));

  return [
    {
      id: 'inv_2025_02',
      date: '2025-02-01',
      amount: 49.99,
      currency: 'EUR',
      status: 'paid',
      plan: 'professional',
      period: '2025-02-01 - 2025-03-01',
      paymentMethod: '**** 1234',
      downloadUrl: '/invoices/inv_2025_02.pdf'
    },
    {
      id: 'inv_2025_01',
      date: '2025-01-01',
      amount: 49.99,
      currency: 'EUR',
      status: 'paid',
      plan: 'professional',
      period: '2025-01-01 - 2025-02-01',
      paymentMethod: '**** 1234',
      downloadUrl: '/invoices/inv_2025_01.pdf'
    },
    {
      id: 'inv_2024_12',
      date: '2024-12-01',
      amount: 19.99,
      currency: 'EUR',
      status: 'paid',
      plan: 'basic',
      period: '2024-12-01 - 2025-01-01',
      paymentMethod: '**** 1234',
      downloadUrl: '/invoices/inv_2024_12.pdf'
    }
  ];
};