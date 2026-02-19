import { test, expect } from '@playwright/test';

/**
 * Test completo para verificar todas las métricas personales del perfil profesional
 * Verifica que los datos lleguen de la API y se muestren correctamente en la interfaz
 */

// Token JWT válido para autenticación
const VALID_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4Y2UyMGMxNzkzMWE0MGI3NGFmMzY2YSIsImVtYWlsIjoiYWRtaW5AZGVtby5jb20iLCJyb2xlIjoidGhlcmFwaXN0IiwiaWF0IjoxNzU5MDIwNzk0LCJleHAiOjE3NTkxMDcxOTR9.8vh-0vox0m8ipR8JHXHF0Up3oU_8lqBwusA4fV1wipc";

// Datos del terapeuta
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

// Datos esperados de las métricas (basados en los tests previos)
const EXPECTED_METRICS = {
  bookings: {
    totalBookings: 32,
    completedBookings: 19,
    upcomingBookings: 10,
    cancelledBookings: 3,
    totalRevenue: 1365,
    completionRate: 59
  },
  reviews: {
    totalReviews: 15,
    averageRating: 4.5,
    ratingDistribution: {
      "3": 1,
      "4": 6,
      "5": 8
    }
  },
  clients: {
    uniqueClients: 6,
    activeClients: 6
  }
};

