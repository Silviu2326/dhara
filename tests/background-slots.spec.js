import { test, expect } from '@playwright/test';

test('Test slots as cell backgrounds and appointments as events', async ({ page }) => {
  const consoleMessages = [];

  page.on('console', msg => {
    const text = msg.text();
    // Capture messages about availability backgrounds and appointment events
    if (text.includes('🟢 AVAILABILITY BACKGROUND') ||
        text.includes('📅 APPOINTMENT EVENTS') ||
        text.includes('📍 Availability slots in map') ||
        text.includes('👥 Appointment events') ||
        text.includes('Added availability slot') ||
        text.includes('Added appointment')) {
      consoleMessages.push(text);
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

  console.log('\n=== BACKGROUND AND EVENT PROCESSING ===');
  consoleMessages.forEach((msg, i) => {
    console.log(`${i + 1}. ${msg}`);
  });

  // Check for availability backgrounds (green-tinted cells)
  console.log('\nChecking for availability backgrounds...');

  // Look for cells with availability background colors
  const greenCells = await page.locator('.bg-green-50').count();
  const yellowCells = await page.locator('.bg-yellow-50').count();
  const blueCells = await page.locator('.bg-blue-50').count();

  console.log(`Green background cells (available): ${greenCells}`);
  console.log(`Yellow background cells (available): ${yellowCells}`);
  console.log(`Blue background cells (available): ${blueCells}`);

  const totalAvailableCells = greenCells + yellowCells + blueCells;
  console.log(`Total available cells: ${totalAvailableCells}`);

  // Check for appointment events (should be overlay elements)
  const appointmentEvents = await page.locator('[class*="bg-blue-600"], [class*="bg-deep"]').count();
  console.log(`Appointment events: ${appointmentEvents}`);

  // Check for availability indicators (small dots)
  const availabilityIndicators = await page.locator('.bg-green-400.opacity-60').count();
  console.log(`Availability indicators: ${availabilityIndicators}`);

  // Take screenshot
  await page.screenshot({ path: 'calendar-backgrounds.png', fullPage: true });
  console.log('📸 Screenshot saved as calendar-backgrounds.png');

  // Verify we have some visual indication of availability
  expect(totalAvailableCells + availabilityIndicators).toBeGreaterThan(0);

  console.log('✅ Background rendering test completed!');
});