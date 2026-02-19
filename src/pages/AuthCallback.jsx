import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabaseAuthService } from '../services/api/supabaseAuthService';
import { logger } from '../services/utils/logger';

/**
 * Página de callback para OAuth de Google
 *
 * Maneja:
 * - Respuesta de Google OAuth
 * - Extracción de sesión de Supabase
 * - Sincronización con backend
 * - Redirección al dashboard
 */
export const AuthCallback = () => {
  const navigate = useNavigate();
  const [status, setStatus] = useState('processing'); // processing | success | error
  const [message, setMessage] = useState('Procesando autenticación...');

  useEffect(() => {
    handleCallback();
  }, []);

  const handleCallback = async () => {
    try {
      logger.info('Processing OAuth callback');

      // Obtener sesión de Supabase
      const session = await supabaseAuthService.getSession();

      if (!session) {
        throw new Error('No se pudo obtener la sesión de autenticación');
      }

      logger.info('Session obtained successfully', {
        userId: session.user.id,
        email: session.user.email
      });

      setStatus('success');
      setMessage('¡Autenticación exitosa! Redirigiendo...');

      // Esperar un momento para mostrar el mensaje de éxito
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Redirigir al dashboard o a la URL guardada
      const redirectUrl = sessionStorage.getItem('redirectAfterLogin') || '/app/dashboard';
      sessionStorage.removeItem('redirectAfterLogin');

      navigate(redirectUrl, { replace: true });
    } catch (error) {
      logger.error('Error processing OAuth callback:', error);

      setStatus('error');
      setMessage(error.message || 'Error al procesar la autenticación');

      // Redirigir a login después de 3 segundos
      setTimeout(() => {
        navigate('/login', { replace: true });
      }, 3000);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sage/10 to-deep/5">
      <div className="max-w-md w-full mx-4">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Logo o icono */}
          <div className="flex justify-center mb-6">
            {status === 'processing' && (
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-sage"></div>
            )}
            {status === 'success' && (
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
            )}
            {status === 'error' && (
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-red-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </div>
            )}
          </div>

          {/* Mensaje */}
          <div className="text-center">
            <h2 className="text-2xl font-bold text-deep mb-2">
              {status === 'processing' && 'Autenticando...'}
              {status === 'success' && '¡Bienvenido!'}
              {status === 'error' && 'Error de Autenticación'}
            </h2>
            <p className="text-gray-600">{message}</p>

            {status === 'error' && (
              <div className="mt-6">
                <button
                  onClick={() => navigate('/login')}
                  className="px-4 py-2 bg-sage text-white rounded-lg hover:bg-sage/90 transition-colors"
                >
                  Volver al login
                </button>
              </div>
            )}
          </div>

          {/* Indicador de progreso */}
          {status === 'processing' && (
            <div className="mt-6">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-sage h-2 rounded-full animate-pulse" style={{ width: '60%' }}></div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthCallback;
