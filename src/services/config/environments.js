// Configuración de ambientes para la aplicación Dharaterapeutas

export const ENVIRONMENTS = {
  // Ambiente actual
  get current() {
    return import.meta.env.MODE || 'development';
  },

  // URLs base por ambiente
  get API_BASE_URL() {
    const env = this.current;
    const urls = {
      development: 'https://dharaback-production.up.railway.app/api',
      staging: 'https://staging-api.dharaterapeutas.com/api',
      production: 'https://api.dharaterapeutas.com/api'
    };
    return urls[env] || urls.development;
  },

  // URL del socket para tiempo real
  get SOCKET_URL() {
    const env = this.current;
    const urls = {
      development: 'ws://localhost:5001',
      staging: 'wss://staging-socket.dharaterapeutas.com',
      production: 'wss://socket.dharaterapeutas.com'
    };
    return urls[env] || urls.development;
  },

  // URL de archivos/uploads
  get UPLOADS_BASE_URL() {
    const env = this.current;
    const urls = {
      development: 'https://dharaback-production.up.railway.app/uploads',
      staging: 'https://staging-cdn.dharaterapeutas.com',
      production: 'https://cdn.dharaterapeutas.com'
    };
    return urls[env] || urls.development;
  },

  // Configuración de logging por ambiente
  get LOG_LEVEL() {
    const env = this.current;
    const levels = {
      development: 'debug',
      staging: 'info',
      production: 'error'
    };
    return levels[env] || 'debug';
  },

  // Configuración de cache por ambiente
  get CACHE_ENABLED() {
    const env = this.current;
    return env !== 'development';
  },

  // Configuración de mock data
  get ENABLE_MOCK_DATA() {
    return this.current === 'development' && import.meta.env.VITE_ENABLE_MOCK === 'true';
  },

  // Configuración de DevTools
  get ENABLE_REDUX_DEVTOOLS() {
    return this.current !== 'production';
  },

  // Configuración de analytics
  get ANALYTICS_ENABLED() {
    return this.current === 'production';
  },

  // Configuración de error reporting
  get ERROR_REPORTING_ENABLED() {
    return this.current !== 'development';
  },

  // Configuración de debug
  get DEBUG_MODE() {
    return this.current === 'development';
  },

  // Verificadores de ambiente
  get isDevelopment() {
    return this.current === 'development';
  },

  get isStaging() {
    return this.current === 'staging';
  },

  get isProduction() {
    return this.current === 'production';
  },

  // Variables de configuración específicas
  get config() {
    const env = this.current;

    const baseConfig = {
      // Configuración de API
      api: {
        timeout: 30000,
        retryAttempts: 3,
        retryDelay: 1000
      },

      // Configuración de autenticación
      auth: {
        tokenRefreshThreshold: 15 * 60 * 1000, // 15 minutos
        sessionTimeout: 8 * 60 * 60 * 1000,    // 8 horas
        rememberMeTimeout: 30 * 24 * 60 * 60 * 1000 // 30 días
      },

      // Configuración de archivos
      files: {
        maxUploadSize: 50 * 1024 * 1024, // 50MB
        chunkSize: 1024 * 1024,          // 1MB
        allowedImageTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
        allowedDocumentTypes: [
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        ]
      },

      // Configuración de notificaciones
      notifications: {
        enablePush: true,
        enableEmail: true,
        enableSMS: false
      }
    };

    const environmentConfigs = {
      development: {
        ...baseConfig,
        api: {
          ...baseConfig.api,
          timeout: 60000, // Mayor timeout en desarrollo
          retryAttempts: 1
        },
        debug: {
          enableConsoleLogging: true,
          enableNetworkLogging: true,
          enablePerformanceLogging: true
        },
        demo: {
          enableDemoAuth: true,
          // JWT token VÁLIDO con ID real del terapeuta "Admin Demo" (ID: 68ce20c17931a40b74af366a)
          // Firmado con la clave secreta real del backend
          demoAuthToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4Y2UyMGMxNzkzMWE0MGI3NGFmMzY2YSIsImVtYWlsIjoiYWRtaW5AZGVtby5jb20iLCJyb2xlIjoidGhlcmFwaXN0IiwiaWF0IjoxNzU5MDIwNzk0LCJleHAiOjE3NTkxMDcxOTR9.8vh-0vox0m8ipR8JHXHF0Up3oU_8lqBwusA4fV1wipc'
        }
      },

      staging: {
        ...baseConfig,
        debug: {
          enableConsoleLogging: true,
          enableNetworkLogging: false,
          enablePerformanceLogging: true
        }
      },

      production: {
        ...baseConfig,
        api: {
          ...baseConfig.api,
          timeout: 20000, // Menor timeout en producción
          retryAttempts: 2
        },
        debug: {
          enableConsoleLogging: false,
          enableNetworkLogging: false,
          enablePerformanceLogging: false
        }
      }
    };

    return environmentConfigs[env] || environmentConfigs.development;
  },

  // Helper para obtener variables de entorno
  getEnvVar(key, defaultValue = null) {
    return import.meta.env[key] || defaultValue;
  },

  // Helper para verificar si una feature está habilitada
  isFeatureEnabled(featureName) {
    const envVar = `VITE_FEATURE_${featureName.toUpperCase()}`;
    return this.getEnvVar(envVar, 'false') === 'true';
  },

  // Configuración de terceros por ambiente
  get integrations() {
    const env = this.current;

    return {
      // Google Analytics
      googleAnalytics: {
        enabled: env === 'production',
        trackingId: this.getEnvVar('VITE_GA_TRACKING_ID')
      },

      // Sentry para error tracking
      sentry: {
        enabled: env !== 'development',
        dsn: this.getEnvVar('VITE_SENTRY_DSN'),
        environment: env
      },

      // Stripe para pagos
      stripe: {
        enabled: true,
        publishableKey: this.getEnvVar(
          env === 'production'
            ? 'VITE_STRIPE_PUBLISHABLE_KEY_PROD'
            : 'VITE_STRIPE_PUBLISHABLE_KEY_TEST'
        )
      },

      // Socket.io
      socketio: {
        enabled: true,
        autoConnect: env === 'production',
        reconnectionAttempts: env === 'production' ? 5 : 3,
        reconnectionDelay: 1000
      }
    };
  }
};

// Helper para validar configuración de ambiente
export const validateEnvironmentConfig = () => {
  const requiredEnvVars = {
    development: [],
    staging: ['VITE_SENTRY_DSN'],
    production: [
      'VITE_GA_TRACKING_ID',
      'VITE_SENTRY_DSN',
      'VITE_STRIPE_PUBLISHABLE_KEY_PROD'
    ]
  };

  const currentEnv = ENVIRONMENTS.current;
  const required = requiredEnvVars[currentEnv] || [];
  const missing = required.filter(envVar => !ENVIRONMENTS.getEnvVar(envVar));

  if (missing.length > 0) {
    console.warn(`Missing required environment variables for ${currentEnv}:`, missing);
  }

  return missing.length === 0;
};

export default ENVIRONMENTS;