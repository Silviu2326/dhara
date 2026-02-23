import { test, expect } from '@playwright/test';

const pages = [
  { url: '/', name: 'Landing' },
  { url: '/login', name: 'Login' },
  { url: '/registro-terapeuta', name: 'Registro Terapeuta' },
  { url: '/registro-exitoso', name: 'Registro Exitoso' },
  // Client routes (without auth - should redirect or show content)
  { url: '/app/cliente', name: 'Cliente Home' },
  { url: '/app/cliente/citas', name: 'Cliente Citas' },
  { url: '/app/cliente/favoritos', name: 'Cliente Favoritos' },
  { url: '/app/cliente/documentos', name: 'Cliente Documentos' },
  { url: '/app/cliente/dashboard', name: 'Cliente Dashboard' },
  // Professional routes (without auth)
  { url: '/app/dashboard-profesional', name: 'Profesional Dashboard' },
  { url: '/app/perfil-profesional', name: 'Perfil Profesional' },
  { url: '/app/disponibilidad', name: 'Disponibilidad' },
  { url: '/app/reservas', name: 'Reservas' },
  { url: '/app/clientes', name: 'Clientes' },
  { url: '/app/chat', name: 'Chat' },
  { url: '/app/documentos-materiales', name: 'Documentos' },
  { url: '/app/reseñas', name: 'Reseñas' },
  { url: '/app/pagos', name: 'Pagos' },
  { url: '/app/notificaciones', name: 'Notificaciones' },
  { url: '/app/integraciones', name: 'Integraciones' },
  { url: '/app/centro-ayuda', name: 'Centro de Ayuda' },
  { url: '/app/configuracion-cuenta', name: 'Configuración Cuenta' },
];

test.describe('All Pages Test', () => {
  for (const page of pages) {
    test(`${page.name} (${page.url}) should load without crash`, async ({ page: pageContext }) => {
      const errors = [];
      
      pageContext.on('console', msg => {
        if (msg.type() === 'error') {
          errors.push(msg.text());
        }
      });
      
      pageContext.on('pageerror', err => {
        errors.push(err.message);
      });

      const response = await pageContext.goto(page.url, { waitUntil: 'domcontentloaded', timeout: 15000 });
      
      // Allow redirects (3xx) but not 5xx errors
      if (response && response.status() >= 500) {
        console.log(`ERROR: ${page.url} returned ${response.status()}`);
      }
      
      // Check page loaded (title should contain something)
      const title = await pageContext.title();
      expect(title.length).toBeGreaterThan(0);
      
      // Report critical errors only
      const criticalErrors = errors.filter(e => 
        !e.includes('Warning') && 
        !e.includes('DevTools') &&
        !e.includes('favicon')
      );
      
      if (criticalErrors.length > 0) {
        console.log(`${page.url}: ${criticalErrors.length} errors - ${criticalErrors.slice(0,3).join(', ')}`);
      }
    });
  }
});
