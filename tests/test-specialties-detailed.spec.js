import { test, expect } from '@playwright/test';

/**
 * Test detallado para especialidades
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

test('Test specialties detailed', async ({ page }) => {
  await page.goto('http://localhost:5173');
  await page.evaluate(({ token, userData }) => {
    localStorage.setItem('dhara-token', token);
    localStorage.setItem('dhara-user', JSON.stringify(userData));
  }, { token: VALID_TOKEN, userData: THERAPIST_DATA });

  console.log('\n🔍 === DETAILED SPECIALTIES TEST ===');

  await page.goto('http://localhost:5173/perfil-profesional');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(3000);

  // 1. Buscar específicamente la sección de terapias (no especialidades)
  const therapiesSection = page.locator('text="Especialidades y Terapias"').first();
  await expect(therapiesSection).toBeVisible();
  console.log('✅ Found "Especialidades y Terapias" section');

  // 2. Buscar el botón de editar para la sección terapias
  const editButtonTherapies = page.locator('[data-testid="edit-therapies"], button:has-text("Editar")').filter({
    hasNot: page.locator('text="Sobre mí"')
  }).nth(1); // El segundo botón editar (después de "Sobre mí")

  const hasEditButton = await editButtonTherapies.isVisible();
  console.log(`✏️ Has therapies edit button: ${hasEditButton}`);

  if (hasEditButton) {
    await editButtonTherapies.click();
    console.log('✅ Clicked therapies edit button');
    await page.waitForTimeout(2000);

    // 3. Buscar específicamente el botón "Añadir especialidad"
    const addSpecialtyButton = page.locator('button:has-text("Añadir especialidad")');
    const hasAddButton = await addSpecialtyButton.isVisible();

    console.log(`➕ Has "Añadir especialidad" button: ${hasAddButton}`);

    if (hasAddButton) {
      await addSpecialtyButton.click();
      console.log('✅ Clicked "Añadir especialidad" button');
      await page.waitForTimeout(1000);

      // 4. Buscar el campo de búsqueda que debe aparecer
      const searchInput = page.locator('input[placeholder*="Buscar o escribir"]');
      const hasSearchInput = await searchInput.isVisible();

      console.log(`🔍 Search input appeared: ${hasSearchInput}`);

      if (hasSearchInput) {
        // 5. Escribir una especialidad personalizada
        const testSpecialty = "Terapia de Testing Automatizado";
        await searchInput.fill(testSpecialty);
        console.log(`✏️ Typed specialty: "${testSpecialty}"`);
        await page.waitForTimeout(1000);

        // 6. Buscar el botón para añadir la especialidad personalizada
        const addCustomButton = page.locator(`button:has-text("Añadir"), button:has-text("${testSpecialty}")`);
        const hasAddCustomButton = await addCustomButton.isVisible();

        console.log(`➕ Has add custom button: ${hasAddCustomButton}`);

        if (hasAddCustomButton) {
          await addCustomButton.first().click();
          console.log('✅ Added custom specialty');
          await page.waitForTimeout(1000);

          // 7. Verificar que la especialidad aparece en la lista
          const addedSpecialtyChip = page.locator(`text="${testSpecialty}"`);
          const wasAdded = await addedSpecialtyChip.isVisible();

          console.log(`✅ Specialty chip appeared: ${wasAdded}`);

          if (wasAdded) {
            // 8. Intentar guardar los cambios
            const floatingButton = page.locator('div.fixed.bottom-6.right-6');
            const hasFloatingButton = await floatingButton.isVisible();

            console.log(`💾 Floating save button: ${hasFloatingButton}`);

            if (hasFloatingButton) {
              const saveButton = floatingButton.locator('button');
              await saveButton.click();
              console.log('✅ Saved changes');
              await page.waitForTimeout(3000);

              // 9. Verificar que salió del modo edición
              const stillHasAddButton = await addSpecialtyButton.isVisible().catch(() => false);
              const specialtyStillVisible = await addedSpecialtyChip.isVisible();

              console.log(`📝 Still in edit mode: ${stillHasAddButton}`);
              console.log(`✅ Specialty still visible: ${specialtyStillVisible}`);
            }
          }
        } else {
          // Probar con Enter
          await searchInput.press('Enter');
          console.log('✅ Pressed Enter to add specialty');
          await page.waitForTimeout(1000);

          const addedSpecialtyChip = page.locator(`text="${testSpecialty}"`);
          const wasAdded = await addedSpecialtyChip.isVisible();
          console.log(`✅ Specialty added with Enter: ${wasAdded}`);
        }
      }
    }
  }

  // 10. Screenshot final
  await page.screenshot({
    path: 'specialties-detailed-test.png',
    fullPage: true
  });

  console.log('\n📊 === DETAILED TEST COMPLETE ===');
  expect(therapiesSection).toBeVisible();
});