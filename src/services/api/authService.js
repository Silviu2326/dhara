import { apiMethods } from '../config/apiClient';
import { ENDPOINTS } from '../config/endpoints';
import { tokenManager } from '../utils/tokenManager';
import { errorHandler } from '../utils/errorHandler';
import { logger } from '../utils/logger';
import { security } from '../utils/security';
import { storage } from '../utils/storage';
import { APP_CONSTANTS } from '../config/constants';

/**
 * Servicio de autenticación completo
 */
class AuthService {
  constructor() {
    this.isInitialized = false;
    this.authState = {
      isAuthenticated: false,
      user: null,
      loading: false,
      error: null
    };

    // Listeners para cambios de estado
    this.listeners = new Set();

    // Inicializar automáticamente
    this.initialize();
  }

  /**
   * Inicializa el servicio de autenticación
   */
  async initialize() {
    try {
      logger.info('Initializing auth service');

      // Validar tokens almacenados
      const isValid = tokenManager.validateStoredTokens();
      if (!isValid) {
        logger.warn('Invalid stored tokens found, clearing');
        this.clearAuthData();
        return;
      }

      // Verificar si hay tokens válidos
      if (tokenManager.isAuthenticated()) {
        await this.loadCurrentUser();
        this.scheduleTokenRefresh();
      }

      this.isInitialized = true;
      logger.info('Auth service initialized successfully');
    } catch (error) {
      logger.error('Auth service initialization failed:', error);
      this.clearAuthData();
    }
  }

  /**
   * Inicia sesión con email y contraseña
   */
  async login(credentials) {
    const { email, password, rememberMe = false, twoFactorCode } = credentials;

    try {
      this.setLoading(true);
      this.clearError();

      // Validar credenciales
      const emailValidation = security.validateEmail(email);
      if (!emailValidation.isValid) {
        throw errorHandler.createError(
          errorHandler.errorCodes.VALIDATION_ERROR,
          emailValidation.error
        );
      }

      if (!password) {
        throw errorHandler.createError(
          errorHandler.errorCodes.VALIDATION_ERROR,
          'Password is required'
        );
      }

      // Preparar datos de login
      const loginData = {
        email: email.toLowerCase().trim(),
        password,
        rememberMe,
        deviceInfo: this.getDeviceInfo(),
        ...(twoFactorCode && { twoFactorCode })
      };

      // Realizar login
      console.log('🔥 FRONTEND: Sending login request with data:', loginData);
      const response = await apiMethods.post(ENDPOINTS.AUTH.LOGIN, loginData);

      console.log('🔥 FRONTEND: Raw response received:', response);
      console.log('🔥 FRONTEND: Response.data:', response.data);
      console.log('🔥 FRONTEND: Response.data.success:', response.data?.success);

      // Verificar si la respuesta fue exitosa
      // El interceptor devuelve response.data directamente, así que response.success debería existir
      if (!response || !response.success) {
        console.log('❌ FRONTEND: Login validation failed');
        console.log('❌ Response exists:', !!response);
        console.log('❌ Response.success:', response?.success);
        console.log('❌ Response.message:', response?.message);
        throw errorHandler.createError(
          errorHandler.errorCodes.AUTHENTICATION_ERROR,
          response?.message || 'Login failed'
        );
      }

      console.log('✅ FRONTEND: Login validation passed, processing success...');

      // Procesar respuesta exitosa
      await this.handleLoginSuccess(response, rememberMe);

      logger.authEvent('login_success', { email, rememberMe });
      return response;
    } catch (error) {
      this.handleAuthError(error);
      logger.authEvent('login_failed', { email, error: error.message });
      throw error;
    } finally {
      this.setLoading(false);
    }
  }

  /**
   * Registra un nuevo usuario
   */
  async register(userData) {
    try {
      this.setLoading(true);
      this.clearError();

      // Validar datos de registro
      const validation = this.validateRegistrationData(userData);
      if (!validation.isValid) {
        throw errorHandler.createError(
          errorHandler.errorCodes.VALIDATION_ERROR,
          'Registration data validation failed',
          { errors: validation.errors }
        );
      }

      // Preparar datos de registro
      const registrationData = {
        ...userData,
        email: userData.email.toLowerCase().trim(),
        deviceInfo: this.getDeviceInfo()
      };

      // Realizar registro
      const response = await apiMethods.post(ENDPOINTS.AUTH.REGISTER, registrationData);

      // Si el registro incluye auto-login
      if (response.accessToken) {
        await this.handleLoginSuccess(response, false);
      }

      logger.authEvent('registration_success', { email: userData.email });
      return response;
    } catch (error) {
      this.handleAuthError(error);
      logger.authEvent('registration_failed', { email: userData.email, error: error.message });
      throw error;
    } finally {
      this.setLoading(false);
    }
  }

