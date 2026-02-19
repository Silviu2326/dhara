/**
 * Utilidades de autenticación para modo demo/desarrollo
 */

/**
 * Crea un token de demo válido para desarrollo
 */
export const createDemoToken = () => {
  // Payload del token demo con datos reales del terapeuta
  const payload = {
    sub: '68ce20c17931a40b74af366a', // ID real del terapeuta "Admin Demo"
    userId: '68ce20c17931a40b74af366a',
    email: 'admin@demo.com',
    role: 'therapist',
    permissions: [
      'read:own_profile',
      'write:own_profile',
      'read:reviews',
      'read:clients',
      'read:sessions'
    ],
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // Expira en 24 horas
  };

  // Crear un JWT simple para demo (sin verificación de firma)
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = btoa(JSON.stringify(payload));
  const signature = 'demo-signature';

  return `${header}.${body}.${signature}`;
};

/**
 * Establece un token de demo en el localStorage para desarrollo
 */
export const setDemoToken = () => {
  if (import.meta.env.MODE === 'development') {
    const token = createDemoToken();
    localStorage.setItem('dhara-token', token);
    localStorage.setItem('dhara-user', JSON.stringify({
      id: '68ce20c17931a40b74af366a',
      email: 'admin@demo.com',
      firstName: 'Admin',
      lastName: 'Demo',
      name: 'Admin Demo',
      role: 'therapist',
      verified: true,
      isActive: true
    }));
    console.log('🎭 Demo token set for development');
    return token;
  }
  return null;
};

/**
 * Limpia el token de demo
 */
export const clearDemoToken = () => {
  localStorage.removeItem('dhara-token');
  localStorage.removeItem('dhara-user');
  sessionStorage.removeItem('dhara-token');
  sessionStorage.removeItem('dhara-user');
  console.log('🎭 Demo token cleared');
};

/**
 * Verifica si hay un token de demo activo
 */
export const hasDemoToken = () => {
  const token = localStorage.getItem('dhara-token') || sessionStorage.getItem('dhara-token');
  const user = localStorage.getItem('dhara-user') || sessionStorage.getItem('dhara-user');
  return !!(token && user);
};

/**
 * Inicializa la autenticación de demo automáticamente en desarrollo
 */
export const initDemoAuth = () => {
  if (import.meta.env.MODE === 'development' && !hasDemoToken()) {
    setDemoToken();
  }
};

export default {
  createDemoToken,
  setDemoToken,
  clearDemoToken,
  hasDemoToken,
  initDemoAuth
};