@echo off
setlocal enabledelayedexpansion
title SafePath-AI - Application Launcher
color 0A

cd /d "%~dp0"
set "ROOT_DIR=%cd%"

echo ===============================================================================
echo                SafePath-AI - Master Application Launcher
echo ===============================================================================
echo.

:: -----------------------------------------------------------------------------
:: Pre-flight Check: Ensure Dependencies Exist
:: -----------------------------------------------------------------------------
set "NEEDS_SETUP=0"

if not exist "%ROOT_DIR%\.venv\Scripts\python.exe" (
    echo [!] Backend virtual environment (.venv) was not found.
    set "NEEDS_SETUP=1"
)

if not exist "%ROOT_DIR%\apps\web\node_modules" (
    echo [!] Frontend dependencies (apps\web\node_modules) were not found.
    set "NEEDS_SETUP=1"
)

if "%NEEDS_SETUP%"=="1" (
    echo.
    echo [*] It looks like the initial setup has not been completed yet.
    set /p "DO_SETUP=Would you like to run setup.bat now? (Y/N): "
    if /i "!DO_SETUP!"=="Y" (
        call "%ROOT_DIR%\setup.bat"
    ) else (
        echo [ERROR] Cannot run application without setup. Please run setup.bat first.
        pause
        exit /b 1
    )
)

:: -----------------------------------------------------------------------------
:: Step 1: Launch Backend API Server (Port 8000)
:: -----------------------------------------------------------------------------
echo [*] Launching FastAPI Backend Server on port 8000...
start "SafePath-AI Backend (Port 8000)" "%ROOT_DIR%\run_backend.bat"

:: -----------------------------------------------------------------------------
:: Step 2: Launch Frontend Web App (Port 3000)
:: -----------------------------------------------------------------------------
echo [*] Launching Next.js Frontend Server on port 3000...
start "SafePath-AI Frontend (Port 3000)" "%ROOT_DIR%\run_frontend.bat"

:: -----------------------------------------------------------------------------
:: Step 3: Wait and Open Browser
:: -----------------------------------------------------------------------------
echo.
echo [*] Waiting for services to initialize...
timeout /t 4 /nobreak >nul

echo [*] Opening SafePath-AI Web UI in your default browser...
start http://localhost:3000

:MENU
cls
echo ===============================================================================
echo                     SafePath-AI :: Services Active
echo ===============================================================================
echo.
echo   * Web Application:     http://localhost:3000
echo   * Backend API:         http://localhost:8000
echo   * Interactive Docs:    http://localhost:8000/api/v1/docs
echo   * Health Check:        http://localhost:8000/api/v1/health
echo.
echo ===============================================================================
echo                               Control Menu
echo ===============================================================================
echo   [1] Open Frontend Web App in browser
echo   [2] Open Backend API Swagger Docs in browser
echo   [3] Run Backend Pytest Suite
echo   [4] Stop All SafePath-AI Servers (Free ports 8000 and 3000)
echo   [5] Restart All Servers
echo   [6] Exit this launcher console
echo ===============================================================================
echo.
set /p "CHOICE=Enter your choice [1-6]: "

if "%CHOICE%"=="1" (
    start http://localhost:3000
    goto MENU
)
if "%CHOICE%"=="2" (
    start http://localhost:8000/api/v1/docs
    goto MENU
)
if "%CHOICE%"=="3" (
    echo.
    echo [*] Running Pytest test suite...
    "%ROOT_DIR%\.venv\Scripts\python.exe" -m pytest
    echo.
    pause
    goto MENU
)
if "%CHOICE%"=="4" (
    call "%ROOT_DIR%\stop.bat" nopause
    echo [*] Servers stopped.
    pause
    goto MENU
)
if "%CHOICE%"=="5" (
    echo [*] Stopping existing servers...
    call "%ROOT_DIR%\stop.bat" nopause
    echo [*] Restarting services...
    start "SafePath-AI Backend (Port 8000)" "%ROOT_DIR%\run_backend.bat"
    start "SafePath-AI Frontend (Port 3000)" "%ROOT_DIR%\run_frontend.bat"
    timeout /t 3 /nobreak >nul
    echo [*] Services restarted!
    pause
    goto MENU
)
if "%CHOICE%"=="6" (
    exit /b 0
)

echo [!] Invalid option. Please enter a number between 1 and 6.
timeout /t 2 >nul
goto MENU
