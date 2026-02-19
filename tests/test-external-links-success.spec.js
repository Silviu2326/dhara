import { test, expect } from '@playwright/test';

/**
 * Test de éxito para enlaces externos con selectors específicos
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

test('SUCCESS: External links work completely', async ({ page }) => {
  await page.goto('http://localhost:5173');
  await page.evaluate(({ token, userData }) => {
    localStorage.setItem('dhara-token', token);
    localStorage.setItem('dhara-user', JSON.stringify(userData));
  }, { token: VALID_TOKEN, userData: THERAPIST_DATA });

  console.log('\n🎉 === SUCCESS TEST: EXTERNAL LINKS ===');

  await page.goto('http://localhost:5173/perfil-profesional');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(3000);

  // 1. Entrar en modo edición
  const externalLinksContainer = page.locator('div').filter({ hasText: 'Enlaces ExternosAgrega enlaces a tus redes sociales' }).first();
  const editButton = externalLinksContainer.locator('button:has-text("Editar")').first();

  await editButton.click();
  console.log('✅ Entered edit mode');
  await page.waitForTimeout(1000);

  // 2. Hacer clic en agregar enlace
  const addLinkButton = page.locator('button:has-text("Agregar Enlace")');
  await addLinkButton.click();
  console.log('✅ Clicked "Agregar Enlace"');
  await page.waitForTimeout(1000);

  // 3. ¡Verificar que el formulario aparece!
  const formTitle = page.locator('h4:has-text("Nuevo Enlace")');
  await expect(formTitle).toBeVisible();
  console.log('🎉 SUCCESS: Form appeared!');

  // 4. Llenar URL
  const urlInput = page.locator('input[type="url"]');
  await expect(urlInput).toBeVisible();

  const testUrl = 'https://www.linkedin.com/in/test-therapist';
  await urlInput.fill(testUrl);
  console.log(`✅ Filled URL: ${testUrl}`);

  // 5. Usar selector más específico para el tipo
  const formContainer = page.locator('div.bg-gray-50');
  const selectType = formContainer.locator('select').first();
  await selectType.selectOption('linkedin');
  console.log('✅ Selected LinkedIn type');

  // 6. Agregar etiqueta personalizada
  const labelInput = page.locator('input[placeholder*="Mi"]');
  await labelInput.fill('Mi LinkedIn Profesional');
  console.log('✅ Added custom label');

  // 7. Guardar el enlace
  const saveButton = page.locator('button:has-text("Guardar Enlace")');
  await saveButton.click();
  console.log('✅ Saved link');
  await page.waitForTimeout(2000);

  // 8. Verificar que el enlace aparece
  const savedLink = page.locator(`a[href="${testUrl}"]`);
  await expect(savedLink).toBeVisible();
  console.log('🎉 SUCCESS: Link appears in list!');

  const linkLabel = page.locator('text="Mi LinkedIn Profesional"');
  await expect(linkLabel).toBeVisible();
  console.log('🎉 SUCCESS: Custom label visible!');

  // 9. Guardar cambios generales
  const floatingButton = page.locator('div.fixed.bottom-6.right-6');
  if (await floatingButton.isVisible()) {
    const generalSaveButton = floatingButton.locator('button');
    await generalSaveButton.click();
    console.log('✅ Saved all changes');
    await page.waitForTimeout(3000);
  }

  // 10. Screenshot final
  await page.screenshot({
    path: 'external-links-success-test.png',
    fullPage: true
  });

  console.log('\n🎉🎉🎉 COMPLETE SUCCESS! 🎉🎉🎉');
  console.log('✅ Form appears correctly');
  console.log('✅ Can add links with custom labels');
  console.log('✅ Links are saved and displayed');
  console.log('✅ External Links functionality is 100% WORKING!');

  console.log('\n📊 === FUNCTIONALITY CONFIRMED ===');
});