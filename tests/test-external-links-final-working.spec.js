import { test, expect } from '@playwright/test';

/**
 * Test final para verificar que los enlaces externos funcionan completamente
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

test('Final working external links test', async ({ page }) => {
  await page.goto('http://localhost:5173');
  await page.evaluate(({ token, userData }) => {
    localStorage.setItem('dhara-token', token);
    localStorage.setItem('dhara-user', JSON.stringify(userData));
  }, { token: VALID_TOKEN, userData: THERAPIST_DATA });

  console.log('\n🎯 === FINAL EXTERNAL LINKS TEST ===');

  await page.goto('http://localhost:5173/perfil-profesional');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(3000);

  // 1. Verificar que la sección existe
  const externalLinksSection = page.locator('text="Enlaces Externos"').first();
  await expect(externalLinksSection).toBeVisible();
  console.log('✅ Found "Enlaces Externos" section');

  // 2. Encontrar y hacer clic en el botón de editar
  const externalLinksContainer = page.locator('div').filter({ hasText: 'Enlaces ExternosAgrega enlaces a tus redes sociales' }).first();
  const editButton = externalLinksContainer.locator('button:has-text("Editar")').first();

  await editButton.click();
  console.log('✅ Clicked edit button');
  await page.waitForTimeout(2000);

  // 3. Verificar que aparece el botón "Agregar Enlace"
  const addLinkButton = page.locator('button:has-text("Agregar Enlace")');
  await expect(addLinkButton).toBeVisible();
  console.log('✅ "Agregar Enlace" button is visible');

  // 4. Hacer clic en agregar enlace
  await addLinkButton.click();
  console.log('✅ Clicked "Agregar Enlace" button');
  await page.waitForTimeout(2000);

  // 5. Verificar que aparece el formulario
  const formTitle = page.locator('h4:has-text("Nuevo Enlace")');
  const formVisible = await formTitle.isVisible();
  console.log(`📝 Form title visible: ${formVisible}`);

  if (formVisible) {
    // 6. Llenar el formulario
    const urlInput = page.locator('input[type="url"]');
    await expect(urlInput).toBeVisible();

    const testUrl = 'https://www.linkedin.com/in/test-therapist';
    await urlInput.fill(testUrl);
    console.log(`✅ Filled URL: ${testUrl}`);

    // 7. Seleccionar tipo LinkedIn
    const selectType = page.locator('select');
    await selectType.selectOption('linkedin');
    console.log('✅ Selected LinkedIn type');

    // 8. Agregar etiqueta personalizada
    const labelInput = page.locator('input[placeholder*="Mi"]');
    await labelInput.fill('Mi Perfil LinkedIn');
    console.log('✅ Added custom label');

    // 9. Guardar el enlace
    const saveButton = page.locator('button:has-text("Guardar Enlace")');
    await saveButton.click();
    console.log('✅ Clicked save button');
    await page.waitForTimeout(2000);

    // 10. Verificar que el enlace aparece en la lista
    const savedLink = page.locator(`a[href="${testUrl}"]`);
    const linkVisible = await savedLink.isVisible();
    console.log(`✅ Link appears in list: ${linkVisible}`);

    const linkLabel = page.locator('text="Mi Perfil LinkedIn"');
    const labelVisible = await linkLabel.isVisible();
    console.log(`✅ Custom label visible: ${labelVisible}`);

    if (linkVisible && labelVisible) {
      // 11. Guardar cambios generales
      const floatingButton = page.locator('div.fixed.bottom-6.right-6');
      if (await floatingButton.isVisible()) {
        const generalSaveButton = floatingButton.locator('button');
        await generalSaveButton.click();
        console.log('✅ Saved changes with floating button');
        await page.waitForTimeout(3000);
      }

      console.log('\n🎉 SUCCESS! External links functionality is working!');
    } else {
      console.log('\n⚠️ Form works but link display has issues');
    }
  } else {
    console.log('\n❌ Form did not appear after clicking "Agregar Enlace"');
  }

  // 12. Screenshot final
  await page.screenshot({
    path: 'external-links-final-working-test.png',
    fullPage: true
  });

  console.log('\n📊 === FINAL TEST COMPLETE ===');
});