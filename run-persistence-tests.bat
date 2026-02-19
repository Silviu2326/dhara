@echo off
echo ========================================
echo Testing Persistence of Credentials and Legal Info
echo ========================================
echo.

REM Verificar que npm está instalado
where npm >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Error: npm not found. Please install Node.js
    pause
    exit /b 1
)

REM Verificar que el servidor está ejecutándose
echo 🔍 Checking if development server is running...
curl -s http://localhost:5173 >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Error: Development server is not running on http://localhost:5173
    echo Please start the server with 'npm run dev' in another terminal
    pause
    exit /b 1
)

echo ✅ Development server is running!
echo.

REM Ejecutar el test específico de persistencia
echo 🧪 Running persistence tests...
echo.
npx playwright test tests/test-persistence-credentials-legal.spec.js --headed --timeout=60000

echo.
echo ========================================
echo Tests completed!
echo ========================================
echo.
echo 📁 Check the following screenshots if tests fail:
echo   - test-persistence-success.png (if credentials persist)
echo   - test-persistence-failure.png (if credentials don't persist)
echo   - test-legal-persistence-success.png (if legal info persists)
echo   - test-legal-persistence-failure.png (if legal info doesn't persist)
echo   - test-initial-state.png (initial page state)
echo.
pause