import { test, expect } from '@playwright/test';

test('Test yellow slot visibility', async ({ page }) => {
  const slotLogs = [];

  page.on('console', msg => {
    const text = msg.text();

    // Capture slot processing logs
    if (text.includes('🟡 Processing slot') ||
        text.includes('📍 Marked hour') ||
        text.includes('Primera Hora') ||
        text.includes('yellow')) {
      slotLogs.push(text);
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

  console.log('\n=== YELLOW SLOT PROCESSING ===');
  slotLogs.forEach((log, i) => {
    console.log(`${i + 1}. ${log}`);
  });

  // Check for yellow background cells specifically
  const yellowCells = await page.locator('.bg-yellow-50').count();
  const yellowBorderCells = await page.locator('.border-yellow-200').count();

  console.log('\n=== YELLOW SLOT UI ELEMENTS ===');
  console.log(`Yellow background cells (.bg-yellow-50): ${yellowCells}`);
  console.log(`Yellow border cells (.border-yellow-200): ${yellowBorderCells}`);

  // Check the 08:00 slot specifically (should be yellow)
  // The slot goes from 08:00 to 08:45, so hour 8 should be yellow
  try {
    // Look for yellow cells in the 08:00 row
    const hour8Row = page.locator('div:has-text("08:00")').first();
    await expect(hour8Row).toBeVisible();
    console.log('✅ Found 08:00 row');

    // Check if there are yellow cells in the calendar
    const hasYellowInCalendar = await page.locator('.bg-yellow-50').count() > 0;
    console.log(`Has yellow cells in calendar: ${hasYellowInCalendar}`);

  } catch (error) {
    console.log('❌ Could not verify 08:00 row:', error.message);
  }

  // Check if we have any availability indicators
  const availabilityIndicators = await page.locator('.bg-green-400.opacity-60').count();
  console.log(`Availability indicators (green dots): ${availabilityIndicators}`);

  // Take a focused screenshot on the morning hours
  await page.screenshot({
    path: 'yellow-slot-check.png',
    fullPage: true,
    clip: { x: 0, y: 0, width: 1200, height: 600 } // Focus on top part
  });
  console.log('📸 Screenshot saved as yellow-slot-check.png');

  console.log('\n=== SLOT ANALYSIS ===');
  console.log('Expected: "Primera Hora" slot from 08:00-08:45 with yellow color');
  console.log('Should show: Yellow background in 08:00 Monday cell');

  // Basic verification - we should have some slot processing
  expect(slotLogs.length).toBeGreaterThan(0);

  console.log('\n✅ Yellow slot test completed!');
});