import { test, expect } from '@playwright/test';

/**
 * Test rápido para ver qué está pasando con el setStats
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

test('Debug stats setting', async ({ page }) => {
  // Capturar logs de stats setting
  const statsLogs = [];
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('[STATS SETTING]')) {
      statsLogs.push(text);
      console.log('🔧 STATS LOG:', text);
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
  await page.waitForTimeout(10000);

  console.log('\n📊 === STATS SETTING LOGS ===');
  statsLogs.forEach((log, index) => {
    console.log(`${index + 1}. ${log}`);
  });

  expect(statsLogs.length).toBeGreaterThan(0);
});