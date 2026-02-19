import { test, expect } from '@playwright/test';

test('Debug add session flow', async ({ page }) => {
  // Navigate and login
  await page.goto('http://localhost:5174/login');
  await page.fill('input[type="email"]', 'admin@demo.com');
  await page.fill('input[type="password"]', 'password123');
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/dashboard/);

  // Navigate to professional profile
  await page.goto('http://localhost:5174/perfil-profesional');
  await page.waitForLoadState('networkidle');

  // Scroll to rates section
  await page.locator('h3:has-text("Tarifas")').first().scrollIntoViewIfNeeded();

  // Enable editing mode for rates section
  console.log('Enabling editing mode for rates section...');
  const editButton = page.locator('button[title="Editar rates"]');
  await editButton.waitFor({ state: 'visible', timeout: 10000 });
  await editButton.click();

  // Wait for editing interface to load
  await page.waitForTimeout(2000);

  // Take screenshot after enabling edit mode
  await page.screenshot({ path: 'debug-after-edit-mode.png', fullPage: true });

  // Click "Agregar Sesión"
  console.log('Clicking Agregar Sesión...');
  const addSessionBtn = page.locator('text=Agregar Sesión').first();
  await addSessionBtn.waitFor({ state: 'visible', timeout: 10000 });
  await addSessionBtn.click();

  // Wait for the form to open
  await page.waitForTimeout(2000);

  // Take screenshot after clicking Agregar Sesión
  await page.screenshot({ path: 'debug-after-add-session.png', fullPage: true });

  // Log all visible input elements
  const inputs = await page.locator('input').all();
  console.log(`Found ${inputs.length} input elements`);

  for (let i = 0; i < inputs.length; i++) {
    const input = inputs[i];
    const placeholder = await input.getAttribute('placeholder');
    const type = await input.getAttribute('type');
    const name = await input.getAttribute('name');
    console.log(`Input ${i}: type="${type}", placeholder="${placeholder}", name="${name}"`);
  }

  // Log all visible select elements
  const selects = await page.locator('select').all();
  console.log(`Found ${selects.length} select elements`);

  // Log all visible buttons
  const buttons = await page.locator('button').allTextContents();
  console.log('Buttons after adding session:', buttons);

  console.log('Debug complete - check screenshots');
});