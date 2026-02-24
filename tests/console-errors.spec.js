import { test, expect } from '@playwright/test';

const pages = [
  '/',
  '/login',
  '/registro-terapeuta',
  '/app/dashboard-profesional',
  '/app/perfil-profesional',
  '/app/disponibilidad',
  '/app/reservas',
  '/app/clientes',
  '/app/chat',
  '/app/documentos-materiales',
  '/app/reseñas',
  '/app/pagos',
];

test.describe('Console Errors Check', () => {
  for (const url of pages) {
    test(`${url} - check console errors`, async ({ page }) => {
      const errors = [];
      
      page.on('console', msg => {
        if (msg.type() === 'error') {
          errors.push(msg.text());
        }
      });
      
      await page.goto(url, { waitUntil: 'networkidle', timeout: 15000 });
      await page.waitForTimeout(1000);
      
      // Filter out non-critical errors
      const criticalErrors = errors.filter(e => 
        !e.includes('Warning') && 
        !e.includes('DevTools') &&
        !e.includes('favicon') &&
        !e.includes('Failed to load resource')
      );
      
      if (criticalErrors.length > 0) {
        console.log(`\n=== ${url} ===`);
        criticalErrors.forEach(e => console.log(e));
      }
      
      expect(criticalErrors.length).toBeLessThanOrEqual(3);
    });
  }
});
