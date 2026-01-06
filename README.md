# Lovable Full-Stack Application

A complete full-stack application combining a React dashboard and frontend website, containerized with Docker for easy deployment and scaling.

## 🏗️ Architecture

- **Dashboard** (`/dashboard/*`, `/admin/*`) - Admin panel and user dashboard
- **Frontend** (`/*`) - Public website with services and payments
- **Nginx** - Reverse proxy routing requests to appropriate services
- **Supabase** - Backend services (database, auth, functions)

## 🚀 Quick Start

### Prerequisites

- Docker and Docker Compose
- Node.js 18+ (for local development)
- npm or yarn

### 1. Clone and Setup

```bash
# Install all dependencies
npm run install:all

# Or install individually
npm run install:dashboard
npm run install:frontend
```

### 2. Environment Configuration

Copy the environment example files and configure your settings:

```bash
# Root level environment for Docker
cp env-example-docker .env

# Individual service environments for development
cp Dashboard/env-example Dashboard/.env
cp frontend/env-example frontend/.env
```

Edit the `.env` files with your actual values:
- **Required:** Supabase URL and anon key
- **Frontend:** Paystack public key
- **Docker:** All variables are passed as build args

**Critical:** Make sure your Supabase project has real-time enabled for WebSocket connections to work!

### 3. Development

```bash
# Run both services locally (different terminals)
npm run dev:dashboard  # Runs on http://localhost:8081
npm run dev:frontend   # Runs on http://localhost:8082

# Or run both concurrently
npm run dev
```

### 4. Production Build

```bash
# Build all services
npm run build:all

# Or build individually
npm run build:dashboard
npm run build:frontend
```

### 5. Comprehensive Testing Guide

#### **Phase 1: Development Mode Testing**
```bash
# Start development servers
npm run dev

# Test individual services
curl http://localhost:8081  # Dashboard (should return HTML)
curl http://localhost:8082  # Frontend (should return HTML)

# Check console for errors and Supabase connections
# Open browser dev tools > Network tab > Check for WebSocket connections
```

#### **Phase 2: Docker Production Testing**
```bash
# Deploy with Docker
npm run deploy

# Check all containers are running
docker ps

# Test unified routing through nginx (port 80)
curl http://localhost/           # Frontend homepage
curl http://localhost/dashboard  # Dashboard (should work!)
curl http://localhost/admin      # Admin panel

# Test health endpoints
curl http://localhost/health     # Nginx health
curl http://localhost:8081/health # Dashboard health
curl http://localhost:8082/health # Frontend health
```

#### **Phase 3: Real-Time Features Testing**
```bash
# Test Supabase real-time (critical!)
# 1. Open admin dashboard in one browser tab
# 2. Make a payment on frontend in another tab
# 3. Watch admin dashboard update in real-time

# Check browser console for WebSocket errors
# Should see: "WebSocket connection established"
```

#### **Phase 4: Environment Variables Validation**
```bash
# Check env vars are baked into containers
docker exec lovable-dashboard env | grep VITE
docker exec lovable-frontend env | grep VITE

# Should show your Supabase URL and keys
```

#### **Phase 5: Performance & Security Testing**
```bash
# Run automated validation
npm run validate

# Or manually check security headers
curl -I http://localhost/dashboard

# Should include:
# X-Frame-Options: SAMEORIGIN
# X-Content-Type-Options: nosniff
# Strict-Transport-Security: max-age=31536000

# Check gzip compression
curl -H "Accept-Encoding: gzip" -I http://localhost/

# Check static asset caching
curl -I http://localhost/assets/main.js
# Should show: Cache-Control: public, immutable
```

#### **Automated Validation**
```bash
# Run comprehensive validation
npm run validate

# This checks:
# ✅ All containers running
# ✅ Health endpoints responding
# ✅ Routing working properly
# ✅ Security headers present
# ✅ Environment variables configured
# ✅ Performance metrics
```

### 5. Docker Deployment

```bash
# Build and start all services
npm run deploy

# Or use docker-compose directly
docker-compose up -d

# Check logs
docker-compose logs -f

# Stop services
docker-compose down
```

## 📁 Project Structure

```
├── Dashboard/           # Admin dashboard (React + Vite)
│   ├── src/
│   ├── Dockerfile
│   ├── nginx.conf
│   └── env-example
├── frontend/            # Public website (React + Vite)
│   ├── src/
│   ├── Dockerfile
│   ├── nginx.conf
│   └── env-example
├── nginx/              # Reverse proxy configuration
│   ├── nginx.conf
│   └── ssl/            # SSL certificates (optional)
├── docker-compose.yml  # Docker orchestration
├── package.json        # Root scripts
└── README.md
```

## 🔧 Configuration

### Routing

The nginx reverse proxy routes requests as follows:
- `/dashboard/*` → Dashboard service
- `/admin/*` → Dashboard service
- `/auth` → Dashboard service
- `/*` (everything else) → Frontend service

### Ports

- **Development:**
  - Dashboard: `http://localhost:8081`
  - Frontend: `http://localhost:8082`

- **Docker:**
  - Dashboard: `http://localhost:8081` (internal)
  - Frontend: `http://localhost:8082` (internal)
  - Nginx: `http://localhost:80` (main entry point)

### Environment Variables

Both services require these environment variables:

```bash
# Required for both services
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Frontend specific
VITE_PAYSTACK_PUBLIC_KEY=your_paystack_public_key
```

## 🐳 Docker Commands

```bash
# Build all images
docker-compose build

# Start all services
docker-compose up -d

# Stop all services
docker-compose down

# View logs
docker-compose logs -f

# Restart specific service
docker-compose restart dashboard
docker-compose restart frontend
docker-compose restart nginx

# Clean up
docker-compose down --volumes --remove-orphans
docker system prune -f
```

