import { createClient } from '@supabase/supabase-js';
import { logger } from '../utils/logger';

/**
 * Configuración de Supabase
 *
 * Variables de entorno requeridas:
 * - VITE_SUPABASE_URL: URL de tu proyecto Supabase
 * - VITE_SUPABASE_ANON_KEY: Clave pública de Supabase
 */

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('⚠️ Supabase credentials not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
}

// Crear cliente de Supabase
export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '', {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storage: window.localStorage,
    flowType: 'pkce'
  },
  global: {
    headers: {
      'X-Client-Info': 'dharaterapeutas-web'
    }
  }
});

/**
 * Helper para manejar errores de Supabase
 */
export const handleSupabaseError = (error) => {
  if (error) {
    logger.error('Supabase error:', error);
    throw new Error(error.message || 'Error en la operación con Supabase');
  }
};

/**
 * Helper para verificar si Supabase está configurado
 */
export const isSupabaseConfigured = () => {
  return !!(supabaseUrl && supabaseAnonKey);
};

/**
 * Listener de cambios de autenticación
 */
export const onAuthStateChange = (callback) => {
  return supabase.auth.onAuthStateChange((event, session) => {
    logger.info('Auth state changed:', { event, hasSession: !!session });
    callback(event, session);
  });
};

export default supabase;
