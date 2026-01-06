#!/bin/bash

# AMAC Revenue System Validation Script
# Run this after deployment to ensure the unified system works

set -e

echo "🔍 Starting AMAC Revenue System Validation"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_success() { echo -e "${GREEN}✅ $1${NC}"; }
print_error() { echo -e "${RED}❌ $1${NC}"; }
print_warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }
print_info() { echo -e "${BLUE}ℹ️  $1${NC}"; }

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    print_error "Docker is not running"
    exit 1
fi

print_info "Docker is running"

# Check unified container
echo "Checking unified container..."
if docker-compose ps | grep -q "amac-revenue-app"; then
    print_success "AMAC Revenue container is running"
else
    print_error "AMAC Revenue container is not running"
    exit 1
fi

# Check health endpoint
echo "Checking health endpoint..."
if curl -f http://localhost/health > /dev/null 2>&1; then
    print_success "Health check passed"
else
    print_error "Health check failed"
fi

# Check all unified routes
echo "Checking unified routing..."

if curl -f http://localhost/ > /dev/null 2>&1; then
    print_success "Public homepage works"
else
    print_error "Public homepage failed"
fi

if curl -f http://localhost/services > /dev/null 2>&1; then
    print_success "Services page works"
else
    print_error "Services page failed"
fi

if curl -f http://localhost/dashboard > /dev/null 2>&1; then
    print_success "User dashboard routing works"
else
    print_error "User dashboard routing failed"
fi

if curl -f http://localhost/admin > /dev/null 2>&1; then
    print_success "Admin dashboard routing works"
else
    print_error "Admin dashboard routing failed"
fi

if curl -f http://localhost/auth > /dev/null 2>&1; then
    print_success "Auth page routing works"
else
    print_error "Auth page routing failed"
fi

# Check security headers
echo "Checking security headers..."
HEADERS=$(curl -I http://localhost/ 2>/dev/null | grep -E "(X-Frame-Options|X-Content-Type-Options|Strict-Transport-Security)" | wc -l)
if [ "$HEADERS" -ge 3 ]; then
    print_success "Security headers are present"
else
    print_warning "Some security headers missing"
fi

# Check environment variables
echo "Checking environment variables..."
if docker exec amac-revenue-app env | grep -q "VITE_SUPABASE_URL"; then
    print_success "Supabase URL configured"
else
    print_error "Supabase URL missing"
fi

if docker exec amac-revenue-app env | grep -q "VITE_PAYSTACK_PUBLIC_KEY"; then
    print_success "Paystack key configured"
else
    print_error "Paystack key missing"
fi

# Performance check
echo "Checking performance..."
IMAGE_SIZE=$(docker images amac-revenue-app --format "table {{.Size}}" | tail -n 1)
print_info "Unified image size: $IMAGE_SIZE"

echo
print_success "Unified System Validation Complete!"
echo
echo "🌐 Your AMAC Revenue System is running at:"
echo "   - Public Portal: http://localhost"
echo "   - User Dashboard: http://localhost/dashboard (after login)"
echo "   - Admin Panel: http://localhost/admin (admin login required)"
echo
echo "Next steps:"
echo "1. Test real-time features in browser"
echo "2. Check browser console for WebSocket connections"
echo "3. Verify payments work end-to-end"
echo "4. Monitor logs: docker-compose logs -f"
