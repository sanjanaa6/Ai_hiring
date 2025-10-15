@echo off
echo ========================================
echo Starting AI Hiring Platform with System Design
echo ========================================
echo.

echo Starting Backend Server...
start cmd /k "cd backend && npm run dev"
timeout /t 3 /nobreak >nul

echo Starting Main Frontend...
start cmd /k "cd frontend && npm start"
timeout /t 3 /nobreak >nul

echo Starting System Design Standalone App...
start cmd /k "cd frontend\src\components\System-design && npm run dev"

echo.
echo ========================================
echo All services started!
echo ========================================
echo Backend:        http://localhost:5000
echo Frontend:       http://localhost:3000
echo System Design:  http://localhost:5174
echo ========================================
echo.
echo Press any key to close this window...
pause >nul
