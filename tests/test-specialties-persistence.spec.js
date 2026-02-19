import { test, expect } from '@playwright/test';

/**
 * Test para verificar que las especialidades persisten después de recargar la página
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

test('Test specialties persistence after page reload', async ({ page }) => {
  await page.goto('http://localhost:5173');
  await page.evaluate(({ token, userData }) => {
    localStorage.setItem('dhara-token', token);
    localStorage.setItem('dhara-user', JSON.stringify(userData));
  }, { token: VALID_TOKEN, userData: THERAPIST_DATA });

  console.log('\n💾 === SPECIALTIES PERSISTENCE TEST ===');

  // 1. Ir al perfil y agregar una especialidad
  await page.goto('http://localhost:5173/perfil-profesional');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(3000);

  const specialtiesSection = page.locator('text="Especialidades"').first();
  await expect(specialtiesSection).toBeVisible();
  console.log('✅ Found specialties section');

  // 2. Entrar en modo edición
  const editButton = specialtiesSection.locator('..').locator('button:has-text("Editar")').first();
  await editButton.click();
  console.log('✅ Entered edit mode');
  await page.waitForTimeout(1000);

  // 3. Agregar una especialidad con timestamp único
  const timestamp = new Date().getTime();
  const testSpecialty = `Test Specialty ${timestamp}`;

  const addSpecialtyButton = page.locator('button:has-text("Añadir especialidad")');
  await addSpecialtyButton.click();
  console.log('✅ Opened specialty selector');

  const searchInput = page.locator('input[placeholder*="Buscar o escribir"]');
  await searchInput.fill(testSpecialty);
  await searchInput.press('Enter');
  console.log(`✅ Added specialty: "${testSpecialty}"`);
  await page.waitForTimeout(1000);

  // 4. Verificar que aparece el chip
  const specialtyChip = page.locator(`text="${testSpecialty}"`);
  await expect(specialtyChip).toBeVisible();
  console.log('✅ Specialty chip is visible');

  // 5. Guardar cambios
  const floatingButton = page.locator('div.fixed.bottom-6.right-6');
  await expect(floatingButton).toBeVisible();
  const saveButton = floatingButton.locator('button');
  await saveButton.click();
  console.log('✅ Saved changes');
  await page.waitForTimeout(3000);

  // 6. Verificar que salió del modo edición
  const stillHasAddButton = await addSpecialtyButton.isVisible().catch(() => false);
  console.log(`📝 Still in edit mode: ${stillHasAddButton}`);
  expect(stillHasAddButton).toBe(false);

  // 7. Verificar que la especialidad sigue visible en modo vista previa
  const specialtyInPreview = page.locator(`text="${testSpecialty}"`);
  await expect(specialtyInPreview).toBeVisible();
  console.log('✅ Specialty visible in preview mode');

  // 8. RECARGAR LA PÁGINA
  console.log('🔄 Reloading page...');
  await page.reload();
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(3000);

  // 9. Verificar que la especialidad persiste después de recargar
  const specialtyAfterReload = page.locator(`text="${testSpecialty}"`);
  const persistsAfterReload = await specialtyAfterReload.isVisible();
  console.log(`💾 Specialty persists after reload: ${persistsAfterReload}`);

  // 10. Tomar screenshot final
  await page.screenshot({
    path: 'specialties-persistence-test.png',
    fullPage: true
  });

  console.log('\n🎯 === PERSISTENCE TEST RESULTS ===');
  if (persistsAfterReload) {
    console.log('✅ SUCCESS: Specialty data persists correctly after page reload!');
  } else {
    console.log('❌ FAILURE: Specialty data was lost after page reload');
  }

  // Test pasa solo si la especialidad persiste después de recargar
  expect(persistsAfterReload).toBe(true);
});