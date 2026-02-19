/**
 * Script para configurar TOKEN JWT VÁLIDO del terapeuta real
 * ✅ Firmado con la clave secreta correcta del backend
 * ✅ ID real del terapeuta: 68ce20c17931a40b74af366a
 * ✅ Verificado por el backend de Dharaterapeutas
 */

// Token JWT VÁLIDO generado con la clave secreta real del backend
const VALID_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4Y2UyMGMxNzkzMWE0MGI3NGFmMzY2YSIsImVtYWlsIjoiYWRtaW5AZGVtby5jb20iLCJyb2xlIjoidGhlcmFwaXN0IiwiaWF0IjoxNzU5MDIwNzk0LCJleHAiOjE3NTkxMDcxOTR9.8vh-0vox0m8ipR8JHXHF0Up3oU_8lqBwusA4fV1wipc";

// Datos reales del terapeuta en el sistema
const REAL_THERAPIST = {
  id: "68ce20c17931a40b74af366a",
  email: "admin@demo.com",
  firstName: "Admin",
  lastName: "Demo",
  name: "Admin Demo",
  role: "therapist",
  verified: true,
  isActive: true,
  isVerified: true
};

// Configurar autenticación válida
function setupValidAuth() {
  localStorage.setItem('dhara-token', VALID_TOKEN);
  localStorage.setItem('dhara-user', JSON.stringify(REAL_THERAPIST));
  sessionStorage.removeItem('dhara-token');
  sessionStorage.removeItem('dhara-user');

  console.log('✅ TOKEN VÁLIDO configurado correctamente');
  console.log('👨‍⚕️ Terapeuta:', REAL_THERAPIST.name);
  console.log('🆔 ID del terapeuta:', REAL_THERAPIST.id);
  console.log('📧 Email:', REAL_THERAPIST.email);
  console.log('🔐 Token JWT con firma válida del backend');
  console.log('🔄 ¡Recarga la página para ver los cambios!');

  return true;
}

// Probar API con token válido
async function testValidAPI() {
  console.log('🧪 Probando API con token válido...');

  try {
    const response = await fetch('http://localhost:5000/api/reviews?therapistId=current&verified=true&limit=5', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${VALID_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('📡 Status de respuesta:', response.status, response.statusText);

    if (response.ok) {
      const data = await response.json();
      console.log('✅ ¡API CALL EXITOSA!');
      console.log('📊 Datos recibidos:', data);
      console.log('📈 Reviews encontradas:', data.data?.reviews?.length || 0);
    } else {
      const errorData = await response.text();
      console.log('❌ API call falló:', errorData);
    }
  } catch (error) {
    console.error('💥 Error en la prueba:', error);
  }
}

// Verificar el estado del token
function verifyTokenStatus() {
  const token = localStorage.getItem('dhara-token') || sessionStorage.getItem('dhara-token');
  const user = localStorage.getItem('dhara-user') || sessionStorage.getItem('dhara-user');

  if (token && user) {
    try {
      const userData = JSON.parse(user);
      console.log('✅ Token presente para:', userData.name);
      console.log('🔑 Token:', token.substring(0, 50) + '...');

      // Decodificar el payload del token
      const [header, payload, signature] = token.split('.');
      const decodedPayload = JSON.parse(atob(payload));

      console.log('📋 Payload del token:');
      console.log('   - ID:', decodedPayload.id);
      console.log('   - Email:', decodedPayload.email);
      console.log('   - Role:', decodedPayload.role);
      console.log('   - Expira:', new Date(decodedPayload.exp * 1000).toLocaleString());

      const now = Math.floor(Date.now() / 1000);
      const timeLeft = decodedPayload.exp - now;
      console.log('⏰ Tiempo restante:', Math.floor(timeLeft / 3600), 'horas');

    } catch (error) {
      console.error('⚠️ Error verificando token:', error);
    }
  } else {
    console.log('❌ No hay token configurado');
  }
}

// Limpiar autenticación
function clearAuth() {
  localStorage.removeItem('dhara-token');
  localStorage.removeItem('dhara-user');
  sessionStorage.removeItem('dhara-token');
  sessionStorage.removeItem('dhara-user');
  console.log('🧹 Autenticación limpiada');
}

// Configurar automáticamente si estamos en el navegador
if (typeof window !== 'undefined') {
  window.setupValidAuth = setupValidAuth;
  window.testValidAPI = testValidAPI;
  window.verifyTokenStatus = verifyTokenStatus;
  window.clearAuth = clearAuth;

  console.log(`
🔐 CONFIGURACIÓN DE TOKEN VÁLIDO PARA DHARATERAPEUTAS
Terapeuta: Admin Demo (ID: 68ce20c17931a40b74af366a)

📚 Funciones disponibles:
  - setupValidAuth() - Configurar token JWT válido
  - testValidAPI() - Probar llamada a reviews API
  - verifyTokenStatus() - Verificar estado del token
  - clearAuth() - Limpiar autenticación

🚀 EJECUTA: setupValidAuth()
🧪 PRUEBA: testValidAPI()
  `);

  // Verificar estado actual
  verifyTokenStatus();
}