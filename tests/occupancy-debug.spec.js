import { test, expect } from '@playwright/test';

test('Debug occupancy structure', async ({ page }) => {
  const debugLogs = [];

  page.on('console', msg => {
    const text = msg.text();

    // Capture all debugging logs about occupancy structure
    if (text.includes('🔍') ||
        text.includes('📍') ||
        text.includes('✅ Using API occupancy data:') ||
        text.includes('Final apiOccupancyData:')) {
      debugLogs.push(text);
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
  await page.waitForTimeout(3000);

  console.log('\n=== OCCUPANCY STRUCTURE DEBUG ===');
  debugLogs.forEach((log, i) => {
    console.log(`${i + 1}. ${log}`);
  });

  console.log(`\nTotal debug logs captured: ${debugLogs.length}`);

  // Take screenshot
  await page.screenshot({ path: 'occupancy-debug.png', fullPage: true });
  console.log('📸 Screenshot saved as occupancy-debug.png');

  expect(debugLogs.length).toBeGreaterThan(0);
});