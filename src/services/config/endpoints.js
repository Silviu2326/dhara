// Configuración centralizada de endpoints de la API

export const API_VERSIONS = {
  V1: "/api/v1",
  V2: "/api/v2",
};

export const ENDPOINTS = {
  // ==================== AUTH ENDPOINTS ====================
  AUTH: {
    BASE: "/auth",
    LOGIN: "/auth/login",
    REGISTER: "/auth/register",
    LOGOUT: "/auth/logout",
    REFRESH: "/auth/refresh",
    FORGOT_PASSWORD: "/auth/forgot-password",
    RESET_PASSWORD: "/auth/reset-password",
    CHANGE_PASSWORD: "/auth/change-password",
    VERIFY_EMAIL: "/auth/verify-email",
    RESEND_VERIFICATION: "/auth/resend-verification",
    ME: "/auth/me",
    SESSIONS: "/auth/sessions",
    REVOKE_ALL_SESSIONS: "/auth/revoke-all-sessions",
  },

  // ==================== USER ENDPOINTS ====================
  USERS: {
    BASE: "/users",
    PROFILE: "/users/profile",
    AVATAR: "/users/avatar",
    PREFERENCES: "/users/preferences",
    STATISTICS: "/users/statistics",
    ACTIVITY_LOG: "/users/activity",
    EXPORT_DATA: "/users/export",
    DELETE_ACCOUNT: "/users/delete-account",
    TWO_FACTOR: {
      ENABLE: "/users/2fa/enable",
      DISABLE: "/users/2fa/disable",
      VERIFY: "/users/2fa/verify",
      BACKUP_CODES: "/users/2fa/backup-codes",
    },
  },

  // ==================== PROFESSIONAL PROFILE ====================
  PROFESSIONAL_PROFILE: {
    BASE: "/profile",
    SPECIALTIES: "/profile/specialties",
    THERAPIES: "/profile/therapies",
    VIDEO_PRESENTATION: "/profile/video",
    STATISTICS: "/profile/statistics",
    AVAILABILITY_STATUS: "/profile/availability",
    PORTFOLIO: "/profile/portfolio",
    CERTIFICATIONS: "/profile/certifications",
    LANGUAGES: "/profile/languages",
    SOCIAL_MEDIA: "/profile/social-media",
  },

  // ==================== VERIFICATION ====================
  VERIFICATION: {
    BASE: "/verification",
    DOCUMENTS: "/verification/documents",
    STATUS: "/verification/status",
    REQUIREMENTS: "/verification/requirements",
    SUBMIT: "/verification/submit",
    RESUBMIT: "/verification/resubmit",
  },

  // ==================== CREDENTIALS ====================
  CREDENTIALS: {
    BASE: "/credentials",
    EDUCATION: "/credentials/education",
    LICENSES: "/credentials/licenses",
    CERTIFICATIONS: "/credentials/certifications",
    EXPERIENCE: "/credentials/experience",
    VERIFY: "/credentials/verify",
  },

  // ==================== APPOINTMENTS/BOOKINGS ====================
  BOOKINGS: {
    BASE: "/bookings",
    LIST: "/bookings",
    CREATE: "/bookings",
    DETAIL: "/bookings/:id",
    UPDATE: "/bookings/:id",
    CANCEL: "/bookings/:id/cancel",
    RESCHEDULE: "/bookings/:id/reschedule",
    CONFIRM: "/bookings/:id/confirm",
    COMPLETE: "/bookings/:id/complete",
    HISTORY: "/bookings/history",
    UPCOMING: "/bookings/upcoming",
    STATISTICS: "/bookings/statistics",
  },

  // ==================== AVAILABILITY ====================
  availability: {
    BASE: "/availability",
    getAll: "/availability",
    create: "/availability",
    createBlock: "/availability/blocks",
    getById: "/availability/:id",
    getBlockById: "/availability/blocks/:id",
    update: "/availability/:id",
    updateBlock: "/availability/blocks/:id",
    delete: "/availability/:id",
    deleteBlock: "/availability/blocks/:id",
    getByTherapist: "/availability/therapist/:therapistId",
    getBlocksByTherapist: "/availability/therapist/:therapistId/blocks",
    calendar: "/availability/calendar",
    slots: "/availability/slots",
    updateSlots: "/availability/update",
    bulkUpdate: "/availability/bulk-update",
    getExceptions: "/availability/exceptions",
    createException: "/availability/exceptions",
    updateException: "/availability/exceptions/:id",
    deleteException: "/availability/exceptions/:id",
    recurring: "/availability/recurring",
    conflicts: "/availability/conflicts",
    checkConflicts: "/availability/conflicts/check",
    checkAppointments: "/availability/appointments/check",
    sync: "/availability/sync",
    syncExternalCalendar: "/availability/sync/external",
    export: "/availability/export",
    resolveConflicts: "/availability/conflicts/resolve",
    notifyScheduleChange: "/availability/notify",
    syncTimeBlockExternal: "/availability/blocks/:id/sync-external",
    syncExceptionExternal: "/availability/exceptions/:id/sync-external",
    getExternalCalendarStatus:
      "/availability/:therapistId/external-calendar-status",
  },

  // ==================== WORK LOCATIONS ====================
  WORK_LOCATIONS: {
    BASE: "/work-locations",
    CREATE: "/work-locations",
    GET_BY_ID: "/work-locations/:id",
    UPDATE: "/work-locations/:id",
    DELETE: "/work-locations/:id",
    GET_BY_THERAPIST: "/work-locations/therapist",
    VALIDATE_ADDRESS: "/work-locations/validate-address",
    SEARCH_NEARBY: "/work-locations/search-nearby",
    ADD_ROOM: "/work-locations/:locationId/rooms",
    UPDATE_SCHEDULE: "/work-locations/:locationId/schedule",
    GET_STATISTICS: "/work-locations/:locationId/statistics",
    UPDATE_PRIMARY: "/work-locations/primary",
    CHECK_ACTIVE_APPOINTMENTS:
      "/work-locations/:locationId/appointments/active",
  },

  // ==================== RATES ====================
  RATES: {
    BASE: "/rates",
    GET_ALL: "/rates",
    CREATE: "/rates",
    UPDATE: "/rates/:id",
    DELETE: "/rates/:id",
    GET_BY_THERAPIST: "/rates/therapist",
    BULK_UPDATE: "/rates/bulk",
  },

  // ==================== PRICING PACKAGES ====================
  pricing: {
    packages: "/pricing/packages",
    getPackage: "/pricing/packages/:id",
    createPackage: "/pricing/packages",
    updatePackage: "/pricing/packages/:id",
    deletePackage: "/pricing/packages/:id",
    status: "/pricing/packages/:id/status",
  },

  // ==================== CLIENTS ====================
  clients: {
    BASE: "/clients",
    getAll: "/clients",
    create: "/clients",
    getById: "/clients/:id",
    update: "/clients/:id",
    delete: "/clients/:id",
    search: "/clients/search",
    getStatistics: "/clients/:id/statistics",
    updateTags: "/clients/:id/tags",
    bulkOperations: "/clients/bulk",
    exportData: "/clients/:id/export",
    uploadAvatar: "/clients/:id/avatar",
    getHistory: "/clients/:id/history",
    notes: "/clients/:id/notes",
    documents: "/clients/:id/documents",
    block: "/clients/:id/block",
    unblock: "/clients/:id/unblock",
  },

  // ==================== THERAPY PLANS ====================
  therapyPlans: {
    BASE: "/plans",
    getAll: "/plans",
    create: "/plans",
    getById: "/plans/:id",
    update: "/plans/:id",
    delete: "/plans/:id",
    search: "/plans/search",
    getTemplates: "/plans/templates",
    getEffectiveness: "/plans/:planId/effectiveness",
    generateReport: "/plans/:planId/report",
    bulkOperations: "/plans/bulk",
    checkActiveAssignments: "/plans/:planId/active-assignments",
    notifyUpdates: "/plans/:planId/notify",
    getStats: "/plans/stats",
    getPopular: "/plans/popular",
    getByType: "/plans/type/:type",
    calculateSchedule: "/plans/:planId/schedule",
    activate: "/plans/:planId/activate",
    archive: "/plans/:planId/archive",
    createTemplate: "/plans/:planId/template",
    share: "/plans/:planId/share",
    assign: "/plans/:planId/assign",
  },

  // ==================== PLAN ASSIGNMENTS ====================
  planAssignments: {
    BASE: "/plan-assignments",
    getAll: "/plan-assignments",
    create: "/plan-assignments",
    getById: "/plan-assignments/:id",
    update: "/plan-assignments/:id",
    delete: "/plan-assignments/:id",
    updateProgress: "/plan-assignments/:assignmentId/progress",
    modifyPlan: "/plan-assignments/:assignmentId/modify",
    reassign: "/plan-assignments/:assignmentId/reassign",
    complete: "/plan-assignments/:assignmentId/complete",
    generateReport: "/plan-assignments/:assignmentId/report",
    recordMilestone: "/plan-assignments/:assignmentId/milestones",
    scheduleReminders: "/plan-assignments/:assignmentId/reminders",
    checkCompatibility: "/plan-assignments/check-compatibility",
    checkOverdue: "/plan-assignments/check-overdue",
    notifyCreated: "/plan-assignments/:assignmentId/notify/created",
    notifyProgress: "/plan-assignments/:assignmentId/notify/progress",
    notifyModification: "/plan-assignments/:assignmentId/notify/modification",
    notifyReassignment: "/plan-assignments/:assignmentId/notify/reassignment",
    notifyCompleted: "/plan-assignments/:assignmentId/notify/completed",
  },

  // ==================== NOTIFICATIONS ====================
  notifications: {
    BASE: "/notifications",
    create: "/notifications",
    getAll: "/notifications",
    getById: "/notifications/:id",
    markRead: "/notifications/:id/read",
    markAllRead: "/notifications/mark-all-read",
    delete: "/notifications/:id",
    preferences: "/notifications/preferences",
    pushSubscription: "/notifications/push/subscribe",
    test: "/notifications/test",
    // Legacy endpoints
    LIST: "/notifications",
    MARK_READ: "/notifications/:id/read",
    MARK_ALL_READ: "/notifications/mark-all-read",
    DELETE: "/notifications/:id",
    PREFERENCES: "/notifications/preferences",
    PUSH_SUBSCRIPTION: "/notifications/push/subscribe",
    TEST: "/notifications/test",
  },

  // ==================== CHAT/MESSAGING ====================
  MESSAGING: {
    BASE: "/messages",
    CONVERSATIONS: "/messages/conversations",
    CONVERSATION: "/messages/conversations/:id",
    SEND: "/messages/conversations/:id/send",
    MARK_READ: "/messages/conversations/:id/read",
    UPLOAD_ATTACHMENT: "/messages/attachments",
    SEARCH: "/messages/search",
  },

  chat: {
    base: "/chat",
    createConversation: "/chat/conversations",
    sendMessage: "/chat/messages",
    getConversation: "/chat/conversations/:id",
    getMessages: "/chat/messages",
    markAsRead: "/chat/messages/:messageId/read",
    editMessage: "/chat/messages/:messageId",
    deleteMessage: "/chat/messages/:messageId",
    searchMessages: "/chat/messages/search",
    archiveConversation: "/chat/conversations/:conversationId/archive",
    uploadAttachment: "/chat/attachments",
    moderateContent: "/chat/moderate",
    flagMessage: "/chat/messages/:messageId/flag",
    notifyConversationCreated: "/chat/conversations/:conversationId/notify",
    getMessage: "/chat/messages/:messageId",
  },

  // ==================== PAYMENTS ====================
  payments: {
    BASE: "/payments",
    getAll: "/payments",
    create: "/payments",
    getById: "/payments/:id",
    updateStatus: "/payments/:id/status",
    process: "/payments/:id/process",
    refund: "/payments/:id/refund",
    downloadInvoice: "/payments/:id/invoice/download",
    createInvoice: "/payments/:id/invoice",
    createReceipt: "/payments/:id/receipt",
    handleDispute: "/payments/:id/dispute",
    submitDisputeEvidence: "/disputes/:disputeId/evidence",
    notifySuccess: "/payments/:id/notify/success",
    notifyFailure: "/payments/:id/notify/failure",
    notifyRefund: "/payments/:id/notify/refund",
    triggerPostActions: "/payments/:id/trigger-actions",
    scheduleRetry: "/payments/:id/schedule-retry",
    updatePendingStatuses: "/payments/update-pending-statuses",
    getTransactionHistory: "/payments/transaction-history",
    calculateFees: "/payments/calculate-fees",
    checkFraud: "/payments/check-fraud",
    getProviders: "/payments/providers",
    // Legacy endpoints
    METHODS: "/payments/methods",
    ADD_METHOD: "/payments/methods",
    DELETE_METHOD: "/payments/methods/:id",
    PROCESS: "/payments/process",
    HISTORY: "/payments/history",
    INVOICES: "/payments/invoices",
    REFUND: "/payments/:id/refund",
    WEBHOOKS: "/payments/webhooks",
    STATISTICS: "/payments/statistics",
  },

  // ==================== PLANS & SUBSCRIPTIONS ====================
  SUBSCRIPTIONS: {
    BASE: "/subscriptions",
    PLANS: "/subscriptions/plans",
    CURRENT: "/subscriptions/current",
    SUBSCRIBE: "/subscriptions/subscribe",
    UPGRADE: "/subscriptions/upgrade",
    DOWNGRADE: "/subscriptions/downgrade",
    CANCEL: "/subscriptions/cancel",
    REACTIVATE: "/subscriptions/reactivate",
    BILLING_HISTORY: "/subscriptions/billing-history",
    // Payout endpoints
    PAYOUT_DATA: "/subscriptions/payout-data",
    REQUEST_PAYOUT: "/subscriptions/request-payout",
    PAYOUT_HISTORY: "/subscriptions/payout-history",
  },

  // ==================== REVIEWS & RATINGS ====================
  REVIEWS: {
    BASE: "/reviews",
    LIST: "/reviews",
    CREATE: "/reviews",
    UPDATE: "/reviews/:id",
    DELETE: "/reviews/:id",
    REPLY: "/reviews/:id/reply",
    REPORT: "/reviews/:id/report",
    STATISTICS: "/reviews/statistics",
  },

  // ==================== AUTO RESPONSES ====================
  AUTO_RESPONSES: {
    BASE: "/auto-responses",
    GET: "/auto-responses",
    UPDATE: "/auto-responses",
    RESET: "/auto-responses/reset/:rating",
    RESET_ALL: "/auto-responses/reset-all",
  },

  // ==================== SESSION NOTES ====================
  SESSION_NOTES: {
    BASE: "/session-notes",
    LIST: "/session-notes",
    CREATE: "/session-notes",
    GET_BY_ID: "/session-notes/:id",
    UPDATE: "/session-notes/:id",
    DELETE: "/session-notes/:id",
    GET_BY_CLIENT: "/session-notes/client/:clientId",
    GET_BY_BOOKING: "/session-notes/booking/:bookingId",
    SEARCH: "/session-notes/search",
    STATISTICS: "/session-notes/statistics",
  },

  // ==================== NOTES ====================
  NOTES: {
    BASE: "/notes",
    LIST: "/notes",
    CREATE: "/notes",
    GET_BY_ID: "/notes/:id",
    UPDATE: "/notes/:id",
    DELETE: "/notes/:id",
    ADD_RESPONSE: "/notes/:id/response",
    EMERGENCY: "/notes/emergency",
    PENDING_RESPONSES: "/notes/pending-responses",
    HIDE: "/notes/:id/hide",
  },

  // ==================== DOCUMENTS & MATERIALS ====================
  DOCUMENTS: {
    BASE: "/documents",
    UPLOAD: "/documents/upload",
    LIST: "/documents",
    DETAIL: "/documents/:id",
    DOWNLOAD: "/documents/:id/download",
    DELETE: "/documents/:id",
    SHARE: "/documents/:id/share",
    SEARCH: "/documents/search",
    CATEGORIES: "/documents/categories",
    TEMPLATES: "/documents/templates",
  },

  // ==================== INTEGRATIONS ====================
  INTEGRATIONS: {
    BASE: "/integrations",
    CALENDAR: "/integrations/calendar",
    VIDEO_CALLS: "/integrations/video-calls",
    PAYMENT_GATEWAYS: "/integrations/payments",
    EMAIL: "/integrations/email",
    SMS: "/integrations/sms",
    SOCIAL_MEDIA: "/integrations/social-media",
  },

  // ==================== ANALYTICS & REPORTS ====================
  ANALYTICS: {
    BASE: "/analytics",
    DASHBOARD: "/analytics/dashboard",
    BOOKINGS: "/analytics/bookings",
    REVENUE: "/analytics/revenue",
    CLIENTS: "/analytics/clients",
    PERFORMANCE: "/analytics/performance",
    EXPORT: "/analytics/export",
  },

  // ==================== SUPPORT & HELP ====================
  SUPPORT: {
    BASE: "/support",
    TICKETS: "/support/tickets",
    CREATE_TICKET: "/support/tickets",
    TICKET_DETAIL: "/support/tickets/:id",
    FAQ: "/support/faq",
    KNOWLEDGE_BASE: "/support/kb",
    CONTACT: "/support/contact",
    FEEDBACK: "/support/feedback",
  },

  // ==================== AUDIT LOGS ====================
  AUDIT_LOGS: {
    BASE: "/audit-logs",
    CREATE: "/audit-logs",
    GET_ALL: "/audit-logs",
    GET_BY_ID: "/audit-logs/:id",
    SEARCH: "/audit-logs/search",
    EXPORT: "/audit-logs/export",
    STATISTICS: "/audit-logs/statistics",
    RETENTION: "/audit-logs/retention",
    BACKUP: "/audit-logs/backup",
  },

  // ==================== SYSTEM & ADMIN ====================
  SYSTEM: {
    BASE: "/system",
    HEALTH: "/system/health",
    STATUS: "/system/status",
    MAINTENANCE: "/system/maintenance",
    LOGS: "/system/logs",
    METRICS: "/system/metrics",
    CACHE: "/system/cache",
  },

  // ==================== UTILITIES ====================
  UTILS: {
    BASE: "/utils",
    UPLOAD: "/utils/upload",
    GEOCODE: "/utils/geocode",
    TIMEZONE: "/utils/timezone",
    CURRENCY: "/utils/currency",
    TRANSLATE: "/utils/translate",
    QR_CODE: "/utils/qr-code",
  },
};

