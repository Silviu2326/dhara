/**
 * Global teardown para los tests de Playwright
 * Limpia el entorno después de ejecutar los tests
 */

async function globalTeardown() {
  console.log('🧹 Iniciando limpieza global después de tests...');

  // Cualquier limpieza necesaria después de los tests
  console.log('✅ Limpieza global completada');
}

module.exports = globalTeardown;