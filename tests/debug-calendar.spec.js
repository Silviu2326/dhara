import { test, expect } from '@playwright/test';

test('Debug calendar rendering step by step', async ({ page }) => {
  const consoleMessages = [];

  page.on('console', msg => {
    const text = msg.text();
    // Capture ALL console messages for debugging
    consoleMessages.push(`[${msg.type().toUpperCase()}] ${text}`);
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

  // Filter relevant console messages
  const relevantMessages = consoleMessages.filter(msg =>
    msg.includes('availabilitySlots') ||
    msg.includes('AvailabilityCalendar') ||
    msg.includes('transformSlots') ||
    msg.includes('COMBINING EVENTS') ||
    msg.includes('FINAL COMBINED') ||
    msg.includes('MockCalendarGrid') ||
    msg.includes('Added slot event') ||
    msg.includes('FORCE TEST EVENT')
  );

  console.log('\n=== RELEVANT DEBUG MESSAGES ===');
  relevantMessages.forEach((msg, i) => {
    console.log(`${i + 1}. ${msg}`);
  });

  console.log(`\nTotal console messages: ${consoleMessages.length}`);
  console.log(`Relevant messages: ${relevantMessages.length}`);

  // Check if we have critical logs
  const hasCalendarRendering = relevantMessages.some(msg =>
    msg.includes('AvailabilityCalendar RENDERED') ||
    msg.includes('MockCalendarGrid RECEIVED')
  );

  const hasDataTransformation = relevantMessages.some(msg =>
    msg.includes('COMBINING EVENTS') ||
    msg.includes('Added slot event')
  );

  console.log(`Calendar component rendered: ${hasCalendarRendering}`);
  console.log(`Data transformation executed: ${hasDataTransformation}`);

  expect(relevantMessages.length).toBeGreaterThan(0);
});