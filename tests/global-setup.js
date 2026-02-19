/**
 * Global setup para los tests de Playwright
 * Configura el entorno antes de ejecutar los tests
 */

async function globalSetup() {
  console.log('🚀 Iniciando setup global para tests...');

  // Verificar que los servidores estén corriendo
  try {
    // Verificar frontend
    const frontendResponse = await fetch('http://localhost:5173');
    if (!frontendResponse.ok) {
      console.warn('⚠️ Frontend no está corriendo en http://localhost:5173');
    } else {
      console.log('✅ Frontend detectado en http://localhost:5173');
    }
  } catch (error) {
    console.warn('⚠️ No se pudo conectar al frontend:', error.message);
  }

  try {
    // Verificar backend
    const backendResponse = await fetch('http://localhost:5000/health');
    if (!backendResponse.ok) {
      console.warn('⚠️ Backend no está corriendo en http://localhost:5000');
    } else {
      const healthData = await backendResponse.json();
      console.log('✅ Backend detectado:', healthData.status);
    }
  } catch (error) {
    console.warn('⚠️ No se pudo conectar al backend:', error.message);
  }

  console.log('✅ Setup global completado');
}

module.exports = globalSetup;