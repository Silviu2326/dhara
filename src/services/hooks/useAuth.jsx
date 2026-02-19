import { useState, useEffect, useCallback, useContext, createContext } from 'react';
import { authService } from '../api/authService';
import { tokenManager } from '../utils/tokenManager';
import { logger } from '../utils/logger';
import { auditService } from '../utils/auditService';

/**
 * @typedef {Object} User
 * @property {string} id - User ID
 * @property {string} email - User email
 * @property {string} firstName - User first name
 * @property {string} lastName - User last name
 * @property {string[]} roles - User roles
 * @property {string[]} permissions - User permissions
 * @property {Object} profile - User profile data
 */

/**
 * @typedef {Object} AuthState
 * @property {User|null} user - Current user
 * @property {boolean} isAuthenticated - Authentication status
 * @property {boolean} isLoading - Loading state
 * @property {string|null} error - Current error
 * @property {boolean} isInitialized - Initialization status
 */

/**
 * @typedef {Object} AuthActions
 * @property {Function} login - Login function
 * @property {Function} logout - Logout function
 * @property {Function} register - Register function
 * @property {Function} refreshToken - Refresh token function
 * @property {Function} updateProfile - Update profile function
 * @property {Function} changePassword - Change password function
 * @property {Function} resetPassword - Reset password function
 * @property {Function} hasPermission - Check permission function
 * @property {Function} hasRole - Check role function
 * @property {Function} clearError - Clear error function
 */

/**
 * @typedef {AuthState & AuthActions} AuthContextValue
 */

// Create Auth Context
const AuthContext = createContext(null);

/**
 * Auth Provider Component
 * @param {Object} props
 * @param {React.ReactNode} props.children
 * @param {Object} props.config - Auth configuration
 * @returns {JSX.Element}
 */
