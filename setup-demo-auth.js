/**
 * Script para configurar autenticación de demo rápidamente
 */

// Función para crear un token de demo
function createDemoToken() {
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

  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = btoa(JSON.stringify(payload));
  const signature = 'demo-signature';

  return `${header}.${body}.${signature}`;
}

// Configurar token de demo
function setupDemoAuth() {
  const token = createDemoToken();
  const user = {
    id: '68ce20c17931a40b74af366a',
    email: 'admin@demo.com',
    firstName: 'Admin',
    lastName: 'Demo',
    name: 'Admin Demo',
    role: 'therapist',
    verified: true,
    isActive: true
  };

  localStorage.setItem('dhara-token', token);
  localStorage.setItem('dhara-user', JSON.stringify(user));

  console.log('✅ Token de demo configurado correctamente');
  console.log('🔑 Token:', token);
  console.log('👤 Usuario:', user);
  console.log('🔄 Recarga la página para ver los cambios');
}

// Función para limpiar la autenticación
function clearAuth() {
  localStorage.removeItem('dhara-token');
  localStorage.removeItem('dhara-user');
  sessionStorage.removeItem('dhara-token');
  sessionStorage.removeItem('dhara-user');
  console.log('🧹 Autenticación limpiada. Recarga la página.');
}

// Función para verificar el estado actual
function checkAuthStatus() {
  const token = localStorage.getItem('dhara-token') || sessionStorage.getItem('dhara-token');
  const user = localStorage.getItem('dhara-user') || sessionStorage.getItem('dhara-user');

  if (token && user) {
    console.log('✅ Usuario autenticado:', JSON.parse(user));
    console.log('🔑 Token presente:', token.substring(0, 50) + '...');
  } else {
    console.log('❌ No hay autenticación activa');
  }
}

// Ejecutar automáticamente si no hay token
if (typeof window !== 'undefined') {
  window.setupDemoAuth = setupDemoAuth;
  window.clearAuth = clearAuth;
  window.checkAuthStatus = checkAuthStatus;

  // Configurar automáticamente si no hay token
  const hasToken = localStorage.getItem('dhara-token') || sessionStorage.getItem('dhara-token');
  if (!hasToken) {
    console.log('🎭 Configurando autenticación de demo automáticamente...');
    setupDemoAuth();
  } else {
    console.log('🎭 Autenticación existente encontrada');
    checkAuthStatus();
  }

  console.log(`
🎭 Funciones de demo disponibles en la consola:
  - setupDemoAuth() - Configurar token de demo
  - clearAuth() - Limpiar autenticación
  - checkAuthStatus() - Verificar estado actual
  `);
}