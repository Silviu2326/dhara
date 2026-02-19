import { test, expect } from '@playwright/test';

/**
 * Test para verificar que el fix del formulario de enlaces externos funciona
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

test('Test fixed external links form', async ({ page }) => {
  await page.goto('http://localhost:5173');
  await page.evaluate(({ token, userData }) => {
    localStorage.setItem('dhara-token', token);
    localStorage.setItem('dhara-user', JSON.stringify(userData));
  }, { token: VALID_TOKEN, userData: THERAPIST_DATA });

  console.log('\n🔧 === TESTING FIXED EXTERNAL LINKS ===');

  await page.goto('http://localhost:5173/perfil-profesional');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(3000);

  // 1. Entrar en modo edición
  const externalLinksContainer = page.locator('div').filter({ hasText: 'Enlaces ExternosAgrega enlaces a tus redes sociales' }).first();
  const editButton = externalLinksContainer.locator('button:has-text("Editar")').first();

  await editButton.click();
  console.log('✅ Entered edit mode');
  await page.waitForTimeout(1000);

  // 2. Hacer clic en "Agregar Enlace"
  const addLinkButton = page.locator('button:has-text("Agregar Enlace")');
  await expect(addLinkButton).toBeVisible();

  await addLinkButton.click();
  console.log('✅ Clicked "Agregar Enlace" button');
  await page.waitForTimeout(1000);

  // 3. Verificar que aparece el formulario completo
  const formTitle = page.locator('h4:has-text("Nuevo Enlace")');
  await expect(formTitle).toBeVisible();
  console.log('✅ Form title "Nuevo Enlace" is visible');

  const urlInput = page.locator('input[type="url"]');
  await expect(urlInput).toBeVisible();
  console.log('✅ URL input is visible');

  const selectType = page.locator('select');
  await expect(selectType).toBeVisible();
  console.log('✅ Type selector is visible');

  const saveButton = page.locator('button:has-text("Guardar Enlace")');
  await expect(saveButton).toBeVisible();
  console.log('✅ Save button is visible');

  // 4. Probar llenar el formulario
  const testUrl = 'https://www.linkedin.com/in/test-therapist';
  await urlInput.fill(testUrl);
  console.log(`✅ Filled URL: ${testUrl}`);

  await selectType.selectOption('linkedin');
  console.log('✅ Selected LinkedIn type');

  // 5. Agregar etiqueta personalizada
  const labelInput = page.locator('input[placeholder*="Mi"]');
  await labelInput.fill('Mi Perfil LinkedIn');
  console.log('✅ Added custom label');

  // 6. Guardar el enlace
  await saveButton.click();
  console.log('✅ Clicked save button');
  await page.waitForTimeout(1000);

  // 7. Verificar que el enlace aparece en la lista
  const savedLink = page.locator(`a[href="${testUrl}"]`);
  await expect(savedLink).toBeVisible();
  console.log('✅ Link appears in the list');

  const linkLabel = page.locator('text="Mi Perfil LinkedIn"');
  await expect(linkLabel).toBeVisible();
  console.log('✅ Custom label is displayed');

  // 8. Guardar cambios generales
  const floatingButton = page.locator('div.fixed.bottom-6.right-6');
  if (await floatingButton.isVisible()) {
    const generalSaveButton = floatingButton.locator('button');
    await generalSaveButton.click();
    console.log('✅ Saved changes');
    await page.waitForTimeout(3000);
  }

  // 9. Screenshot final
  await page.screenshot({
    path: 'external-links-fixed-test.png',
    fullPage: true
  });

  console.log('\n🎉 === SUCCESS! EXTERNAL LINKS WORKING ===');
  console.log('✅ Form appears correctly');
  console.log('✅ Can add links with custom labels');
  console.log('✅ Links are saved and displayed');
});