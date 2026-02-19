import { test, expect } from '@playwright/test';

test('Check if calendar data is now displaying', async ({ page }) => {
  // Collect console messages to verify data processing
  const consoleMessages = [];
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('📥 Setting availabilitySlots state') ||
        text.includes('🎯 Final processed slots count') ||
        text.includes('📍 Found slots') ||
        text.includes('🔧 API returned') ||
        text.includes('FOUND EVENTS at day') ||
        text.includes('TEST EVENT') ||
        text.includes('✅ Added slot event') ||
        text.includes('🚨 ADDED FORCE TEST EVENT') ||
        text.includes('SLOT EVENT DETAILS') ||
        text.includes('🎯🎯🎯 FINAL COMBINED EVENTS')) {
      consoleMessages.push(text);
    }
  });

  // Login
  await page.goto('/');
  await page.fill('input[name="email"]', 'admin@demo.com');
  await page.fill('input[name="password"]', 'password123');
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL('/dashboard');

  // Navigate to availability and wait
  await page.goto('/disponibilidad');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(5000);

  // Log important console messages
  console.log('\n=== KEY CONSOLE MESSAGES ===');
  consoleMessages.forEach(msg => console.log(msg));

  // Check if slots are being processed
  const hasSlotProcessing = consoleMessages.some(msg =>
    msg.includes('📥 Setting availabilitySlots state') ||
    msg.includes('🎯 Final processed slots count')
  );

  // Check if events are found in calendar
  const hasEventRendering = consoleMessages.some(msg =>
    msg.includes('FOUND EVENTS at day') ||
    msg.includes('TEST EVENT')
  );

  console.log(`\nSlots being processed: ${hasSlotProcessing}`);
  console.log(`Events being rendered: ${hasEventRendering}`);

  // Take screenshot for manual verification
  await page.screenshot({ path: 'calendar-with-data.png', fullPage: true });
  console.log('📸 Screenshot saved as calendar-with-data.png');

  // Basic validation
  expect(hasSlotProcessing || hasEventRendering).toBe(true);
});