// Helper para construir URLs dinámicas
export const buildEndpoint = (template, params = {}) => {
  let url = template;
  Object.keys(params).forEach((key) => {
    url = url.replace(`:${key}`, params[key]);
  });
  return url;
};

// Helper para construir query strings
export const buildQueryString = (params = {}) => {
  const searchParams = new URLSearchParams();
  Object.keys(params).forEach((key) => {
    const value = params[key];
    if (value !== null && value !== undefined && value !== "") {
      if (Array.isArray(value)) {
        value.forEach((item) => searchParams.append(key, item));
      } else {
        searchParams.append(key, value);
      }
    }
  });
  return searchParams.toString();
};

// Helper para construir URL completa con query string
export const buildFullUrl = (endpoint, pathParams = {}, queryParams = {}) => {
  const url = buildEndpoint(endpoint, pathParams);
  const queryString = buildQueryString(queryParams);
  return queryString ? `${url}?${queryString}` : url;
};

// Validador de endpoints
export const validateEndpoint = (endpoint) => {
  if (!endpoint || typeof endpoint !== "string") {
    throw new Error("Invalid endpoint provided");
  }

  if (!endpoint.startsWith("/")) {
    throw new Error("Endpoint must start with /");
  }

  return true;
};

// Helper para obtener endpoints por categoría
export const getEndpointsByCategory = (category) => {
  const categoryKey = category.toUpperCase();
  return ENDPOINTS[categoryKey] || {};
};

