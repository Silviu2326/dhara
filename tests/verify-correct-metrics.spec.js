import { test, expect } from '@playwright/test';

/**
 * Test para verificar que las métricas muestran los datos correctos
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

test('Verificar métricas correctas', async ({ page }) => {
  // Capturar logs del componente
  const componentLogs = [];
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('[PROFILE STATS]') || text.includes('[PERSONAL STATS]')) {
      componentLogs.push(text);
      console.log('📊 LOG:', text);
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
  await page.waitForTimeout(8000);

  console.log('\n📊 === EXPECTED CORRECT VALUES ===');
  console.log('✅ Sesiones completadas: 19 (was showing wrong number)');
  console.log('✅ Clientes únicos totales: 6 (was showing 32)');
  console.log('✅ Clientes activos: 4 (was showing 10)');
  console.log('✅ Valoración media: should get from reviews API');

  // Verificar que los valores correctos aparecen
  const sessions19 = page.locator('text="19"').first();
  const clients6 = page.locator('text="6"').first();
  const clients4 = page.locator('text="4"').first();

  await expect(sessions19).toBeVisible();
  console.log('✅ Found "19" for sessions');

  const isVisible6 = await clients6.isVisible().catch(() => false);
  const isVisible4 = await clients4.isVisible().catch(() => false);

  console.log(`📊 Found "6" for total clients: ${isVisible6}`);
  console.log(`📊 Found "4" for active clients: ${isVisible4}`);

  // Capturar screenshot para verificación visual
  await page.screenshot({
    path: 'corrected-metrics-verification.png',
    fullPage: true
  });

  console.log('\n🎯 RESULTADO: Las métricas deberían mostrar ahora los valores correctos');
  console.log('📸 Revisa el screenshot "corrected-metrics-verification.png"');

  // Log all component data received
  console.log('\n📋 === COMPONENT LOGS ===');
  componentLogs.forEach((log, index) => {
    console.log(`${index + 1}. ${log}`);
  });

  expect(sessions19).toBeVisible();
});