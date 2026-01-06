@echo off
REM Lovable Full-Stack Deployment Script for Windows
REM This script builds and deploys both the dashboard and frontend services

echo 🚀 Starting Lovable Full-Stack Deployment

REM Check if Docker is running
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker is not running. Please start Docker and try again.
    exit /b 1
)

REM Check if docker-compose is available
docker-compose --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ docker-compose is not installed. Please install it and try again.
    exit /b 1
)

echo 📦 Building applications...
call npm run build:all

echo 🐳 Building Docker images...
docker-compose build

echo 🛑 Stopping existing services...
docker-compose down

echo ▶️  Starting services...
docker-compose up -d

echo ⏳ Waiting for services to be healthy...
timeout /t 30 /nobreak >nul

REM Health check
curl -f http://localhost/health >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Deployment successful!
    echo 🌐 Your application is running at:
    echo    - Main app: http://localhost
    echo    - Dashboard: http://localhost/dashboard
    echo    - Admin: http://localhost/admin
    echo.
    echo To view logs: docker-compose logs -f
    echo To stop services: docker-compose down
) else (
    echo ❌ Health check failed. Check logs with: docker-compose logs
    exit /b 1
)
