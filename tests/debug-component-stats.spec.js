import { test, expect } from '@playwright/test';

/**
 * Test para ver qué está recibiendo el componente PersonalStats
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

test('Debug what PersonalStats component receives', async ({ page }) => {
  // Capturar logs del componente
  const componentLogs = [];
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('[PERSONAL STATS]')) {
      componentLogs.push(text);
      console.log('🎯 COMPONENT LOG:', text);
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
  await page.waitForTimeout(12000);

  console.log('\n🎯 === COMPONENT LOGS ===');
  componentLogs.forEach((log, index) => {
    console.log(`${index + 1}. ${log}`);
  });

  // Buscar logs específicos
  const receivedLogs = componentLogs.filter(log => log.includes('Component received stats'));
  const finalLogs = componentLogs.filter(log => log.includes('Final defaultStats'));

  console.log('\n📊 === ANALYSIS ===');
  console.log(`Component received stats logs: ${receivedLogs.length}`);
  console.log(`Final defaultStats logs: ${finalLogs.length}`);

  if (receivedLogs.length > 0) {
    console.log('\n🔍 Latest received stats:');
    console.log(receivedLogs[receivedLogs.length - 1]);
  }

  if (finalLogs.length > 0) {
    console.log('\n📊 Latest final stats:');
    console.log(finalLogs[finalLogs.length - 1]);
  }

  expect(componentLogs.length).toBeGreaterThan(0);
});