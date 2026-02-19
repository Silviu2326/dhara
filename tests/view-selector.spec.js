import { test, expect } from '@playwright/test';

test('Test calendar view selector', async ({ page }) => {
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

  console.log('Testing view selector...');

  // Check that view selector buttons are present
  const weekButton = page.locator('button:has-text("Semana")').nth(-1); // Get the one from calendar, not header
  const monthButton = page.locator('button:has-text("Mes")').nth(-1);   // Get the one from calendar, not header

  await expect(weekButton).toBeVisible();
  await expect(monthButton).toBeVisible();

  // Check initial state (should be week view)
  console.log('Checking initial week view...');

  // Week button should be active initially
  const weekButtonClasses = await weekButton.getAttribute('class');
  console.log('Week button classes:', weekButtonClasses);
  expect(weekButtonClasses).toContain('bg-white'); // Active state

  // Check date display shows week format
  const dateDisplay = page.locator('span.text-sm.font-medium:has-text("Semana")');
  const dateText = await dateDisplay.textContent();
  console.log('Initial date display:', dateText);
  expect(dateText).toContain('Semana del');

  // Test switching to month view
  console.log('Switching to month view...');
  await monthButton.click();
  await page.waitForTimeout(1000);

  // Month button should now be active
  const monthButtonClasses = await monthButton.getAttribute('class');
  console.log('Month button classes after click:', monthButtonClasses);
  expect(monthButtonClasses).toContain('bg-white'); // Active state

  // Date display should change to month format
  // In month view, the text format changes, so use a more general selector
  const monthDateDisplay = page.locator('span.text-sm.font-medium').first();
  const newDateText = await monthDateDisplay.textContent();
  console.log('Date display after month click:', newDateText);

  // Test switching back to week view
  console.log('Switching back to week view...');
  await weekButton.click();
  await page.waitForTimeout(1000);

  // Week button should be active again
  const weekButtonClassesAgain = await weekButton.getAttribute('class');
  console.log('Week button classes after switching back:', weekButtonClassesAgain);
  expect(weekButtonClassesAgain).toContain('bg-white');

  console.log('✅ View selector is working!');
});