export const AuthProvider = ({ children, config = {} }) => {
  const {
    redirectTo = '/app/dashboard',
    loginRedirect = '/login',
    enableAutoRefresh = true,
    refreshInterval = 5 * 60 * 1000, // 5 minutes
    enablePersistence = true,
    onAuthStateChange = null,
    enableAuditLogging = true
  } = config;

  // State management
  const [state, setState] = useState({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    error: null,
    isInitialized: false
  });

  // Refresh timer reference
  const [refreshTimer, setRefreshTimer] = useState(null);

  /**
   * Update auth state
   * @param {Partial<AuthState>} updates
   */
  const updateState = useCallback((updates) => {
    setState(prev => {
      const newState = { ...prev, ...updates };

      // Notify auth state change
      if (onAuthStateChange && (
        updates.isAuthenticated !== undefined ||
        updates.user !== undefined
      )) {
        onAuthStateChange(newState);
      }

      return newState;
    });
  }, [onAuthStateChange]);

  /**
   * Initialize authentication state
   */
  const initialize = useCallback(async () => {
    try {
      updateState({ isLoading: true, error: null });

      // Check if user is already authenticated
      const isAuthenticated = authService.isAuthenticated();

      if (isAuthenticated) {
        try {
          // Get current user data
          const currentUser = await authService.getCurrentUser();

          if (currentUser) {
            updateState({
              user: currentUser,
              isAuthenticated: true,
              isLoading: false,
              isInitialized: true
            });

            // Start auto-refresh if enabled
            if (enableAutoRefresh) {
              startTokenRefresh();
            }

            // Log successful initialization
            if (enableAuditLogging) {
              await auditService.logEvent({
                eventType: 'auth_session',
                entityType: 'user',
                entityId: currentUser.id,
                action: 'session_restored',
                details: { timestamp: new Date().toISOString() }
              });
            }

            logger.info('Auth state initialized successfully', { userId: currentUser.id });
            return;
          }
        } catch (error) {
          logger.error('Error getting current user:', error);
          // Token might be invalid, clear it
          await authService.logout({ skipApiCall: true });
        }
      }

      // No valid authentication found
      updateState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        isInitialized: true
      });

    } catch (error) {
      logger.error('Auth initialization error:', error);
      updateState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: error.message,
        isInitialized: true
      });
    }
  }, [enableAutoRefresh, enableAuditLogging]);

  /**
   * Start automatic token refresh
   */
  const startTokenRefresh = useCallback(() => {
    if (refreshTimer) {
      clearInterval(refreshTimer);
    }

    const timer = setInterval(async () => {
      try {
        if (authService.isAuthenticated()) {
          await authService.refreshToken();
          logger.debug('Token refreshed automatically');
        } else {
          clearInterval(timer);
          setRefreshTimer(null);
        }
      } catch (error) {
        logger.error('Auto token refresh failed:', error);
        // Force logout on refresh failure
        await logout({ reason: 'token_refresh_failed' });
      }
    }, refreshInterval);

    setRefreshTimer(timer);
  }, [refreshTimer, refreshInterval]);

  /**
   * Stop automatic token refresh
   */
  const stopTokenRefresh = useCallback(() => {
    if (refreshTimer) {
      clearInterval(refreshTimer);
      setRefreshTimer(null);
    }
  }, [refreshTimer]);

  /**
   * Login user
   * @param {Object} credentials
   * @param {string} credentials.email
   * @param {string} credentials.password
   * @param {boolean} credentials.rememberMe
   * @param {Object} options
   * @returns {Promise<Object>}
   */
  const login = useCallback(async (credentials, options = {}) => {
    try {
      updateState({ isLoading: true, error: null });

      const result = await authService.login(credentials);

      if (result.success && result.user) {
        updateState({
          user: result.user,
          isAuthenticated: true,
          isLoading: false
        });

        // Start auto-refresh
        if (enableAutoRefresh) {
          startTokenRefresh();
        }

        // Audit logging
        if (enableAuditLogging) {
          await auditService.logEvent({
            eventType: 'auth_session',
            entityType: 'user',
            entityId: result.user.id,
            action: 'login',
            details: {
              timestamp: new Date().toISOString(),
              rememberMe: credentials.rememberMe || false
            }
          });
        }

        logger.info('User logged in successfully', { userId: result.user.id });

        // Redirect if specified
        if (options.redirect !== false && redirectTo) {
          window.location.href = redirectTo;
        }

        return result;
      } else {
        throw new Error(result.message || 'Login failed');
      }
    } catch (error) {
      logger.error('Login error:', error);
      updateState({
        isLoading: false,
        error: error.message || 'Login failed'
      });
      throw error;
    }
  }, [enableAutoRefresh, enableAuditLogging, redirectTo, startTokenRefresh]);

  /**
   * Logout user
   * @param {Object} options
   * @returns {Promise<void>}
   */
  const logout = useCallback(async (options = {}) => {
    try {
      const { reason = 'user_action', redirect = true } = options;
      const currentUser = state.user;

      updateState({ isLoading: true, error: null });

      // Stop token refresh
      stopTokenRefresh();

      // Call logout service
      await authService.logout();

      // Update state
      updateState({
        user: null,
        isAuthenticated: false,
        isLoading: false
      });

      // Audit logging
      if (enableAuditLogging && currentUser) {
        await auditService.logEvent({
          eventType: 'auth_session',
          entityType: 'user',
          entityId: currentUser.id,
          action: 'logout',
          details: {
            timestamp: new Date().toISOString(),
            reason
          }
        });
      }

      logger.info('User logged out successfully', {
        userId: currentUser?.id,
        reason
      });

      // Redirect if specified
      if (redirect && loginRedirect) {
        window.location.href = loginRedirect;
      }

    } catch (error) {
      logger.error('Logout error:', error);
      updateState({
        isLoading: false,
        error: error.message || 'Logout failed'
      });
    }
  }, [state.user, enableAuditLogging, loginRedirect, stopTokenRefresh]);

  /**
   * Register new user
   * @param {Object} userData
   * @returns {Promise<Object>}
   */
  const register = useCallback(async (userData, options = {}) => {
    try {
      updateState({ isLoading: true, error: null });

      const result = await authService.register(userData);

      if (result.success) {
        // Auto-login after registration if user is verified
        if (result.user && result.user.verified) {
          updateState({
            user: result.user,
            isAuthenticated: true,
            isLoading: false
          });

          if (enableAutoRefresh) {
            startTokenRefresh();
          }
        } else {
          updateState({ isLoading: false });
        }

        // Audit logging
        if (enableAuditLogging && result.user) {
          await auditService.logEvent({
            eventType: 'user_change',
            entityType: 'user',
            entityId: result.user.id,
            action: 'register',
            details: {
              timestamp: new Date().toISOString(),
              autoLogin: result.user.verified
            }
          });
        }

        logger.info('User registered successfully', { userId: result.user?.id });
        return result;
      } else {
        throw new Error(result.message || 'Registration failed');
      }
    } catch (error) {
      logger.error('Registration error:', error);
      updateState({
        isLoading: false,
        error: error.message || 'Registration failed'
      });
      throw error;
    }
  }, [enableAutoRefresh, enableAuditLogging, startTokenRefresh]);

  /**
   * Refresh authentication token
   * @returns {Promise<void>}
   */
  const refreshToken = useCallback(async () => {
    try {
      const result = await authService.refreshToken();

      if (result.user) {
        updateState({ user: result.user });
      }

      logger.debug('Token refreshed manually');
      return result;
    } catch (error) {
      logger.error('Token refresh error:', error);
      // Force logout on refresh failure
      await logout({ reason: 'token_refresh_failed' });
      throw error;
    }
  }, [logout]);

  /**
   * Update user profile
   * @param {Object} profileData
   * @returns {Promise<Object>}
   */
  const updateProfile = useCallback(async (profileData) => {
    try {
      updateState({ isLoading: true, error: null });

      const result = await authService.updateProfile(profileData);

      if (result.success && result.user) {
        updateState({
          user: result.user,
          isLoading: false
        });

        // Audit logging
        if (enableAuditLogging) {
          await auditService.logEvent({
            eventType: 'user_change',
            entityType: 'user',
            entityId: result.user.id,
            action: 'profile_update',
            details: {
              timestamp: new Date().toISOString(),
              updatedFields: Object.keys(profileData)
            }
          });
        }

        logger.info('Profile updated successfully', { userId: result.user.id });
        return result;
      } else {
        throw new Error(result.message || 'Profile update failed');
      }
    } catch (error) {
      logger.error('Profile update error:', error);
      updateState({
        isLoading: false,
        error: error.message || 'Profile update failed'
      });
      throw error;
    }
  }, [enableAuditLogging]);

  /**
   * Change user password
   * @param {Object} passwordData
   * @param {string} passwordData.currentPassword
   * @param {string} passwordData.newPassword
   * @returns {Promise<Object>}
   */
  const changePassword = useCallback(async (passwordData) => {
    try {
      updateState({ isLoading: true, error: null });

      const result = await authService.changePassword(passwordData);

      updateState({ isLoading: false });

      // Audit logging
      if (enableAuditLogging && state.user) {
        await auditService.logEvent({
          eventType: 'security_change',
          entityType: 'user',
          entityId: state.user.id,
          action: 'password_change',
          details: { timestamp: new Date().toISOString() }
        });
      }

      logger.info('Password changed successfully', { userId: state.user?.id });
      return result;
    } catch (error) {
      logger.error('Password change error:', error);
      updateState({
        isLoading: false,
        error: error.message || 'Password change failed'
      });
      throw error;
    }
  }, [enableAuditLogging, state.user]);

  /**
   * Reset user password
   * @param {string} email
   * @returns {Promise<Object>}
   */
  const resetPassword = useCallback(async (email) => {
    try {
      updateState({ isLoading: true, error: null });

      const result = await authService.resetPassword(email);

      updateState({ isLoading: false });

      logger.info('Password reset requested', { email });
      return result;
    } catch (error) {
      logger.error('Password reset error:', error);
      updateState({
        isLoading: false,
        error: error.message || 'Password reset failed'
      });
      throw error;
    }
  }, []);

  /**
   * Check if user has specific permission
   * @param {string} permission
   * @returns {boolean}
   */
  const hasPermission = useCallback((permission) => {
    if (!state.isAuthenticated || !state.user) {
      return false;
    }

    return authService.hasPermission(permission);
  }, [state.isAuthenticated, state.user]);

  /**
   * Check if user has specific role
   * @param {string} role
   * @returns {boolean}
   */
  const hasRole = useCallback((role) => {
    if (!state.isAuthenticated || !state.user) {
      return false;
    }

    return authService.hasRole(role);
  }, [state.isAuthenticated, state.user]);

  /**
   * Clear current error
   */
  const clearError = useCallback(() => {
    updateState({ error: null });
  }, []);

  // Initialize on mount
  useEffect(() => {
    initialize();

    // Cleanup on unmount
    return () => {
      stopTokenRefresh();
    };
  }, [initialize, stopTokenRefresh]);

  // Listen for token expiration
  useEffect(() => {
    const handleTokenExpired = () => {
      logout({ reason: 'token_expired' });
    };

    tokenManager.on('tokenExpired', handleTokenExpired);

    return () => {
      tokenManager.off('tokenExpired', handleTokenExpired);
    };
  }, [logout]);

  // Context value
  const contextValue = {
    // State
    ...state,

    // Actions
    login,
    logout,
    register,
    refreshToken,
    updateProfile,
    changePassword,
    resetPassword,
    hasPermission,
    hasRole,
    clearError
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

/**
 * Custom hook to use authentication context
 * @returns {AuthContextValue}
 */
export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
};

