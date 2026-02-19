# Leer prompts (separados por lineas con "---" o lineas en blanco dobles)
Write-Host "Leyendo archivo prompts.txt..." -ForegroundColor Cyan
$promptsRaw = Get-Content -Raw -Encoding UTF8 -Path ".\prompts.txt"

# Primero intentar separar por "---", si no hay, usar lineas en blanco dobles
Write-Host "Procesando prompts..." -ForegroundColor Cyan
if ($promptsRaw -match "(?m)^---\s*$") {
    Write-Host "   Detectados separadores '---'" -ForegroundColor Green
    $prompts = $promptsRaw -split "(?m)^---\s*$" | Where-Object { $_.Trim().Length -gt 0 }
} else {
    Write-Host "   No se encontraron separadores '---', usando lineas en blanco" -ForegroundColor Yellow
    $prompts = $promptsRaw -split "(\r?\n){2,}" | Where-Object { $_.Trim().Length -gt 0 }
}

Write-Host "Total de prompts encontrados: $($prompts.Count)" -ForegroundColor Magenta
if ($prompts.Count -eq 0) {
    Write-Error "No hay prompts en prompts.txt"
    exit 1
}

# Mostrar preview de cada prompt y extraer títulos
$promptTitles = @()
for ($i = 0; $i -lt $prompts.Count; $i++) {
    $firstLine = ($prompts[$i] -split "`n")[0]
    $preview = $firstLine.Substring(0, [Math]::Min(80, $firstLine.Length))
    Write-Host "   Prompt $($i+1): $preview..." -ForegroundColor Gray

    # Extraer título del prompt (buscar palabras clave)
    if ($firstLine -match "ClientPlanProgress") {
        $promptTitles += "ClientPlanProgress Model"
    } elseif ($firstLine -match "SessionNote") {
        $promptTitles += "SessionNote Model"
    } else {
        # Extraer primera palabra después de "modelo" o usar primera línea truncada
        if ($firstLine -match "modelo\s+(\w+)") {
            $promptTitles += "$($Matches[1]) Model"
        } else {
            $promptTitles += $firstLine.Substring(0, [Math]::Min(30, $firstLine.Length))
        }
    }
}

# Carpeta de logs
Write-Host "Preparando directorio de logs..." -ForegroundColor Cyan
$logDir = Join-Path (Get-Location) "logs"
if (-not (Test-Path $logDir)) {
    New-Item -ItemType Directory -Path $logDir | Out-Null
    Write-Host "   Directorio 'logs' creado" -ForegroundColor Green
} else {
    Write-Host "   Directorio 'logs' ya existe" -ForegroundColor Green
}
$ts = Get-Date -Format "yyyyMMdd-HHmmss"
Write-Host "Timestamp de sesion: $ts" -ForegroundColor Magenta

Write-Host "`nIniciando ejecucion de prompts..." -ForegroundColor Yellow
Write-Host "============================================================" -ForegroundColor DarkGray

# 1er turno: arranca sesion en este directorio
$currentPrompt = ($prompts[0] -split "`n")[0].Substring(0, [Math]::Min(50, ($prompts[0] -split "`n")[0].Length))
Write-Host "Turno 1/$($prompts.Count): $currentPrompt..." -ForegroundColor Yellow
Write-Host "   Prompt: Implementando '$($promptTitles[0])'" -ForegroundColor White
Write-Host "   Inicio: $(Get-Date -Format 'HH:mm:ss')" -ForegroundColor Gray
$logFile1 = Join-Path $logDir "$ts-turn1.json"
Write-Host "   Log: $logFile1" -ForegroundColor Gray

& claude -p $prompts[0] --permission-mode acceptEdits --allowedTools "Edit(**)" "Read(**)" "Bash(npm:*)" "Bash(git:*)" --max-turns 50 --output-format json --model sonnet | Tee-Object -FilePath $logFile1 | Out-Null

Write-Host "   Turno 1 completado a las $(Get-Date -Format 'HH:mm:ss')" -ForegroundColor Green
Write-Host "------------------------------------------------------------" -ForegroundColor DarkGray

# Siguientes turnos: continuan la misma conversacion de este directorio
for ($i = 1; $i -lt $prompts.Count; $i++) {
    $currentPrompt = ($prompts[$i] -split "`n")[0].Substring(0, [Math]::Min(50, ($prompts[$i] -split "`n")[0].Length))
    Write-Host "Turno $($i+1)/$($prompts.Count): $currentPrompt..." -ForegroundColor Yellow
    Write-Host "   Prompt: Implementando '$($promptTitles[$i])'" -ForegroundColor White
    Write-Host "   Inicio: $(Get-Date -Format 'HH:mm:ss')" -ForegroundColor Gray
    $logFile = Join-Path $logDir "$ts-turn$($i+1).json"
    Write-Host "   Log: $logFile" -ForegroundColor Gray

    & claude --continue -p $prompts[$i] --permission-mode acceptEdits --allowedTools "Edit(**)" "Read(**)" "Bash(npm:*)" "Bash(git:*)" --max-turns 50 --output-format json --model sonnet | Tee-Object -FilePath $logFile | Out-Null

    Write-Host "   Turno $($i+1) completado a las $(Get-Date -Format 'HH:mm:ss')" -ForegroundColor Green
    Write-Host "------------------------------------------------------------" -ForegroundColor DarkGray
}

Write-Host "`nProceso completado!" -ForegroundColor Green
Write-Host "Resumen:" -ForegroundColor Cyan
Write-Host "   Total de prompts ejecutados: $($prompts.Count)" -ForegroundColor White
Write-Host "   Modelos implementados: $($promptTitles -join ', ')" -ForegroundColor White
Write-Host "   Logs guardados en: $logDir" -ForegroundColor White
Write-Host "   Timestamp de sesion: $ts" -ForegroundColor White
Write-Host "`nRevisa la carpeta logs para ver los detalles de cada implementacion." -ForegroundColor Yellow