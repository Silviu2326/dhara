import { test, expect } from '@playwright/test';

test('Simple calendar data verification', async ({ page }) => {
  // Login
  await page.goto('/');
  await page.fill('input[name="email"]', 'admin@demo.com');
  await page.fill('input[name="password"]', 'password123');
  await page.click('button[type="submit"]');

  // Wait for dashboard
  await expect(page).toHaveURL('/dashboard');

  // Navigate to availability
  await page.goto('/disponibilidad');
  await page.waitForLoadState('networkidle');

  // Wait for calendar to load
  await page.waitForTimeout(3000);

  // Check for calendar elements
  const calendarExists = await page.locator('[class*="calendar"]').count() > 0;
  console.log('Calendar elements found:', calendarExists);

  // Check for specific calendar content
  const hasCalendarText = await page.locator('text=calendario').count() > 0;
  const hasDisponibilidadText = await page.locator('text=disponibilidad').count() > 0;

  console.log('Has calendar text:', hasCalendarText);
  console.log('Has disponibilidad text:', hasDisponibilidadText);

  // Basic assertions
  expect(calendarExists).toBe(true);
  expect(hasDisponibilidadText).toBe(true);
});