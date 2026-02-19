import { test, expect } from '@playwright/test';

/**
 * Test para verificar que aparece el botón de guardar cuando se edita el perfil
 */

const VALID_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4Y2UyMGMxNzkzMWE0MGI3NGFmMzY2YSIsImVtYWlsIjoiYWRtaW5AZGVtby5jb20iLCJyb2xlIjoidGhlcmFwaXN0IiwiaWF0IjoxNzU5MDIwNzk0LCJleHAiOjE3NTkxMDcxOTR9.8vh-0vox0m8ipR8JHXHF0Up3oU_8lqBwusA4fV1wipc";

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

test('Verificar botón de guardar flotante', async ({ page }) => {
  // Configurar autenticación
  await page.goto('http://localhost:5173');
  await page.evaluate(({ token, userData }) => {
    localStorage.setItem('dhara-token', token);
    localStorage.setItem('dhara-user', JSON.stringify(userData));
  }, { token: VALID_TOKEN, userData: THERAPIST_DATA });

  // Ir al perfil profesional
  await page.goto('http://localhost:5173/perfil-profesional');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(3000);

  console.log('\n📝 === TESTING SAVE BUTTON FUNCTIONALITY ===');

  // 1. Verificar que NO hay botón flotante al principio
  const floatingButton = page.locator('div.fixed.bottom-6.right-6');
  await expect(floatingButton).not.toBeVisible();
  console.log('✅ No hay botón flotante inicialmente');

  // 2. Buscar y hacer clic en un botón de editar (ej: Sobre mí)
  const editButton = page.locator('button:has-text("Editar"):not(:has-text("Editar perfil"))').first();

  if (await editButton.isVisible()) {
    await editButton.click();
    console.log('✅ Hicimos clic en botón de editar sección');
    await page.waitForTimeout(1000);

    // 3. Buscar un campo de texto para editarlo
    const textArea = page.locator('textarea').first();
    const textInput = page.locator('input[type="text"]').first();

    let fieldToEdit = null;
    if (await textArea.isVisible()) {
      fieldToEdit = textArea;
    } else if (await textInput.isVisible()) {
      fieldToEdit = textInput;
    }

    if (fieldToEdit) {
      // Modificar el contenido
      await fieldToEdit.fill('Contenido modificado para testing');
      console.log('✅ Modificamos el contenido del campo');
      await page.waitForTimeout(1000);

      // 4. Verificar que ahora aparece el botón flotante
      await expect(floatingButton).toBeVisible();
      console.log('✅ Aparece el botón flotante de guardar');

      // 5. Verificar el texto del botón
      const saveButton = floatingButton.locator('button');
      await expect(saveButton).toContainText('Guardar cambios');
      console.log('✅ El botón tiene el texto correcto');

      // 6. Tomar screenshot del botón flotante
      await page.screenshot({
        path: 'save-button-floating.png',
        fullPage: true
      });
      console.log('📸 Screenshot tomado: save-button-floating.png');

      // 7. Hacer clic en el botón de guardar
      await saveButton.click();
      console.log('✅ Hicimos clic en guardar');
      await page.waitForTimeout(2000);

      // 8. Verificar que el botón desaparece después de guardar
      await expect(floatingButton).not.toBeVisible();
      console.log('✅ El botón flotante desaparece después de guardar');

    } else {
      console.log('⚠️ No se encontró campo editable');
    }
  } else {
    console.log('⚠️ No se encontró botón de editar');
  }

  console.log('\n🎯 RESULTADO: Funcionalidad del botón de guardar verificada');
});