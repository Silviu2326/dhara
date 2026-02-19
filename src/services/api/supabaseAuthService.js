import { supabase, handleSupabaseError, isSupabaseConfigured } from '../config/supabase';
import { logger } from '../utils/logger';
import { tokenManager } from '../utils/tokenManager';

/**
 * Servicio de autenticación con Supabase
 *
 * Incluye:
 * - Login con Google OAuth
 * - Gestión de sesiones
 * - Sincronización con backend propio
 */
class SupabaseAuthService {
  constructor() {
    this.isEnabled = isSupabaseConfigured();

    if (!this.isEnabled) {
      logger.warn('Supabase auth is not configured');
    }
  }

  /**
   * Inicializar listener de sesión
   */
  initialize() {
    if (!this.isEnabled) return;

    supabase.auth.onAuthStateChange(async (event, session) => {
      logger.info('Supabase auth event:', event);

      switch (event) {
        case 'SIGNED_IN':
          await this.handleSignIn(session);
          break;
        case 'SIGNED_OUT':
          await this.handleSignOut();
          break;
        case 'TOKEN_REFRESHED':
          await this.handleTokenRefresh(session);
          break;
        case 'USER_UPDATED':
          await this.handleUserUpdate(session);
          break;
      }
    });

    logger.info('Supabase auth service initialized');
  }

  /**
   * Login con Google OAuth
   */
  async signInWithGoogle(options = {}) {
    try {
      if (!this.isEnabled) {
        throw new Error('Supabase is not configured');
      }

      const { redirectTo } = options;

      logger.info('Initiating Google sign in');

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectTo || `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent'
          },
          scopes: 'email profile'
        }
      });

      handleSupabaseError(error);

      logger.info('Google sign in initiated successfully');
      return data;
    } catch (error) {
      logger.error('Error signing in with Google:', error);
      throw error;
    }
  }

  /**
   * Obtener sesión actual
   */
  async getSession() {
    try {
      if (!this.isEnabled) return null;

      const { data: { session }, error } = await supabase.auth.getSession();
      handleSupabaseError(error);

      return session;
    } catch (error) {
      logger.error('Error getting session:', error);
      return null;
    }
  }

  /**
   * Obtener usuario actual
   */
  async getUser() {
    try {
      if (!this.isEnabled) return null;

      const { data: { user }, error } = await supabase.auth.getUser();
      handleSupabaseError(error);

      return user;
    } catch (error) {
      logger.error('Error getting user:', error);
      return null;
    }
  }

  /**
   * Cerrar sesión
   */
  async signOut() {
    try {
      if (!this.isEnabled) return;

      logger.info('Signing out from Supabase');

      const { error } = await supabase.auth.signOut();
      handleSupabaseError(error);

      logger.info('Signed out successfully');
    } catch (error) {
      logger.error('Error signing out:', error);
      throw error;
    }
  }

  /**
   * Manejar inicio de sesión exitoso
   */
  async handleSignIn(session) {
    try {
      logger.info('Handling sign in', {
        userId: session.user.id,
        email: session.user.email
      });

      // Sincronizar con backend propio
      await this.syncWithBackend(session);

      // Guardar token en tokenManager para compatibilidad
      if (session.access_token) {
        tokenManager.setTokens(session.access_token, session.refresh_token);
      }

      logger.info('Sign in handled successfully');
    } catch (error) {
      logger.error('Error handling sign in:', error);
    }
  }

  /**
   * Manejar cierre de sesión
   */
  async handleSignOut() {
    try {
      logger.info('Handling sign out');

      // Limpiar tokens
      tokenManager.clearTokens();

      // Redirigir a login si estamos en ruta protegida
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    } catch (error) {
      logger.error('Error handling sign out:', error);
    }
  }

  /**
   * Manejar refresh de token
   */
  async handleTokenRefresh(session) {
    try {
      logger.info('Handling token refresh');

      if (session?.access_token) {
        tokenManager.setTokens(session.access_token, session.refresh_token);
      }
    } catch (error) {
      logger.error('Error handling token refresh:', error);
    }
  }

  /**
   * Manejar actualización de usuario
   */
  async handleUserUpdate(session) {
    try {
      logger.info('Handling user update');

      // Sincronizar cambios con backend
      await this.syncWithBackend(session);
    } catch (error) {
      logger.error('Error handling user update:', error);
    }
  }

  /**
   * Sincronizar sesión de Supabase con backend propio
   *
   * Esto permite que el backend conozca la sesión de Supabase
   * y pueda crear/actualizar el usuario en la base de datos propia
   */
  async syncWithBackend(session) {
    try {
      if (!session) return;

      const { user } = session;

      // Endpoint para sincronizar usuario de Supabase con backend
      const response = await fetch('/api/auth/supabase/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          supabaseId: user.id,
          email: user.email,
          name: user.user_metadata?.full_name || user.user_metadata?.name,
          avatar: user.user_metadata?.avatar_url,
          provider: 'google',
          emailVerified: user.email_confirmed_at ? true : false
        })
      });

      if (!response.ok) {
        logger.warn('Failed to sync with backend:', await response.text());
      } else {
        const data = await response.json();
        logger.info('Synced with backend successfully:', data);
      }
    } catch (error) {
      logger.error('Error syncing with backend:', error);
      // No lanzar error - la sincronización es opcional
    }
  }

  /**
   * Verificar si el usuario está autenticado
   */
  async isAuthenticated() {
    const session = await this.getSession();
    return !!session;
  }

  /**
   * Obtener token de acceso
   */
  async getAccessToken() {
    const session = await this.getSession();
    return session?.access_token || null;
  }
}

export const supabaseAuthService = new SupabaseAuthService();
export default supabaseAuthService;
