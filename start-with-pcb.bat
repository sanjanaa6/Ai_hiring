@echo off
echo ========================================
echo Starting AI Hiring Platform with PCB
echo ========================================
echo.

REM Start backend server
echo [1/3] Starting Backend Server...
start "Backend Server" cmd /k "cd backend && npm start"
timeout /t 3 /nobreak >nul

REM Start main frontend
echo [2/3] Starting Main Frontend (Port 3000)...
start "Main Frontend" cmd /k "cd frontend && npm start"
timeout /t 3 /nobreak >nul

REM Start PCB app
echo [3/3] Starting PCB Design Tool (Port 3001)...
start "PCB Design Tool" cmd /k "cd frontend\src\pcb && set PORT=3001 && npm start"

echo.
echo ========================================
echo All services started!
echo ========================================
echo.
echo Backend:       http://localhost:5000
echo Main App:      http://localhost:3000
echo PCB Tool:      http://localhost:3001
echo.
echo Press any key to close this window...
pause >nul
