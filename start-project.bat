@echo off
setlocal enabledelayedexpansion

echo ========================================
echo AI Hiring Platform - Startup Script
echo ========================================
echo.

REM Check if MongoDB is running
echo [STEP 1/4] Checking MongoDB...
echo.

REM Try to connect to MongoDB
powershell -Command "try { $null = New-Object System.Net.Sockets.TcpClient('localhost', 27017); Write-Host '✓ MongoDB is running on port 27017' -ForegroundColor Green; exit 0 } catch { Write-Host '✗ MongoDB is NOT running!' -ForegroundColor Red; exit 1 }"

if %errorlevel% neq 0 (
    echo.
    echo ========================================
    echo MONGODB NOT DETECTED
    echo ========================================
    echo.
    echo MongoDB is required to run this application.
    echo.
    echo Please install MongoDB using one of these options:
    echo.
    echo Option 1: Install MongoDB Community Server
    echo   - Download: https://www.mongodb.com/try/download/community
    echo   - Install as Windows Service
    echo   - Default port: 27017
    echo.
    echo Option 2: Use Docker
    echo   - Install Docker Desktop: https://www.docker.com/products/docker-desktop
    echo   - Run: docker run -d -p 27017:27017 --name mongodb mongo:6.0
    echo.
    echo After installing MongoDB, run this script again.
    echo.
    echo Press any key to open MongoDB download page...
    pause >nul
    start https://www.mongodb.com/try/download/community
    exit /b 1
)

echo.
echo [STEP 2/4] Checking Node.js and npm...
echo.

where node >nul 2>&1
if %errorlevel% neq 0 (
    echo ✗ Node.js is not installed!
    echo Please install Node.js from: https://nodejs.org/
    pause
    exit /b 1
)

node --version
npm --version
echo ✓ Node.js and npm are installed
echo.

echo [STEP 3/4] Checking dependencies...
echo.

REM Check if backend node_modules exists
if not exist "backend\node_modules\" (
    echo Installing backend dependencies...
    cd backend
    call npm install
    cd ..
) else (
    echo ✓ Backend dependencies already installed
)

REM Check if frontend node_modules exists
if not exist "frontend\node_modules\" (
    echo Installing frontend dependencies...
    cd frontend
    call npm install
    cd ..
) else (
    echo ✓ Frontend dependencies already installed
)

echo.
echo [STEP 4/4] Starting services...
echo.

REM Check if .env file exists
if not exist "backend\.env" (
    echo ⚠ Warning: backend\.env file not found!
    echo Creating default .env file...
    (
        echo PORT=5000
        echo NODE_ENV=development
        echo MONGODB_URI=mongodb://localhost:27017/ai-hiring
        echo JWT_SECRET=dev-secret-key-change-in-production
        echo FRONTEND_URL=http://localhost:3000
        echo CLIENT_URL=http://localhost:3000
        echo OPENAI_API_KEY=
        echo GEMINI_API_KEY=
    ) > backend\.env
    echo ✓ Default .env file created
    echo.
)

echo ========================================
echo Starting Backend Server...
echo ========================================
start "Backend Server [Port 5000]" cmd /k "cd backend && npm run dev"
timeout /t 5 /nobreak >nul

echo.
echo ========================================
echo Starting Frontend Application...
echo ========================================
start "Frontend App [Port 3000]" cmd /k "cd frontend && npm start"
timeout /t 3 /nobreak >nul

echo.
echo ========================================
echo ALL SERVICES STARTED!
echo ========================================
echo.
echo 📱 Main Application:  http://localhost:3000
echo 🔧 Backend API:       http://localhost:5000
echo 🏥 Health Check:      http://localhost:5000/api/health
echo.
echo Default Admin Login:
echo   Email:    admin@example.com
echo   Password: admin123
echo.
echo ⚠ IMPORTANT: If this is your first time running the app,
echo   you need to seed the admin user:
echo   1. Open a new terminal
echo   2. Run: cd backend
echo   3. Run: node scripts/seedAdmin.js
echo.
echo 📚 Full setup instructions: SETUP_INSTRUCTIONS.md
echo.
echo ========================================
echo.
echo This window can be closed. Services are running in separate windows.
echo.
pause

