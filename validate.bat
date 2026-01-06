@echo off
REM AMAC Revenue System Validation Script for Windows

echo 🔍 Starting AMAC Revenue System Validation

REM Check if Docker is running
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker is not running
    exit /b 1
)

echo ℹ️  Docker is running

REM Check unified container
echo Checking unified container...
docker-compose ps | findstr amac-revenue-app >nul
if %errorlevel% equ 0 (
    echo ✅ AMAC Revenue container is running
) else (
    echo ❌ AMAC Revenue container is not running
    exit /b 1
)

REM Check health endpoint
echo Checking health endpoint...
curl -f http://localhost/health >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Health check passed
) else (
    echo ❌ Health check failed
)

REM Check all routes
echo Checking unified routing...

curl -f http://localhost/ >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Public homepage works
) else (
    echo ❌ Public homepage failed
)

curl -f http://localhost/services >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Services page works
) else (
    echo ❌ Services page failed
)

curl -f http://localhost/dashboard >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ User dashboard routing works
) else (
    echo ❌ User dashboard routing failed
)

curl -f http://localhost/admin >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Admin dashboard routing works
) else (
    echo ❌ Admin dashboard routing failed
)

curl -f http://localhost/auth >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Auth page routing works
) else (
    echo ❌ Auth page routing failed
)

REM Check security headers
echo Checking security headers...
curl -I http://localhost/ 2>nul | findstr /C:"X-Frame-Options" >nul
if %errorlevel% equ 0 (
    echo ✅ Security headers are present
) else (
    echo ⚠️  Some security headers missing
)

REM Check environment variables
echo Checking environment variables...
docker exec amac-revenue-app env | findstr VITE_SUPABASE_URL >nul
if %errorlevel% equ 0 (
    echo ✅ Supabase URL configured
) else (
    echo ❌ Supabase URL missing
)

docker exec amac-revenue-app env | findstr VITE_PAYSTACK_PUBLIC_KEY >nul
if %errorlevel% equ 0 (
    echo ✅ Paystack key configured
) else (
    echo ❌ Paystack key missing
)

REM Performance check
echo Checking performance...
for /f "tokens=*" %%i in ('docker images amac-revenue-app --format "{{.Size}}"') do set IMAGE_SIZE=%%i
echo ℹ️  Image size: %IMAGE_SIZE%

echo.
echo ✅ Unified System Validation Complete!
echo.
echo 🌐 Your AMAC Revenue System is running at:
echo    - Public Portal: http://localhost
echo    - User Dashboard: http://localhost/dashboard (after login)
echo    - Admin Panel: http://localhost/admin (admin login required)
echo.
echo Next steps:
echo 1. Test real-time features in browser
echo 2. Check browser console for WebSocket connections
echo 3. Verify payments work end-to-end
echo 4. Monitor logs: docker-compose logs -f
