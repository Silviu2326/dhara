import { test, expect } from '@playwright/test';

test('Test occupancy data processing', async ({ page }) => {
  let occupancyProcessingLogs = [];

  page.on('console', msg => {
    const text = msg.text();

    // Capture occupancy processing logs
    if (text.includes('🔍 Processing occupancy data:') ||
        text.includes('✅ Using API occupancy data directly') ||
        text.includes('✅ Using nested occupancy data') ||
        text.includes('✅ Generating occupancy from actual data') ||
        text.includes('Occupancy analysis response:') ||
        text.includes('📊 Loaded data:')) {
      occupancyProcessingLogs.push(text);
    }
  });

  // Login
  await page.goto('/');
  await page.fill('input[name="email"]', 'admin@demo.com');
  await page.fill('input[name="password"]', 'password123');
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL('/dashboard');

  // Navigate to availability
  await page.goto('/disponibilidad');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(5000);

  console.log('\n=== OCCUPANCY PROCESSING LOGS ===');
  occupancyProcessingLogs.forEach((log, i) => {
    console.log(`${i + 1}. ${log}`);
  });

  // Check if occupancy data is being processed
  const hasProcessingLog = occupancyProcessingLogs.some(log =>
    log.includes('🔍 Processing occupancy data:'));

  const hasApiDataUsage = occupancyProcessingLogs.some(log =>
    log.includes('✅ Using API occupancy data directly'));

  const hasNestedDataUsage = occupancyProcessingLogs.some(log =>
    log.includes('✅ Using nested occupancy data'));

  const hasGeneratedDataUsage = occupancyProcessingLogs.some(log =>
    log.includes('✅ Generating occupancy from actual data'));

  console.log('\n=== OCCUPANCY DATA PROCESSING STATUS ===');
  console.log(`Processing started: ${hasProcessingLog ? '✅' : '❌'}`);
  console.log(`Using API data directly: ${hasApiDataUsage ? '✅' : '❌'}`);
  console.log(`Using nested data: ${hasNestedDataUsage ? '✅' : '❌'}`);
  console.log(`Generating from actual data: ${hasGeneratedDataUsage ? '✅' : '❌'}`);

  // Look for the occupancy bar/summary on the page
  const occupancyElements = await page.locator('*:has-text("Ocupación"), *:has-text("ocupación")').count();
  const percentageElements = await page.locator('*:has-text("%")').count();

  console.log('\n=== OCCUPANCY UI ELEMENTS ===');
  console.log(`Elements with "Ocupación": ${occupancyElements}`);
  console.log(`Elements with "%": ${percentageElements}`);

  // Try to find specific occupancy values
  const pageContent = await page.locator('body').textContent();

  // Look for the specific values we know from API
  const has9_3_percent = pageContent.includes('9.3%') || pageContent.includes('9,3%');
  const has10_75_hours = pageContent.includes('10.75') || pageContent.includes('10,75');
  const has1_hour = pageContent.includes('1.0 h') || pageContent.includes('1,0 h') || pageContent.includes('1 h');

  console.log('\n=== EXPECTED API VALUES IN UI ===');
  console.log(`Contains 9.3% (expected occupancy): ${has9_3_percent ? '✅' : '❌'}`);
  console.log(`Contains 10.75h (expected available hours): ${has10_75_hours ? '✅' : '❌'}`);
  console.log(`Contains 1h (expected booked hours): ${has1_hour ? '✅' : '❌'}`);

  // Take screenshot
  await page.screenshot({ path: 'occupancy-processing.png', fullPage: true });
  console.log('📸 Screenshot saved as occupancy-processing.png');

  // Verify we have some occupancy processing
  expect(hasProcessingLog || hasApiDataUsage || hasNestedDataUsage || hasGeneratedDataUsage).toBe(true);

  console.log('\n✅ Occupancy processing test completed!');
});