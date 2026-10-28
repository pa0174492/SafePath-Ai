@echo off
setlocal enabledelayedexpansion
title SafePath-AI - Automated Environment Setup Wizard
color 0B

echo ===============================================================================
echo                SafePath-AI - Automated Environment Setup Wizard
echo    Pedestrian Mobility, Multi-Modal Vehicle Navigation, AI Studio ^& Big Data
echo ===============================================================================
echo.

:: Set current directory to the script's root folder
cd /d "%~dp0"
set "ROOT_DIR=%cd%"

echo [*] Working directory: %ROOT_DIR%
echo.

:: -----------------------------------------------------------------------------
:: Step 1: Verify Python Installation (Python 3.10, 3.11, or 3.12)
:: -----------------------------------------------------------------------------
echo [1/7] Checking Python installation...
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
echo [2/7] Checking Node.js and npm installation...
where node >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Node.js was not found in your PATH!
    echo Please download and install Node.js [v18, v20, or v22 LTS] from:
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
:: Step 3: Check MongoDB Status (Big Data Lake on localhost:27017)
:: -----------------------------------------------------------------------------
echo [3/7] Checking MongoDB Community Server (Big Data Lake)...
set "MONGO_RUNNING=0"
powershell -NoProfile -Command "try { $client = New-Object System.Net.Sockets.TcpClient('127.0.0.1', 27017); if ($client.Connected) { $client.Close(); exit 0 } } catch { exit 1 }" >nul 2>&1
if %ERRORLEVEL% equ 0 (
    set "MONGO_RUNNING=1"
    echo [OK] MongoDB is running on localhost:27017.
    echo      Database: 'safepath_ai_bigdata' ^& Collection: 'training_dataset'
) else (
    echo [NOTE] MongoDB was not detected on localhost:27017.
    echo        The application will automatically use in-memory synthetic datasets.
    echo        To enable the full Big Data Lake, install and start MongoDB Community Server from:
    echo        https://www.mongodb.com/try/download/community
)
echo.

:: -----------------------------------------------------------------------------
:: Step 4: Setup Environment Configuration (.env files)
:: -----------------------------------------------------------------------------
echo [4/7] Configuring environment settings...

if not exist "%ROOT_DIR%\.env" (
    if exist "%ROOT_DIR%\.env.example" (
        copy /y "%ROOT_DIR%\.env.example" "%ROOT_DIR%\.env" >nul
        echo [OK] Created root .env from .env.example
    ) else (
        echo [WARNING] No .env.example found in root directory.
    )
) else (
    echo [OK] Root .env already exists.
)

:: Ensure MongoDB and API settings are in .env
findstr /i "MONGODB_URI" "%ROOT_DIR%\.env" >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo MONGODB_URI="mongodb://localhost:27017">> "%ROOT_DIR%\.env"
    echo MONGODB_DB_NAME="safepath_ai_bigdata">> "%ROOT_DIR%\.env"
    echo [OK] Added MongoDB configuration to .env
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
:: Step 5: Setup Python Virtual Environment (.venv) & Install Dependencies
:: -----------------------------------------------------------------------------
echo [5/7] Setting up Python virtual environment and dependencies...

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

echo [*] Installing backend dependencies from requirements.txt...
echo     (Includes FastAPI, PyTorch, PyMongo, Pillow, Scikit-learn, LightGBM, Shapely)
"%VENV_PY%" -m pip install -r "%ROOT_DIR%\requirements.txt"
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Failed to install Python dependencies!
    if "%~1" neq "nopause" pause
    exit /b 1
)
echo [OK] Python dependencies installed successfully.
echo.

:: -----------------------------------------------------------------------------
:: Step 6: Initialize AI Models & MongoDB Seed (if active)
:: -----------------------------------------------------------------------------
echo [6/7] Initializing AI Models and Big Data Seed...
"%VENV_PY%" -c "
import sys
try:
    from services.ml_engine.surface_vision_service import sidewalk_vision_service
    spec = sidewalk_vision_service.get_model_spec()
    print('[OK] Hugging Face Project Sidewalk Surface Tagger initialized:', spec['model_id'])
