@echo off
setlocal enabledelayedexpansion
title SafePath-AI - Backend API Server (Port 8000)
color 0A

cd /d "%~dp0"

echo ===============================================================================
echo                SafePath-AI - FastAPI Backend API Server
echo ===============================================================================
echo.

if not exist ".venv\Scripts\python.exe" (
    echo [ERROR] Virtual environment not found at .venv\Scripts\python.exe
    echo Please run setup.bat first!
    echo.
    pause
    exit /b 1
)

echo [*] Activating virtual environment...
call "%~dp0.venv\Scripts\activate.bat"

echo [*] Starting FastAPI Gateway via Uvicorn on http://0.0.0.0:8000 ...
echo [*] Interactive Docs will be at: http://localhost:8000/api/v1/docs
echo.
"%~dp0.venv\Scripts\python.exe" -m uvicorn apps.api.main:app --host 0.0.0.0 --port 8000 --reload

echo.
echo [*] Backend server stopped.
pause
