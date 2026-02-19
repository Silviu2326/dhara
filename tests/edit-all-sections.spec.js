import { test, expect } from '@playwright/test';

/**
 * Test comprehensivo para editar todas las secciones del perfil profesional
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

test('Editar todas las secciones del perfil profesional', async ({ page }) => {
  // Capturar logs de errores
  const errors = [];
  const consoleMessages = [];

  page.on('console', msg => {
    const text = msg.text();
    consoleMessages.push(text);
    if (text.includes('Error')) {
      errors.push(text);
      console.log('❌ ERROR:', text);
    }
  });

  page.on('pageerror', error => {
    errors.push(error.message);
    console.log('❌ PAGE ERROR:', error.message);
  });

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

  console.log('\n🔧 === TESTING ALL PROFILE SECTIONS ===');

  const sectionsToTest = [
    {
      name: 'Sobre mí',
      selector: 'text="Sobre mí"',
      editSelector: 'textarea',
      testValue: 'Nueva descripción profesional actualizada'
    },
    {
      name: 'Especialidades',
      selector: 'text="Especialidades"',
      editSelector: 'input[placeholder*="especialidad"]',
      testValue: 'Terapia de Testing'
    },
    {
      name: 'Tarifas',
      selector: 'text="Tarifas"',
      editSelector: 'input[type="number"]',
      testValue: '75'
    },
    {
      name: 'Experiencia',
      selector: 'text="Experiencia Profesional"',
      editSelector: 'input[type="text"]',
      testValue: 'Nueva experiencia añadida'
    }
  ];

  for (const section of sectionsToTest) {
    console.log(`\n📝 Testing section: ${section.name}`);

    try {
      // 1. Buscar la sección
      const sectionElement = page.locator(section.selector).first();
      if (await sectionElement.isVisible()) {
        console.log(`✅ Found section: ${section.name}`);

        // 2. Buscar botón de editar cerca de la sección
        const editButton = page.locator(`text="${section.name}"`).locator('..').locator('button:has-text("Editar")').first();

        if (await editButton.isVisible()) {
          await editButton.click();
          console.log(`✅ Clicked edit button for ${section.name}`);
          await page.waitForTimeout(1000);

          // 3. Buscar campo editable
          const editField = page.locator(section.editSelector).first();

          if (await editField.isVisible()) {
            // Limpiar y escribir nuevo valor
            await editField.clear();
            await editField.fill(section.testValue);
            console.log(`✅ Modified field in ${section.name}: "${section.testValue}"`);
            await page.waitForTimeout(500);

            // 4. Verificar que aparece el botón flotante
            const floatingButton = page.locator('div.fixed.bottom-6.right-6');
            if (await floatingButton.isVisible()) {
              console.log(`✅ Floating save button appeared for ${section.name}`);

              // 5. Intentar guardar
              const saveButton = floatingButton.locator('button');
              await saveButton.click();
              console.log(`✅ Clicked save button for ${section.name}`);

              // Esperar a que termine el guardado
              await page.waitForTimeout(3000);

              // Verificar si hay errores en los logs
              const sectionErrors = errors.filter(error =>
                error.includes('Error saving profile') ||
                error.includes('Profile validation failed')
              );

              if (sectionErrors.length > 0) {
                console.log(`❌ Save failed for ${section.name}:`, sectionErrors);
              } else {
                console.log(`✅ Save succeeded for ${section.name}`);
              }

            } else {
              console.log(`⚠️ No floating button appeared for ${section.name}`);
            }
          } else {
            console.log(`⚠️ No editable field found for ${section.name} with selector: ${section.editSelector}`);
          }
        } else {
          console.log(`⚠️ No edit button found for ${section.name}`);
        }
      } else {
        console.log(`⚠️ Section not found: ${section.name}`);
      }
    } catch (error) {
      console.log(`❌ Error testing ${section.name}:`, error.message);
    }
  }

  // Capturar screenshot final
  await page.screenshot({
    path: 'profile-sections-test.png',
    fullPage: true
  });

  console.log('\n📊 === TEST SUMMARY ===');
  console.log(`Total errors captured: ${errors.length}`);
  console.log(`Console messages: ${consoleMessages.length}`);

  if (errors.length > 0) {
    console.log('\n❌ ERRORS FOUND:');
    errors.forEach((error, index) => {
      console.log(`${index + 1}. ${error}`);
    });
  }

  // Buscar errores específicos de validación
  const validationErrors = errors.filter(error =>
    error.includes('Profile validation failed') ||
    error.includes('validateProfileData')
  );

  if (validationErrors.length > 0) {
    console.log('\n🔍 VALIDATION ERRORS DETECTED:');
    validationErrors.forEach(error => console.log(error));
  }

  console.log('\n🎯 Test completed - check logs for validation issues');
});