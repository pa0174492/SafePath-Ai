@echo off
setlocal enabledelayedexpansion
title SafePath-AI - Setup Wizard
color 0B

echo ===============================================================================
echo                SafePath-AI - Automated Environment Setup Wizard
echo ===============================================================================
echo.

:: Set current directory to the script's root folder
cd /d "%~dp0"
set "ROOT_DIR=%cd%"

echo [*] Working directory: %ROOT_DIR%
echo.

:: -----------------------------------------------------------------------------
:: Step 1: Verify Python Installation
:: -----------------------------------------------------------------------------
echo [1/6] Checking Python installation...
set "PYTHON_CMD="
where python >nul 2>&1
if %ERRORLEVEL% equ 0 (
    set "PYTHON_CMD=python"
) else (
    where py >nul 2>&1
    if %ERRORLEVEL% equ 0 (
        set "PYTHON_CMD=py"
    )
)

if "%PYTHON_CMD%"=="" (
    echo [ERROR] Python was not found in your PATH!
    echo Please download and install Python 3.11 or 3.12 from:
    echo   https://www.python.org/downloads/
    echo Make sure to check the box "Add Python to PATH" during installation.
    echo.
    if "%~1" neq "nopause" pause
    exit /b 1
)

for /f "tokens=*" %%v in ('%PYTHON_CMD% --version 2^>^&1') do set "PY_VER=%%v"
echo [OK] Detected %PY_VER%
echo.

:: -----------------------------------------------------------------------------
:: Step 2: Verify Node.js and NPM Installation
:: -----------------------------------------------------------------------------
echo [2/6] Checking Node.js and npm installation...
where node >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Node.js was not found in your PATH!
    echo Please download and install Node.js [v18 or v20 LTS] from:
    echo   https://nodejs.org/
    echo.
    if "%~1" neq "nopause" pause
    exit /b 1
)

where npm >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [ERROR] npm was not found in your PATH!
    echo Please install Node.js with npm included.
    echo.
    if "%~1" neq "nopause" pause
    exit /b 1
)

for /f "tokens=*" %%v in ('node -v 2^>^&1') do set "NODE_VER=%%v"
for /f "tokens=*" %%v in ('npm -v 2^>^&1') do set "NPM_VER=%%v"
echo [OK] Detected Node.js %NODE_VER% and npm %NPM_VER%
echo.

:: -----------------------------------------------------------------------------
:: Step 3: Setup Configuration (.env files)
:: -----------------------------------------------------------------------------
echo [3/6] Configuring environment settings...

if not exist "%ROOT_DIR%\.env" (
    if exist "%ROOT_DIR%\.env.example" (
        copy /y "%ROOT_DIR%\.env.example" "%ROOT_DIR%\.env" >nul
        echo [OK] Created root .env from .env.example
    ) else (
        echo [WARNING] No .env or .env.example found in root directory.
    )
) else (
    echo [OK] Root .env already exists.
)

if not exist "%ROOT_DIR%\apps\web\.env.local" (
    if exist "%ROOT_DIR%\.env" (
        copy /y "%ROOT_DIR%\.env" "%ROOT_DIR%\apps\web\.env.local" >nul
        echo [OK] Created apps\web\.env.local from root .env
    ) else (
        echo NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1> "%ROOT_DIR%\apps\web\.env.local"
        echo [OK] Created default apps\web\.env.local
    )
) else (
    echo [OK] apps\web\.env.local already exists.
)
echo.

:: -----------------------------------------------------------------------------
:: Step 4: Setup Python Virtual Environment (.venv)
:: -----------------------------------------------------------------------------
echo [4/6] Setting up Python virtual environment...

if not exist "%ROOT_DIR%\.venv\Scripts\python.exe" (
    echo [*] Creating virtual environment at .venv ...
    %PYTHON_CMD% -m venv "%ROOT_DIR%\.venv"
    if %ERRORLEVEL% neq 0 (
        echo [ERROR] Failed to create virtual environment!
        if "%~1" neq "nopause" pause
        exit /b 1
    )
    echo [OK] Virtual environment created successfully.
) else (
    echo [OK] Virtual environment already exists.
)

set "VENV_PY=%ROOT_DIR%\.venv\Scripts\python.exe"

echo [*] Upgrading pip...
"%VENV_PY%" -m pip install --upgrade pip --quiet
echo [OK] pip upgraded.
echo.

:: -----------------------------------------------------------------------------
:: Step 5: Install Backend Dependencies
:: -----------------------------------------------------------------------------
echo [5/6] Installing backend dependencies from requirements.txt...
"%VENV_PY%" -m pip install -r "%ROOT_DIR%\requirements.txt"
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Failed to install Python dependencies!
    if "%~1" neq "nopause" pause
    exit /b 1
)
echo [OK] Python dependencies installed successfully.
echo.

:: -----------------------------------------------------------------------------
:: Step 6: Install Frontend Dependencies
:: -----------------------------------------------------------------------------
echo [6/6] Installing frontend dependencies in apps\web...
cd /d "%ROOT_DIR%\apps\web"
call npm install
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Failed to install Node.js dependencies!
    cd /d "%ROOT_DIR%"
    if "%~1" neq "nopause" pause
    exit /b 1
)
cd /d "%ROOT_DIR%"
echo [OK] Node.js dependencies installed successfully.
echo.

:: -----------------------------------------------------------------------------
:: Optional Verification: Backend Tests
:: -----------------------------------------------------------------------------
echo ===============================================================================
echo [*] Running quick backend verification tests (pytest)...
echo ===============================================================================
"%VENV_PY%" -m pytest --maxfail=1 -q
if %ERRORLEVEL% equ 0 (
    echo [SUCCESS] Backend test verification PASSED!
) else (
    echo [WARNING] Some tests did not pass or warnings occurred. You can still proceed.
)
echo.

:: -----------------------------------------------------------------------------
:: Setup Completion
:: -----------------------------------------------------------------------------
echo ===============================================================================
echo                       SETUP COMPLETED SUCCESSFULLY!
echo ===============================================================================
echo.
echo To run the application:
echo   - Double-click:  run.bat           (Starts both Backend and Frontend)
echo   - Or run:        run_backend.bat   (FastAPI Backend only, port 8000)
echo   - Or run:        run_frontend.bat  (Next.js Web UI only, port 3000)
echo   - To stop:       stop.bat          (Terminates background servers)
echo.
echo ===============================================================================
if "%~1" neq "nopause" pause