  /**
   * Cierra la sesión actual
   */
  async logout(logoutFromAllDevices = false) {
    try {
      this.setLoading(true);

      const endpoint = logoutFromAllDevices
        ? ENDPOINTS.AUTH.REVOKE_ALL_SESSIONS
        : ENDPOINTS.AUTH.LOGOUT;

      // Intentar logout en el servidor
      try {
        await apiMethods.post(endpoint);
      } catch (error) {
        // Continuar con logout local incluso si falla el servidor
        logger.warn('Server logout failed, proceeding with local logout', error);
      }

      // Limpiar datos locales
      this.clearAuthData();

      logger.authEvent('logout_success', { logoutFromAllDevices });
    } catch (error) {
      this.handleAuthError(error);
      logger.authEvent('logout_failed', { error: error.message });
      throw error;
    } finally {
      this.setLoading(false);
    }
  }

  /**
   * Renueva el token de acceso
   */
  async refreshToken() {
    try {
      const refreshToken = tokenManager.getRefreshToken();

      if (!refreshToken || tokenManager.isRefreshTokenExpired()) {
        throw errorHandler.createError(
          errorHandler.errorCodes.TOKEN_EXPIRED,
          'Refresh token expired'
        );
      }

      const response = await apiMethods.post(ENDPOINTS.AUTH.REFRESH, {
        refreshToken
      });

      // Actualizar tokens
      tokenManager.setTokens(response.accessToken, response.refreshToken);

      // Programar próxima renovación
      this.scheduleTokenRefresh();

      logger.authEvent('token_refresh_success');
      return response;
    } catch (error) {
      logger.authEvent('token_refresh_failed', { error: error.message });
      this.clearAuthData();
      throw errorHandler.handleAuthError(error);
    }
  }

  /**
   * Solicita recuperación de contraseña
   */
  async forgotPassword(email) {
    try {
      this.setLoading(true);
      this.clearError();

      const emailValidation = security.validateEmail(email);
      if (!emailValidation.isValid) {
        throw errorHandler.createError(
          errorHandler.errorCodes.VALIDATION_ERROR,
          emailValidation.error
        );
      }

      const response = await apiMethods.post(ENDPOINTS.AUTH.FORGOT_PASSWORD, {
        email: email.toLowerCase().trim()
      });

      logger.authEvent('forgot_password_requested', { email });
      return response;
    } catch (error) {
      this.handleAuthError(error);
      throw error;
    } finally {
      this.setLoading(false);
    }
  }

  /**
   * Restablece la contraseña
   */
  async resetPassword(resetData) {
    const { token, newPassword, confirmPassword } = resetData;

    try {
      this.setLoading(true);
      this.clearError();

      // Validar contraseñas
      if (newPassword !== confirmPassword) {
        throw errorHandler.createError(
          errorHandler.errorCodes.VALIDATION_ERROR,
          'Passwords do not match'
        );
      }

      const passwordValidation = security.validatePasswordStrength(newPassword);
      if (!passwordValidation.isValid) {
        throw errorHandler.createError(
          errorHandler.errorCodes.VALIDATION_ERROR,
          'Password does not meet requirements',
          { suggestions: passwordValidation.suggestions }
        );
      }

      const response = await apiMethods.post(ENDPOINTS.AUTH.RESET_PASSWORD, {
        token,
        newPassword
      });

      logger.authEvent('password_reset_success');
      return response;
    } catch (error) {
      this.handleAuthError(error);
      logger.authEvent('password_reset_failed', { error: error.message });
      throw error;
    } finally {
      this.setLoading(false);
    }
  }

