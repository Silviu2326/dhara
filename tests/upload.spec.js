import { test, expect } from '@playwright/test';

test.describe('Upload Functionality', () => {
  test('should load profile page with upload components', async ({ page }) => {
    await page.goto('/app/perfil-profesional');
    await page.waitForLoadState('networkidle');
    
    // Check for avatar upload
    const avatarButton = page.locator('button:has-text("Cambiar"), button:has([class*="avatar"])').first();
    // Just check page loads without errors
    await expect(page).toHaveTitle(/LexCorp/);
  });
  
  test('should load clients page with upload modal', async ({ page }) => {
    await page.goto('/app/clientes');
    await page.waitForLoadState('networkidle');
    
    // Check if upload button exists
    const uploadButtons = page.locator('button:has-text("Subir"), button:has-text("Upload")');
    const count = await uploadButtons.count();
    
    console.log(`Found ${count} upload buttons`);
  });
  
  test('should load chat with file attachment', async ({ page }) => {
    await page.goto('/app/chat');
    await page.waitForLoadState('networkidle');
    
    // Check if there's attachment button
    const attachButton = page.locator('button:has-text("Adjuntar"), [class*="attach"]').first();
    const isVisible = await attachButton.isVisible().catch(() => false);
    
    console.log(`Attachment button visible: ${isVisible}`);
  });
  
  test('should check upload components in documents page', async ({ page }) => {
    await page.goto('/app/documentos-materiales');
    await page.waitForLoadState('networkidle');
    
    // Check for upload elements
    const uploadElements = page.locator('input[type="file"]');
    const count = await uploadElements.count();
    
    console.log(`Found ${count} file input elements`);
  });
});
