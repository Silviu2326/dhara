import { test, expect } from '@playwright/test';

/**
 * Test para verificar que la prop isEditing se pasa correctamente
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

test('Debug isEditing prop for external links', async ({ page }) => {
  await page.goto('http://localhost:5173');
  await page.evaluate(({ token, userData }) => {
    localStorage.setItem('dhara-token', token);
    localStorage.setItem('dhara-user', JSON.stringify(userData));
  }, { token: VALID_TOKEN, userData: THERAPIST_DATA });

  console.log('\n🔍 === DEBUGGING ISEDITING PROP ===');

  await page.goto('http://localhost:5173/perfil-profesional');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(3000);

  // 1. Verificar estado inicial
  console.log('📊 INITIAL STATE:');

  const addLinkButtonInitial = page.locator('button:has-text("Agregar Enlace")');
  const hasAddButtonInitial = await addLinkButtonInitial.isVisible();
  console.log(`  "Agregar Enlace" button visible: ${hasAddButtonInitial}`);

  // Inyectar código para debuggear el estado del componente
  await page.evaluate(() => {
    window.debugExternalLinks = () => {
      // Buscar el componente React
      const elementsWithProps = document.querySelectorAll('*');
      for (let element of elementsWithProps) {
        const reactProps = element._reactInternalFiber || element._reactInternalInstance;
        if (reactProps && reactProps.memoizedProps && reactProps.memoizedProps.isEditing !== undefined) {
          console.log('Found ExternalLinks component props:', reactProps.memoizedProps);
          return reactProps.memoizedProps;
        }
      }
      return null;
    };
  });

  // 2. Hacer clic en editar
  console.log('\n📊 CLICKING EDIT BUTTON:');

  const externalLinksContainer = page.locator('div').filter({ hasText: 'Enlaces ExternosAgrega enlaces a tus redes sociales' }).first();
  const editButton = externalLinksContainer.locator('button:has-text("Editar")').first();

  await editButton.click();
  console.log('✅ Clicked edit button');
  await page.waitForTimeout(1000);

  // 3. Verificar estado después de editar
  console.log('\n📊 AFTER EDIT CLICK:');

  const hasAddButtonAfterEdit = await addLinkButtonInitial.isVisible();
  console.log(`  "Agregar Enlace" button visible: ${hasAddButtonAfterEdit}`);

  // 4. Hacer clic en "Agregar Enlace" si está visible
  if (hasAddButtonAfterEdit) {
    console.log('\n📊 CLICKING ADD LINK BUTTON:');

    await addLinkButtonInitial.click();
    console.log('✅ Clicked "Agregar Enlace" button');
    await page.waitForTimeout(1000);

    // 5. Verificar qué elementos aparecen ahora
    console.log('\n📊 AFTER ADD LINK CLICK:');

    const formElements = [
      { name: 'Nuevo Enlace title', selector: 'h4:has-text("Nuevo Enlace")' },
      { name: 'Form container', selector: 'div.bg-gray-50:has(h4:has-text("Nuevo Enlace"))' },
      { name: 'URL input', selector: 'input[type="url"]' },
      { name: 'Any form with URL', selector: 'form input[type="url"], div input[type="url"]' }
    ];

    for (const element of formElements) {
      const isVisible = await page.locator(element.selector).isVisible().catch(() => false);
      console.log(`  ${element.name}: ${isVisible ? '✅' : '❌'}`);
    }

    // 6. Buscar el div contenedor exacto del formulario
    const exactFormContainer = page.locator('div.border.border-gray-200.rounded-lg.p-6.bg-gray-50');
    const exactFormExists = await exactFormContainer.count();
    console.log(`  Exact form container count: ${exactFormExists}`);

    if (exactFormExists > 0) {
      const formContent = await exactFormContainer.first().textContent();
      console.log(`  Form content: "${formContent.substring(0, 100)}..."`);
    }
  }

  // 7. Screenshot final para análisis
  await page.screenshot({
    path: 'is-editing-prop-debug.png',
    fullPage: true
  });

  console.log('\n📊 === DEBUGGING COMPLETE ===');
});