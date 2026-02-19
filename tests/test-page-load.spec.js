import { test, expect } from '@playwright/test';

/**
 * Test simple para verificar que la página del perfil profesional carga correctamente
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

test('Test page loads correctly', async ({ page }) => {
  // Capturar errores
  const errors = [];
  page.on('pageerror', error => {
    errors.push(error.message);
    console.log(`❌ Page Error: ${error.message}`);
  });

  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log(`❌ Console Error: ${msg.text()}`);
    }
  });

  await page.goto('http://localhost:5173');
  await page.evaluate(({ token, userData }) => {
    localStorage.setItem('dhara-token', token);
    localStorage.setItem('dhara-user', JSON.stringify(userData));
  }, { token: VALID_TOKEN, userData: THERAPIST_DATA });

  console.log('\n🔍 === TESTING PAGE LOAD ===');

  await page.goto('http://localhost:5173/perfil-profesional');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(3000);

  // Verificar si hay error en la página
  const errorText = page.locator('text="Oops! Algo salió mal"');
  const hasError = await errorText.isVisible().catch(() => false);

  if (hasError) {
    console.log('❌ Page shows error: "Oops! Algo salió mal"');

    // Buscar más detalles del error
    const reloadButton = page.locator('button:has-text("Recargar")');
    const hasReloadButton = await reloadButton.isVisible().catch(() => false);
    console.log(`🔄 Has reload button: ${hasReloadButton}`);

  } else {
    console.log('✅ Page loaded successfully');

    // Verificar que elementos básicos están presentes
    const title = page.locator('text="Perfil Profesional"');
    const hasTitle = await title.isVisible().catch(() => false);
    console.log(`📄 Has "Perfil Profesional" title: ${hasTitle}`);

    const externalLinksSection = page.locator('text="Enlaces Externos"');
    const hasExternalLinks = await externalLinksSection.isVisible().catch(() => false);
    console.log(`🔗 Has "Enlaces Externos" section: ${hasExternalLinks}`);
  }

  // Mostrar errores capturados
  if (errors.length > 0) {
    console.log('\n❌ ERRORS CAPTURED:');
    errors.forEach((error, index) => {
      console.log(`  ${index + 1}. ${error}`);
    });
  } else {
    console.log('\n✅ No JavaScript errors detected');
  }

  await page.screenshot({
    path: 'page-load-test.png',
    fullPage: true
  });

  console.log('\n📊 === PAGE LOAD TEST COMPLETE ===');
});