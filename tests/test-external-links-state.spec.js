import { test, expect } from '@playwright/test';

/**
 * Test para verificar el estado de isEditing y showAddForm
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

test('Debug external links state management', async ({ page }) => {
  await page.goto('http://localhost:5173');
  await page.evaluate(({ token, userData }) => {
    localStorage.setItem('dhara-token', token);
    localStorage.setItem('dhara-user', JSON.stringify(userData));
  }, { token: VALID_TOKEN, userData: THERAPIST_DATA });

  console.log('\n🔍 === DEBUGGING EXTERNAL LINKS STATE ===');

  await page.goto('http://localhost:5173/perfil-profesional');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(3000);

  // 1. Verificar estado inicial
  const addLinkButtonInitial = page.locator('button:has-text("Agregar Enlace")');
  const hasAddButtonInitial = await addLinkButtonInitial.isVisible();
  console.log(`📊 Initial state - "Agregar Enlace" button visible: ${hasAddButtonInitial}`);

  // 2. Encontrar y hacer clic en editar
  const externalLinksContainer = page.locator('div').filter({ hasText: 'Enlaces ExternosAgrega enlaces a tus redes sociales' }).first();
  const editButton = externalLinksContainer.locator('button:has-text("Editar")').first();

  console.log('🖱️ Clicking edit button...');
  await editButton.click();
  await page.waitForTimeout(2000);

  // 3. Verificar estado después de editar
  const hasAddButtonAfterEdit = await addLinkButtonInitial.isVisible();
  console.log(`📊 After edit - "Agregar Enlace" button visible: ${hasAddButtonAfterEdit}`);

  if (hasAddButtonAfterEdit) {
    // 4. Hacer clic en agregar enlace y verificar inmediatamente
    console.log('🖱️ Clicking "Agregar Enlace" button...');
    await addLinkButtonInitial.click();

    // Verificar inmediatamente después del clic
    await page.waitForTimeout(500);

    // 5. Buscar elementos del formulario específicamente
    const formElements = {
      'form container': 'div.bg-gray-50',
      'nuevo enlace title': 'h4:has-text("Nuevo Enlace")',
      'tipo de enlace label': 'label:has-text("Tipo de Enlace")',
      'url label': 'label:has-text("URL")',
      'url input': 'input[type="url"]',
      'select element': 'select',
      'guardar button': 'button:has-text("Guardar Enlace")',
      'cancelar button': 'button:has-text("Cancelar")'
    };

    console.log('\n📝 Checking form elements after click:');
    for (const [name, selector] of Object.entries(formElements)) {
      const element = page.locator(selector);
      const isVisible = await element.isVisible().catch(() => false);
      console.log(`  ${name}: ${isVisible ? '✅ visible' : '❌ not visible'}`);
    }

    // 6. Verificar si hay algún div con bg-gray-50 que debería ser el formulario
    const formContainer = page.locator('div.bg-gray-50');
    const formContainerExists = await formContainer.count();
    console.log(`📦 Form containers found: ${formContainerExists}`);

    if (formContainerExists > 0) {
      const formHTML = await formContainer.first().innerHTML().catch(() => 'Error getting HTML');
      console.log(`📄 Form container HTML: ${formHTML.substring(0, 300)}...`);
    }

    // 7. Verificar toda la sección de Enlaces Externos
    const externalLinksHTML = await externalLinksContainer.innerHTML().catch(() => 'Error');
    const hasFormInSection = externalLinksHTML.includes('Nuevo Enlace') ||
                            externalLinksHTML.includes('Tipo de Enlace') ||
                            externalLinksHTML.includes('bg-gray-50');
    console.log(`🔍 Form elements in external links section: ${hasFormInSection}`);

  } else {
    console.log('❌ "Agregar Enlace" button not visible after edit');
  }

  // 8. Screenshot final
  await page.screenshot({
    path: 'external-links-state-debug.png',
    fullPage: true
  });

  console.log('\n📊 === STATE DEBUG COMPLETE ===');
});