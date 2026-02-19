@echo off
echo 🎭 Ejecutando tests de edicion de perfil con Playwright
echo ================================================

echo 📋 Verificando Node.js...
node --version
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Node.js no esta instalado
    pause
    exit /b 1
)

echo 📋 Verificando npm...
npm --version
if %ERRORLEVEL% NEQ 0 (
    echo ❌ npm no esta disponible
    pause
    exit /b 1
)

echo 🚀 Iniciando script de tests...
node run-profile-tests.js %*

echo.
echo ✨ Proceso completado
pause