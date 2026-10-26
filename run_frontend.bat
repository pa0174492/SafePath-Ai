@echo off
setlocal enabledelayedexpansion
title SafePath-AI - Frontend Web Server (Port 3000)
color 09

cd /d "%~dp0apps\web"

echo ===============================================================================
echo                SafePath-AI - Next.js Frontend Web Server
echo ===============================================================================
echo.

if not exist "node_modules" (
    echo [ERROR] Frontend node_modules not found in apps\web!
    echo Please run setup.bat first!
    echo.
    pause
    exit /b 1
)

echo [*] Starting Next.js Dev Server on http://localhost:3000 ...
echo.
call npm run dev

echo.
echo [*] Frontend server stopped.
pause
