# AMAC Admin Portal

A separate, independent admin dashboard for managing AMAC payments and receipts using MongoDB.

## Features

### 🔐 **Secure Authentication**
- JWT-based authentication
- Role-based access control
- Secure login with password hashing

### 💰 **Payment Management**
- View all payments with pagination
- Filter by status, gateway, and search
- Export payments to CSV
- Detailed payment information

### 🧾 **Receipt Verification**
- Verify receipt authenticity
- Real-time receipt validation
- QR code integration support
- Complete receipt details display

### 📊 **Analytics Dashboard**
- Revenue tracking and reporting
- Payment statistics
- Gateway performance metrics
- Real-time data updates

### 🔍 **Advanced Search & Filtering**
- Search by reference, payer name, email
- Filter by payment status and gateway
- Date range filtering
- Pagination for large datasets

## Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS, Framer Motion
- **Backend**: Express.js, Node.js, TypeScript
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT with bcrypt
- **Deployment**: Vercel

## URLs

- **Admin Portal**: `https://amac-admin-portal.vercel.app`
- **Login**: `https://amac-admin-portal.vercel.app/admin-portal/login`
- **Dashboard**: `https://amac-admin-portal.vercel.app/admin-portal/dashboard`
- **Payments**: `https://amac-admin-portal.vercel.app/admin-portal/payments`

## Getting Started

### Prerequisites
- Node.js 18+
- MongoDB Atlas instance
- npm or yarn

### Installation

1. **Clone the repository**
   \`\`\`bash
   git clone <repository-url>
   cd admin-portal
   \`\`\`

2. **Install dependencies**
   \`\`\`bash
   npm install
   \`\`\`

3. **Set environment variables**
   \`\`\`bash
   MONGODB_URI="mongodb+srv://your-connection-string"
   JWT_SECRET="your-jwt-secret"
   \`\`\`

4. **Run development server**
   \`\`\`bash
   # Frontend
   npm run dev

   # Backend (separate terminal)
   npm run start:api
   \`\`\`

## Database Schema

### Payments Collection
\`\`\`javascript
{
  reference: String,
  amount: Number,
  payer_name: String,
  payer_email: String,
  payer_phone: String,
  service_name: String,
  payment_method: String,
  status: String, // confirmed, pending, failed
  gateway: String, // paystack, remita
  receipt_number: String,
  paid_at: Date,
  created_at: Date
}
\`\`\`

### Receipts Collection
\`\`\`javascript
{
  receipt_number: String,
  payment_id: String,
  reference: String,
  amount: Number,
  payer_name: String,
  service_name: String,
  qr_code_data: String,
  generated_at: Date,
  created_at: Date
}
\`\`\`

### Admins Collection
\`\`\`javascript
{
  email: String,
  password: String, // bcrypt hashed
  name: String,
  role: String,
  permissions: [String],
  is_active: Boolean,
  created_at: Date
}
\`\`\`

## API Endpoints

### Authentication
- `POST /api/admin/login` - Admin login
- Returns JWT token for authenticated sessions

### Payments
- `GET /api/payments` - Get all payments with filtering
- `GET /api/payments/:reference` - Get specific payment
- `POST /api/payments/webhook` - Receive payment webhooks

### Receipts
- `GET /api/receipts/:receiptNumber` - Verify receipt authenticity

### Analytics
- `GET /api/analytics` - Get payment analytics and statistics

## Webhook Integration

The admin portal can receive payment webhooks from the main system:

\`\`\`bash
POST http://localhost:3004/api/payments/webhook
{
  "reference": "AMAC123456",
  "amount": 50000,
  "payer_name": "John Doe",
  "status": "confirmed",
  "receipt_number": "AMAC/2026/WEB/789012",
  // ... other payment fields
}
\`\`\`

## Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: bcrypt for secure password storage
- **CORS Protection**: Configured for allowed origins
- **Input Validation**: Request validation and sanitization
- **Rate Limiting**: Basic rate limiting on endpoints

## Deployment

### Vercel Deployment
\`\`\`bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
\`\`\`

### Environment Variables on Vercel
- `MONGODB_URI` - MongoDB connection string
- `JWT_SECRET` - JWT signing secret

## Development

### Project Structure
\`\`\`
admin-portal/
├── src/
│   ├── api/          # Backend API server
│   ├── contexts/      # React contexts
│   ├── pages/         # React pages
│   ├── lib/          # Database connection
│   └── components/    # Reusable components
├── public/
├── package.json
├── vite.config.ts
└── vercel.json
\`\`\`

### Running Locally
1. Start the API server: `npm run start:api`
2. Start the frontend: `npm run dev`
3. Access at: `http://localhost:3003`

## Support

For issues and support:
- Check the browser console for errors
- Verify MongoDB connection
- Ensure environment variables are set
- Check API server logs

---

**Note**: This is a separate admin system designed to work independently of the main AMAC portal, using MongoDB as the primary database for reliability and performance.