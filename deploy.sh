#!/bin/bash

# Lovable Full-Stack Deployment Script
# This script builds and deploys both the dashboard and frontend services

set -e  # Exit on any error

echo "🚀 Starting Lovable Full-Stack Deployment"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    print_error "Docker is not running. Please start Docker and try again."
    exit 1
fi

# Check if docker-compose is available
if ! command -v docker-compose &> /dev/null; then
    print_error "docker-compose is not installed. Please install it and try again."
    exit 1
fi

print_status "Building applications..."
npm run build:all

print_status "Building Docker images..."
docker-compose build --parallel

print_status "Stopping existing services..."
docker-compose down

print_status "Starting services..."
docker-compose up -d

print_status "Waiting for services to be healthy..."
sleep 30

# Health check
if curl -f http://localhost/health > /dev/null 2>&1; then
    print_status "✅ Deployment successful!"
    print_status "🌐 Your application is running at:"
    print_status "   - Main app: http://localhost"
    print_status "   - Dashboard: http://localhost/dashboard"
    print_status "   - Admin: http://localhost/admin"
    print_status ""
    print_status "To view logs: docker-compose logs -f"
    print_status "To stop services: docker-compose down"
else
    print_error "❌ Health check failed. Check logs with: docker-compose logs"
    exit 1
fi
