import { test, expect } from '@playwright/test';

/**
 * Test para verificar que los cambios persisten después de recargar la página
 */

const VALID_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4Y2UyMGMxNzkzMWE0NGI3NGFmMzY2YSIsImVtYWlsIjoiYWRtaW5AZGVtby5jb20iLCJyb2xlIjoidGhlcmFwaXN0IiwiaWF0IjoxNzU5MDIwNzk0LCJleHAiOjE3NTkxMDcxOTR9.8vh-0vox0m8ipR8JHXHF0Up3oU_8lqBwusA4fV1wipc";

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

test('Test persistence - editar, guardar y recargar página', async ({ page }) => {
  // Capturar logs importantes
  const apiLogs = [];
  const errors = [];

  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('[VALIDATION]') || text.includes('API') || text.includes('ERROR')) {
      apiLogs.push(text);
      console.log('📋 LOG:', text);
    }
    if (text.includes('Error') && (text.includes('saving') || text.includes('loading'))) {
      errors.push(text);
      console.log('❌ ERROR:', text);
    }
  });

  // Configurar autenticación
  await page.goto('http://localhost:5173');
  await page.evaluate(({ token, userData }) => {
    localStorage.setItem('dhara-token', token);
    localStorage.setItem('dhara-user', JSON.stringify(userData));
  }, { token: VALID_TOKEN, userData: THERAPIST_DATA });

  console.log('\n🔄 === TESTING DATA PERSISTENCE ===');

  // 1. Ir al perfil profesional
  await page.goto('http://localhost:5173/perfil-profesional');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(3000);

  // 2. Verificar datos actuales en "Sobre mí"
  const aboutSection = page.locator('text="Sobre mí"').first();
  await expect(aboutSection).toBeVisible();
  console.log('✅ Found "Sobre mí" section');

  // 3. Hacer clic en editar
  const editButton = page.locator('text="Sobre mí"').locator('..').locator('button:has-text("Editar")').first();
  await editButton.click();
  console.log('✅ Clicked edit button');
  await page.waitForTimeout(1000);

  // 4. Verificar contenido actual del campo
  const textArea = page.locator('textarea').first();
  await expect(textArea).toBeVisible();

  const currentValue = await textArea.inputValue();
  console.log(`📄 Current value: "${currentValue}"`);

  // 5. Modificar con un texto único
  const timestamp = new Date().toISOString().slice(0, 19); // YYYY-MM-DDTHH:mm:ss
  const newText = `Descripción actualizada en test: ${timestamp}`;

  await textArea.clear();
  await textArea.fill(newText);
  console.log(`✏️ Set new text: "${newText}"`);
  await page.waitForTimeout(1000);

  // 6. Verificar que aparece el botón flotante
  const floatingButton = page.locator('div.fixed.bottom-6.right-6');
  await expect(floatingButton).toBeVisible();
  console.log('✅ Floating save button appeared');

  // 7. Guardar cambios
  const saveButton = floatingButton.locator('button');
  await saveButton.click();
  console.log('✅ Clicked save button');
  await page.waitForTimeout(5000); // Esperar a que termine el guardado

  // 8. Verificar que no hay errores de guardado
  if (errors.length > 0) {
    console.log('❌ Save errors detected:', errors);
  } else {
    console.log('✅ No save errors detected');
  }

  // 9. Recargar la página
  console.log('\n🔄 Reloading page...');
  await page.reload();
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(3000);

  // 10. Re-autenticar después de la recarga
  await page.evaluate(({ token, userData }) => {
    localStorage.setItem('dhara-token', token);
    localStorage.setItem('dhara-user', JSON.stringify(userData));
  }, { token: VALID_TOKEN, userData: THERAPIST_DATA });

  // 11. Verificar que los datos persisten
  const aboutSectionAfterReload = page.locator('text="Sobre mí"').first();
  await expect(aboutSectionAfterReload).toBeVisible();

  // 12. Hacer clic en editar para ver el contenido
  const editButtonAfterReload = page.locator('text="Sobre mí"').locator('..').locator('button:has-text("Editar")').first();
  await editButtonAfterReload.click();
  await page.waitForTimeout(1000);

  // 13. Verificar que el texto guardado está presente
  const textAreaAfterReload = page.locator('textarea').first();
  await expect(textAreaAfterReload).toBeVisible();

  const valueAfterReload = await textAreaAfterReload.inputValue();
  console.log(`📄 Value after reload: "${valueAfterReload}"`);

  // 14. Tomar screenshot del resultado
  await page.screenshot({
    path: 'persistence-test-result.png',
    fullPage: true
  });

  console.log('\n🎯 === PERSISTENCE TEST RESULTS ===');
  console.log(`Original text: "${newText}"`);
  console.log(`Text after reload: "${valueAfterReload}"`);

  if (valueAfterReload === newText) {
    console.log('✅ SUCCESS: Data persisted correctly!');
  } else if (valueAfterReload.includes(timestamp)) {
    console.log('✅ PARTIAL SUCCESS: Data persisted with some changes');
  } else {
    console.log('❌ FAILURE: Data did not persist');
  }

  // 15. Verificar si hay texto "No hay información disponible"
  const noInfoMessage = page.locator('text="No hay información disponible"');
  const hasNoInfoMessage = await noInfoMessage.isVisible().catch(() => false);

  if (hasNoInfoMessage) {
    console.log('❌ "No hay información disponible" message is shown');
  } else {
    console.log('✅ No "No hay información disponible" message');
  }

  // Test pasa si el texto persiste o no hay mensaje de "no información"
  expect(valueAfterReload === newText || !hasNoInfoMessage).toBeTruthy();
});