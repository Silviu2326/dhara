import { test, expect } from '@playwright/test';

/**
 * Test específico para debuggear el botón "Agregar Enlace"
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

test('Debug add link button functionality', async ({ page }) => {
  // Monitorear errores en consola
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log(`🚨 Console Error: ${msg.text()}`);
    }
  });

  await page.goto('http://localhost:5173');
  await page.evaluate(({ token, userData }) => {
    localStorage.setItem('dhara-token', token);
    localStorage.setItem('dhara-user', JSON.stringify(userData));
  }, { token: VALID_TOKEN, userData: THERAPIST_DATA });

  console.log('\n🔍 === DEBUGGING ADD LINK BUTTON ===');

  await page.goto('http://localhost:5173/perfil-profesional');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(3000);

  // 1. Buscar y entrar en modo edición
  const externalLinksContainer = page.locator('div').filter({ hasText: 'Enlaces ExternosAgrega enlaces a tus redes sociales' }).first();
  const editButton = externalLinksContainer.locator('button:has-text("Editar")').first();

  await editButton.click();
  console.log('✅ Clicked edit button');
  await page.waitForTimeout(2000);

  // 2. Verificar estado antes de hacer clic
  const addLinkButton = page.locator('button:has-text("Agregar Enlace")');
  const isButtonVisible = await addLinkButton.isVisible();
  const isButtonEnabled = await addLinkButton.isEnabled();

  console.log(`📊 Before click - Button visible: ${isButtonVisible}, enabled: ${isButtonEnabled}`);

  // 3. Verificar si ya hay formulario visible
  const existingForm = page.locator('input[type="url"], select, text="Nuevo Enlace", text="Editar Enlace"');
  const hasExistingForm = await existingForm.first().isVisible().catch(() => false);
  console.log(`📝 Form already visible before click: ${hasExistingForm}`);

  // 4. Hacer clic y monitorear cambios
  console.log('🖱️ Clicking "Agregar Enlace" button...');
  await addLinkButton.click();
  await page.waitForTimeout(2000);

  // 5. Verificar qué elementos aparecieron después del clic
  const afterClickElements = [
    { name: 'URL input', selector: 'input[type="url"]' },
    { name: 'Select dropdown', selector: 'select' },
    { name: 'Nuevo Enlace text', selector: 'text="Nuevo Enlace"' },
    { name: 'Editar Enlace text', selector: 'text="Editar Enlace"' },
    { name: 'Any input', selector: 'input' },
    { name: 'Any form element', selector: 'form' },
    { name: 'Label with URL', selector: 'label:has-text("URL")' },
    { name: 'Label with Tipo', selector: 'label:has-text("Tipo")' }
  ];

  let foundElements = [];
  for (const element of afterClickElements) {
    const isVisible = await page.locator(element.selector).isVisible().catch(() => false);
    if (isVisible) {
      foundElements.push(element.name);
      console.log(`✅ Found: ${element.name}`);
    }
  }

  if (foundElements.length === 0) {
    console.log('❌ No form elements found after click');
  } else {
    console.log(`✅ Found ${foundElements.length} form elements: ${foundElements.join(', ')}`);
  }

  // 6. Verificar si hay cambios en el DOM
  const pageContent = await page.content();
  const hasFormInHTML = pageContent.includes('type="url"') ||
                       pageContent.includes('Nuevo Enlace') ||
                       pageContent.includes('Editar Enlace');
  console.log(`📄 Form elements in HTML: ${hasFormInHTML}`);

  // 7. Verificar errores de JavaScript
  const errors = await page.evaluate(() => {
    return window.errors || [];
  });

  if (errors.length > 0) {
    console.log(`🚨 JavaScript errors found: ${errors.join(', ')}`);
  } else {
    console.log('✅ No JavaScript errors detected');
  }

  // 8. Screenshot para análisis visual
  await page.screenshot({
    path: 'add-link-button-debug.png',
    fullPage: true
  });

  console.log('\n📊 === DEBUG SUMMARY ===');
  console.log(`Button was clickable: ${isButtonVisible && isButtonEnabled}`);
  console.log(`Form elements appeared: ${foundElements.length > 0}`);
  console.log('🔍 Check the screenshot for visual analysis');
});