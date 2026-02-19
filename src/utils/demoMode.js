/**
 * Utilidades para modo demostración
 * Permite mostrar datos de ejemplo cuando no hay autenticación
 */
import { tokenManager } from '../services/utils/tokenManager';

export const demoMode = {
  /**
   * Verifica si estamos en modo demostración
   */
  isEnabled() {
    // Deshabilitado - no mostrar datos de demostración
    return false;
  },

  /**
   * Verifica si hay un token válido disponible
   */
  hasValidToken() {
    try {
      const token = tokenManager.getAccessToken();
      return !!token && !tokenManager.isTokenExpired(token);
    } catch (error) {
      return false;
    }
  },

  /**
   * Detecta si un error es de autenticación
   */
  isAuthError(error) {
    return error?.response?.status === 401 ||
           error?.status === 401 ||
           error?.message?.includes('401') ||
           error?.message?.includes('Unauthorized');
  },

  /**
   * Muestra notificación de modo demo
   */
  showDemoNotification() {
    if (this.isEnabled() && !sessionStorage.getItem('demoNotificationShown')) {
      console.info(
        '%c🎭 Modo Demostración Activado',
        'background: #4f46e5; color: white; padding: 8px 12px; border-radius: 4px; font-weight: bold;',
        '\nEstás viendo datos de ejemplo porque no hay autenticación válida.'
      );
      sessionStorage.setItem('demoNotificationShown', 'true');
    }
  },

  /**
   * Helper para manejar llamadas a servicios con fallback silencioso
   */
  async handleServiceCall(serviceCall, fallbackData = null) {
    try {
      console.log('🎭 [DEMO MODE] Executing service call...');
      const result = await serviceCall();
      console.log('✅ [DEMO MODE] Service call successful:', result);
      return result;
    } catch (error) {
      console.log('❌ [DEMO MODE] Service call failed:', error);
      if (this.isAuthError(error)) {
        console.warn('🔐 [DEMO MODE] Authentication error silenced, returning fallback data:', error.message);
        return fallbackData;
      }
      console.log('🚨 [DEMO MODE] Re-throwing non-auth error');
      throw error;
    }
  }
};

/**
 * Datos de demostración para diferentes servicios
 */
export const demoData = {
  // Estadísticas del perfil profesional (vacías)
  profileStats: {
    totalSessions: 0,
    activeClients: 0,
    averageRating: 0,
    totalClients: 0,
    responseTime: 0,
    completionRate: 0,
    monthlySessions: 0,
    newClients: 0,
    monthlyRevenue: 0,
    satisfactionRate: 0
  },

  // Datos vacíos para evitar mostrar información de prueba
  reviews: [],

  // Datos del perfil (vacíos)
  profileData: {
    avatar: null,
    banner: null,
    about: '',
    therapies: [],
    workLocations: [],
    rates: {
      sessionPrice: 0,
      currency: 'EUR',
      discounts: {
        multiSession: 0,
        student: 0,
        unemployed: 0
      }
    },
    isAvailable: true,
    credentials: [],
    legalInfo: {
      licenses: [],
      dataProtectionCompliance: false
    },
    workExperience: [],
    externalLinks: [],
    featuredTestimonials: [],
    videoPresentation: null,
    pricingPackages: {
      packages: [],
      coupons: []
    }
  }
};

export default { demoMode, demoData };