# Documentación de Servicios - Dharaterapeutas

## 🏗️ Arquitectura de Servicios

Esta documentación describe la arquitectura completa de servicios implementada para el frontend de Dharaterapeutas, incluyendo autenticación robusta, manejo de errores, logging y utilidades de seguridad.

## 📁 Estructura de Directorios

```
src/services/
├── config/
│   ├── apiClient.js          # Cliente HTTP principal con axios
│   ├── endpoints.js          # Configuración centralizada de endpoints
│   ├── constants.js          # Constantes globales de la aplicación
│   ├── environments.js       # Configuración por ambiente
│   └── interceptors.js       # Interceptors avanzados de axios
├── utils/
│   ├── tokenManager.js       # Gestión segura de tokens JWT
│   ├── errorHandler.js       # Manejo centralizado de errores
│   ├── logger.js            # Sistema de logging avanzado
│   ├── security.js          # Utilidades de seguridad
│   └── storage.js           # Abstracción de almacenamiento
├── api/
│   └── authService.js       # Servicio completo de autenticación
├── types/
│   └── auth.types.js        # Definiciones de tipos y constantes
└── index.js                 # Exportaciones principales
```

## 🚀 Inicialización

Para inicializar todos los servicios:

```javascript
import { initializeServices } from '@/services';

// En tu archivo main.js o App.jsx
const startApp = async () => {
  const servicesReady = await initializeServices();

  if (servicesReady) {
    // Inicializar tu aplicación
    console.log('Servicios listos, iniciando aplicación...');
  } else {
    console.error('Error al inicializar servicios');
  }
};

startApp();
```

## 🔐 Servicio de Autenticación

### Uso Básico

```javascript
import { authService, login, register, logout } from '@/services';

// Login
try {
  const user = await login({
    email: 'usuario@ejemplo.com',
    password: 'contraseñaSegura',
    rememberMe: true
  });
  console.log('Usuario autenticado:', user);
} catch (error) {
  console.error('Error de login:', error.userMessage);
}

// Registro
try {
  const response = await register({
    email: 'nuevo@ejemplo.com',
    password: 'contraseñaSegura',
    confirmPassword: 'contraseñaSegura',
    firstName: 'Juan',
    lastName: 'Pérez',
    acceptTerms: true
  });
} catch (error) {
  console.error('Error de registro:', error.userMessage);
}

// Logout
await logout(false); // false = solo cerrar sesión actual
```

### Estado de Autenticación

```javascript
import { authService, isAuthenticated, getCurrentUser } from '@/services';

// Verificar si está autenticado
if (isAuthenticated()) {
  const user = getCurrentUser();
  console.log('Usuario actual:', user);
}

// Suscribirse a cambios de estado
const unsubscribe = authService.subscribe((authState) => {
  console.log('Estado de auth:', authState);
  // { isAuthenticated, user, loading, error }
});

// Limpiar suscripción
unsubscribe();
```

### Gestión de Permisos

```javascript
import { hasPermission, hasRole, PERMISSIONS, USER_ROLES } from '@/services';

// Verificar permisos
if (hasPermission(PERMISSIONS.BOOKING_CREATE)) {
  // El usuario puede crear citas
}

// Verificar roles
if (hasRole(USER_ROLES.THERAPIST)) {
  // El usuario es terapeuta
}
```

## 🌐 Cliente HTTP (API)

### Uso Básico

```javascript
import { apiMethods, ENDPOINTS } from '@/services';

// GET request
const users = await apiMethods.get('/users');

// POST request
const newUser = await apiMethods.post('/users', {
  name: 'Juan Pérez',
  email: 'juan@ejemplo.com'
});

// Con endpoints predefinidos
const profile = await apiMethods.get(ENDPOINTS.USERS.PROFILE);
```

### Requests Avanzados

```javascript
// Upload de archivos con progreso
await apiMethods.upload('/upload', formData, {
  onProgress: (percent, event) => {
    console.log(`Progreso: ${percent}%`);
  },
  chunkSize: 1024 * 1024 // 1MB chunks
});

// Download de archivos
await apiMethods.download('/files/documento.pdf', 'mi-documento.pdf', {
  onProgress: (percent) => console.log(`Descarga: ${percent}%`)
});

// Request con cache
const data = await apiMethods.getWithCache('/expensive-data', {
  cacheTTL: 10 * 60 * 1000, // 10 minutos
  cacheKey: 'expensive-data-key'
});

// Batch de requests
const results = await apiMethods.batch([
  { method: 'GET', url: '/users' },
  { method: 'GET', url: '/profiles' },
  { method: 'POST', url: '/analytics', data: { event: 'page_view' } }
]);
```

### WebSocket y SSE

```javascript
// Server-Sent Events
const eventSource = apiMethods.createEventSource('/notifications', {
  onMessage: (data) => console.log('Notificación:', data),
  onError: (error) => console.error('Error SSE:', error)
});

// WebSocket
const ws = apiMethods.createWebSocket('/chat', {
  onMessage: (data) => console.log('Mensaje:', data),
  onOpen: () => console.log('WebSocket conectado')
});
```

## ⚠️ Manejo de Errores