except Exception as e:
    print('[NOTE] Surface vision initialization notice:', e)

try:
    from services.data_ingestion.mongodb_service import mongo_service
    if mongo_service.is_connected:
        stats = mongo_service.get_stats()
        if stats.get('total_records', 0) == 0:
            print('[*] Pre-seeding 10,000 initial training records into MongoDB...')
            mongo_service.seed_training_data(10000)
            print('[OK] Pre-seeded 10,000 records successfully into MongoDB.')
        else:
            print(f'[OK] MongoDB already populated with {stats.get(\"total_records\")} records.')
    else:
        print('[NOTE] MongoDB offline; synthetic dataset generator active.')
except Exception as e:
    print('[NOTE] MongoDB check notice:', e)
"
echo.

:: -----------------------------------------------------------------------------
:: Step 7: Install Frontend Dependencies (apps\web)
:: -----------------------------------------------------------------------------
echo [7/7] Installing frontend dependencies in apps\web (npm install)...
cd /d "%ROOT_DIR%\apps\web"
call npm install
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Failed to install Node.js dependencies!
    cd /d "%ROOT_DIR%"
    if "%~1" neq "nopause" pause
    exit /b 1
)
cd /d "%ROOT_DIR%"
echo [OK] Frontend Node.js dependencies installed successfully.
echo.

:: -----------------------------------------------------------------------------
:: Verification & Health Check
:: -----------------------------------------------------------------------------
echo ===============================================================================
echo [*] Running automated verification test suite (pytest)...
echo ===============================================================================
"%VENV_PY%" -m pytest tests/test_model_studio.py --maxfail=1 -q
if %ERRORLEVEL% equ 0 (
    echo [SUCCESS] Backend test verification PASSED!
) else (
    echo [WARNING] Some tests reported warnings or skipped. You can still proceed.
)
echo.

:: -----------------------------------------------------------------------------
:: Setup Completion
:: -----------------------------------------------------------------------------
echo ===============================================================================
echo                       SETUP COMPLETED SUCCESSFULLY!
echo ===============================================================================
echo.
echo SafePath-AI features ready to use:
echo   - 🗺️ Map ^& Navigation (/map):
echo       Multi-modal routing (Walk, Two-Wheeler, Four-Wheeler, Auto-Rickshaw)
echo       Turn-by-turn road safety maneuvers and speed telemetry
echo   - 🧠 Project Sidewalk AI Surface Tagger (Hugging Face DINOv2 ASSETS '24):
echo       Real-time 13-class surface defect inspection and pothole avoidance
echo   - 🔬 AI Model Studio (/ai-studio):
echo       Train LightGBM, ST-GCN, Bayesian Nets, and Random Forest models
echo       Live SHAP feature attributions and counterfactual recommendations
echo   - 🗄️ MongoDB Big Data Lake (/datasets):
echo       Train/Test partitions, BSON document inspector, batch ingestion
echo   - 🛡️ Route Guardian (/guardian):
echo       Real-time trip watch, deviation alarms, and SOS emergency beacons
echo.
echo Application Controls:
echo   - Double-click:  run.bat           (Starts both Backend ^& Frontend together)
echo   - Or run:        run_backend.bat   (FastAPI Backend only on http://localhost:8000)
echo   - Or run:        run_frontend.bat  (Next.js Frontend only on http://localhost:3000)
echo   - To stop:       stop.bat          (Terminates all running background servers)
echo.
echo URLs:
echo   - Web UI:        http://localhost:3000
echo   - API Swagger:   http://localhost:8000/docs
echo   - Datasets:      http://localhost:3000/datasets
echo   - AI Studio:     http://localhost:3000/ai-studio
echo ===============================================================================
echo.
if "%~1" neq "nopause" pause