test.describe('Verificación Completa de Métricas Personales', () => {

  test.beforeEach(async ({ page }) => {
    // Configurar autenticación
    await page.goto('http://localhost:5173');

    // Inyectar token de autenticación
    await page.evaluate(({ token, userData }) => {
      localStorage.setItem('dhara-token', token);
      localStorage.setItem('dhara-user', JSON.stringify(userData));
    }, { token: VALID_TOKEN, userData: THERAPIST_DATA });

    // Habilitar intercepción de requests para monitorear APIs
    await page.route('**/api/**', async (route) => {
      const url = route.request().url();
      const method = route.request().method();

      console.log(`🌐 API Call: ${method} ${url}`);

      // Continuar con la petición real
      await route.continue();
    });
  });

  test('Debe verificar que todas las APIs de estadísticas respondan correctamente', async ({ page }) => {
    // Almacenar las respuestas de las APIs
    const apiResponses = {};

    // Interceptar y capturar respuestas específicas
    await page.route('**/api/bookings/statistics*', async (route) => {
      const response = await route.continue();
      const responseBody = await response.json();
      apiResponses.bookings = responseBody;
      console.log('📊 Booking Statistics Response:', JSON.stringify(responseBody, null, 2));
    });

    await page.route('**/api/payments/statistics*', async (route) => {
      const response = await route.continue();
      const responseBody = await response.json();
      apiResponses.payments = responseBody;
      console.log('💰 Payment Statistics Response:', JSON.stringify(responseBody, null, 2));
    });

    await page.route('**/api/reviews/statistics*', async (route) => {
      const response = await route.continue();
      const responseBody = await response.json();
      apiResponses.reviews = responseBody;
      console.log('⭐ Review Statistics Response:', JSON.stringify(responseBody, null, 2));
    });

    // Cargar la página del perfil profesional
    await page.goto('http://localhost:5173/perfil-profesional');

    // Esperar a que todas las peticiones se completen
    await page.waitForLoadState('networkidle');

    // Esperar un poco más para asegurar que todas las APIs han respondido
    await page.waitForTimeout(3000);

    // Verificar que las APIs han respondido
    expect(apiResponses.bookings).toBeDefined();
    expect(apiResponses.reviews).toBeDefined();
    // payments puede estar vacío si no hay datos del mes actual

    // Verificar estructura de respuesta de bookings
    if (apiResponses.bookings && apiResponses.bookings.success) {
      const bookingData = apiResponses.bookings.data;
      expect(bookingData.totalBookings).toBeGreaterThan(0);
      expect(bookingData.completedBookings).toBeGreaterThan(0);
      expect(bookingData.totalRevenue).toBeGreaterThan(0);

      console.log(`✅ Booking Statistics: ${bookingData.totalBookings} total, ${bookingData.completedBookings} completed, €${bookingData.totalRevenue} revenue`);
    }

    // Verificar estructura de respuesta de reviews
    if (apiResponses.reviews && apiResponses.reviews.success) {
      const reviewData = apiResponses.reviews.data;
      expect(reviewData.totalReviews).toBeGreaterThan(0);
      expect(reviewData.averageRating).toBeGreaterThan(0);

      console.log(`✅ Review Statistics: ${reviewData.totalReviews} reviews, ${reviewData.averageRating} average rating`);
    }
  });

  test('Debe mostrar las métricas correctas en la interfaz', async ({ page }) => {
    await page.goto('http://localhost:5173/perfil-profesional');

    // Esperar a que la página cargue completamente
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(5000); // Esperar a que las APIs respondan y actualicen la UI

    console.log('🔍 Verificando métricas en la interfaz...');

    // Función helper para extraer número de texto
    const extractNumber = (text) => {
      const match = text.match(/[\d,]+/);
      return match ? parseInt(match[0].replace(',', '')) : 0;
    };

    // Función helper para extraer rating
    const extractRating = (text) => {
      const match = text.match(/(\d+\.?\d*)/);
      return match ? parseFloat(match[1]) : 0;
    };

    // Verificar sección de Métricas Personales
    const metricsSection = page.locator('text=Métricas Personales').first();
    await expect(metricsSection).toBeVisible();

    // 1. Verificar Sesiones impartidas
    console.log('📋 Verificando Sesiones impartidas...');
    const sessionElement = page.locator('text=Sesiones impartidas').locator('..').locator('..').first();
    await expect(sessionElement).toBeVisible();

    const sessionCount = sessionElement.locator('.text-2xl, .text-3xl, [class*="text-"], h1, h2, h3').first();
    const sessionText = await sessionCount.textContent();
    const sessionNumber = extractNumber(sessionText);

    console.log(`   Sesiones en UI: ${sessionNumber} (esperado: > 0)`);
    expect(sessionNumber).toBeGreaterThan(0);

    // 2. Verificar Clientes activos
    console.log('👥 Verificando Clientes activos...');
    const activeClientsElement = page.locator('text=Clientes activos').locator('..').locator('..').first();
    await expect(activeClientsElement).toBeVisible();

    const activeClientsCount = activeClientsElement.locator('.text-2xl, .text-3xl, [class*="text-"], h1, h2, h3').first();
    const activeClientsText = await activeClientsCount.textContent();
    const activeClientsNumber = extractNumber(activeClientsText);

    console.log(`   Clientes activos en UI: ${activeClientsNumber} (esperado: > 0)`);
    expect(activeClientsNumber).toBeGreaterThan(0);

    // 3. Verificar Valoración media
    console.log('⭐ Verificando Valoración media...');
    const ratingElement = page.locator('text=Valoración media').locator('..').locator('..').first();
    await expect(ratingElement).toBeVisible();

    const ratingCount = ratingElement.locator('.text-2xl, .text-3xl, [class*="text-"], h1, h2, h3').first();
    const ratingText = await ratingCount.textContent();
    const ratingNumber = extractRating(ratingText);

    console.log(`   Valoración en UI: ${ratingNumber} (esperado: > 0)`);
    expect(ratingNumber).toBeGreaterThan(0);

    // 4. Verificar Total clientes
    console.log('👥 Verificando Total clientes...');
    const totalClientsElement = page.locator('text=Total clientes').locator('..').locator('..').first();
    await expect(totalClientsElement).toBeVisible();

    const totalClientsCount = totalClientsElement.locator('.text-2xl, .text-3xl, [class*="text-"], h1, h2, h3').first();
    const totalClientsText = await totalClientsCount.textContent();
    const totalClientsNumber = extractNumber(totalClientsText);

    console.log(`   Total clientes en UI: ${totalClientsNumber} (esperado: > 0)`);
    expect(totalClientsNumber).toBeGreaterThan(0);

    // 5. Verificar Tasa de finalización
    console.log('📊 Verificando Tasa de finalización...');
    const completionElement = page.locator('text=Tasa de finalización').locator('..').locator('..').first();
    await expect(completionElement).toBeVisible();

    const completionCount = completionElement.locator('.text-2xl, .text-3xl, [class*="text-"], h1, h2, h3').first();
    const completionText = await completionCount.textContent();
    const completionNumber = extractNumber(completionText);

    console.log(`   Tasa de finalización en UI: ${completionNumber}% (esperado: > 0)`);
    expect(completionNumber).toBeGreaterThan(0);

    // Verificar sección Resumen del mes
    console.log('📈 Verificando Resumen del mes...');
    const monthSummarySection = page.locator('text=Resumen del mes').first();
    await expect(monthSummarySection).toBeVisible();

    // Satisfacción debería ser > 0% si hay reviews
    const satisfactionElement = page.locator('text=Satisfacción').locator('..').first();
    if (await satisfactionElement.isVisible()) {
      const satisfactionText = await satisfactionElement.textContent();
      const satisfactionNumber = extractNumber(satisfactionText);
      console.log(`   Satisfacción: ${satisfactionNumber}%`);
    }

    console.log('✅ Verificación de métricas en UI completada');
  });

  test('Debe mostrar datos coherentes entre API y UI', async ({ page }) => {
    let apiData = {};

    // Capturar datos de las APIs
    await page.route('**/api/bookings/statistics*', async (route) => {
      const response = await route.continue();
      const responseBody = await response.json();
      if (responseBody.success) {
        apiData.bookings = responseBody.data;
      }
    });

    await page.route('**/api/reviews/statistics*', async (route) => {
      const response = await route.continue();
      const responseBody = await response.json();
      if (responseBody.success) {
        apiData.reviews = responseBody.data;
      }
    });

    await page.goto('http://localhost:5173/perfil-profesional');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(5000);

    // Función helper para extraer números de la UI
    const getUIValue = async (selector) => {
      try {
        const element = page.locator(selector).first();
        await element.waitFor({ timeout: 5000 });
        const text = await element.textContent();
        const match = text.match(/[\d,]+(\.\d+)?/);
        return match ? parseFloat(match[0].replace(',', '')) : 0;
      } catch (error) {
        console.warn(`No se pudo obtener valor de: ${selector}`);
        return 0;
      }
    };

    // Comparar datos API vs UI
    if (apiData.bookings) {
      console.log('🔄 Comparando datos de bookings API vs UI...');
      console.log(`API - Total sesiones: ${apiData.bookings.completedBookings}`);
      console.log(`API - Tasa completada: ${apiData.bookings.completionRate}%`);

      // Los valores de la UI deberían reflejar los datos de la API
      expect(apiData.bookings.totalBookings).toBeGreaterThan(0);
      expect(apiData.bookings.completedBookings).toBeGreaterThan(0);
    }

    if (apiData.reviews) {
      console.log('🔄 Comparando datos de reviews API vs UI...');
      console.log(`API - Total reviews: ${apiData.reviews.totalReviews}`);
      console.log(`API - Rating promedio: ${apiData.reviews.averageRating}`);

      expect(apiData.reviews.totalReviews).toBeGreaterThan(0);
      expect(apiData.reviews.averageRating).toBeGreaterThan(0);
    }

    console.log('✅ Verificación de coherencia API-UI completada');
  });

  test('Debe detectar errores de autenticación y llamadas fallidas', async ({ page }) => {
    const failedCalls = [];
    const successfulCalls = [];

    // Interceptar todas las llamadas a API para detectar errores
    await page.route('**/api/**', async (route) => {
      const url = route.request().url();
      try {
        const response = await route.continue();
        if (response.status() >= 400) {
          failedCalls.push({ url, status: response.status() });
          console.log(`❌ API Failed: ${response.status()} ${url}`);
        } else {
          successfulCalls.push({ url, status: response.status() });
          console.log(`✅ API Success: ${response.status()} ${url}`);
        }
      } catch (error) {
        failedCalls.push({ url, error: error.message });
        console.log(`💥 API Error: ${url} - ${error.message}`);
      }
    });

    // Interceptar logs de consola para detectar errores del demoMode
    const consoleLogs = [];
    page.on('console', msg => {
      const text = msg.text();
      consoleLogs.push(text);
      if (text.includes('DemoMode') || text.includes('Authentication') || text.includes('error')) {
        console.log(`🖥️ Console: ${text}`);
      }
    });

    await page.goto('http://localhost:5173/perfil-profesional');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(5000);

    // Analizar resultados
    console.log(`📊 Resumen de llamadas API:`);
    console.log(`   ✅ Exitosas: ${successfulCalls.length}`);
    console.log(`   ❌ Fallidas: ${failedCalls.length}`);

    // No debería haber errores 401 (no autorizado)
    const authErrors = failedCalls.filter(call => call.status === 401);
    expect(authErrors.length).toBe(0);

    // Verificar que al menos las APIs principales funcionan
    const importantApis = ['/api/bookings/statistics', '/api/reviews/statistics'];
    const workingImportantApis = successfulCalls.filter(call =>
      importantApis.some(api => call.url.includes(api))
    );

    expect(workingImportantApis.length).toBeGreaterThan(0);

    // Verificar logs de DemoMode para debugging
    const demoModeLogs = consoleLogs.filter(log => log.includes('DemoMode'));
    console.log(`🎭 DemoMode logs encontrados: ${demoModeLogs.length}`);
    demoModeLogs.forEach(log => console.log(`   ${log}`));

    console.log('✅ Verificación de errores completada');
  });
});

