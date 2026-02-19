/**
 * Script para ejecutar los tests de edición de perfil
 * Con configuración automática del entorno
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🎭 Ejecutando tests de edición de perfil con Playwright');
console.log('='= 50);

// Función para verificar si un puerto está ocupado
async function checkPort(port) {
  try {
    const response = await fetch(`http://localhost:${port}`);
    return response.ok;
  } catch {
    return false;
  }
}

// Función para esperar a que un servidor esté listo
async function waitForServer(url, maxWait = 60000) {
  const start = Date.now();

  while (Date.now() - start < maxWait) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        return true;
      }
    } catch {
      // Servidor no listo aún
    }

    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  return false;
}

async function main() {
  console.log('🔍 Verificando prerrequisitos...');

  // Verificar que Playwright esté instalado
  const packageJsonPath = path.join(__dirname, 'package.json');
  if (fs.existsSync(packageJsonPath)) {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    const hasPlaywright = packageJson.devDependencies?.['@playwright/test'] || packageJson.dependencies?.['@playwright/test'];

    if (!hasPlaywright) {
      console.log('📦 Instalando Playwright...');
      await new Promise((resolve, reject) => {
        const install = spawn('npm', ['install', '@playwright/test'], { stdio: 'inherit' });
        install.on('close', (code) => {
          if (code === 0) resolve();
          else reject(new Error(`npm install failed with code ${code}`));
        });
      });
    }
  }

  // Verificar servidores
  console.log('🌐 Verificando servidores...');

  const frontendRunning = await checkPort(5173);
  const backendRunning = await checkPort(5000);

  if (!frontendRunning) {
    console.log('⚠️ Frontend no está corriendo en puerto 5173');
    console.log('💡 Por favor ejecuta: npm run dev');
  }

  if (!backendRunning) {
    console.log('⚠️ Backend no está corriendo en puerto 5000');
    console.log('💡 Por favor ejecuta en el directorio backend: npm start');
  }

  if (!frontendRunning || !backendRunning) {
    console.log('');
    console.log('🔧 Para ejecutar los servidores automáticamente:');
    console.log('   Terminal 1: npm run dev');
    console.log('   Terminal 2: cd backend && npm start');
    console.log('');
    console.log('⏳ Esperando a que los servidores estén listos...');

    // Esperar a que los servidores estén listos
    if (!frontendRunning) {
      console.log('   Esperando frontend...');
      await waitForServer('http://localhost:5173');
    }

    if (!backendRunning) {
      console.log('   Esperando backend...');
      await waitForServer('http://localhost:5000/health');
    }
  }

  console.log('✅ Servidores listos');
  console.log('');

  // Ejecutar tests
  console.log('🎭 Ejecutando tests de edición de perfil...');
  console.log('='= 50);

  const playwrightArgs = [
    'exec', 'playwright', 'test',
    'tests/profile-editing.spec.js',
    '--headed',  // Mostrar el navegador
    '--workers=1',  // Un test a la vez para mejor debugging
    '--reporter=list'  // Reporter detallado
  ];

  // Agregar argumentos adicionales si se pasan
  const additionalArgs = process.argv.slice(2);
  playwrightArgs.push(...additionalArgs);

  return new Promise((resolve, reject) => {
    const testProcess = spawn('npx', playwrightArgs, {
      stdio: 'inherit',
      cwd: __dirname
    });

    testProcess.on('close', (code) => {
      console.log('');

      if (code === 0) {
        console.log('✅ Todos los tests pasaron correctamente!');
        console.log('📊 Reporte disponible en: playwright-report/index.html');
        resolve();
      } else {
        console.log(`❌ Tests fallaron con código: ${code}`);
        console.log('📊 Revisa el reporte para más detalles');
        reject(new Error(`Tests failed with code ${code}`));
      }
    });

    testProcess.on('error', (error) => {
      console.error('💥 Error ejecutando tests:', error);
      reject(error);
    });
  });
}

// Ejecutar script
if (require.main === module) {
  main().catch((error) => {
    console.error('💥 Error:', error.message);
    process.exit(1);
  });
}

module.exports = { main, checkPort, waitForServer };