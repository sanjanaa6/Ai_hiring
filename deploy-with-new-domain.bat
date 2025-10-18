@echo off
echo ========================================
echo AI Hiring Platform - Deploy with .in Domain
echo ========================================
echo.

echo This script will rebuild your application with the new .in domain.
echo.
echo Changes:
echo   - Old: eval8.xyz (replaced)
echo   - New: eval8.ai (current)
echo.

pause

echo.
echo [STEP 1/4] Creating production environment file...
echo.

cd frontend

if exist .env.production (
    echo Warning: .env.production already exists!
    echo Creating backup as .env.production.backup
    copy .env.production .env.production.backup >nul
)

(
echo REACT_APP_API_URL=https://aihiring.eval8.ai
echo NODE_ENV=production
) > .env.production

echo ✓ Created .env.production
type .env.production
echo.

echo [STEP 2/4] Installing/Updating dependencies...
echo.

call npm install

if %errorlevel% neq 0 (
    echo ✗ npm install failed!
    pause
    exit /b 1
)

echo.
echo [STEP 3/4] Building frontend...
echo.

call npm run build

if %errorlevel% neq 0 (
    echo ✗ Build failed!
    pause
    exit /b 1
)

echo.
echo ✓ Build completed successfully!
echo.

cd ..

echo [STEP 4/4] Verifying backend configuration...
echo.

echo Checking backend/server.js for correct CORS settings...
findstr /C:"eval8.in" backend\server.js >nul
if %errorlevel% equ 0 (
    echo ✓ Backend CORS configured for .in domain
) else (
    echo ✗ Warning: Backend may not have .in domain in CORS settings
)

echo.
echo ========================================
echo BUILD COMPLETE!
echo ========================================
echo.
echo 📦 Build location: frontend/build/
echo.
echo Next steps:
echo.
echo 1. BACKEND DEPLOYMENT:
echo    - Ensure backend is running on your server
echo    - Verify MongoDB connection
echo    - Check environment variables
echo.
echo 2. FRONTEND DEPLOYMENT:
echo    - Upload frontend/build/* to your web server
echo    - Configure HTTPS for https://aihiring.eval8.ai
echo    - Clear CDN cache if applicable
echo.
echo 3. DNS CONFIGURATION:
echo    - Point aihiring.eval8.ai to your server IP
echo    - Point pcb1.eval8.ai to PCB app (if separate)
echo    - Point systemdesign.eval8.ai to system design app (if separate)
echo.
echo 4. VERIFICATION:
echo    - Visit https://aihiring.eval8.ai
echo    - Check browser console for errors
echo    - Test login/registration
echo    - Test profile updates
echo.
echo ========================================
echo.
echo 📚 See DOMAIN_MIGRATION_SUMMARY.md for complete details
echo.
pause
