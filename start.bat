@echo off
setlocal
title Freewrite - Dialogue Studio

cd /d "%~dp0"

REM Retrieve public IP
set "PUBLIC_IP=Unavailable"
for /f "delims=" %%I in ('curl -fsS --max-time 5 ipinfo.io/ip 2^>nul') do (
    set "PUBLIC_IP=%%I"
)

REM Display colored, centered header
powershell -NoProfile -Command ^
 "$w=51;" ^
 "$center={param($s) $s.PadLeft([int](($w+$s.Length)/2)).PadRight($w)};" ^
 "Write-Host ('='*$w) -ForegroundColor DarkCyan;" ^
 "Write-Host (&$center 'Starting Freewrite') -ForegroundColor Cyan;" ^
 "Write-Host '';" ^
 "Write-Host (&$center ('Collab server = ws://'+$env:PUBLIC_IP+':1234')) -ForegroundColor Magenta;" ^
 "Write-Host (&$center 'Web Editor = http://localhost:5173') -ForegroundColor DarkCyan;" ^
 "Write-Host '';" ^
 "Write-Host ('='*$w) -ForegroundColor DarkCyan;"

echo.
echo.

REM Check if dependencies are installed
if not exist "node_modules\" (
    echo [Setup] Installing dependencies...
    call pnpm install
    if errorlevel 1 (
        echo [Error] Failed to install dependencies. Make sure pnpm is installed.
        pause
        exit /b 1
    )
)

REM Ensure core package is built
if not exist "packages\core\dist\" (
    echo [Build] Building core package...
    call pnpm --filter @freewrite/core build
    if errorlevel 1 (
        echo [Error] Failed to build core package.
        pause
        exit /b 1
    )
)

REM Open browser after 3 seconds in background
start "" cmd /c "timeout /t 3 /nobreak >nul && start http://localhost:5173"

echo [Running] Starting Hocuspocus Server and Web Client...
call pnpm start

endlocal