  /**
   * Cambia la contraseña del usuario autenticado
   */
  async changePassword(passwordData) {
    const { currentPassword, newPassword, confirmPassword } = passwordData;

    try {
      this.setLoading(true);
      this.clearError();

      if (newPassword !== confirmPassword) {
        throw errorHandler.createError(
          errorHandler.errorCodes.VALIDATION_ERROR,
          'Passwords do not match'
        );
      }

      const passwordValidation = security.validatePasswordStrength(newPassword);
      if (!passwordValidation.isValid) {
        throw errorHandler.createError(
          errorHandler.errorCodes.VALIDATION_ERROR,
          'Password does not meet requirements',
          { suggestions: passwordValidation.suggestions }
        );
      }

      const response = await apiMethods.post(ENDPOINTS.AUTH.CHANGE_PASSWORD, {
        currentPassword,
        newPassword
      });

      logger.authEvent('password_change_success');
      return response;
    } catch (error) {
      this.handleAuthError(error);
      logger.authEvent('password_change_failed', { error: error.message });
      throw error;
    } finally {
      this.setLoading(false);
    }
  }

  /**
   * Verifica el email del usuario
   */
  async verifyEmail(verificationToken) {
    try {
      this.setLoading(true);
      this.clearError();

      const response = await apiMethods.post(ENDPOINTS.AUTH.VERIFY_EMAIL, {
        token: verificationToken
      });

      // Actualizar usuario si está autenticado
      if (this.isAuthenticated()) {
        await this.loadCurrentUser();
      }

      logger.authEvent('email_verification_success');
      return response;
    } catch (error) {
      this.handleAuthError(error);
      logger.authEvent('email_verification_failed', { error: error.message });
      throw error;
    } finally {
      this.setLoading(false);
    }
  }

  /**
   * Reenvía el email de verificación
   */
  async resendVerificationEmail() {
    try {
      this.setLoading(true);
      this.clearError();

      const response = await apiMethods.post(ENDPOINTS.AUTH.RESEND_VERIFICATION);

      logger.authEvent('verification_email_resent');
      return response;
    } catch (error) {
      this.handleAuthError(error);
      throw error;
    } finally {
      this.setLoading(false);
    }
  }

  /**
   * Carga la información del usuario actual
   */
  async loadCurrentUser() {
    try {
      if (!tokenManager.isAuthenticated()) {
        this.clearAuthData();
        return null;
      }

      const response = await apiMethods.get(ENDPOINTS.AUTH.ME);
      const user = response.user || response;

      this.setAuthState({
        isAuthenticated: true,
        user,
        error: null
      });

      // Guardar usuario en storage
      storage.setItem('current_user', user);

      return user;
    } catch (error) {
      logger.error('Failed to load current user:', error);
      this.clearAuthData();
      throw error;
    }
  }

  /**
   * Obtiene las sesiones activas del usuario
   */
  async getSessions() {
    try {
      const response = await apiMethods.get(ENDPOINTS.AUTH.SESSIONS);
      return response.sessions || response;
    } catch (error) {
      throw errorHandler.handleError(error);
    }
  }

  /**
   * Maneja el éxito del login
   */
  async handleLoginSuccess(response, rememberMe) {
    console.log('🔥 FRONTEND: handleLoginSuccess called with:', response);
    // El interceptor ya extrajo response.data, por lo que response es directamente los datos
    const responseData = response;
    console.log('🔥 FRONTEND: responseData extracted:', responseData);
    const { accessToken, refreshToken, user, requiresTwoFactor } = responseData;
    console.log('🔥 FRONTEND: Extracted tokens and user:', {
      hasAccessToken: !!accessToken,
      hasRefreshToken: !!refreshToken,
      hasUser: !!user,
      requiresTwoFactor
    });

    // Si requiere 2FA, no completar el login todavía
    if (requiresTwoFactor) {
      return response;
    }

    // Establecer tokens
    tokenManager.setTokens(accessToken, refreshToken);

    // Establecer estado de autenticación
    this.setAuthState({
      isAuthenticated: true,
      user,
      error: null
    });

    // Guardar preferencias
    if (rememberMe) {
      storage.setItem('remember_me', true);
    }

    // Programar renovación de token
    this.scheduleTokenRefresh();

    // Redirigir si hay URL guardada
    this.handlePostLoginRedirect();
  }

  /**
   * Maneja la redirección después del login
   */
  handlePostLoginRedirect() {
    if (typeof window !== 'undefined') {
      const redirectUrl = sessionStorage.getItem('redirectAfterLogin');
      if (redirectUrl && redirectUrl !== '/login') {
        sessionStorage.removeItem('redirectAfterLogin');
        window.location.href = redirectUrl;
      }
    }
  }

