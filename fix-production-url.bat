@echo off
echo ========================================
echo Production URL Fix Script
echo ========================================
echo.

echo [STEP 1] Creating correct .env.production file...
echo.

cd frontend

(
echo REACT_APP_API_URL=https://aihiring.eval8.in
echo NODE_ENV=production
) > .env.production

echo ✓ Created .env.production with correct URL
echo.

echo [STEP 2] Building frontend with correct configuration...
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

echo ========================================
echo NEXT STEPS:
echo ========================================
echo.
echo 1. Upload the contents of 'frontend/build/' to your production server
echo 2. Replace all files in the production deployment
echo 3. Clear browser cache or use hard refresh (Ctrl+Shift+R)
echo 4. Test the application
echo.
echo The build is located at: frontend/build/
echo.
echo ========================================
pause
