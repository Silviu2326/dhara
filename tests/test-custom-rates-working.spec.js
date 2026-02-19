import { test, expect } from '@playwright/test';

test.describe('Custom Rates Functionality - Working Version', () => {
  test('should save and persist custom rates data', async ({ page }) => {
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

    // Find the rates section heading and scroll to it
    await page.locator('h3:has-text("Tarifas")').first().scrollIntoViewIfNeeded();

    // First, click the "Editar" button in the Tarifas section to enable editing mode
    console.log('Enabling editing mode for rates section...');
    const editButton = page.locator('button[title="Editar rates"]');
    await editButton.waitFor({ state: 'visible', timeout: 10000 });
    await editButton.click();

    // Wait for editing interface to load
    await page.waitForTimeout(1000);

    // Test adding a custom session
    console.log('Testing custom session creation...');

    // Look for "Agregar Sesión" button and click it
    const addSessionBtn = page.locator('text=Agregar Sesión').first();
    await addSessionBtn.waitFor({ state: 'visible', timeout: 10000 });
    await addSessionBtn.click();

    // Wait for form to open
    await page.waitForTimeout(1000);

    // Fill in custom session details using label-based selectors
    console.log('Filling session form...');

    // Select session type
    await page.selectOption('select', 'individual');

    // Fill name (look for input near "Nombre Personalizado" label)
    const nameInput = page.locator('input[type="text"]').nth(1); // Skip the search input
    await nameInput.fill('Sesión Individual Personalizada');

    // Fill duration (look for number input near "Duración" label)
    const durationInput = page.locator('input[type="number"]').first();
    await durationInput.fill('90');

    // Fill price (look for number input near "Precio" label)
    const priceInput = page.locator('input[type="number"]').nth(1);
    await priceInput.fill('75');

    // Fill description in textarea
    const descriptionTextarea = page.locator('textarea');
    await descriptionTextarea.fill('Sesión individual de 90 minutos con enfoque personalizado');

    // Save the session
    await page.click('button:has-text("Guardar")');

    // Wait for save to complete
    await page.waitForTimeout(2000);

    // Save the entire profile
    await page.click('button:has-text("Guardar cambios")');

    // Wait for save confirmation
    await page.waitForTimeout(3000);

    // Reload the page to test persistence
    console.log('Reloading page to test persistence...');
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Scroll to rates section again
    await page.locator('h3:has-text("Tarifas")').first().scrollIntoViewIfNeeded();

    // Verify the custom session persisted
    const customSession = page.locator('text=Sesión Individual Personalizada');
    await expect(customSession).toBeVisible({ timeout: 10000 });

    // Verify session details
    await expect(page.locator('text=90 min')).toBeVisible();
    await expect(page.locator('text=€75')).toBeVisible();

    console.log('✅ Custom rates data persistence test completed successfully');
  });

  test('should allow editing existing custom rates', async ({ page }) => {
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

    // First, enable editing mode for the rates section
    console.log('Enabling editing mode for rates section...');
    const editButton = page.locator('button[title="Editar rates"]');
    await editButton.waitFor({ state: 'visible', timeout: 10000 });
    await editButton.click();

    // Wait for editing interface to load
    await page.waitForTimeout(1000);

    // Find and click edit button for an existing session (the pencil icon)
    const sessionEditBtn = page.locator('.bg-white .p-2:has(.h-4.w-4)').first();
    if (await sessionEditBtn.isVisible()) {
      await sessionEditBtn.click();

      // Wait for edit mode
      await page.waitForTimeout(1000);

      // Modify the price
      const priceInput = page.locator('input[type="number"]').nth(1);
      await priceInput.fill('80');

      // Save changes
      await page.click('button:has-text("Guardar")');
      await page.waitForTimeout(2000);

      // Save profile
      await page.click('button:has-text("Guardar cambios")');
      await page.waitForTimeout(3000);

      // Reload and verify change
      await page.reload();
      await page.waitForLoadState('networkidle');
      await page.locator('h3:has-text("Tarifas")').first().scrollIntoViewIfNeeded();

      // Verify updated price
      await expect(page.locator('text=€80')).toBeVisible({ timeout: 10000 });

      console.log('✅ Custom rates editing test completed successfully');
    } else {
      console.log('ℹ️ No existing sessions to edit, skipping edit test');
    }
  });
});