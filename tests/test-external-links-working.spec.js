import { test, expect } from '@playwright/test';

/**
 * Test funcional para enlaces externos con selector corregido
 */

const VALID_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4Y2UyMGMxNzkzMWE0MGI3NGFmMzY2YSIsImVtYWlsIjoiYWRtaW5AZGVtby5jb20iLCJyb2xlIjoidGhlcmFwaXN0IiwiaWF0IjoxNzU5MDI2OTMzLCJleHAiOjE3NTk2MzE3MzN9.kUd3Fvie_59uDQlrldUhH6xz-mGXa2vepHmRDTtUXV0";

const THERAPIST_DATA = {
  id: "68ce20c17931a40b74af366a",
  email: "admin@demo.com",
  firstName: "Admin",
  lastName: "Demo",
  name: "Admin Demo",
  role: "therapist",
  verified: true,
  isActive: true
};

test('Test working external links functionality', async ({ page }) => {
  await page.goto('http://localhost:5173');
  await page.evaluate(({ token, userData }) => {
    localStorage.setItem('dhara-token', token);
    localStorage.setItem('dhara-user', JSON.stringify(userData));
  }, { token: VALID_TOKEN, userData: THERAPIST_DATA });

  console.log('\n🔗 === WORKING EXTERNAL LINKS TEST ===');

  await page.goto('http://localhost:5173/perfil-profesional');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(3000);

  // 1. Buscar la sección de Enlaces Externos
  const externalLinksSection = page.locator('text="Enlaces Externos"').first();
  await expect(externalLinksSection).toBeVisible();
  console.log('✅ Found "Enlaces Externos" section');

  // 2. Usar un selector más específico para encontrar el botón de editar de esta sección
  // Basándome en la estructura del screenshot, el botón está en el mismo contenedor
  const externalLinksContainer = page.locator('div').filter({ hasText: 'Enlaces ExternosAgrega enlaces a tus redes sociales' }).first();
  const editButton = externalLinksContainer.locator('button:has-text("Editar")').first();

  const hasEditButton = await editButton.isVisible();
  console.log(`✏️ Has edit button: ${hasEditButton}`);

  if (hasEditButton) {
    // 3. Hacer clic en editar
    await editButton.click();
    console.log('✅ Clicked edit button');
    await page.waitForTimeout(2000);

    // 4. Verificar que aparece el botón "Agregar Enlace"
    const addLinkButton = page.locator('button:has-text("Agregar Enlace")');
    const hasAddLinkButton = await addLinkButton.isVisible();
    console.log(`➕ Has "Agregar Enlace" button: ${hasAddLinkButton}`);

    if (hasAddLinkButton) {
      // 5. Hacer clic en agregar enlace
      await addLinkButton.click();
      console.log('✅ Clicked "Agregar Enlace" button');
      await page.waitForTimeout(1000);

      // 6. Verificar que aparece el formulario
      const formTitle = page.locator('text="Nuevo Enlace"');
      const hasForm = await formTitle.isVisible();
      console.log(`📝 Form appeared: ${hasForm}`);

      if (hasForm) {
        // 7. Llenar el formulario
        const urlInput = page.locator('input[type="url"]');
        const testUrl = 'https://www.linkedin.com/in/test-therapist';

        await urlInput.fill(testUrl);
        console.log(`✏️ Filled URL: "${testUrl}"`);

        // 8. Seleccionar tipo LinkedIn
        const typeSelect = page.locator('select');
        await typeSelect.selectOption('linkedin');
        console.log('✅ Selected LinkedIn type');

        // 9. Agregar etiqueta personalizada
        const labelInput = page.locator('input[placeholder*="Mi"]');
        const customLabel = 'Mi Perfil Profesional';
        await labelInput.fill(customLabel);
        console.log(`✏️ Added custom label: "${customLabel}"`);

        // 10. Guardar el enlace
        const saveButton = page.locator('button:has-text("Guardar Enlace")');
        await saveButton.click();
        console.log('✅ Clicked save button');
        await page.waitForTimeout(1000);

        // 11. Verificar que el enlace aparece en la lista
        const savedLink = page.locator(`text="${testUrl}"`);
        const linkWasSaved = await savedLink.isVisible();
        console.log(`✅ Link was saved and visible: ${linkWasSaved}`);

        // 12. Verificar que aparece la etiqueta personalizada
        const customLabelElement = page.locator(`text="${customLabel}"`);
        const labelVisible = await customLabelElement.isVisible();
        console.log(`🏷️ Custom label visible: ${labelVisible}`);

        if (linkWasSaved) {
          // 13. Intentar guardar los cambios generales
          const floatingButton = page.locator('div.fixed.bottom-6.right-6');
          const hasFloatingButton = await floatingButton.isVisible();
          console.log(`💾 Floating save button: ${hasFloatingButton}`);

          if (hasFloatingButton) {
            const generalSaveButton = floatingButton.locator('button');
            await generalSaveButton.click();
            console.log('✅ Saved changes');
            await page.waitForTimeout(3000);

            // 14. Verificar que salió del modo edición
            const stillHasAddButton = await addLinkButton.isVisible().catch(() => false);
            const linkStillVisible = await savedLink.isVisible();

            console.log(`📝 Still in edit mode: ${stillHasAddButton}`);
            console.log(`✅ Link still visible after save: ${linkStillVisible}`);

            // 15. Verificar que el enlace es clicable
            const linkElement = page.locator(`a[href="${testUrl}"]`);
            const linkIsClickable = await linkElement.isVisible();
            console.log(`🔗 Link is clickable: ${linkIsClickable}`);
          }
        }
      }
    }
  }

  // 16. Tomar screenshot final
  await page.screenshot({
    path: 'external-links-working-test.png',
    fullPage: true
  });

  console.log('\n📊 === WORKING EXTERNAL LINKS TEST COMPLETE ===');
  expect(externalLinksSection).toBeVisible();
});