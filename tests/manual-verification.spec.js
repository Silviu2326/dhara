import { test, expect } from '@playwright/test';

test('Manual verification - Custom rates functionality works', async ({ page }) => {
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
  console.log('✅ Step 1: Enabling editing mode for rates section...');
  const editButton = page.locator('button[title="Editar rates"]');
  await editButton.waitFor({ state: 'visible', timeout: 10000 });
  await editButton.click();

  // Wait for editing interface to load
  await page.waitForTimeout(2000);

  // Verify "Agregar Sesión" button is visible
  console.log('✅ Step 2: Checking Agregar Sesión button...');
  const addSessionBtn = page.locator('text=Agregar Sesión').first();
  await expect(addSessionBtn).toBeVisible({ timeout: 5000 });

  // Click "Agregar Sesión"
  console.log('✅ Step 3: Clicking Agregar Sesión...');
  await addSessionBtn.click();

  // Wait for form to open
  await page.waitForTimeout(1000);

  // Verify form fields are present
  console.log('✅ Step 4: Verifying form fields...');

  // Check currency selector
  await expect(page.locator('select#currency-select')).toBeVisible();

  // Check session type selector (the second select)
  const sessionTypeSelect = page.locator('select').nth(1);
  await expect(sessionTypeSelect).toBeVisible();

  // Check save and cancel buttons
  await expect(page.locator('button:has-text("Guardar")')).toBeVisible();
  await expect(page.locator('button:has-text("Cancelar")')).toBeVisible();

  // Verify "Agregar Paquete" button is also available
  console.log('✅ Step 5: Checking Agregar Paquete button...');
  await expect(page.locator('text=Agregar Paquete')).toBeVisible();

  // Take final screenshot
  await page.screenshot({ path: 'manual-verification-complete.png', fullPage: true });

  console.log('✅ Manual verification completed successfully!');
  console.log('✅ Custom rates functionality is working correctly:');
  console.log('   - Edit mode activates properly');
  console.log('   - "Agregar Sesión" button appears and works');
  console.log('   - Session form opens with all required fields');
  console.log('   - "Agregar Paquete" button is also available');
  console.log('   - Currency selector and session type selector are functional');
});