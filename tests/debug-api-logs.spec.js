import { test, expect } from '@playwright/test';

/**
 * Test específico para debuggear exactamente por qué las APIs no se están llamando
 * Captura todos los console.logs que agregamos para rastrear el flujo
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

test('Debug API calls execution flow', async ({ page }) => {
  // Capturar TODOS los logs de consola
  const consoleLogs = [];

  page.on('console', msg => {
    const type = msg.type();
    const text = msg.text();

    // Filtrar logs relevantes
    if (
      text.includes('[PROFILE STATS]') ||
      text.includes('[BOOKING SERVICE]') ||
      text.includes('[PAYMENT SERVICE]') ||
      text.includes('[REVIEW SERVICE]') ||
      text.includes('[DEMO MODE]') ||
      text.includes('API') ||
      text.includes('statistics') ||
      text.includes('error')
    ) {
      const logEntry = `[${type.toUpperCase()}] ${text}`;
      consoleLogs.push(logEntry);
      console.log(logEntry);
    }
  });

  // Capturar peticiones de red
  const networkRequests = [];
  page.on('request', request => {
    const url = request.url();
    if (url.includes('/api/')) {
      networkRequests.push({
        method: request.method(),
        url,
        headers: request.headers()
      });
      console.log(`🌐 NETWORK REQUEST: ${request.method()} ${url}`);
    }
  });

  // Capturar respuestas de red
  const networkResponses = [];
  page.on('response', async response => {
    const url = response.url();
    if (url.includes('/api/')) {
      try {
        const responseBody = await response.json();
        networkResponses.push({
          status: response.status(),
          url,
          body: responseBody
        });
        console.log(`📥 NETWORK RESPONSE: ${response.status()} ${url}`);
        console.log(`   Body:`, JSON.stringify(responseBody, null, 2));
      } catch (e) {
        networkResponses.push({
          status: response.status(),
          url,
          body: 'Non-JSON response'
        });
        console.log(`📥 NETWORK RESPONSE: ${response.status()} ${url} (Non-JSON)`);
      }
    }
  });

  // Configurar autenticación
  await page.goto('http://localhost:5173');

  console.log('🔐 Setting up authentication...');
  await page.evaluate(({ token, userData }) => {
    localStorage.setItem('dhara-token', token);
    localStorage.setItem('dhara-user', JSON.stringify(userData));
    console.log('✅ Token and user data set in localStorage');
  }, { token: VALID_TOKEN, userData: THERAPIST_DATA });

  // Verificar localStorage
  const storageInfo = await page.evaluate(() => {
    return {
      dharaToken: !!localStorage.getItem('dhara-token'),
      dharaUser: !!localStorage.getItem('dhara-user'),
      allKeys: Object.keys(localStorage)
    };
  });

  console.log('🗄️ LocalStorage verification:', storageInfo);

  // Navegar al perfil profesional
  console.log('🚀 Navigating to professional profile...');
  await page.goto('http://localhost:5173/perfil-profesional');

  // Esperar a que la página cargue
  console.log('⏳ Waiting for page to load...');
  await page.waitForLoadState('networkidle');

  // Esperar tiempo adicional para que se ejecuten las APIs
  console.log('⏳ Waiting additional time for API calls...');
  await page.waitForTimeout(15000); // 15 segundos

  // Analizar los resultados
  console.log('\n📊 === ANALYSIS RESULTS ===');
  console.log(`📝 Total console logs captured: ${consoleLogs.length}`);
  console.log(`🌐 Network requests made: ${networkRequests.length}`);
  console.log(`📥 Network responses received: ${networkResponses.length}`);

  // Categorizar los logs
  const profileStatsLogs = consoleLogs.filter(log => log.includes('[PROFILE STATS]'));
  const bookingServiceLogs = consoleLogs.filter(log => log.includes('[BOOKING SERVICE]'));
  const paymentServiceLogs = consoleLogs.filter(log => log.includes('[PAYMENT SERVICE]'));
  const reviewServiceLogs = consoleLogs.filter(log => log.includes('[REVIEW SERVICE]'));
  const demoModeLogs = consoleLogs.filter(log => log.includes('[DEMO MODE]'));

  console.log('\n📋 === LOG BREAKDOWN ===');
  console.log(`🎯 Profile Stats logs: ${profileStatsLogs.length}`);
  console.log(`📅 Booking Service logs: ${bookingServiceLogs.length}`);
  console.log(`💰 Payment Service logs: ${paymentServiceLogs.length}`);
  console.log(`⭐ Review Service logs: ${reviewServiceLogs.length}`);
  console.log(`🎭 Demo Mode logs: ${demoModeLogs.length}`);

  // Mostrar todos los logs importantes
  console.log('\n📝 === DETAILED LOGS ===');
  consoleLogs.forEach((log, index) => {
    console.log(`${index + 1}. ${log}`);
  });

  // Mostrar requests de red
  console.log('\n🌐 === NETWORK REQUESTS ===');
  const statisticsRequests = networkRequests.filter(req =>
    req.url.includes('statistics') || req.url.includes('stats')
  );

  console.log(`📊 Statistics-related requests: ${statisticsRequests.length}`);
  statisticsRequests.forEach((req, index) => {
    console.log(`${index + 1}. ${req.method} ${req.url}`);
    console.log(`   Authorization: ${req.headers.authorization ? 'Present' : 'Missing'}`);
  });

  // Verificaciones
  console.log('\n✅ === VERIFICATIONS ===');

  // ¿Se inició el proceso de obtener estadísticas?
  const statsProcessStarted = profileStatsLogs.some(log =>
    log.includes('Starting profile statistics collection')
  );
  console.log(`📊 Statistics process started: ${statsProcessStarted ? 'YES' : 'NO'}`);

  // ¿Se llamaron los servicios individuales?
  const servicesCalledCount = [
    paymentServiceLogs.length > 0,
    bookingServiceLogs.length > 0,
    reviewServiceLogs.length > 0
  ].filter(Boolean).length;
  console.log(`🔧 Services called: ${servicesCalledCount}/3`);

  // ¿Se hicieron requests HTTP?
  const httpRequestsMade = statisticsRequests.length > 0;
  console.log(`🌐 HTTP requests made: ${httpRequestsMade ? 'YES' : 'NO'}`);

  // ¿DemoMode está interfiriendo?
  const demoModeInterference = demoModeLogs.some(log =>
    log.includes('Authentication error silenced')
  );
  console.log(`🎭 Demo Mode interference: ${demoModeInterference ? 'YES' : 'NO'}`);

  // Captura de pantalla para debug visual
  await page.screenshot({ path: 'debug-api-logs.png', fullPage: true });
  console.log('📸 Screenshot saved as debug-api-logs.png');

  // Verificar que al menos el proceso se inició
  if (!statsProcessStarted) {
    console.log('❌ CRITICAL: Statistics collection process never started!');
    console.log('   This suggests the component is not loading or the hook is not running.');
  }

  if (statsProcessStarted && servicesCalledCount === 0) {
    console.log('❌ CRITICAL: Stats process started but no services were called!');
    console.log('   This suggests there is an issue in the Promise.allSettled section.');
  }

  if (servicesCalledCount > 0 && !httpRequestsMade) {
    console.log('❌ CRITICAL: Services called but no HTTP requests made!');
    console.log('   This suggests there is an issue in the apiClient or interceptors.');
  }

  // El test pasa si al menos capturamos algunos logs
  expect(consoleLogs.length).toBeGreaterThan(0);
});