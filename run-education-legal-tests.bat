@echo off
echo Running Education and Legal Information Tests...
echo.

REM Verificar que npm está instalado
where npm >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo Error: npm not found. Please install Node.js
    pause
    exit /b 1
)

REM Verificar que el servidor está ejecutándose
echo Checking if development server is running...
curl -s http://localhost:5173 >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo Error: Development server is not running on http://localhost:5173
    echo Please start the server with 'npm run dev' in another terminal
    pause
    exit /b 1
)

echo Development server is running!
echo.

REM Ejecutar los tests específicos
echo Running education and legal information tests...
npx playwright test tests/test-profile-education-legal.spec.js --headed

echo.
echo Tests completed!
pause