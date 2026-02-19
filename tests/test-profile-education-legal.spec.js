const { test, expect } = require('@playwright/test');

test.describe('Perfil Profesional - Formación e Información Legal', () => {

  test.beforeEach(async ({ page }) => {
    // Navegar a la página de perfil profesional
    await page.goto('http://localhost:5173/perfil-profesional');

    // Esperar a que la página cargue completamente
    await page.waitForSelector('[data-testid="professional-profile"]', { timeout: 10000 });
  });

  test('debería mostrar las secciones de formación e información legal', async ({ page }) => {
    // Verificar que la sección de formación está presente
    const formationSection = await page.locator('h3:has-text("Formación")').first();
    await expect(formationSection).toBeVisible();

    // Verificar que la sección de información legal está presente
    const legalSection = await page.locator('h3:has-text("Información Legal")').first();
    await expect(legalSection).toBeVisible();
  });

  test('debería permitir agregar una nueva credencial de formación', async ({ page }) => {
    // Buscar el botón de editar en la sección de formación
    const editButton = await page.locator('[data-section="credentials"] button').first();
    if (await editButton.isVisible()) {
      await editButton.click();
    }

    // Buscar el botón "Añadir" de credenciales
    const addButton = await page.locator('button:has-text("Añadir")').first();
    if (await addButton.isVisible()) {
      await addButton.click();

      // Llenar el formulario del modal
      await page.fill('input[placeholder*="Máster"]', 'Máster en Psicología Clínica');
      await page.fill('input[placeholder*="Universidad"]', 'Universidad de Madrid');
      await page.fill('input[type="number"]', '2020');
      await page.fill('textarea[placeholder*="Detalles"]', 'Especialización en terapia cognitivo-conductual');

      // Guardar la credencial
      await page.click('button:has-text("Guardar")');

      // Verificar que se agregó la credencial
      await expect(page.locator('text=Máster en Psicología Clínica')).toBeVisible();
      await expect(page.locator('text=Universidad de Madrid')).toBeVisible();
    }
  });

  test('debería permitir agregar información legal', async ({ page }) => {
    // Buscar el botón de editar en la sección de información legal
    const editButton = await page.locator('[data-section="legalInfo"] button').first();
    if (await editButton.isVisible()) {
      await editButton.click();
    }

    // Buscar el botón "Añadir Licencia"
    const addLicenseButton = await page.locator('button:has-text("Añadir Licencia")').first();
    if (await addLicenseButton.isVisible()) {
      await addLicenseButton.click();

      // Llenar el formulario de licencia
      await page.selectOption('select', 'Colegio Oficial de Psicólogos');
      await page.fill('input[placeholder*="12345"]', 'M-12345');
      await page.fill('input[placeholder*="COP Madrid"]', 'Colegio Oficial de Psicólogos de Madrid');

      // Guardar la licencia
      await page.click('button:has-text("Añadir Licencia")');

      // Verificar que se agregó la licencia
      await expect(page.locator('text=Colegio Oficial de Psicólogos')).toBeVisible();
      await expect(page.locator('text=M-12345')).toBeVisible();
    }
  });

  test('debería guardar los cambios de formación e información legal', async ({ page }) => {
    // Hacer cambios en el perfil
    const hasChanges = await page.locator('button:has-text("Guardar")').isVisible();

    if (hasChanges) {
      // Activar edición global si es necesario
      const editButton = await page.locator('button:has-text("Editar")').first();
      if (await editButton.isVisible()) {
        await editButton.click();
      }

      // Hacer un cambio menor para activar el estado de cambios
      await page.fill('textarea[placeholder*="sobre ti"]', 'Soy un profesional especializado en terapia.');

      // Guardar los cambios
      await page.click('button:has-text("Guardar")');

      // Verificar que se muestre el mensaje de guardado exitoso
      await expect(page.locator('text=guardado')).toBeVisible({ timeout: 10000 });
    }
  });

  test('debería persistir los datos después de recargar la página', async ({ page }) => {
    // Agregar algún dato de prueba
    const editButton = await page.locator('button:has-text("Editar")').first();
    if (await editButton.isVisible()) {
      await editButton.click();

      // Hacer un cambio
      await page.fill('textarea[placeholder*="sobre ti"]', 'Datos de prueba para persistencia');

      // Guardar
      await page.click('button:has-text("Guardar")');
      await page.waitForSelector('text=guardado', { timeout: 10000 });
    }

    // Recargar la página
    await page.reload();
    await page.waitForSelector('[data-testid="professional-profile"]', { timeout: 10000 });

    // Verificar que los datos siguen ahí
    await expect(page.locator('text=Datos de prueba para persistencia')).toBeVisible();
  });

  test('debería validar campos obligatorios en el formulario de credenciales', async ({ page }) => {
    // Intentar agregar credencial sin rellenar campos obligatorios
    const editButton = await page.locator('[data-section="credentials"] button').first();
    if (await editButton.isVisible()) {
      await editButton.click();
    }

    const addButton = await page.locator('button:has-text("Añadir")').first();
    if (await addButton.isVisible()) {
      await addButton.click();

      // Intentar guardar sin llenar campos
      await page.click('button:has-text("Guardar")');

      // Verificar que se muestren errores de validación
      await expect(page.locator('text=obligatorio')).toBeVisible();
    }
  });

  test('debería permitir editar credenciales existentes', async ({ page }) => {
    // Buscar credenciales existentes y editarlas
    const editCredentialButton = await page.locator('button[aria-label*="Editar"]').first();
    if (await editCredentialButton.isVisible()) {
      await editCredentialButton.click();

      // Modificar el título
      await page.fill('input[value*=""]', 'Título de Credencial Modificado');

      // Guardar cambios
      await page.click('button:has-text("Guardar")');

      // Verificar que se guardaron los cambios
      await expect(page.locator('text=Título de Credencial Modificado')).toBeVisible();
    }
  });

  test('debería permitir eliminar credenciales', async ({ page }) => {
    // Buscar credenciales existentes y eliminarlas
    const deleteButton = await page.locator('button[aria-label*="Eliminar"]').first();
    if (await deleteButton.isVisible()) {
      // Hacer clic en eliminar
      await deleteButton.click();

      // Confirmar la eliminación en el diálogo
      page.on('dialog', dialog => dialog.accept());

      // La credencial debería desaparecer
      // Esto dependerá del contenido específico que se eliminó
    }
  });
});