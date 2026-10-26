@echo off
title SafePath-AI - Stop Services
color 0C

echo ===============================================================================
echo                SafePath-AI - Stopping Running Services
echo ===============================================================================
echo.

echo [*] Checking and terminating active processes on ports 8000 and 3000...
powershell -NoProfile -ExecutionPolicy Bypass -Command "$ports = @(8000, 3000); $found = $false; foreach ($p in $ports) { $procs = Get-NetTCPConnection -LocalPort $p -State Listen -ErrorAction SilentlyContinue; foreach ($conn in $procs) { $pidToKill = $conn.OwningProcess; if ($pidToKill -gt 0) { Write-Host \"[*] Terminating process on port $p (PID: $pidToKill)...\"; Stop-Process -Id $pidToKill -Force -ErrorAction SilentlyContinue; $found = $true } } }; if (-not $found) { Write-Host '[*] No active servers found listening on ports 8000 or 3000.' } else { Write-Host '[OK] Servers on ports 8000 and 3000 have been stopped.' }"

echo.
echo ===============================================================================
if "%~1" neq "nopause" (
    pause
)
