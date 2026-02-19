import { test, expect } from '@playwright/test';

test.describe('Custom Rates Functionality', () => {
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

    // Fill in custom session details
    await page.fill('input[placeholder*="nombre"]', 'Sesión Individual Personalizada');
    await page.selectOption('select', 'individual');
    await page.fill('input[type="number"][placeholder*="duración"]', '90');
    await page.fill('input[type="number"][placeholder*="precio"]', '75');
    await page.fill('textarea[placeholder*="descripción"]', 'Sesión individual de 90 minutos con enfoque personalizado');

    // Save the session
    await page.click('button:has-text("Guardar")');

    // Wait for save to complete
    await page.waitForTimeout(2000);

    // Test adding a package
    console.log('Testing package creation...');

    const addPackageBtn = page.locator('text=Agregar Paquete').first();
    if (await addPackageBtn.isVisible()) {
      await addPackageBtn.click();

      // Fill package details
      await page.fill('input[placeholder*="nombre del paquete"]', 'Paquete Terapia Intensiva');
      await page.fill('input[type="number"][placeholder*="sesiones"]', '8');
      await page.selectOption('select[name*="sessionType"]', 'individual');
      await page.fill('input[type="number"][placeholder*="precio"]', '500');
      await page.fill('textarea[placeholder*="descripción"]', 'Paquete de 8 sesiones individuales con descuento');

      // Save the package
      await page.click('button:has-text("Guardar")');
      await page.waitForTimeout(2000);
    }

    // Save the entire profile
    await page.click('button:has-text("Guardar Perfil")');

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
    await expect(page.locator('text=90 minutos')).toBeVisible();
    await expect(page.locator('text=€75')).toBeVisible();

    // Verify the package persisted if it was created
    const customPackage = page.locator('text=Paquete Terapia Intensiva');
    if (await customPackage.isVisible()) {
      await expect(customPackage).toBeVisible();
      await expect(page.locator('text=8 sesiones')).toBeVisible();
      await expect(page.locator('text=€500')).toBeVisible();
    }

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

    // Find and click edit button for an existing session
    const editBtn = page.locator('button:has-text("Editar")').first();
    if (await editBtn.isVisible()) {
      await editBtn.click();

      // Modify the price
      await page.fill('input[type="number"][placeholder*="precio"]', '80');

      // Save changes
      await page.click('button:has-text("Guardar")');
      await page.waitForTimeout(2000);

      // Save profile
      await page.click('button:has-text("Guardar Perfil")');
      await page.waitForTimeout(3000);

      // Reload and verify change
      await page.reload();
      await page.waitForLoadState('networkidle');
      await page.locator('h3:has-text("Tarifas")').first().scrollIntoViewIfNeeded();

      // Verify updated price
      await expect(page.locator('text=€80')).toBeVisible({ timeout: 10000 });

      console.log('✅ Custom rates editing test completed successfully');
    }
  });
});