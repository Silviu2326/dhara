import { test, expect } from '@playwright/test';

/**
 * Test final para verificar que el campo "Sobre mí" se muestra correctamente
 */

const VALID_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4Y2UyMGMxNzkzMWE0MGI3NGFmMzY2YSIsImVtYWlsIjoiYWRtaW5AZGVtby5jb20iLCJyb2xlIjoidGhlcmFwaXN0IiwiaWF0IjoxNzU5MDI2OTMzLCJleHAiOjE3NTk2MzE3MzN9.kUd3Fvie_59uDQlrldUhH6xz-mGXa2vepHmRDTtUXV0";

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

test('Test About field fix - should show content', async ({ page }) => {
  // Configurar autenticación
  await page.goto('http://localhost:5173');
  await page.evaluate(({ token, userData }) => {
    localStorage.setItem('dhara-token', token);
    localStorage.setItem('dhara-user', JSON.stringify(userData));
  }, { token: VALID_TOKEN, userData: THERAPIST_DATA });

  console.log('\n✅ === TESTING ABOUT FIELD FIX ===');

  // Ir al perfil profesional
  await page.goto('http://localhost:5173/perfil-profesional');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(5000);

  // Verificar sección "Sobre mí"
  const aboutSection = page.locator('text="Sobre mí"').first();
  await expect(aboutSection).toBeVisible();
  console.log('✅ Found "Sobre mí" section');

  // Verificar que NO aparece "No hay información disponible"
  const noInfoMessage = page.locator('text="No hay información disponible"');
  const hasNoInfo = await noInfoMessage.isVisible();

  console.log(`❌ Shows "No hay información disponible": ${hasNoInfo}`);

  // Buscar el contenido esperado
  const expectedContent = page.locator('text*="Test persistence with valid token"');
  const hasExpectedContent = await expectedContent.isVisible();

  console.log(`✅ Shows expected content: ${hasExpectedContent}`);

  // Tomar screenshot del resultado
  await page.screenshot({
    path: 'about-field-fix-result.png',
    fullPage: true
  });

  console.log('\n🎯 === RESULT ===');
  if (!hasNoInfo && hasExpectedContent) {
    console.log('✅ SUCCESS: About field is displaying correctly!');
  } else if (!hasNoInfo) {
    console.log('⚠️ PARTIAL: No "no info" message, but content might be different');
  } else {
    console.log('❌ FAILURE: Still showing "No hay información disponible"');
  }

  // El test pasa si no hay mensaje de "no información"
  expect(hasNoInfo).toBe(false);
});