// Helper para buscar endpoints
export const findEndpoint = (searchTerm) => {
  const results = [];

  const searchInObject = (obj, path = "") => {
    for (const [key, value] of Object.entries(obj)) {
      const currentPath = path ? `${path}.${key}` : key;

      if (typeof value === "string") {
        if (
          value.toLowerCase().includes(searchTerm.toLowerCase()) ||
          key.toLowerCase().includes(searchTerm.toLowerCase())
        ) {
          results.push({
            path: currentPath,
            endpoint: value,
            key,
          });
        }
      } else if (typeof value === "object") {
        searchInObject(value, currentPath);
      }
    }
  };

  searchInObject(ENDPOINTS);
  return results;
};

// Helper para validar parámetros requeridos
export const validateRequiredParams = (endpoint, params) => {
  const requiredParams = [];
  const matches = endpoint.match(/:(\w+)/g);

  if (matches) {
    matches.forEach((match) => {
      const paramName = match.substring(1);
      requiredParams.push(paramName);
    });
  }

  const missingParams = requiredParams.filter(
    (param) =>
      !params.hasOwnProperty(param) ||
      params[param] === null ||
      params[param] === undefined,
  );

  if (missingParams.length > 0) {
    throw new Error(`Missing required parameters: ${missingParams.join(", ")}`);
  }

  return true;
};

// Helper para obtener metadatos de endpoint
export const getEndpointMetadata = (endpoint) => {
  const params = [];
  const matches = endpoint.match(/:(\w+)/g);

  if (matches) {
    matches.forEach((match) => {
      params.push(match.substring(1));
    });
  }

  return {
    endpoint,
    hasParams: params.length > 0,
    params,
    isPublic:
      endpoint.includes("/auth/") &&
      (endpoint.includes("login") ||
        endpoint.includes("register") ||
        endpoint.includes("forgot-password")),
    requiresAuth:
      !endpoint.includes("/auth/login") &&
      !endpoint.includes("/auth/register") &&
      !endpoint.includes("/system/health"),
  };
};

export default ENDPOINTS;
