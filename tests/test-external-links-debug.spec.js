import { test, expect } from '@playwright/test';

/**
 * Test debug para investigar el estado de la sección Enlaces Externos
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

test('Debug external links section', async ({ page }) => {
  await page.goto('http://localhost:5173');
  await page.evaluate(({ token, userData }) => {
    localStorage.setItem('dhara-token', token);
    localStorage.setItem('dhara-user', JSON.stringify(userData));
  }, { token: VALID_TOKEN, userData: THERAPIST_DATA });

  console.log('\n🔍 === DEBUGGING EXTERNAL LINKS ===');

  await page.goto('http://localhost:5173/perfil-profesional');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(3000);

  // 1. Buscar la sección
  const externalLinksSection = page.locator('text="Enlaces Externos"').first();
  await expect(externalLinksSection).toBeVisible();
  console.log('✅ Found "Enlaces Externos" section');

  // 2. Buscar todos los botones en la página
  const allButtons = await page.locator('button').all();
  console.log(`📊 Total buttons found: ${allButtons.length}`);

  for (let i = 0; i < Math.min(allButtons.length, 20); i++) {
    const buttonText = await allButtons[i].textContent().catch(() => 'No text');
    const isVisible = await allButtons[i].isVisible().catch(() => false);
    console.log(`  Button ${i}: "${buttonText}" (visible: ${isVisible})`);
  }

  // 3. Buscar específicamente botones de editar
  const editButtons = page.locator('button:has-text("Editar")');
  const editButtonCount = await editButtons.count();
  console.log(`🖊️ Edit buttons found: ${editButtonCount}`);

  for (let i = 0; i < editButtonCount; i++) {
    const button = editButtons.nth(i);
    const isVisible = await button.isVisible();
    const parentText = await button.locator('..').textContent().catch(() => 'No parent text');
    console.log(`  Edit button ${i}: visible=${isVisible}, parent="${parentText.substring(0, 50)}..."`);
  }

  // 4. Buscar el botón "Agregar Enlace" (solo aparece en modo edición)
  const addLinkButton = page.locator('button:has-text("Agregar Enlace")');
  const hasAddLinkButton = await addLinkButton.isVisible();
  console.log(`➕ "Agregar Enlace" button visible: ${hasAddLinkButton}`);

  // 5. Verificar si hay algún div contenedor con el texto de editar
  const editContainer = externalLinksSection.locator('..').locator('..').locator('button:has-text("Editar")');
  const hasEditInContainer = await editContainer.isVisible().catch(() => false);
  console.log(`📦 Edit button in container: ${hasEditInContainer}`);

  // 6. Verificar estructura DOM alrededor de la sección
  const sectionContainer = externalLinksSection.locator('..');
  const containerHTML = await sectionContainer.innerHTML().catch(() => 'Error getting HTML');
  console.log(`🔍 Section container HTML: ${containerHTML.substring(0, 200)}...`);

  await page.screenshot({
    path: 'external-links-debug.png',
    fullPage: true
  });

  console.log('\n📊 === DEBUG COMPLETE ===');
});