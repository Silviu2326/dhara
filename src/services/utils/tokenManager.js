import { APP_CONSTANTS } from '../config/constants';
import { logger } from './logger';
import { storage } from './storage';

/**
 * Gestor seguro de tokens JWT para autenticación
 */
class TokenManager {
  constructor() {
    this.accessTokenKey = APP_CONSTANTS.AUTH.TOKEN_KEY;
    this.refreshTokenKey = APP_CONSTANTS.AUTH.REFRESH_TOKEN_KEY;
    this.userDataKey = APP_CONSTANTS.AUTH.USER_KEY;
  }

  /**
   * Decodifica un token JWT
   */
  decodeToken(token) {
    try {
      if (!token) return null;

      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );

      return JSON.parse(jsonPayload);
    } catch (error) {
      logger.error('Error decoding token:', error);
      return null;
    }
  }

  /**
   * Verifica si un token ha expirado
   */
  isTokenExpired(token) {
    const decoded = this.decodeToken(token);
    if (!decoded || !decoded.exp) return true;

    const currentTime = Date.now() / 1000;
    return decoded.exp < currentTime;
  }

  /**
   * Verifica si un token expirará pronto
   */
  isTokenExpiringSoon(token, threshold = APP_CONSTANTS.AUTH.REFRESH_THRESHOLD) {
    const decoded = this.decodeToken(token);
    if (!decoded || !decoded.exp) return true;

    const currentTime = Date.now() / 1000;
    const expirationTime = decoded.exp;
    const timeUntilExpiration = (expirationTime - currentTime) * 1000;

    return timeUntilExpiration <= threshold;
  }

  /**
   * Obtiene el access token
   */
  getAccessToken() {
    try {
      // First try the new token storage format used by useAuth hook
      let token = localStorage.getItem('dhara-token') || sessionStorage.getItem('dhara-token');

      // Fallback to old format
      if (!token) {
        token = storage.getItem(this.accessTokenKey);
      }

      if (!token) return null;

      if (this.isTokenExpired(token)) {
        this.clearAccessToken();
        return null;
      }

      return token;
    } catch (error) {
      logger.error('Error getting access token:', error);
      return null;
    }
  }

  /**
   * Obtiene el refresh token
   */
  getRefreshToken() {
    try {
      return storage.getItem(this.refreshTokenKey);
    } catch (error) {
      logger.error('Error getting refresh token:', error);
      return null;
    }
  }

  /**
   * Verifica si el refresh token ha expirado
   */
  isRefreshTokenExpired() {
    const refreshToken = this.getRefreshToken();
    return !refreshToken || this.isTokenExpired(refreshToken);
  }

  /**
   * Establece los tokens de autenticación
   */
  setTokens(accessToken, refreshToken) {
    try {
      if (!accessToken) {
        throw new Error('Access token is required');
      }

      // Validar formato del token
      if (!this.isValidTokenFormat(accessToken)) {
        throw new Error('Invalid access token format');
      }

      storage.setItem(this.accessTokenKey, accessToken);

      if (refreshToken) {
        if (!this.isValidTokenFormat(refreshToken)) {
          throw new Error('Invalid refresh token format');
        }
        storage.setItem(this.refreshTokenKey, refreshToken);
      }

      logger.info('Tokens set successfully');
    } catch (error) {
      logger.error('Error setting tokens:', error);
      throw error;
    }
  }

  /**
   * Valida el formato de un token JWT
   */
  isValidTokenFormat(token) {
    if (!token || typeof token !== 'string') return false;

    const parts = token.split('.');
    return parts.length === 3;
  }

  /**
   * Elimina el access token
   */
  clearAccessToken() {
    try {
      // Clear both token storage formats
      localStorage.removeItem('dhara-token');
      sessionStorage.removeItem('dhara-token');
      storage.removeItem(this.accessTokenKey);
      logger.debug('Access token cleared');
    } catch (error) {
      logger.error('Error clearing access token:', error);
    }
  }

  /**
   * Elimina el refresh token
   */
  clearRefreshToken() {
    try {
      storage.removeItem(this.refreshTokenKey);
      logger.debug('Refresh token cleared');
    } catch (error) {
      logger.error('Error clearing refresh token:', error);
    }
  }

  /**
   * Elimina todos los tokens y datos de usuario
   */
  clearTokens() {
    try {
      storage.removeItem(this.accessTokenKey);
      storage.removeItem(this.refreshTokenKey);
      storage.removeItem(this.userDataKey);
      logger.info('All tokens and user data cleared');
    } catch (error) {
      logger.error('Error clearing tokens:', error);
    }
  }

  /**
   * Obtiene información del usuario desde el token
   */
  getUserFromToken() {
    const token = this.getAccessToken();
    if (!token) return null;

    const decoded = this.decodeToken(token);
    return decoded ? {
      id: decoded.sub || decoded.userId,
      email: decoded.email,
      role: decoded.role,
      permissions: decoded.permissions || [],
      sessionId: decoded.sessionId
    } : null;
  }

  /**
   * Verifica si el usuario está autenticado
   */
  isAuthenticated() {
    const token = this.getAccessToken();
    return !!token && !this.isTokenExpired(token);
  }

  /**
   * Verifica si el usuario tiene un permiso específico
   */
  hasPermission(permission) {
    const user = this.getUserFromToken();
    return user?.permissions?.includes(permission) || false;
  }

  /**
   * Verifica si el usuario tiene un rol específico
   */
  hasRole(role) {
    const user = this.getUserFromToken();
    return user?.role === role;
  }

  /**
   * Obtiene el tiempo restante hasta la expiración del token (en ms)
   */
  getTokenTimeRemaining() {
    const token = this.getAccessToken();
    if (!token) return 0;

    const decoded = this.decodeToken(token);
    if (!decoded || !decoded.exp) return 0;

    const currentTime = Date.now() / 1000;
    const timeRemaining = (decoded.exp - currentTime) * 1000;

    return Math.max(0, timeRemaining);
  }

  /**
   * Programa la renovación automática del token
   */
  scheduleTokenRefresh(onRefresh) {
    const timeRemaining = this.getTokenTimeRemaining();
    const refreshTime = timeRemaining - APP_CONSTANTS.AUTH.REFRESH_THRESHOLD;

    if (refreshTime > 0) {
      setTimeout(() => {
        if (this.isAuthenticated() && !this.isRefreshTokenExpired()) {
          onRefresh();
        }
      }, refreshTime);
    }
  }

  /**
   * Valida la integridad de los tokens almacenados
   */
  validateStoredTokens() {
    const accessToken = storage.getItem(this.accessTokenKey);
    const refreshToken = storage.getItem(this.refreshTokenKey);

    let isValid = true;

    if (accessToken && !this.isValidTokenFormat(accessToken)) {
      this.clearAccessToken();
      isValid = false;
    }

    if (refreshToken && !this.isValidTokenFormat(refreshToken)) {
      this.clearRefreshToken();
      isValid = false;
    }

    return isValid;
  }
}

export const tokenManager = new TokenManager();
export default tokenManager;