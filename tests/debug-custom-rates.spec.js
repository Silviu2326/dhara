import { test, expect } from '@playwright/test';

test('Debug custom rates page', async ({ page }) => {
  // Navigate to login page
  await page.goto('http://localhost:5174/login');

  // Login with test credentials
  await page.fill('input[type="email"]', 'admin@demo.com');
  await page.fill('input[type="password"]', 'password123');
  await page.click('button[type="submit"]');

  // Wait for navigation to complete
  await page.waitForURL(/\/dashboard/);

  // Navigate to professional profile
  await page.goto('http://localhost:5174/perfil-profesional');

  // Wait for page to load
  await page.waitForLoadState('networkidle');

  // Take a screenshot to see what's on the page
  await page.screenshot({ path: 'debug-profile-page.png', fullPage: true });

  // Find the rates section heading and scroll to it
  await page.locator('h3:has-text("Tarifas")').first().scrollIntoViewIfNeeded();

  // Take another screenshot focused on the rates section
  await page.screenshot({ path: 'debug-rates-section.png' });

  // Log all buttons visible in the rates section
  const buttons = await page.locator('button').allTextContents();
  console.log('Buttons found on page:', buttons);

  // Log all text elements that contain "Agregar" or "Sesión"
  const agregar = await page.locator('text*=Agregar').allTextContents();
  console.log('Elements with "Agregar":', agregar);

  const sesion = await page.locator('text*=Sesión').allTextContents();
  console.log('Elements with "Sesión":', sesion);

  console.log('Debug complete - check screenshots');
});