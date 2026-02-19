/**
 * Script para configurar autenticación con el terapeuta real del sistema
 * Terapeuta: Admin Demo (ID: 68ce20c17931a40b74af366a)
 */

// Función para crear un token con datos reales del terapeuta
function createRealTherapistToken() {
  const payload = {
    sub: '68ce20c17931a40b74af366a', // ID real del terapeuta "Admin Demo"
    userId: '68ce20c17931a40b74af366a',
    email: 'admin@demo.com',
    role: 'therapist',
    name: 'Admin Demo',
    permissions: [
      'read:own_profile',
      'write:own_profile',
      'read:reviews',
      'read:clients',
      'read:sessions',
      'write:sessions',
      'read:bookings',
      'write:bookings'
    ],
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // Expira en 24 horas
  };

  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = btoa(JSON.stringify(payload));
  const signature = 'real-therapist-token-signature';

  return `${header}.${body}.${signature}`;
}

// Configurar token del terapeuta real
function setupRealTherapistAuth() {
  const token = createRealTherapistToken();
  const user = {
    id: '68ce20c17931a40b74af366a',
    email: 'admin@demo.com',
    firstName: 'Admin',
    lastName: 'Demo',
    name: 'Admin Demo',
    role: 'therapist',
    verified: true,
    isActive: true,
    isVerified: true
  };

  localStorage.setItem('dhara-token', token);
  localStorage.setItem('dhara-user', JSON.stringify(user));

  console.log('✅ Token del terapeuta real configurado correctamente');
  console.log('👨‍⚕️ Terapeuta: Admin Demo');
  console.log('🆔 ID:', user.id);
  console.log('📧 Email:', user.email);
  console.log('🔑 Token configurado para API calls');
  console.log('🔄 Recarga la página para ver los cambios');

  // Mostrar el token decodificado
  try {
    const [header, payload, signature] = token.split('.');
    const decodedPayload = JSON.parse(atob(payload));
    console.log('📋 Token payload:', decodedPayload);
  } catch (error) {
    console.log('⚠️ Error decodificando token:', error);
  }
}

// Función para hacer una petición de prueba
async function testApiCall() {
  const token = localStorage.getItem('dhara-token');
  if (!token) {
    console.log('❌ No hay token configurado. Ejecuta setupRealTherapistAuth() primero');
    return;
  }

  try {
    console.log('🧪 Probando llamada a la API...');
    const response = await fetch('http://localhost:5000/api/reviews?therapistId=current&verified=true&limit=5', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('📡 Status:', response.status);
    console.log('📄 Response headers:', Object.fromEntries(response.headers.entries()));

    if (response.ok) {
      const data = await response.json();
      console.log('✅ API call exitosa:', data);
    } else {
      const errorText = await response.text();
      console.log('❌ API call falló:', errorText);
    }
  } catch (error) {
    console.error('💥 Error en API call:', error);
  }
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
    const userData = JSON.parse(user);
    console.log('✅ Usuario autenticado:', userData);
    console.log('🔑 Token presente:', token.substring(0, 50) + '...');

    // Decodificar token
    try {
      const [header, payload, signature] = token.split('.');
      const decodedPayload = JSON.parse(atob(payload));
      const now = Math.floor(Date.now() / 1000);
      const timeLeft = decodedPayload.exp - now;

      console.log('⏰ Token expira en:', Math.floor(timeLeft / 3600), 'horas');
      console.log('🆔 User ID en token:', decodedPayload.sub);
      console.log('📧 Email en token:', decodedPayload.email);
    } catch (error) {
      console.log('⚠️ Error decodificando token:', error);
    }
  } else {
    console.log('❌ No hay autenticación activa');
  }
}

// Ejecutar automáticamente si no hay token
if (typeof window !== 'undefined') {
  window.setupRealTherapistAuth = setupRealTherapistAuth;
  window.clearAuth = clearAuth;
  window.checkAuthStatus = checkAuthStatus;
  window.testApiCall = testApiCall;

  console.log(`
🎭 AUTENTICACIÓN CON TERAPEUTA REAL
Terapeuta: Admin Demo (ID: 68ce20c17931a40b74af366a)

📚 Funciones disponibles en la consola:
  - setupRealTherapistAuth() - Configurar token del terapeuta real
  - clearAuth() - Limpiar autenticación
  - checkAuthStatus() - Verificar estado actual
  - testApiCall() - Probar llamada a la API

🚀 Para empezar rápido, ejecuta: setupRealTherapistAuth()
  `);

  // Si no hay token, configurar automáticamente
  checkAuthStatus();
}