## 🚀 Deployment to Production

### 1. Server Requirements

- Ubuntu 20.04+ or similar Linux distribution
- 2GB RAM minimum (4GB recommended)
- Docker and Docker Compose installed

### 2. SSL Configuration (Optional)

For HTTPS, place your SSL certificates in `nginx/ssl/`:
- `cert.pem` - Your SSL certificate
- `key.pem` - Your private key

Then uncomment the SSL server block in `nginx/nginx.conf`.

### 3. Domain Configuration

Update `nginx/nginx.conf`:
```nginx
server_name yourdomain.com www.yourdomain.com;
```

### 4. Deployment Script

```bash
#!/bin/bash
# deploy.sh

# Pull latest changes
git pull origin main

# Build and deploy
npm run deploy

# Wait for services to be healthy
sleep 30

# Check health
curl http://localhost/health
```

### 5. Monitoring

```bash
# Check service status
docker-compose ps

# Monitor resource usage
docker stats

# View nginx access logs
docker-compose logs nginx
```

## 🔒 Security Features

- Nginx rate limiting for auth endpoints
- Security headers (XSS protection, CSRF, etc.)
- Gzip compression
- SPA routing protection
- Container isolation

## 🐛 Troubleshooting

### Common Issues & Fixes

#### **1. "Cannot GET /dashboard" (404 Error)**
**Cause:** SPA routing not working properly
**Fix:**
```bash
# Check nginx configuration
cat nginx/nginx.conf | grep dashboard

# Rebuild containers
docker-compose down
docker-compose up -d --build
```

#### **2. "WebSocket connection failed"**
**Cause:** Missing WebSocket headers for Supabase real-time
**Fix:**
```nginx
# Add to nginx.conf location blocks:
proxy_http_version 1.1;
proxy_set_header Upgrade $http_upgrade;
proxy_set_header Connection "upgrade";
```

#### **3. Assets (CSS/JS) return 404**
**Cause:** Incorrect base path in Vite build
**Fix:** Dashboard uses `/dashboard/` base path in production

#### **4. Environment variables not working**
**Cause:** Not passed as build args
**Fix:**
```bash
# Check docker-compose.yml has build args
cat docker-compose.yml | grep args

# Rebuild with new env vars
docker-compose build --no-cache
```

#### **5. Port conflicts**
```bash
# Check what's using ports
netstat -tulpn | grep :80
netstat -tulpn | grep :8081

# Kill conflicting processes or change ports in docker-compose.yml
```

#### **6. Container won't start**
```bash
# Check logs
docker-compose logs dashboard
docker-compose logs frontend
docker-compose logs nginx

# Check container status
docker ps -a
```

#### **7. Build fails**
```bash
# Clean build
docker-compose build --no-cache

# Check disk space
df -h

# Clear Docker cache
docker system prune -f
```

#### **8. Real-time not working**
```bash
# Check Supabase project settings
# Ensure real-time is enabled in Supabase dashboard

# Check browser Network tab for WebSocket connections
# Should see: wss://your-project.supabase.co/realtime/v1
```

### Health Checks

```bash
# Check all services
curl http://localhost/health

# Check individual services
curl http://localhost:8081/health  # Dashboard
curl http://localhost:8082/health  # Frontend
```

## 📈 Performance Optimization

- Multi-stage Docker builds for smaller images
- Nginx caching for static assets
- Gzip compression enabled
- Optimized bundle splitting in Vite

## 🔄 Updates and Maintenance

```bash
# Update all services
docker-compose pull
docker-compose up -d

# Update specific service
docker-compose up -d dashboard

# Backup volumes (if using persistent data)
docker run --rm -v lovable_nginx-logs:/data -v $(pwd):/backup alpine tar czf /backup/nginx-logs.tar.gz -C /data .
```

## 🤝 Contributing

1. Make changes to individual services
2. Test locally with `npm run dev`
3. Build and test with Docker
4. Create pull request

## 💳 **PAYMENT SYSTEM OVERHAUL**

### **Two Payment Options**

#### **💳 PAY NOW (Card/USSD) - Recommended**
- ✅ **Instant confirmation** with automatic receipt
- ✅ **Secure Paystack** integration
- ✅ **Includes transaction fees** (1.5% + ₦100)
- ✅ **Best for**: Small payments, urgent transactions
- 📍 **Processing**: Immediate via Paystack

#### **🏦 BANK TRANSFER - Manual Verification**
- ✅ **No transaction fees** - save money on large payments
- ✅ **Upload proof** of transfer for verification
- ✅ **1-2 hour processing** during business hours (8AM-5PM Mon-Fri)
- ✅ **Best for**: High-value payments (>₦100k)
- 📍 **Account**: Zenith Bank - 1310770007 (Abuja Municipal Area Council)

### **Bank Transfer Flow**
1. **Select Bank Transfer** on payment page
2. **Transfer exact amount** to Zenith Bank account
3. **Upload proof** (receipt/screenshot) at `/upload-proof/:paymentId`
4. **Wait for verification** (1-2 hours)
5. **Receive confirmation** via email/SMS

### **Admin Verification Dashboard**
- **URL**: `/admin/payment-verification`
- **Features**:
  - View all pending bank transfers
  - Review uploaded payment proofs
  - Approve/Reject transactions
  - Add verification notes
  - Real-time statistics

### **Database Changes**
- Added `payment_method`, `proof_of_payment_url`, `verification_notes` columns
- Created `user_roles` table for admin permissions
- Added storage bucket for payment proofs
- New statuses: `pending_verification`, `awaiting_verification`, `rejected`

### **API Endpoints**
- `POST /functions/v1/send-payment-confirmation` - Sends confirmation emails/SMS

---

## 📄 License

MIT License - see LICENSE file for details.
