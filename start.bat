@echo off
title Freewrite - Dialogue Studio
echo ===================================================
echo               Starting Freewrite
echo     (Collab Server :1234 + Web Editor :5173)
echo ===================================================
echo.

cd /d "%~dp0"

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
)

REM Open browser after 2.5 seconds in background
start "" cmd /c "timeout /t 3 /nobreak >nul && start http://localhost:5173"
--host

echo [Running] Starting Hocuspocus Server and Web Client...
call pnpm start
