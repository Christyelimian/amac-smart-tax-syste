# AMAC Admin Portal Deployment Guide

## 🚀 Quick Deployment to Vercel

### Prerequisites
- Node.js 18+ installed
- Vercel CLI installed (`npm i -g vercel`)
- Git repository connected to your GitHub

### Step 1: Deploy to Vercel

```bash
# Navigate to admin portal directory
cd admin-portal

# Deploy to Vercel
vercel --prod

# Follow the prompts:
# - Connect to your GitHub account
# - Select the `amac-smart-tax-syste` repository
# - Confirm the root directory as `admin-portal`
# - Allow Vercel to auto-detect settings
```

### Step 2: Configure Environment Variables

During deployment, Vercel will automatically use the MongoDB URI from `vercel.json`.
If you need to update it later:

```bash
# Set environment variables
vercel env add MONGODB_URI="mongodb+srv://Vercel-Admin-amac-portal:7RgEZUPY3lVKn5g4@amac-portal.tegr73k.mongodb.net/?retryWrites=true&w=majority"

# Verify environment variables
vercel env ls
```

### Step 3: Access Your Admin Portal

Once deployed, your admin portal will be available at:
- **Primary URL**: `https://amac-admin-portal.vercel.app`
- **Login**: `https://amac-admin-portal.vercel.app/admin-portal/login`

## 🔗 Integration with Main System

### Webhook Configuration

To connect payment data from the main AMAC portal to this admin system:

#### 1. Update Main Portal Webhook

In the main AMAC portal (frontend), update the payment confirmation webhook:

```typescript
// In the frontend/src/pages/PaymentSuccess.tsx or webhook handler
const webhookUrl = 'https://amac-admin-portal.vercel.app/admin-portal/api/payments/webhook';

// Send payment data after successful payment
await fetch(webhookUrl, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    reference: payment.reference,
    amount: payment.amount,
    payer_name: payment.payer_name,
    payer_email: payment.payer_email,
    service_name: payment.service_name,
    payment_method: payment.payment_method,
    status: payment.status,
    receipt_number: payment.receipt_number,
    gateway: payment.gateway,
    paid_at: payment.paid_at,
  }),
});
```

#### 2. Test Webhook Integration

```bash
# Test webhook connection
curl -X POST https://amac-admin-portal.vercel.app/admin-portal/api/payments/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "reference": "TEST123",
    "amount": 50000,
    "payer_name": "Test User",
    "service_name": "Test Service",
    "status": "confirmed",
    "receipt_number": "AMAC/2026/WEB/TEST001",
    "gateway": "paystack",
    "paid_at": "2024-01-12T10:00:00Z"
  }'
```

## 📊 Admin Portal Features

### URLs and Routes
- **Login**: `/admin-portal/login` - Secure admin authentication
- **Dashboard**: `/admin-portal/dashboard` - Analytics overview
- **Payments**: `/admin-portal/payments` - Payment management
- **Receipts**: `/admin-portal/receipts` - Receipt verification

### Default Login Credentials (for testing)

**Note**: These should be created manually in MongoDB:
```javascript
// Connect to MongoDB and create an admin user:
db.admins.insertOne({
  email: "admin@amac.gov.ng",
  password: "$2b$12$rT6e4YfG/kL59LsQ/sBMaOy8mBDuM2H", // bcrypt hash of "admin123"
  name: "Super Admin",
  role: "super_admin",
  permissions: ["read", "write", "delete", "admin"],
  is_active: true,
  created_at: new Date()
});
```

### API Endpoints

All API endpoints are available under `/admin-portal/api/`:

- `POST /admin-portal/api/admin/login` - Admin authentication
- `GET /admin-portal/api/payments` - List payments with filtering
- `GET /admin-portal/api/payments/:reference` - Get specific payment
- `POST /admin-portal/api/payments/webhook` - Receive payment data
- `GET /admin-portal/api/receipts/:receiptNumber` - Verify receipts
- `GET /admin-portal/api/analytics` - Get analytics data

## 🔧 Local Development

### Running Locally

```bash
# Navigate to admin portal
cd admin-portal

# Install dependencies
npm install

# Start both frontend and backend
npm start

# Access the application
# Frontend: http://localhost:3003
# Backend API: http://localhost:3004
```

### Environment Variables

For local development, create a `.env` file:

```bash
# .env file
MONGODB_URI="mongodb+srv://Vercel-Admin-amac-portal:7RgEZUPY3lVKn5g4@amac-portal.tegr73k.mongodb.net/?retryWrites=true&w=majority"
JWT_SECRET="amac-admin-secret-key-2024"
```

## 🐛 Troubleshooting

### Common Issues

#### 404 on `/admin-portal/`
- **Cause**: Vercel routing not configured correctly
- **Fix**: Ensure `vercel.json` has correct `routes` configuration
- **Check**: Deploy with `vercel --prod` and verify deployment

#### API Routes Not Working
- **Cause**: Serverless function not properly configured
- **Fix**: Check `vercel.json` `functions` section
- **Verify**: Function runtime is set to `nodejs18.x`

#### Database Connection Issues
- **Cause**: MongoDB URI incorrect or network blocked
- **Fix**: Verify MONGODB_URI in Vercel environment variables
- **Test**: Use MongoDB Compass to test connection

#### Login Issues
- **Cause**: Admin user not created in database
- **Fix**: Create admin user manually via MongoDB shell
- **Password**: Use bcrypt for password hashing

## 📱 Mobile Responsiveness

The admin portal is fully responsive and works on:
- ✅ Desktop (1024px+)
- ✅ Tablet (768px-1023px)  
- ✅ Mobile (320px-767px)

## 🔐 Security Features

- JWT authentication with 24-hour expiration
- Password hashing with bcrypt
- CORS protection for allowed origins
- Input validation and sanitization
- Rate limiting capabilities
- Secure session management

## 📈 Analytics Capabilities

The dashboard provides:
- **Total Revenue**: Sum of all confirmed payments
- **Payment Count**: Number of successful transactions
- **Gateway Performance**: Revenue by payment gateway
- **Recent Activity**: Latest 10 payment activities
- **Time-based Filtering**: 24h, 7d, 30d, 1y analytics
- **Search & Filter**: Advanced payment discovery
- **Export Functionality**: CSV download for reporting

## 🚀 Next Steps

1. **Deploy to Vercel** using the commands above
2. **Test the admin portal** functionality thoroughly
3. **Connect webhook** from main AMAC portal
4. **Monitor analytics** and payment data flow
5. **Set up monitoring** for production issues

---

**Note**: This admin portal is completely independent and doesn't interfere with existing AMAC systems. It provides a modern, scalable solution for payment management and analytics.