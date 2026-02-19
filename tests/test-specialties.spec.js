import { test, expect } from '@playwright/test';

/**
 * Test para verificar la funcionalidad de especialidades
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

test('Test specialties functionality', async ({ page }) => {
  // Configurar autenticación
  await page.goto('http://localhost:5173');
  await page.evaluate(({ token, userData }) => {
    localStorage.setItem('dhara-token', token);
    localStorage.setItem('dhara-user', JSON.stringify(userData));
  }, { token: VALID_TOKEN, userData: THERAPIST_DATA });

  console.log('\n🎯 === TESTING SPECIALTIES FUNCTIONALITY ===');

  // Ir al perfil profesional
  await page.goto('http://localhost:5173/perfil-profesional');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(3000);

  // 1. Buscar la sección de especialidades
  const specialtiesSection = page.locator('text="Especialidades"').first();
  await expect(specialtiesSection).toBeVisible();
  console.log('✅ Found "Especialidades" section');

  // 2. Verificar contenido actual
  const specialtiesContainer = page.locator('text="Especialidades"').locator('..');

  // Buscar si hay contenido o mensaje de "no hay especialidades"
  const noSpecialtiesMessage = page.locator('text="No hay especialidades definidas"');
  const hasNoSpecialties = await noSpecialtiesMessage.isVisible();

  console.log(`📋 Shows "No hay especialidades definidas": ${hasNoSpecialties}`);

  // 3. Buscar botón de editar
  const editButton = page.locator('text="Especialidades"').locator('..').locator('button:has-text("Editar")').first();
  const hasEditButton = await editButton.isVisible();

  console.log(`✏️ Has edit button: ${hasEditButton}`);

  if (hasEditButton) {
    // 4. Hacer clic en editar
    await editButton.click();
    console.log('✅ Clicked edit button');
    await page.waitForTimeout(2000);

    // 5. Buscar elementos de edición (inputs, selects, etc.)
    const inputs = await page.locator('input').all();
    const selects = await page.locator('select').all();
    const textareas = await page.locator('textarea').all();

    console.log(`🔍 Found after clicking edit:`);
    console.log(`  - Inputs: ${inputs.length}`);
    console.log(`  - Selects: ${selects.length}`);
    console.log(`  - Textareas: ${textareas.length}`);

    // 6. Buscar campos específicos de especialidades
    const specialtyInput = page.locator('input[placeholder*="especialidad"]');
    const hasSpecialtyInput = await specialtyInput.isVisible().catch(() => false);

    console.log(`📝 Has specialty input field: ${hasSpecialtyInput}`);

    if (hasSpecialtyInput) {
      // 7. Intentar agregar una especialidad
      const testSpecialty = "Terapia de Testing";
      await specialtyInput.fill(testSpecialty);
      console.log(`✏️ Filled specialty: "${testSpecialty}"`);
      await page.waitForTimeout(1000);

      // Buscar botón para agregar
      const addButton = page.locator('button:has-text("Agregar"), button:has-text("Añadir"), button:has-text("+")');
      const hasAddButton = await addButton.first().isVisible().catch(() => false);

      console.log(`➕ Has add button: ${hasAddButton}`);

      if (hasAddButton) {
        await addButton.first().click();
        console.log('✅ Clicked add button');
        await page.waitForTimeout(1000);

        // 8. Verificar si se agregó la especialidad
        const addedSpecialty = page.locator(`text="${testSpecialty}"`);
        const wasAdded = await addedSpecialty.isVisible().catch(() => false);

        console.log(`✅ Specialty was added to list: ${wasAdded}`);

        if (wasAdded) {
          // 9. Intentar guardar
          const floatingButton = page.locator('div.fixed.bottom-6.right-6');
          const hasFloatingButton = await floatingButton.isVisible();

          console.log(`💾 Floating save button appeared: ${hasFloatingButton}`);

          if (hasFloatingButton) {
            const saveButton = floatingButton.locator('button');
            await saveButton.click();
            console.log('✅ Clicked save button');
            await page.waitForTimeout(3000);

            // 10. Verificar que salió del modo edición y la especialidad persiste
            const stillInEditMode = await specialtyInput.isVisible().catch(() => false);
            const specialtyStillVisible = await addedSpecialty.isVisible().catch(() => false);

            console.log(`📝 Still in edit mode after save: ${stillInEditMode}`);
            console.log(`✅ Specialty still visible after save: ${specialtyStillVisible}`);
          }
        }
      }
    }
  }

  // 11. Tomar screenshot final
  await page.screenshot({
    path: 'specialties-test-result.png',
    fullPage: true
  });

  console.log('\n📊 === SPECIALTIES TEST SUMMARY ===');
  console.log('📸 Screenshot saved as: specialties-test-result.png');

  expect(specialtiesSection).toBeVisible();
});