import { test, expect } from '@playwright/test';

/**
 * Test corregido para especialidades - buscando la sección correcta
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

test('Test corrected specialties functionality', async ({ page }) => {
  await page.goto('http://localhost:5173');
  await page.evaluate(({ token, userData }) => {
    localStorage.setItem('dhara-token', token);
    localStorage.setItem('dhara-user', JSON.stringify(userData));
  }, { token: VALID_TOKEN, userData: THERAPIST_DATA });

  console.log('\n🔧 === CORRECTED SPECIALTIES TEST ===');

  await page.goto('http://localhost:5173/perfil-profesional');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(3000);

  // 1. Buscar la sección "Especialidades" (no "Especialidades y Terapias")
  const specialtiesSection = page.locator('text="Especialidades"').first();
  await expect(specialtiesSection).toBeVisible();
  console.log('✅ Found "Especialidades" section');

  // 2. Buscar el botón de editar para especialidades
  const editButton = specialtiesSection.locator('..').locator('button:has-text("Editar")').first();
  const hasEditButton = await editButton.isVisible();
  console.log(`✏️ Has specialties edit button: ${hasEditButton}`);

  if (hasEditButton) {
    await editButton.click();
    console.log('✅ Clicked specialties edit button');
    await page.waitForTimeout(2000);

    // 3. Ahora debería aparecer "Especialidades y Terapias" en el componente TherapiesSelect
    const therapiesTitle = page.locator('text="Especialidades y Terapias"');
    const hasTherapiesTitle = await therapiesTitle.isVisible();
    console.log(`📋 TherapiesSelect title appeared: ${hasTherapiesTitle}`);

    // 4. Buscar el botón "Añadir especialidad"
    const addSpecialtyButton = page.locator('button:has-text("Añadir especialidad")');
    const hasAddButton = await addSpecialtyButton.isVisible();
    console.log(`➕ Has "Añadir especialidad" button: ${hasAddButton}`);

    if (hasAddButton) {
      await addSpecialtyButton.click();
      console.log('✅ Clicked "Añadir especialidad" button');
      await page.waitForTimeout(1000);

      // 5. Buscar el campo de búsqueda
      const searchInput = page.locator('input[placeholder*="Buscar o escribir"]');
      const hasSearchInput = await searchInput.isVisible();
      console.log(`🔍 Search input appeared: ${hasSearchInput}`);

      if (hasSearchInput) {
        // 6. Escribir una especialidad personalizada
        const testSpecialty = "Terapia de Testing Automatizado";
        await searchInput.fill(testSpecialty);
        console.log(`✏️ Typed specialty: "${testSpecialty}"`);
        await page.waitForTimeout(1000);

        // 7. Presionar Enter para añadir
        await searchInput.press('Enter');
        console.log('✅ Pressed Enter to add specialty');
        await page.waitForTimeout(1000);

        // 8. Verificar que la especialidad aparece como chip
        const addedSpecialtyChip = page.locator(`text="${testSpecialty}"`);
        const wasAdded = await addedSpecialtyChip.isVisible();
        console.log(`✅ Specialty chip appeared: ${wasAdded}`);

        if (wasAdded) {
          // 9. Intentar guardar los cambios
          const floatingButton = page.locator('div.fixed.bottom-6.right-6');
          const hasFloatingButton = await floatingButton.isVisible();
          console.log(`💾 Floating save button: ${hasFloatingButton}`);

          if (hasFloatingButton) {
            const saveButton = floatingButton.locator('button');
            await saveButton.click();
            console.log('✅ Saved changes');
            await page.waitForTimeout(3000);

            // 10. Verificar que salió del modo edición
            const stillHasAddButton = await addSpecialtyButton.isVisible().catch(() => false);
            const specialtyStillVisible = await addedSpecialtyChip.isVisible();

            console.log(`📝 Still in edit mode: ${stillHasAddButton}`);
            console.log(`✅ Specialty still visible: ${specialtyStillVisible}`);
          }
        }
      }
    } else {
      console.log('❌ "Añadir especialidad" button not found - investigating further...');

      // Debug: listar todos los botones visibles
      const allButtons = await page.locator('button').all();
      console.log(`🔍 Total buttons visible: ${allButtons.length}`);

      for (let i = 0; i < Math.min(allButtons.length, 10); i++) {
        const buttonText = await allButtons[i].textContent().catch(() => 'No text');
        console.log(`  Button ${i}: "${buttonText}"`);
      }
    }
  }

  // 11. Screenshot final
  await page.screenshot({
    path: 'specialties-corrected-test.png',
    fullPage: true
  });

  console.log('\n📊 === CORRECTED TEST COMPLETE ===');
  expect(specialtiesSection).toBeVisible();
});