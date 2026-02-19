import { test, expect } from '@playwright/test';

/**
 * Test simple para verificar que el guardado funciona después del fix
 */

const VALID_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4Y2UyMGMxNzkzMWE0MGI3NGFmMzY2YSIsImVtYWlsIjoiYWRtaW5AZGVtby5jb20iLCJyb2xlIjoidGhlcmFwaXN0IiwiaWF0IjoxNzU5MDIwNzk0LCJleHAiOjE3NTkxMDcxOTR9.8vh-0vox0m8ipR8JHXHF0Up3oU_8lqBwusA4fV1wipc";

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

test('Test save fix - editar Sobre mí', async ({ page }) => {
  // Capturar logs de validación
  const validationLogs = [];
  const errors = [];

  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('[VALIDATION]')) {
      validationLogs.push(text);
      console.log('🔍 VALIDATION:', text);
    }
    if (text.includes('Error') && text.includes('saving')) {
      errors.push(text);
      console.log('❌ SAVE ERROR:', text);
    }
  });

  // Configurar autenticación
  await page.goto('http://localhost:5173');
  await page.evaluate(({ token, userData }) => {
    localStorage.setItem('dhara-token', token);
    localStorage.setItem('dhara-user', JSON.stringify(userData));
  }, { token: VALID_TOKEN, userData: THERAPIST_DATA });

  // Ir al perfil profesional
  await page.goto('http://localhost:5173/perfil-profesional');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(3000);

  console.log('\n🧪 === TESTING SAVE FIX ===');

  // 1. Buscar la sección "Sobre mí"
  const aboutSection = page.locator('text="Sobre mí"').first();
  await expect(aboutSection).toBeVisible();
  console.log('✅ Found "Sobre mí" section');

  // 2. Hacer clic en el botón de editar
  const editButton = page.locator('text="Sobre mí"').locator('..').locator('button:has-text("Editar")').first();
  await editButton.click();
  console.log('✅ Clicked edit button');
  await page.waitForTimeout(1000);

  // 3. Modificar el campo de texto
  const textArea = page.locator('textarea').first();
  await expect(textArea).toBeVisible();

  const testText = `Test description updated at ${new Date().toISOString()}`;
  await textArea.clear();
  await textArea.fill(testText);
  console.log(`✅ Modified text to: "${testText}"`);
  await page.waitForTimeout(1000);

  // 4. Verificar que aparece el botón flotante
  const floatingButton = page.locator('div.fixed.bottom-6.right-6');
  await expect(floatingButton).toBeVisible();
  console.log('✅ Floating save button appeared');

  // 5. Hacer clic en guardar
  const saveButton = floatingButton.locator('button');
  await saveButton.click();
  console.log('✅ Clicked save button');

  // 6. Esperar y verificar resultado
  await page.waitForTimeout(5000);

  console.log('\n📋 === VALIDATION LOGS ===');
  validationLogs.forEach((log, index) => {
    console.log(`${index + 1}. ${log}`);
  });

  console.log('\n📋 === SAVE ERRORS ===');
  if (errors.length > 0) {
    errors.forEach((error, index) => {
      console.log(`${index + 1}. ${error}`);
    });
  } else {
    console.log('✅ No save errors detected!');
  }

  console.log('\n🎯 === RESULT ===');
  if (errors.length === 0) {
    console.log('✅ SUCCESS: Profile save is working correctly!');
  } else {
    console.log('❌ FAILURE: Still getting save errors');
  }

  // Tomar screenshot
  await page.screenshot({
    path: 'save-fix-test.png',
    fullPage: true
  });

  // El test pasa si no hay errores de guardado
  expect(errors.length).toBe(0);
});