### Uso del Error Handler

```javascript
import { errorHandler, createValidationError } from '@/services';

try {
  await apiMethods.post('/endpoint', data);
} catch (error) {
  // El error ya está procesado por el interceptor
  console.log('Código de error:', error.code);
  console.log('Mensaje para usuario:', error.userMessage);
  console.log('Sugerencias:', errorHandler.getErrorSuggestions(error));

  // Verificar tipo de error
  if (errorHandler.isCriticalError(error)) {
    // Manejar error crítico
  }

  if (errorHandler.isRecoverableError(error)) {
    // Intentar recuperación
  }
}

// Crear errores personalizados
const validationError = createValidationError({
  email: 'Email inválido',
  password: 'Contraseña muy débil'
});
```

## 📊 Sistema de Logging

### Uso del Logger

```javascript
import { logger } from '@/services';

// Logs básicos
logger.debug('Información de debug');
logger.info('Información general');
logger.warn('Advertencia');
logger.error('Error crítico');

// Logs estructurados
logger.info('Usuario inició sesión', {
  userId: '123',
  timestamp: new Date(),
  deviceInfo: navigator.userAgent
});

// Logs específicos para APIs
logger.apiRequest('POST', '/auth/login', { email: 'user@example.com' });
logger.apiResponse('POST', '/auth/login', 200, { success: true }, 250);

// Logs de performance
logger.performance('Page Load', 1250, { page: '/dashboard' });

// Exportar logs para debugging
logger.exportLogs(); // Descarga un archivo JSON
```

### Configuración de Logging

```javascript
// Cambiar nivel de log dinámicamente
logger.setLevel('debug');

// Obtener estadísticas
const stats = logger.getStats();
console.log('Estadísticas de logs:', stats);

// Limpiar logs
logger.clearLogs();
```

## 🔒 Utilidades de Seguridad

### Validaciones

```javascript
import { security, validatePassword, validateEmail } from '@/services';

// Validar email
const emailResult = validateEmail('usuario@ejemplo.com');
if (!emailResult.isValid) {
  console.error(emailResult.error);
}

// Validar contraseña
const passwordResult = validatePassword('MiContraseña123!');
console.log('Puntuación:', passwordResult.score);
console.log('Sugerencias:', passwordResult.suggestions);

// Generar contraseña segura
const securePassword = security.generateSecurePassword(16);
```

### Sanitización y Seguridad

```javascript
// Sanitizar HTML
const safeHtml = security.sanitizeHtml('<script>alert("xss")</script>');

// Detectar ataques
if (security.detectXSS(userInput)) {
  console.warn('Posible ataque XSS detectado');
}

// Limpiar datos para logging
const sanitizedData = security.sanitizeForLogging({
  email: 'user@example.com',
  password: 'secreto123',
  token: 'jwt-token-here'
});
// Result: { email: 'user@example.com', password: '[REDACTED]', token: '[REDACTED]' }

// Rate limiting
const rateLimiter = security.createRateLimiter(10, 60000); // 10 requests per minute
if (rateLimiter.isAllowed()) {
  // Proceder con la operación
}
```

## 💾 Gestión de Almacenamiento

### Storage Básico

```javascript
import { storage, userStorage, settingsStorage } from '@/services';

// Storage general
storage.setItem('miClave', { data: 'valor' });
const data = storage.getItem('miClave', { defaultValue: null });

// Storage específico para usuarios
userStorage.setUser({ id: 1, name: 'Juan' });
const user = userStorage.getUser();

// Storage para configuraciones
settingsStorage.setSetting('theme', 'dark');
const theme = settingsStorage.getSetting('theme', 'light');
```

### Storage Avanzado

```javascript
// Con TTL (tiempo de vida)
storage.setItem('datos-temporales', data, { ttl: 5 * 60 * 1000 });

// Con compresión (para datos grandes)
storage.setItem('datos-grandes', bigData, { compress: true });

// Usar sessionStorage en lugar de localStorage
storage.setItem('datos-sesion', data, { useSessionStorage: true });

// Estadísticas de storage
const stats = storage.getStats();
console.log('Uso de storage:', stats);

// Limpiar storage antiguo
storage.clearOldItems();
```

## 🔧 Configuración de Ambientes

### Variables de Entorno

```javascript
import { ENVIRONMENTS } from '@/services';

// Acceder a configuración actual
console.log('API URL:', ENVIRONMENTS.API_BASE_URL);
console.log('Ambiente:', ENVIRONMENTS.current);
console.log('Es desarrollo:', ENVIRONMENTS.isDevelopment);

// Configuración específica
const config = ENVIRONMENTS.config;
console.log('Timeout de API:', config.api.timeout);
console.log('Debug habilitado:', config.debug.enableConsoleLogging);

// Variables de entorno personalizadas
const customVar = ENVIRONMENTS.getEnvVar('VITE_CUSTOM_VAR', 'defaultValue');

// Verificar features
if (ENVIRONMENTS.isFeatureEnabled('NEW_DASHBOARD')) {
  // Mostrar nuevo dashboard
}
```

## 🛠️ Interceptors de Axios

Los interceptors están configurados automáticamente para:

