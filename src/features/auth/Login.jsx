import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { authService } from '../../services';
import { Button } from '../../components/Button';
import { GoogleLoginButton } from '../../components/GoogleLoginButton';
import { useNavigate } from 'react-router-dom';

export const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loginError, setLoginError] = useState('');
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    const inputValue = type === 'checkbox' ? checked : value;
    
    setFormData(prev => ({
      ...prev,
      [name]: inputValue
    }));

    // Validación inmediata para email
    if (name === 'email') {
      if (value && !validateEmail(value)) {
        setErrors(prev => ({ ...prev, email: 'Formato de email inválido' }));
      } else {
        setErrors(prev => ({ ...prev, email: '' }));
      }
    }

    // Limpiar error de login al cambiar campos
    if (loginError) {
      setLoginError('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setLoginError('');

    // Validaciones
    const newErrors = {};
    
    if (!formData.email) {
      newErrors.email = 'El email es requerido';
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Formato de email inválido';
    }

    if (!formData.password) {
      newErrors.password = 'La contraseña es requerida';
    } else if (formData.password.length < 8) {
      newErrors.password = 'La contraseña debe tener al menos 8 caracteres';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setIsSubmitting(false);
      return;
    }

    try {
      const result = await login({
        email: formData.email,
        password: formData.password,
        rememberMe: formData.rememberMe
      });

      if (result.success) {
        // Manejar el token según la opción "Recordarme"
        if (formData.rememberMe) {
          // El token ya se guarda en localStorage por defecto en useAuth
          // Aquí podríamos guardar un refresh token adicional si fuera necesario
        } else {
          // Mover el token a sessionStorage si no quiere ser recordado
          const token = localStorage.getItem('dhara-token');
          const user = localStorage.getItem('dhara-user');
          if (token) {
            sessionStorage.setItem('dhara-token', token);
            sessionStorage.setItem('dhara-user', user);
            localStorage.removeItem('dhara-token');
            localStorage.removeItem('dhara-user');
          }
        }
        
        // Redirigir según el rol del usuario
        const userData = JSON.parse(localStorage.getItem('dhara-user') || sessionStorage.getItem('dhara-user') || '{}');
        if (userData.role === 'cliente') {
          navigate('/app/cliente/home');
        } else {
          // Terapeuta u otros roles
          navigate('/app/dashboard-profesional');
        }
      } else {
        setLoginError(result.error || 'Credenciales no válidas');
        // Mostrar error específico para contraseña incorrecta
        if (result.error && result.error.toLowerCase().includes('contraseña')) {
          setErrors(prev => ({ ...prev, password: 'Contraseña incorrecta' }));
        }
      }
    } catch (error) {
      setLoginError('Error de conexión. Inténtalo de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSubmit(e);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Logo y título ya están en AuthLayout */}
      
      {/* Título de la página */}
      <div className="text-center mb-6">
        <h2 className="text-deep font-semibold text-2xl">Acceder a tu cuenta</h2>
      </div>

      {/* Mensaje de error general */}
      {loginError && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {loginError}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Campo Email */}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-deep mb-1">
            Email
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            placeholder="correo@ejemplo.com"
            required
            aria-invalid={errors.email ? 'true' : 'false'}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-sage focus:border-transparent transition-colors ${
              errors.email ? 'border-red-300 bg-red-50' : 'border-gray-300'
            }`}
          />
          {errors.email && (
            <p className="mt-1 text-sm text-red-600" role="alert">{errors.email}</p>
          )}
        </div>

        {/* Campo Contraseña */}
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-deep mb-1">
            Contraseña
          </label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              id="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              required
              minLength={8}
              aria-invalid={errors.password ? 'true' : 'false'}
              className={`w-full px-3 py-2 pr-10 border rounded-lg focus:ring-2 focus:ring-sage focus:border-transparent transition-colors ${
                errors.password ? 'border-red-300 bg-red-50' : 'border-gray-300'
              }`}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
              aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.password && (
            <p className="mt-1 text-sm text-red-600" role="alert">{errors.password}</p>
          )}
        </div>

        {/* Checkbox Recordarme */}
        <div className="flex items-center">
          <input
            type="checkbox"
            id="rememberMe"
            name="rememberMe"
            checked={formData.rememberMe}
            onChange={handleInputChange}
            className="h-4 w-4 text-sage focus:ring-sage border-gray-300 rounded"
          />
          <label htmlFor="rememberMe" className="ml-2 block text-sm text-gray-700">
            Mantener sesión 30 días
          </label>
        </div>

        {/* Botón Login */}
        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-sage text-white rounded-xl py-2 px-4 font-medium hover:bg-sage/90 focus:ring-2 focus:ring-sage focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isSubmitting ? (
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Iniciando sesión...
            </div>
          ) : (
            'Iniciar Sesión'
          )}
        </Button>

        {/* Enlace ¿Olvidaste tu contraseña? */}
        <div className="text-center">
          <button
            type="button"
            onClick={async () => {
              if (formData.email) {
                try {
                  await authService.forgotPassword(formData.email);
                  alert('Se ha enviado un email con instrucciones para recuperar tu contraseña');
                } catch (error) {
                  alert('Error al enviar email de recuperación: ' + error.message);
                }
              } else {
                alert('Por favor ingresa tu email primero');
              }
            }}
            className="text-sm text-sage hover:text-sage/80 transition-colors"
          >
            ¿Olvidaste tu contraseña?
          </button>
        </div>
      </form>

      {/* Usuario de Prueba - Solo para desarrollo */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-xs text-blue-600 font-medium mb-2">🧪 Modo Desarrollo - Credenciales de prueba:</p>
          <button
            type="button"
            onClick={() => {
              setFormData({
                email: 'terapeuta@test.com',
                password: 'Test1234!',
                rememberMe: false
              });
              setErrors({});
              setLoginError('');
            }}
            className="w-full py-2 px-3 bg-blue-100 hover:bg-blue-200 text-blue-700 text-sm rounded-lg transition-colors"
          >
            Usar usuario de prueba
          </button>
        </div>
      )}

      {/* Divider */}
      <div className="my-6 flex items-center">
        <div className="flex-grow border-t border-gray-300"></div>
        <span className="mx-4 text-sm text-gray-500">o continúa con</span>
        <div className="flex-grow border-t border-gray-300"></div>
      </div>

      {/* Google Login Button */}
      <GoogleLoginButton
        onSuccess={() => {
          console.log('Google login initiated');
        }}
        onError={(error) => {
          setLoginError('Error al iniciar sesión con Google: ' + error.message);
        }}
        redirectTo={`${window.location.origin}/auth/callback`}
      />

      {/* Footer */}
      <div className="mt-6 text-center">
        <p className="text-sm text-gray-600">
          ¿Eres nuevo terapeuta?{' '}
          <button
            type="button"
            onClick={() => {
              // TODO: Implementar navegación a página de registro
              alert('Página de solicitud de acceso próximamente');
            }}
            className="text-sage hover:text-sage/80 transition-colors font-medium"
          >
            Solicita acceso →
          </button>
        </p>
      </div>
    </div>
  );
};