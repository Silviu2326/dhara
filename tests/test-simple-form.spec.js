import { test, expect } from '@playwright/test';

/**
 * Test simple para verificar si el formulario aparece
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

test('Simple form visibility test', async ({ page }) => {
  await page.goto('http://localhost:5173');
  await page.evaluate(({ token, userData }) => {
    localStorage.setItem('dhara-token', token);
    localStorage.setItem('dhara-user', JSON.stringify(userData));
  }, { token: VALID_TOKEN, userData: THERAPIST_DATA });

  await page.goto('http://localhost:5173/perfil-profesional');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(3000);

  // Entrar en modo edición y hacer clic en agregar
  const externalLinksContainer = page.locator('div').filter({ hasText: 'Enlaces ExternosAgrega enlaces a tus redes sociales' }).first();
  const editButton = externalLinksContainer.locator('button:has-text("Editar")').first();
  await editButton.click();
  await page.waitForTimeout(1000);

  const addLinkButton = page.locator('button:has-text("Agregar Enlace")');
  await addLinkButton.click();
  await page.waitForTimeout(3000); // Esperar más tiempo

  // Buscar cualquier div con el background específico
  const formDivs = await page.locator('div[style*="minHeight"]').count();
  console.log(`Found ${formDivs} divs with minHeight style`);

  const formContainer = page.locator('div').filter({ hasText: 'Nuevo Enlace' });
  const formCount = await formContainer.count();
  console.log(`Found ${formCount} containers with "Nuevo Enlace" text`);

  // Tomar screenshot antes de buscar elementos
  await page.screenshot({
    path: 'simple-form-test-before-search.png',
    fullPage: true
  });

  // Buscar con selectores más amplios
  const anyH4 = await page.locator('h4').allTextContents();
  console.log('All h4 elements:', anyH4);

  const anyInput = await page.locator('input').count();
  console.log(`Total inputs on page: ${anyInput}`);

  // Scroll down en caso de que el formulario esté fuera del viewport
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(1000);

  await page.screenshot({
    path: 'simple-form-test-after-scroll.png',
    fullPage: true
  });

  console.log('Test complete - check screenshots for analysis');
});