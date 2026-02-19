import { test, expect } from '@playwright/test';

/**
 * Test para verificar que las especialidades se guardan en el backend
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

test('Test backend save with network monitoring', async ({ page }) => {
  // Monitor network requests
  page.on('request', request => {
    if (request.url().includes('/profile')) {
      console.log(`📤 REQUEST: ${request.method()} ${request.url()}`);
      if (request.method() === 'PUT' || request.method() === 'POST') {
        console.log(`📝 Body: ${request.postData()}`);
      }
    }
  });

  page.on('response', response => {
    if (response.url().includes('/profile')) {
      console.log(`📥 RESPONSE: ${response.status()} ${response.url()}`);
    }
  });

  await page.goto('http://localhost:5173');
  await page.evaluate(({ token, userData }) => {
    localStorage.setItem('dhara-token', token);
    localStorage.setItem('dhara-user', JSON.stringify(userData));
  }, { token: VALID_TOKEN, userData: THERAPIST_DATA });

  console.log('\n🔍 === BACKEND SAVE TEST ===');

  await page.goto('http://localhost:5173/perfil-profesional');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(3000);

  // Agregar especialidad y guardar
  const specialtiesSection = page.locator('text="Especialidades"').first();
  const editButton = specialtiesSection.locator('..').locator('button:has-text("Editar")').first();
  await editButton.click();
  console.log('✅ Entered edit mode');

  const addSpecialtyButton = page.locator('button:has-text("Añadir especialidad")');
  await addSpecialtyButton.click();

  const searchInput = page.locator('input[placeholder*="Buscar o escribir"]');
  await searchInput.fill("Backend Test Specialty");
  await searchInput.press('Enter');
  console.log('✅ Added specialty');
  await page.waitForTimeout(1000);

  // Guardar y monitorear la petición
  const floatingButton = page.locator('div.fixed.bottom-6.right-6');
  const saveButton = floatingButton.locator('button');

  console.log('💾 Saving changes...');
  await saveButton.click();
  await page.waitForTimeout(5000); // Esperar más tiempo para ver la respuesta

  console.log('\n📊 === BACKEND SAVE TEST COMPLETE ===');
});