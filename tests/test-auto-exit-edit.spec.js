import { test, expect } from '@playwright/test';

/**
 * Test para verificar que después de guardar, el campo vuelve al modo vista previa
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

test('Test auto-exit edit mode after saving', async ({ page }) => {
  // Configurar autenticación
  await page.goto('http://localhost:5173');
  await page.evaluate(({ token, userData }) => {
    localStorage.setItem('dhara-token', token);
    localStorage.setItem('dhara-user', JSON.stringify(userData));
  }, { token: VALID_TOKEN, userData: THERAPIST_DATA });

  console.log('\n🔄 === TESTING AUTO-EXIT EDIT MODE ===');

  // Ir al perfil profesional
  await page.goto('http://localhost:5173/perfil-profesional');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(3000);

  // 1. Verificar que inicialmente está en modo vista previa
  const aboutSection = page.locator('text="Sobre mí"').first();
  await expect(aboutSection).toBeVisible();
  console.log('✅ Found "Sobre mí" section');

  // Verificar que NO hay textarea inicialmente (modo vista previa)
  const textareaInitial = page.locator('textarea').first();
  const hasTextareaInitial = await textareaInitial.isVisible().catch(() => false);
  console.log(`📄 Initially has textarea (edit mode): ${hasTextareaInitial}`);

  // 2. Hacer clic en "Editar" para entrar en modo edición
  const editButton = page.locator('text="Sobre mí"').locator('..').locator('button:has-text("Editar")').first();
  await editButton.click();
  console.log('✅ Clicked edit button');
  await page.waitForTimeout(1000);

  // 3. Verificar que ahora SÍ hay textarea (modo edición)
  const textareaAfterEdit = page.locator('textarea').first();
  await expect(textareaAfterEdit).toBeVisible();
  console.log('✅ Textarea appeared - now in edit mode');

  // 4. Modificar el contenido
  const newText = `Auto-exit test content: ${new Date().toISOString()}`;
  await textareaAfterEdit.clear();
  await textareaAfterEdit.fill(newText);
  console.log(`✏️ Modified content: "${newText}"`);
  await page.waitForTimeout(1000);

  // 5. Verificar que aparece el botón flotante
  const floatingButton = page.locator('div.fixed.bottom-6.right-6');
  await expect(floatingButton).toBeVisible();
  console.log('✅ Floating save button appeared');

  // 6. Guardar cambios
  const saveButton = floatingButton.locator('button');
  await saveButton.click();
  console.log('✅ Clicked save button');
  await page.waitForTimeout(3000); // Esperar a que termine el guardado

  // 7. Verificar que el textarea ha desaparecido (volvió a modo vista previa)
  const textareaAfterSave = page.locator('textarea').first();
  const hasTextareaAfterSave = await textareaAfterSave.isVisible().catch(() => false);
  console.log(`📄 Has textarea after save (should be false): ${hasTextareaAfterSave}`);

  // 8. Verificar que el contenido se muestra en modo vista previa
  const contentInPreview = page.locator(`text*="Auto-exit test content"`);
  const hasContentInPreview = await contentInPreview.isVisible().catch(() => false);
  console.log(`📝 Content visible in preview mode: ${hasContentInPreview}`);

  // 9. Tomar screenshot del resultado
  await page.screenshot({
    path: 'auto-exit-edit-mode-test.png',
    fullPage: true
  });

  console.log('\n🎯 === RESULTS ===');
  if (!hasTextareaAfterSave && hasContentInPreview) {
    console.log('✅ SUCCESS: Auto-exit edit mode working correctly!');
    console.log('   - Textarea disappeared (exited edit mode)');
    console.log('   - Content is visible in preview mode');
  } else if (!hasTextareaAfterSave) {
    console.log('⚠️ PARTIAL: Exited edit mode but content might not be visible');
  } else {
    console.log('❌ FAILURE: Still in edit mode after saving');
  }

  // Test pasa si no hay textarea después de guardar (salió del modo edición)
  expect(hasTextareaAfterSave).toBe(false);
});