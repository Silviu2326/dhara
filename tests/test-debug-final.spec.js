import { test, expect } from '@playwright/test';

/**
 * Test final para debuggear el estado del formulario
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

test('Final debug test', async ({ page }) => {
  // Capturar ALL console logs
  page.on('console', msg => {
    if (msg.text().includes('🟡') || msg.text().includes('🔵')) {
      console.log(`📝 ${msg.text()}`);
    }
  });

  await page.goto('http://localhost:5173');
  await page.evaluate(({ token, userData }) => {
    localStorage.setItem('dhara-token', token);
    localStorage.setItem('dhara-user', JSON.stringify(userData));
  }, { token: VALID_TOKEN, userData: THERAPIST_DATA });

  console.log('\n🔍 === FINAL DEBUG TEST ===');

  await page.goto('http://localhost:5173/perfil-profesional');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(3000);

  console.log('\n1️⃣ Initial page load complete');

  // Entrar en modo edición
  const externalLinksContainer = page.locator('div').filter({ hasText: 'Enlaces ExternosAgrega enlaces a tus redes sociales' }).first();
  const editButton = externalLinksContainer.locator('button:has-text("Editar")').first();

  await editButton.click();
  console.log('\n2️⃣ Clicked edit button');
  await page.waitForTimeout(1000);

  // Hacer clic en agregar enlace
  const addLinkButton = page.locator('button:has-text("Agregar Enlace")');
  console.log('\n3️⃣ About to click "Agregar Enlace" button');

  await addLinkButton.click();
  console.log('\n4️⃣ Clicked "Agregar Enlace" button');

  // Esperar un poco más para que React procese el estado
  await page.waitForTimeout(3000);

  console.log('\n5️⃣ Waited for state updates');

  // Verificar resultado final
  const formTitle = page.locator('h4:has-text("Nuevo Enlace")');
  const hasForm = await formTitle.isVisible().catch(() => false);
  console.log(`\n6️⃣ Final result - Form visible: ${hasForm}`);

  await page.screenshot({
    path: 'debug-final-test.png',
    fullPage: true
  });

  console.log('\n📊 === FINAL DEBUG COMPLETE ===');
});