- **Autenticación automática**: Agrega tokens JWT a todas las requests
- **Renovación de tokens**: Renueva automáticamente tokens expirados
- **Logging automático**: Registra todas las requests y responses
- **Manejo de errores**: Procesa errores automáticamente
- **Rate limiting**: Controla el número de requests por minuto
- **Reintentos**: Reintenta requests fallidos automáticamente
- **Validación de seguridad**: Detecta posibles ataques

## 📋 Endpoints Predefinidos

```javascript
import { ENDPOINTS, buildEndpoint, buildFullUrl } from '@/services';

// Usar endpoints predefinidos
const response = await apiMethods.get(ENDPOINTS.AUTH.PROFILE);

// Construir endpoints dinámicos
const userEndpoint = buildEndpoint(ENDPOINTS.USERS.DETAIL, { id: 123 });
// Result: '/users/123'

// Construir URL completa con query params
const fullUrl = buildFullUrl(
  ENDPOINTS.BOOKINGS.LIST,
  {},
  { page: 1, limit: 20, status: 'active' }
);
// Result: '/bookings?page=1&limit=20&status=active'
```

## 🎯 Ejemplos de Uso Completos

### Componente de Login en React

```jsx
import React, { useState } from 'react';
import { login, authService } from '@/services';

const LoginComponent = () => {
  const [credentials, setCredentials] = useState({
    email: '',
    password: '',
    rememberMe: false
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await login(credentials);
      // Redirección manejada automáticamente
    } catch (error) {
      setError(error.userMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleLogin}>
      {/* Form fields */}
      {error && <div className="error">{error}</div>}
      <button type="submit" disabled={loading}>
        {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
      </button>
    </form>
  );
};
```

### Hook de Autenticación

```javascript
import { useState, useEffect } from 'react';
import { authService } from '@/services';

export const useAuth = () => {
  const [authState, setAuthState] = useState(authService.authState);

  useEffect(() => {
    const unsubscribe = authService.subscribe(setAuthState);
    return unsubscribe;
  }, []);

  return {
    ...authState,
    login: authService.login.bind(authService),
    logout: authService.logout.bind(authService),
    register: authService.register.bind(authService)
  };
};
```

### Protección de Rutas

```jsx
import React from 'react';
import { isAuthenticated, hasPermission, PERMISSIONS } from '@/services';

const ProtectedRoute = ({ children, permission }) => {
  if (!isAuthenticated()) {
    return <Navigate to="/login" />;
  }

  if (permission && !hasPermission(permission)) {
    return <div>No tienes permisos para acceder a esta página</div>;
  }

  return children;
};

// Uso
<ProtectedRoute permission={PERMISSIONS.ADMIN_READ}>
  <AdminPanel />
</ProtectedRoute>
```

## 🔄 Actualización y Mantenimiento

### Renovación de Tokens

Los tokens se renuevan automáticamente, pero puedes forzar una renovación:

```javascript
import { authService } from '@/services';

try {
  await authService.refreshToken();
  console.log('Token renovado exitosamente');
} catch (error) {
  console.error('Error al renovar token:', error);
  // Usuario será redirigido al login automáticamente
}
```

### Limpieza de Datos

```javascript
import { storage, logger, authService } from '@/services';

// Limpiar datos de autenticación
authService.clearAuthData();

// Limpiar storage
storage.clear();

// Limpiar logs
logger.clearLogs();
```

## 🚨 Manejo de Errores Globales

El sistema captura automáticamente errores no manejados:

```javascript
// Los errores se capturan automáticamente y se envían a logging
// En producción, también se reportan al servidor

// Para manejar errores específicos de la aplicación:
window.addEventListener('error', (event) => {
  console.log('Error capturado por el sistema:', event);
});

window.addEventListener('unhandledrejection', (event) => {
  console.log('Promise rechazada capturada:', event);
});
```

## 📈 Monitoreo y Analytics

```javascript
import { logger, ENVIRONMENTS } from '@/services';

// El sistema automáticamente registra:
// - Requests y responses de API
// - Errores de autenticación
// - Performance de la aplicación
// - Eventos de usuario

// En producción, los logs se envían automáticamente al servidor
// Para verificar el estado:
if (ENVIRONMENTS.ERROR_REPORTING_ENABLED) {
  console.log('Reporte de errores activo');
}
```

## ⚡ Optimizaciones de Performance

- **Cache automático** para requests GET repetitivas
- **Compresión de datos** grandes en storage
- **Lazy loading** de módulos no críticos
- **Debouncing** automático en requests frecuentes
- **Chunked uploads** para archivos grandes
- **Connection pooling** para requests paralelas

## 🛡️ Consideraciones de Seguridad

- **Sanitización automática** de datos de entrada
- **Validación de tokens** en cada request
- **Rate limiting** del lado del cliente
- **Detección de ataques** XSS y SQL injection
- **Cifrado de datos sensibles** en storage local
- **Verificación de integridad** de respuestas

---

Esta arquitectura proporciona una base sólida y segura para el desarrollo de Dharaterapeutas, con todas las funcionalidades necesarias para una aplicación profesional de terapeutas.