/**
 * Higher-order component for protected routes
 * @param {React.Component} Component
 * @param {Object} options
 * @returns {React.Component}
 */
export const withAuth = (Component, options = {}) => {
  const {
    requiredPermissions = [],
    requiredRoles = [],
    redirectTo = '/login',
    fallbackComponent = null
  } = options;

  return function AuthenticatedComponent(props) {
    const { isAuthenticated, isLoading, hasPermission, hasRole } = useAuth();

    // Show loading state
    if (isLoading) {
      return fallbackComponent || <div>Loading...</div>;
    }

    // Check authentication
    if (!isAuthenticated) {
      window.location.href = redirectTo;
      return null;
    }

    // Check permissions
    if (requiredPermissions.length > 0) {
      const hasRequiredPermissions = requiredPermissions.every(permission =>
        hasPermission(permission)
      );

      if (!hasRequiredPermissions) {
        return fallbackComponent || <div>Access denied</div>;
      }
    }

    // Check roles
    if (requiredRoles.length > 0) {
      const hasRequiredRoles = requiredRoles.some(role => hasRole(role));

      if (!hasRequiredRoles) {
        return fallbackComponent || <div>Access denied</div>;
      }
    }

    return <Component {...props} />;
  };
};

/**
 * Hook for protected routes with automatic redirection
 * @param {Object} options
 * @returns {Object}
 */
export const useAuthGuard = (options = {}) => {
  const {
    requiredPermissions = [],
    requiredRoles = [],
    redirectTo = '/login'
  } = options;

  const { isAuthenticated, isLoading, hasPermission, hasRole } = useAuth();

  const isAuthorized = useCallback(() => {
    if (!isAuthenticated) return false;

    // Check permissions
    if (requiredPermissions.length > 0) {
      const hasRequiredPermissions = requiredPermissions.every(permission =>
        hasPermission(permission)
      );
      if (!hasRequiredPermissions) return false;
    }

    // Check roles
    if (requiredRoles.length > 0) {
      const hasRequiredRoles = requiredRoles.some(role => hasRole(role));
      if (!hasRequiredRoles) return false;
    }

    return true;
  }, [isAuthenticated, requiredPermissions, requiredRoles, hasPermission, hasRole]);

  useEffect(() => {
    if (!isLoading && !isAuthorized()) {
      window.location.href = redirectTo;
    }
  }, [isLoading, isAuthorized, redirectTo]);

  return {
    isAuthenticated,
    isLoading,
    isAuthorized: isAuthorized(),
    canAccess: !isLoading && isAuthorized()
  };
};

export default useAuth;