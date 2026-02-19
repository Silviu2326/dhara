import { test, expect } from '@playwright/test';

/**
 * Test para verificar la funcionalidad de enlaces externos
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

test('Test external links functionality', async ({ page }) => {
  await page.goto('http://localhost:5173');
  await page.evaluate(({ token, userData }) => {
    localStorage.setItem('dhara-token', token);
    localStorage.setItem('dhara-user', JSON.stringify(userData));
  }, { token: VALID_TOKEN, userData: THERAPIST_DATA });

  console.log('\n🔗 === EXTERNAL LINKS TEST ===');

  await page.goto('http://localhost:5173/perfil-profesional');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(3000);

  // 1. Buscar la sección de Enlaces Externos
  const externalLinksSection = page.locator('text="Enlaces Externos"').first();
  await expect(externalLinksSection).toBeVisible();
  console.log('✅ Found "Enlaces Externos" section');

  // 2. Verificar el estado inicial
  const noLinksMessage = page.locator('text="No hay enlaces configurados"');
  const hasNoLinksMessage = await noLinksMessage.isVisible();
  console.log(`📋 Shows "No hay enlaces configurados": ${hasNoLinksMessage}`);

  // 3. Buscar el botón de editar
  const editButton = externalLinksSection.locator('..').locator('button:has-text("Editar")').first();
  const hasEditButton = await editButton.isVisible();
  console.log(`✏️ Has edit button: ${hasEditButton}`);

  if (hasEditButton) {
    // 4. Entrar en modo edición
    await editButton.click();
    console.log('✅ Clicked edit button');
    await page.waitForTimeout(1000);

    // 5. Buscar el botón "Agregar Enlace"
    const addLinkButton = page.locator('button:has-text("Agregar Enlace")');
    const hasAddLinkButton = await addLinkButton.isVisible();
    console.log(`➕ Has "Agregar Enlace" button: ${hasAddLinkButton}`);

    if (hasAddLinkButton) {
      // 6. Hacer clic en agregar enlace
      await addLinkButton.click();
      console.log('✅ Clicked "Agregar Enlace" button');
      await page.waitForTimeout(1000);

      // 7. Verificar que aparece el formulario
      const formTitle = page.locator('text="Nuevo Enlace"');
      const hasForm = await formTitle.isVisible();
      console.log(`📝 Form appeared: ${hasForm}`);

      if (hasForm) {
        // 8. Llenar el formulario
        const urlInput = page.locator('input[type="url"]');
        const testUrl = 'https://www.linkedin.com/in/test-user';

        await urlInput.fill(testUrl);
        console.log(`✏️ Filled URL: "${testUrl}"`);

        // 9. Seleccionar tipo LinkedIn
        const typeSelect = page.locator('select');
        await typeSelect.selectOption('linkedin');
        console.log('✅ Selected LinkedIn type');

        // 10. Guardar el enlace
        const saveButton = page.locator('button:has-text("Guardar Enlace")');
        await saveButton.click();
        console.log('✅ Clicked save button');
        await page.waitForTimeout(1000);

        // 11. Verificar que el enlace aparece
        const savedLink = page.locator(`text="${testUrl}"`);
        const linkWasSaved = await savedLink.isVisible();
        console.log(`✅ Link was saved and visible: ${linkWasSaved}`);

        if (linkWasSaved) {
          // 12. Intentar guardar los cambios generales
          const floatingButton = page.locator('div.fixed.bottom-6.right-6');
          const hasFloatingButton = await floatingButton.isVisible();
          console.log(`💾 Floating save button: ${hasFloatingButton}`);

          if (hasFloatingButton) {
            const generalSaveButton = floatingButton.locator('button');
            await generalSaveButton.click();
            console.log('✅ Saved changes');
            await page.waitForTimeout(3000);

            // 13. Verificar que salió del modo edición
            const stillHasAddButton = await addLinkButton.isVisible().catch(() => false);
            const linkStillVisible = await savedLink.isVisible();

            console.log(`📝 Still in edit mode: ${stillHasAddButton}`);
            console.log(`✅ Link still visible: ${linkStillVisible}`);
          }
        }
      }
    }
  }

  // 14. Tomar screenshot final
  await page.screenshot({
    path: 'external-links-test.png',
    fullPage: true
  });

  console.log('\n📊 === EXTERNAL LINKS TEST COMPLETE ===');
  expect(externalLinksSection).toBeVisible();
});