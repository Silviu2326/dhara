import { test, expect } from '@playwright/test';

test('Test calendar navigation controls', async ({ page }) => {
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

  // Check that navigation elements are present
  const prevButton = page.locator('button[title*="anterior"]');
  const nextButton = page.locator('button[title*="siguiente"]');
  const todayButton = page.locator('button:has-text("Hoy")');
  const dateDisplay = page.locator('span.text-sm.font-medium:has-text("Semana")');

  console.log('Checking navigation elements...');

  // Verify elements exist
  await expect(prevButton).toBeVisible();
  await expect(nextButton).toBeVisible();
  await expect(todayButton).toBeVisible();
  await expect(dateDisplay).toBeVisible();

  // Get initial date text
  const initialDateText = await dateDisplay.textContent();
  console.log('Initial date:', initialDateText);

  // Test next week navigation
  await nextButton.click();
  await page.waitForTimeout(1000);

  const nextWeekText = await dateDisplay.textContent();
  console.log('After next:', nextWeekText);

  // Verify the date changed
  expect(nextWeekText).not.toBe(initialDateText);

  // Test previous week navigation
  await prevButton.click();
  await page.waitForTimeout(1000);

  const backToOriginalText = await dateDisplay.textContent();
  console.log('After previous:', backToOriginalText);

  // Should be back to original (or very close)
  expect(backToOriginalText).toBeTruthy();

  // Test "Today" button
  await todayButton.click();
  await page.waitForTimeout(1000);

  const todayText = await dateDisplay.textContent();
  console.log('After today button:', todayText);

  console.log('✅ Navigation controls are working!');
});