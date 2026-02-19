const { defineConfig, devices } = require('@playwright/test');

/**
 * Configuración de Playwright para testing de navegación
 * @see https://playwright.dev/docs/test-configuration
 */
module.exports = defineConfig({
  testDir: './tests',

  // Configuración de timeout
  timeout: 30 * 1000,
  expect: {
    timeout: 5000,
  },

  // Configuración de reportes
  reporter: [
    ['list'],
    ['html', { outputFolder: 'test-results/html-report' }]
  ],

  // Configuración global
  use: {
    // Base URL para tests (no aplica para React Native pero lo incluyo)
    baseURL: 'http://localhost:19006',

    // Trace para debugging
    trace: 'on-first-retry',

    // Screenshots en fallos
    screenshot: 'only-on-failure',
  },

  // Configuración de proyectos
  projects: [
    {
      name: 'Navigation Tests',
      use: { ...devices['Desktop Chrome'] },
      testMatch: 'tests/navigation.test.js',
    },
  ],

  // Configuración para modo watch
  globalSetup: undefined,
  globalTeardown: undefined,
});