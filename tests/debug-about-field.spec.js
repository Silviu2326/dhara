import { test, expect } from '@playwright/test';

/**
 * Test para debuggear el campo 'about' específicamente
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

test('Debug about field mapping', async ({ page }) => {
  // Capturar logs específicos del perfil
  const profileLogs = [];

  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('[PROFILE DEBUG]')) {
      profileLogs.push(text);
      console.log('🔍 PROFILE LOG:', text);
    }
  });

  // Configurar autenticación
  await page.goto('http://localhost:5173');
  await page.evaluate(({ token, userData }) => {
    localStorage.setItem('dhara-token', token);
    localStorage.setItem('dhara-user', JSON.stringify(userData));
  }, { token: VALID_TOKEN, userData: THERAPIST_DATA });

  console.log('\n🔍 === DEBUGGING ABOUT FIELD MAPPING ===');

  // Ir al perfil profesional
  await page.goto('http://localhost:5173/perfil-profesional');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(5000);

  console.log('\n📋 === PROFILE DEBUG LOGS ===');
  profileLogs.forEach((log, index) => {
    console.log(`${index + 1}. ${log}`);
  });

  // Verificar sección "Sobre mí"
  const aboutSection = page.locator('text="Sobre mí"').first();
  await expect(aboutSection).toBeVisible();

  // Buscar el contenido actual de "Sobre mí"
  const aboutContent = page.locator('text="Sobre mí"').locator('..').locator('div').filter({ hasText: /información|disponible|Test|persistence/ });

  let aboutText = '';
  const aboutElements = await aboutContent.all();

  for (const element of aboutElements) {
    const text = await element.textContent();
    if (text && !text.includes('Editar') && !text.includes('Sobre mí')) {
      aboutText += text + ' ';
    }
  }

  console.log(`\n📝 Current "Sobre mí" content displayed: "${aboutText.trim()}"`);

  // Verificar si hay mensaje "No hay información disponible"
  const noInfoMessage = page.locator('text="No hay información disponible"');
  const hasNoInfo = await noInfoMessage.isVisible();

  console.log(`❌ Shows "No hay información disponible": ${hasNoInfo}`);

  // Tomar screenshot
  await page.screenshot({
    path: 'debug-about-field.png',
    fullPage: true
  });

  console.log('\n🎯 === EXPECTED vs ACTUAL ===');
  console.log('Expected: "Test persistence with valid token: 2025-09-28T02:36:41.955Z"');
  console.log(`Actual displayed: "${aboutText.trim()}"`);

  if (profileLogs.length === 0) {
    console.log('⚠️ No profile debug logs captured - check if hook is running');
  }

  expect(aboutSection).toBeVisible();
});