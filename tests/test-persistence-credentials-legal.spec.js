import { test, expect } from '@playwright/test';

test.describe('Persistencia de Formación e Información Legal', () => {
  test.beforeEach(async ({ page }) => {
    // Navegar a la página de perfil profesional
    await page.goto('http://localhost:5173/perfil-profesional');

    // Esperar a que la página cargue completamente
    await page.waitForSelector('[data-testid="professional-profile"]', { timeout: 15000 });

    // Esperar un poco más para que todos los datos se carguen
    await page.waitForTimeout(2000);
  });

  test('debería persistir la información de formación al recargar la página', async ({ page }) => {
    console.log('🧪 Iniciando test de persistencia de formación...');

    // 1. Activar modo de edición para formación
    console.log('📝 1. Activando modo de edición para formación...');

    // Buscar el botón de editar en la sección de formación
    const formationEditButton = page.locator('h3:has-text("Formación")').locator('..').locator('button').first();

    try {
      await formationEditButton.click();
      console.log('✅ Botón de edición de formación clicado');
    } catch (error) {
      console.log('⚠️ No se encontró botón de edición específico, intentando edición global...');

      // Intentar activar edición global
      const globalEditButton = page.locator('button:has-text("Editar")').first();
      if (await globalEditButton.isVisible()) {
        await globalEditButton.click();
        console.log('✅ Modo de edición global activado');
      }
    }

    await page.waitForTimeout(1000);

    // 2. Agregar nueva credencial de formación
    console.log('➕ 2. Agregando nueva credencial de formación...');

    const addCredentialButton = page.locator('button:has-text("Añadir")').first();

    if (await addCredentialButton.isVisible()) {
      await addCredentialButton.click();
      console.log('✅ Botón "Añadir" clicado');

      // Esperar a que aparezca el modal
      await page.waitForSelector('input[placeholder*="Máster"]', { timeout: 5000 });

      // Llenar el formulario con datos específicos
      const testData = {
        title: 'Máster en Psicología Clínica TEST',
        institution: 'Universidad de Madrid TEST',
        year: '2023',
        description: 'Especialización en terapia cognitivo-conductual TEST'
      };

      console.log('📝 Llenando formulario de credencial...');
      await page.fill('input[placeholder*="Máster"]', testData.title);
      await page.fill('input[placeholder*="Universidad"]', testData.institution);
      await page.fill('input[type="number"]', testData.year);
      await page.fill('textarea[placeholder*="Detalles"]', testData.description);

      // Guardar la credencial
      await page.click('button:has-text("Guardar")');
      console.log('💾 Credencial guardada en modal');

      // Esperar a que el modal se cierre
      await page.waitForTimeout(1000);

      // Verificar que se agregó la credencial en la UI
      await expect(page.locator(`text=${testData.title}`)).toBeVisible();
      console.log('✅ Credencial visible en la UI');

      // 3. Guardar el perfil completo
      console.log('💾 3. Guardando perfil completo...');

      const saveButton = page.locator('button:has-text("Guardar")').first();
      if (await saveButton.isVisible()) {
        await saveButton.click();
        console.log('✅ Botón guardar clicado');

        // Esperar confirmación de guardado
        try {
          await expect(page.locator('text=guardado')).toBeVisible({ timeout: 10000 });
          console.log('✅ Confirmación de guardado recibida');
        } catch (error) {
          console.log('⚠️ No se vio confirmación explícita, pero continuando...');
        }

        await page.waitForTimeout(2000);
      }

      // 4. Recargar la página
      console.log('🔄 4. Recargando página para verificar persistencia...');
      await page.reload();
      await page.waitForSelector('[data-testid="professional-profile"]', { timeout: 15000 });
      await page.waitForTimeout(3000); // Esperar a que los datos se carguen

      // 5. Verificar que los datos persisten
      console.log('🔍 5. Verificando que los datos persisten...');

      try {
        await expect(page.locator(`text=${testData.title}`)).toBeVisible({ timeout: 10000 });
        console.log('✅ ÉXITO: La credencial persiste después de recargar');

        await expect(page.locator(`text=${testData.institution}`)).toBeVisible();
        console.log('✅ ÉXITO: La institución persiste después de recargar');

        await expect(page.locator(`text=${testData.year}`)).toBeVisible();
        console.log('✅ ÉXITO: El año persiste después de recargar');

        // Tomar screenshot de éxito
        await page.screenshot({ path: 'test-persistence-success.png', fullPage: true });
        console.log('📸 Screenshot de éxito guardado');

      } catch (error) {
        console.log('❌ ERROR: Los datos NO persisten después de recargar');

        // Tomar screenshot del problema
        await page.screenshot({ path: 'test-persistence-failure.png', fullPage: true });
        console.log('📸 Screenshot del problema guardado');

        // Buscar cualquier credencial visible
        const anyCredential = await page.locator('text=Máster').first().isVisible();
        console.log(`🔍 ¿Hay alguna credencial visible? ${anyCredential}`);

        // Verificar si hay errores en consola
        page.on('console', msg => {
          if (msg.type() === 'error') {
            console.log(`❌ Error de consola: ${msg.text()}`);
          }
        });

        throw error;
      }
    } else {
      console.log('⚠️ No se encontró botón "Añadir", tomando screenshot para debug...');
      await page.screenshot({ path: 'test-debug-no-add-button.png', fullPage: true });
      throw new Error('No se encontró el botón "Añadir" para credenciales');
    }
  });

  test('debería persistir la información legal al recargar la página', async ({ page }) => {
    console.log('🧪 Iniciando test de persistencia de información legal...');

    // 1. Activar modo de edición para información legal
    console.log('📝 1. Activando modo de edición para información legal...');

    const legalEditButton = page.locator('h3:has-text("Información Legal")').locator('..').locator('button').first();

    try {
      await legalEditButton.click();
      console.log('✅ Botón de edición de información legal clicado');
    } catch (error) {
      console.log('⚠️ No se encontró botón de edición específico, intentando edición global...');

      const globalEditButton = page.locator('button:has-text("Editar")').first();
      if (await globalEditButton.isVisible()) {
        await globalEditButton.click();
        console.log('✅ Modo de edición global activado');
      }
    }

    await page.waitForTimeout(1000);

    // 2. Agregar nueva licencia
    console.log('➕ 2. Agregando nueva licencia...');

    const addLicenseButton = page.locator('button:has-text("Añadir Licencia")').first();

    if (await addLicenseButton.isVisible()) {
      await addLicenseButton.click();
      console.log('✅ Botón "Añadir Licencia" clicado');

      await page.waitForTimeout(1000);

      // Llenar el formulario de licencia
      const testLegalData = {
        type: 'Colegio Oficial de Psicólogos',
        number: 'M-TEST-12345',
        issuingBody: 'Colegio Oficial de Psicólogos de Madrid TEST'
      };

      console.log('📝 Llenando formulario de licencia...');
      await page.selectOption('select', testLegalData.type);
      await page.fill('input[placeholder*="12345"]', testLegalData.number);
      await page.fill('input[placeholder*="COP Madrid"]', testLegalData.issuingBody);

      // Guardar la licencia
      await page.click('button:has-text("Añadir Licencia")');
      console.log('💾 Licencia guardada');

      await page.waitForTimeout(1000);

      // Verificar que se agregó la licencia en la UI
      await expect(page.locator(`text=${testLegalData.number}`)).toBeVisible();
      console.log('✅ Licencia visible en la UI');

      // 3. Guardar el perfil completo
      console.log('💾 3. Guardando perfil completo...');

      const saveButton = page.locator('button:has-text("Guardar")').first();
      if (await saveButton.isVisible()) {
        await saveButton.click();
        console.log('✅ Botón guardar clicado');

        // Esperar confirmación de guardado
        await page.waitForTimeout(3000);
      }

      // 4. Recargar la página
      console.log('🔄 4. Recargando página para verificar persistencia...');
      await page.reload();
      await page.waitForSelector('[data-testid="professional-profile"]', { timeout: 15000 });
      await page.waitForTimeout(3000);

      // 5. Verificar que los datos persisten
      console.log('🔍 5. Verificando que los datos legales persisten...');

      try {
        await expect(page.locator(`text=${testLegalData.number}`)).toBeVisible({ timeout: 10000 });
        console.log('✅ ÉXITO: La licencia persiste después de recargar');

        await expect(page.locator(`text=${testLegalData.type}`)).toBeVisible();
        console.log('✅ ÉXITO: El tipo de licencia persiste después de recargar');

        // Tomar screenshot de éxito
        await page.screenshot({ path: 'test-legal-persistence-success.png', fullPage: true });
        console.log('📸 Screenshot de éxito legal guardado');

      } catch (error) {
        console.log('❌ ERROR: Los datos legales NO persisten después de recargar');

        // Tomar screenshot del problema
        await page.screenshot({ path: 'test-legal-persistence-failure.png', fullPage: true });
        console.log('📸 Screenshot del problema legal guardado');

        throw error;
      }
    } else {
      console.log('⚠️ No se encontró botón "Añadir Licencia", tomando screenshot para debug...');
      await page.screenshot({ path: 'test-debug-no-add-license-button.png', fullPage: true });
      throw new Error('No se encontró el botón "Añadir Licencia"');
    }
  });

  test('debería mostrar los datos existentes al cargar la página', async ({ page }) => {
    console.log('🧪 Verificando datos existentes en la carga inicial...');

    // Esperar a que la página cargue completamente
    await page.waitForTimeout(3000);

    // Tomar screenshot del estado inicial
    await page.screenshot({ path: 'test-initial-state.png', fullPage: true });
    console.log('📸 Screenshot del estado inicial guardado');

    // Verificar si hay datos de formación existentes
    const formationSection = page.locator('h3:has-text("Formación")').locator('..');
    const hasFormationData = await formationSection.locator('text=No hay formación registrada').isVisible();

    if (hasFormationData) {
      console.log('ℹ️ No hay datos de formación existentes');
    } else {
      console.log('✅ Hay datos de formación existentes');
    }

    // Verificar si hay datos legales existentes
    const legalSection = page.locator('h3:has-text("Información Legal")').locator('..');
    const hasLegalData = await legalSection.locator('text=No hay licencias registradas').isVisible();

    if (hasLegalData) {
      console.log('ℹ️ No hay datos legales existentes');
    } else {
      console.log('✅ Hay datos legales existentes');
    }

    // Verificar que las secciones están presentes
    await expect(page.locator('h3:has-text("Formación")')).toBeVisible();
    await expect(page.locator('h3:has-text("Información Legal")')).toBeVisible();
    console.log('✅ Las secciones de formación e información legal están presentes');
  });
});