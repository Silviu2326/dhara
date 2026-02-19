# 🎭 Tests de Edición de Perfil Profesional con Playwright

Este directorio contiene tests automatizados completos para verificar la funcionalidad de edición del perfil profesional en Dharaterapeutas.

## 🚀 Ejecución Rápida

### Opción 1: Script Automático (Recomendado)
```bash
# Windows
run-profile-tests.bat

# Linux/Mac
node run-profile-tests.js
```

### Opción 2: Playwright Directo
```bash
# Instalar Playwright si no está instalado
npm install @playwright/test
npx playwright install

# Ejecutar tests
npx playwright test tests/profile-editing.spec.js --headed
```

## 📋 Prerrequisitos

### 🔧 Servidores Requeridos
Antes de ejecutar los tests, asegúrate de que estos servidores estén corriendo:

1. **Frontend** (puerto 5173):
   ```bash
   npm run dev
   ```

2. **Backend** (puerto 5000):
   ```bash
   cd backend
   npm start
   ```

### 🔐 Autenticación
Los tests usan un **token JWT válido** configurado automáticamente:
- **Token**: Firmado con la clave secreta real del backend
- **Usuario**: Admin Demo (ID: `68ce20c17931a40b74af366a`)
- **Configuración**: Automática en cada test

## 🧪 Tests Incluidos

### ✅ Tests Principales

| Test | Descripción | Funcionalidad |
|------|-------------|---------------|
| **Carga de Página** | Verifica que la página de perfil carga correctamente | Navegación básica |
| **Editar Descripción** | Prueba editar el campo de descripción profesional | Textarea editing |
| **Agregar Credencial** | Verifica agregar nueva credencial educativa | Form submission |
| **Editar Tarifas** | Prueba cambiar precios de sesiones | Number inputs |
| **Cambiar Disponibilidad** | Verifica toggle de disponibilidad | Switch/checkbox |
| **Agregar Ubicación** | Prueba agregar nueva ubicación de trabajo | Complex form |
| **Flujo Completo** | Test end-to-end de edición y guardado | Full workflow |
| **Manejo de Errores** | Verifica comportamiento con errores de red | Error handling |

### 📱 Tests Adicionales

- **Responsividad Mobile**: Verifica funcionamiento en viewport móvil
- **Rendimiento**: Mide tiempo de carga (debe ser < 5 segundos)
- **Accesibilidad**: Verifica elementos accesibles básicos

## 🎯 Funciones Verificadas

### 🔍 **Carga de Datos**
- ✅ Información personal (avatar, banner, nombre)
- ✅ Descripción profesional y especialidades
- ✅ Credenciales y experiencia
- ✅ Ubicaciones de trabajo y horarios
- ✅ Tarifas y paquetes de precios
- ✅ Video presentación y enlaces externos
- ✅ Testimonios y reseñas

### ✏️ **Edición de Campos**
- ✅ Textarea de descripción profesional
- ✅ Formularios de credenciales
- ✅ Campos numéricos de tarifas
- ✅ Switches de disponibilidad
- ✅ Formularios complejos de ubicaciones

### 💾 **Guardado y Persistencia**
- ✅ Indicadores de guardado en progreso
- ✅ Confirmación de guardado exitoso
- ✅ Manejo de errores de guardado
- ✅ Validación de datos

## 📊 Reportes de Tests

Después de ejecutar los tests, encontrarás reportes en:

- **HTML Report**: `playwright-report/index.html`
- **JSON Results**: `test-results/results.json`
- **JUnit XML**: `test-results/junit.xml`
- **Screenshots**: `test-results/` (solo en fallos)
- **Videos**: `test-results/` (solo en fallos)

## 🛠️ Configuración Avanzada

### 🎛️ Opciones de Ejecución

```bash
# Solo un browser específico
npx playwright test --project chromium

# Modo debug (paso a paso)
npx playwright test --debug

# Solo tests que contienen cierta palabra
npx playwright test --grep "descripción"

# Ejecutar en paralelo
npx playwright test --workers 4

# Generar reporte sin ejecutar tests
npx playwright show-report
```

### 🔧 Configuración de Browser

Los tests están configurados para ejecutarse en:
- ✅ **Chromium** (Chrome)
- ✅ **Firefox**
- ✅ **Webkit** (Safari)
- ✅ **Mobile Chrome** (Pixel 5)
- ✅ **Mobile Safari** (iPhone 12)
- ✅ **Microsoft Edge**

### 📱 Viewports Testados

- **Desktop**: 1280x720
- **Mobile**: 375x667 (iPhone)
- **Tablet**: 768x1024 (iPad)

## 🐛 Troubleshooting

### ❌ Problemas Comunes

| Error | Solución |
|-------|----------|
| `ECONNREFUSED localhost:5173` | Ejecutar `npm run dev` |
| `ECONNREFUSED localhost:5000` | Ejecutar `cd backend && npm start` |
| `Authentication failed` | El token se configura automáticamente |
| `Element not found` | Esperar más tiempo o verificar selectores |
| `Test timeout` | Aumentar timeout en config |

### 🔍 Debug Mode

Para debuggear un test específico:

```bash
# Modo debug interactivo
npx playwright test tests/profile-editing.spec.js --debug

# Con browser visible
npx playwright test tests/profile-editing.spec.js --headed --slowMo=1000

# Con logging detallado
DEBUG=pw:api npx playwright test tests/profile-editing.spec.js
```

## 📈 Métricas de Success

Los tests verifican:

- ✅ **Carga**: Página carga en < 5 segundos
- ✅ **Funcionalidad**: Todas las ediciones funcionan
- ✅ **Navegación**: Sin errores de navegación
- ✅ **Responsividad**: Funciona en mobile
- ✅ **Accesibilidad**: Elementos básicos accesibles
- ✅ **Errores**: Manejo graceful de errores de red

## 🔄 Integración Continua

Para integrar en CI/CD:

```yaml
# GitHub Actions ejemplo
- name: Run Profile Tests
  run: |
    npm install
    npm run dev &
    cd backend && npm start &
    npx playwright test tests/profile-editing.spec.js
```

---

🎯 **¡Ejecuta `run-profile-tests.bat` y verifica que todo funciona!**