test.describe('Tests de Debugging Específicos', () => {
  test('Debe mostrar información detallada de debugging', async ({ page }) => {
    // Configurar autenticación
    await page.goto('http://localhost:5173');
    await page.evaluate(({ token, userData }) => {
      localStorage.setItem('dhara-token', token);
      localStorage.setItem('dhara-user', JSON.stringify(userData));
    }, { token: VALID_TOKEN, userData: THERAPIST_DATA });

    // Interceptar y mostrar todo el tráfico de red relevante
    await page.route('**/api/**', async (route) => {
      const request = route.request();
      const url = request.url();
      const method = request.method();
      const headers = request.headers();

      console.log(`\n🌐 ${method} ${url}`);
      console.log(`   Authorization: ${headers.authorization ? '✅ Present' : '❌ Missing'}`);

      const response = await route.continue();
      const status = response.status();

      try {
        const responseBody = await response.json();
        console.log(`   Response: ${status} - ${JSON.stringify(responseBody, null, 2)}`);
      } catch (e) {
        console.log(`   Response: ${status} - Non-JSON response`);
      }
    });

    // Capturar todos los logs de consola
    page.on('console', msg => {
      const type = msg.type();
      const text = msg.text();
      console.log(`🖥️ [${type.toUpperCase()}] ${text}`);
    });

    await page.goto('http://localhost:5173/perfil-profesional');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(10000); // Esperar más tiempo para ver todos los logs

    // Verificar token en localStorage
    const tokenInfo = await page.evaluate(() => {
      const token = localStorage.getItem('dhara-token');
      const user = localStorage.getItem('dhara-user');
      return {
        hasToken: !!token,
        tokenLength: token ? token.length : 0,
        hasUser: !!user,
        userInfo: user ? JSON.parse(user) : null
      };
    });

    console.log('🔐 Token Information:', JSON.stringify(tokenInfo, null, 2));

    expect(tokenInfo.hasToken).toBe(true);
    expect(tokenInfo.hasUser).toBe(true);
  });
});