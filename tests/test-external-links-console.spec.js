import { test, expect } from '@playwright/test';

/**
 * Test para monitorear los logs de consola del componente ExternalLinks
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

test('Monitor external links console logs', async ({ page }) => {
  // Capturar logs de consola
  const consoleLogs = [];
  page.on('console', msg => {
    if (msg.text().includes('🔍')) {
      consoleLogs.push(msg.text());
      console.log(`📝 Console: ${msg.text()}`);
    }
  });

  await page.goto('http://localhost:5173');
  await page.evaluate(({ token, userData }) => {
    localStorage.setItem('dhara-token', token);
    localStorage.setItem('dhara-user', JSON.stringify(userData));
  }, { token: VALID_TOKEN, userData: THERAPIST_DATA });

  console.log('\n🔍 === MONITORING CONSOLE LOGS ===');

  await page.goto('http://localhost:5173/perfil-profesional');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(3000);

  console.log('\n📊 Initial render complete, checking for render logs...');

  // Hacer clic en editar
  const externalLinksContainer = page.locator('div').filter({ hasText: 'Enlaces ExternosAgrega enlaces a tus redes sociales' }).first();
  const editButton = externalLinksContainer.locator('button:has-text("Editar")').first();

  await editButton.click();
  console.log('✅ Clicked edit button');
  await page.waitForTimeout(1000);

  console.log('\n📊 After edit click, checking for render logs...');

  // Hacer clic en "Agregar Enlace"
  const addLinkButton = page.locator('button:has-text("Agregar Enlace")');
  await addLinkButton.click();
  console.log('✅ Clicked "Agregar Enlace" button');
  await page.waitForTimeout(2000);

  console.log('\n📊 After add link click, checking for render logs...');

  // Verificar si el formulario apareció
  const formTitle = page.locator('h4:has-text("Nuevo Enlace")');
  const hasForm = await formTitle.isVisible().catch(() => false);
  console.log(`📝 Form visible: ${hasForm}`);

  // Mostrar resumen de logs capturados
  console.log('\n📋 CAPTURED CONSOLE LOGS:');
  consoleLogs.forEach((log, index) => {
    console.log(`  ${index + 1}. ${log}`);
  });

  if (consoleLogs.length === 0) {
    console.log('❌ No debug logs captured');
  }

  await page.screenshot({
    path: 'external-links-console-test.png',
    fullPage: true
  });

  console.log('\n📊 === CONSOLE MONITORING COMPLETE ===');
});