  /**
   * Programa la renovación automática del token
   */
  scheduleTokenRefresh() {
    tokenManager.scheduleTokenRefresh(() => {
      this.refreshToken().catch(error => {
        logger.error('Scheduled token refresh failed:', error);
        this.clearAuthData();
      });
    });
  }

  /**
   * Valida los datos de registro
   */
  validateRegistrationData(userData) {
    const errors = {};

    // Validar email
    const emailValidation = security.validateEmail(userData.email);
    if (!emailValidation.isValid) {
      errors.email = emailValidation.error;
    }

    // Validar contraseña
    if (!userData.password) {
      errors.password = 'Password is required';
    } else {
      const passwordValidation = security.validatePasswordStrength(userData.password);
      if (!passwordValidation.isValid) {
        errors.password = passwordValidation.suggestions.join(', ');
      }
    }

    // Validar confirmación de contraseña
    if (userData.password !== userData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    // Validar nombre
    if (!userData.firstName || userData.firstName.trim().length < 2) {
      errors.firstName = 'First name must be at least 2 characters';
    }

    if (!userData.lastName || userData.lastName.trim().length < 2) {
      errors.lastName = 'Last name must be at least 2 characters';
    }

    // Validar términos y condiciones
    if (!userData.acceptTerms) {
      errors.acceptTerms = 'You must accept the terms and conditions';
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  }

  /**
   * Obtiene información del dispositivo
   */
  getDeviceInfo() {
    if (typeof window === 'undefined') return {};

    return {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      language: navigator.language,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      screenResolution: `${screen.width}x${screen.height}`,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Limpia todos los datos de autenticación
   */
  clearAuthData() {
    tokenManager.clearTokens();
    storage.removeItem('current_user');
    storage.removeItem('remember_me');

    this.setAuthState({
      isAuthenticated: false,
      user: null,
      error: null
    });

    logger.authEvent('auth_data_cleared');
  }

  /**
   * Maneja errores de autenticación
   */
  handleAuthError(error) {
    this.setError(error);

    // Si es un error de autenticación, limpiar datos
    if (error.code === errorHandler.errorCodes.AUTH_ERROR ||
        error.code === errorHandler.errorCodes.TOKEN_EXPIRED) {
      this.clearAuthData();
    }
  }

  /**
   * Establece el estado de carga
   */
  setLoading(loading) {
    this.authState.loading = loading;
    this.notifyListeners();
  }

  /**
   * Establece un error
   */
  setError(error) {
    this.authState.error = error;
    this.notifyListeners();
  }

  /**
   * Limpia el error
   */
  clearError() {
    this.authState.error = null;
    this.notifyListeners();
  }

  /**
   * Establece el estado de autenticación
   */
  setAuthState(newState) {
    Object.assign(this.authState, newState);
    this.notifyListeners();
  }

  /**
   * Suscribe un listener a cambios de estado
   */
  subscribe(listener) {
    this.listeners.add(listener);

    // Retornar función para desuscribir
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Notifica a todos los listeners
   */
  notifyListeners() {
    this.listeners.forEach(listener => {
      try {
        listener(this.authState);
      } catch (error) {
        logger.error('Listener error:', error);
      }
    });
  }

  // Getters para acceso al estado
  isAuthenticated() {
    return this.authState.isAuthenticated && tokenManager.isAuthenticated();
  }

  getCurrentUser() {
    return this.authState.user;
  }

  isLoading() {
    return this.authState.loading;
  }

  getError() {
    return this.authState.error;
  }

  hasPermission(permission) {
    return tokenManager.hasPermission(permission);
  }

  hasRole(role) {
    return tokenManager.hasRole(role);
  }
}

// Instancia global del servicio de autenticación
export const authService = new AuthService();

// Helpers de conveniencia
export const login = (credentials) => authService.login(credentials);
export const register = (userData) => authService.register(userData);
export const logout = (logoutFromAllDevices) => authService.logout(logoutFromAllDevices);
export const getCurrentUser = () => authService.getCurrentUser();
export const isAuthenticated = () => authService.isAuthenticated();
export const hasPermission = (permission) => authService.hasPermission(permission);
export const hasRole = (role) => authService.hasRole(role);

export default authService;