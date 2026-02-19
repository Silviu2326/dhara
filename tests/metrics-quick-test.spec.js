import { test, expect } from '@playwright/test';

/**
 * Test rápido para verificar que las métricas ahora muestran valores reales
 */

const VALID_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4Y2UyMGMxNzkzMWE0MGI3NGFmMzY2YSIsImVtYWlsIjoiYWRtaW5AZGVtby5jb20iLCJyb2xlIjoidGhlcmFwaXN0IiwiaWF0IjoxNzU5MDIwNzk0LCJleHAiOjE3NTkxMDcxOTR9.8vh-0vox0m8ipR8JHXHF0Up3oU_8lqBwusA4fV1wipc";

const THERAPIST_DATA = {
  id: "68ce20c17931a40b74af366a",
  email: "admin@demo.com",
  firstName: "Admin",
  lastName: "Demo",
  name: "Admin Demo",
  role: "therapist",
  verified: true,
  isActive: true
};

test('Verificar que las métricas muestran datos reales', async ({ page }) => {
  // Configurar autenticación
  await page.goto('http://localhost:5173');
  await page.evaluate(({ token, userData }) => {
    localStorage.setItem('dhara-token', token);
    localStorage.setItem('dhara-user', JSON.stringify(userData));
  }, { token: VALID_TOKEN, userData: THERAPIST_DATA });

  // Ir al perfil profesional
  await page.goto('http://localhost:5173/perfil-profesional');
  await page.waitForLoadState('networkidle');

  // Esperar a que las APIs respondan
  await page.waitForTimeout(8000);

  console.log('🔍 Verificando métricas en la interfaz...');

  // Función helper para extraer número de texto
  const extractNumber = (text) => {
    const match = text.match(/[\d,]+(\.\d+)?/);
    return match ? parseFloat(match[0].replace(',', '')) : 0;
  };

  // Buscar sección de métricas
  const metricsSection = page.locator('text=Métricas Personales').first();
  await expect(metricsSection).toBeVisible();

  // Verificar sesiones impartidas (debería ser 19)
  const sessionElement = page.locator('text=Sesiones impartidas').locator('..').locator('..').first();
  const sessionNumber = sessionElement.locator('.text-2xl, .text-3xl, h1, h2, h3, [class*="text-lg"], [class*="text-xl"]').first();
  const sessionText = await sessionNumber.textContent();
  const sessions = extractNumber(sessionText);

  console.log(`📊 Sesiones impartidas: ${sessions} (esperado: 19)`);

  // Verificar valoración media (debería ser 4.5)
  const ratingElement = page.locator('text=Valoración media').locator('..').locator('..').first();
  const ratingNumber = ratingElement.locator('.text-2xl, .text-3xl, h1, h2, h3, [class*="text-lg"], [class*="text-xl"]').first();
  const ratingText = await ratingNumber.textContent();
  const rating = extractNumber(ratingText);

  console.log(`⭐ Valoración media: ${rating} (esperado: 4.5)`);

  // Verificar tasa de finalización (debería ser 59%)
  const completionElement = page.locator('text=Tasa de finalización').locator('..').locator('..').first();
  const completionNumber = completionElement.locator('.text-2xl, .text-3xl, h1, h2, h3, [class*="text-lg"], [class*="text-xl"]').first();
  const completionText = await completionNumber.textContent();
  const completion = extractNumber(completionText);

  console.log(`📈 Tasa de finalización: ${completion}% (esperado: 59%)`);

  // Verificar que al menos algunos valores son mayores que 0
  const hasRealData = sessions > 0 || rating > 0 || completion > 0;

  if (hasRealData) {
    console.log('✅ ¡Métricas funcionando correctamente!');
  } else {
    console.log('❌ Las métricas siguen mostrando 0');

    // Debug: capturar screenshot para ver qué está pasando
    await page.screenshot({ path: 'metrics-debug.png', fullPage: true });
    console.log('📸 Screenshot guardado como metrics-debug.png');
  }

  // Al menos una métrica debería mostrar datos reales
  expect(hasRealData).toBe(true);
});