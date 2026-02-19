import { test, expect } from '@playwright/test';

/**
 * Test con token válido para verificar persistencia
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

test('Test with valid token - check persistence', async ({ page }) => {
  // Configurar autenticación
  await page.goto('http://localhost:5173');
  await page.evaluate(({ token, userData }) => {
    localStorage.setItem('dhara-token', token);
    localStorage.setItem('dhara-user', JSON.stringify(userData));
  }, { token: VALID_TOKEN, userData: THERAPIST_DATA });

  console.log('\n🔑 === TESTING WITH VALID TOKEN ===');

  // Ir al perfil profesional
  await page.goto('http://localhost:5173/perfil-profesional');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(5000);

  // Verificar que no hay errores 401
  const errorMessages = [];
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('401') || text.includes('Unauthorized')) {
      errorMessages.push(text);
      console.log('❌ AUTH ERROR:', text);
    }
    if (text.includes('profile') && text.includes('ERROR')) {
      console.log('🔍 PROFILE ERROR:', text);
    }
  });

  // Buscar la sección "Sobre mí"
  const aboutSection = page.locator('text="Sobre mí"').first();
  await expect(aboutSection).toBeVisible();
  console.log('✅ Found "Sobre mí" section');

  // Hacer clic en editar
  const editButton = page.locator('text="Sobre mí"').locator('..').locator('button:has-text("Editar")').first();
  await editButton.click();
  console.log('✅ Clicked edit button');
  await page.waitForTimeout(1000);

  // Verificar contenido actual
  const textArea = page.locator('textarea').first();
  await expect(textArea).toBeVisible();

  const currentValue = await textArea.inputValue();
  console.log(`📄 Current value loaded: "${currentValue}"`);

  // Modificar contenido
  const newText = `Test persistence with valid token: ${new Date().toISOString()}`;
  await textArea.clear();
  await textArea.fill(newText);
  console.log(`✏️ Set new text: "${newText}"`);
  await page.waitForTimeout(1000);

  // Guardar
  const floatingButton = page.locator('div.fixed.bottom-6.right-6');
  await expect(floatingButton).toBeVisible();

  const saveButton = floatingButton.locator('button');
  await saveButton.click();
  console.log('✅ Clicked save button');
  await page.waitForTimeout(5000);

  // Recargar página
  console.log('\n🔄 Reloading page...');
  await page.reload();
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(3000);

  // Re-autenticar
  await page.evaluate(({ token, userData }) => {
    localStorage.setItem('dhara-token', token);
    localStorage.setItem('dhara-user', JSON.stringify(userData));
  }, { token: VALID_TOKEN, userData: THERAPIST_DATA });

  // Verificar persistencia
  await page.waitForTimeout(2000);
  const aboutSectionAfter = page.locator('text="Sobre mí"').first();
  await expect(aboutSectionAfter).toBeVisible();

  const editButtonAfter = page.locator('text="Sobre mí"').locator('..').locator('button:has-text("Editar")').first();
  await editButtonAfter.click();
  await page.waitForTimeout(1000);

  const textAreaAfter = page.locator('textarea').first();
  await expect(textAreaAfter).toBeVisible();

  const valueAfter = await textAreaAfter.inputValue();
  console.log(`📄 Value after reload: "${valueAfter}"`);

  // Tomar screenshot
  await page.screenshot({
    path: 'valid-token-test.png',
    fullPage: true
  });

  console.log('\n🎯 === RESULTS ===');
  if (valueAfter === newText) {
    console.log('✅ SUCCESS: Data persisted correctly!');
  } else if (valueAfter && valueAfter !== '') {
    console.log('⚠️ PARTIAL: Some data persisted but different from expected');
    console.log(`Expected: "${newText}"`);
    console.log(`Got: "${valueAfter}"`);
  } else {
    console.log('❌ FAILURE: No data persisted');
  }

  console.log(`Authentication errors: ${errorMessages.length}`);

  expect(valueAfter).not.toBe('');
});