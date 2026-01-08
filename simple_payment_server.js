/**
 * Simple Payment Server - No Database Required
 * This creates a local server that simulates payment initialization
 * without requiring Supabase service role key
 */

const express = require('express');
const cors = require('cors');
const crypto = require('crypto');

const app = express();
const PORT = 3001;

// CORS configuration - Allow both localhost and production domain
app.use(cors({
  origin: ['http://localhost:3000', 'https://amac-smart-tax-system.vercel.app'], // Allow specific origins
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-client-info', 'apikey', 'X-Requested-With'],
  credentials: true,
  maxAge: 86400 // 24 hours
}));

app.use(express.json());

// Handle CORS preflight requests
app.use((req, res, next) => {
  const allowedOrigins = ['http://localhost:3000', 'https://amac-smart-tax-system.vercel.app'];
  const origin = req.headers.origin;
  
  if (allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
  }
  
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, x-client-info, apikey');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
    return;
  }
  
  next();
});

// Remita configuration
const REMITA_CONFIG = {
  publicKey: 'QzAwMDAyNzEyNTl8MTEwNjE4NjF8OWZjOWYwNmMyZDk3MDRhYWM3YThiOThlNTNjZTE3ZjYxOTY5NDdmZWE1YzU3NDc0ZjE2ZDZjNTg1YWYxNWY3NWM4ZjMzNzZhNjNhZWZlOWQwNmJhNTFkMjIxYTRiMjYzZDkzNGQ3NTUxNDIxYWNlOGY4ZWEyODY3ZjlhNGUwYTY=',
  secretKey: '1946',
  merchantId: '2547916',
  serviceTypeId: '4430731',
  apiUrl: 'https://demo.remita.net/remita/exapp/api/v1/send/api',
  webhookUrl: 'https://kfummdjejjjccfbzzifc.supabase.co/functions/v1/remita-webhook',
};

// Generate SHA-512 hash
function generateRemitaHash(data) {
  return crypto.createHash('sha512').update(data).digest('hex');
}

// Generate RRR
function generateRRR() {
  const timestamp = Date.now().toString();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `AMC-${timestamp}-${random}`;
}

// Handle GET requests to /initialize-payment (provide helpful info)
app.get('/initialize-payment', (req, res) => {
  console.log('⚠️  GET request received on POST endpoint - sending helpful info');
  res.status(405).json({
    error: 'Method Not Allowed',
    message: 'This endpoint only accepts POST requests',
    method: 'POST',
    requiredHeaders: {
      'Content-Type': 'application/json'
    },
    exampleRequest: {
      revenueType: 'SHOP_LICENSE',
      serviceName: 'Shop License',
      amount: 50000,
      payerName: 'John Doe',
      payerPhone: '08012345678',
      payerEmail: 'john@example.com',
      businessAddress: '123 Main St',
      registrationNumber: 'REG123456',
      zone: 'zone_a',
      notes: 'Optional notes'
    },
    exampleResponse: {
      success: true,
      reference: 'AMC-SHO-1234567890-ABC123',
      rrr: 'AMC-1234567890123-XYZ789',
      paymentUrl: 'https://remitademo.net/remita/ecomm/finalize.reg?rrr=AMC-1234567890123-XYZ789&merchantId=2547916',
      ussdCode: '*322*270007777777#',
      amount: 50000
    },
    documentation: 'This endpoint initializes a payment and returns a Remita payment URL for redirection',
    healthCheck: 'http://localhost:3001/health'
  });
});

// Initialize payment endpoint (POST)
app.post('/initialize-payment', async (req, res) => {
  console.log('🚀 Simple Payment Server - Initialize Payment');
  console.log('📋 Request Body:', JSON.stringify(req.body, null, 2));

  try {
    const { revenueType, serviceName, amount, payerName, payerPhone, payerEmail, businessAddress, registrationNumber, zone, notes } = req.body;

    // Validate required fields
    if (!revenueType || !serviceName || !amount || !payerName || !payerPhone) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: revenueType, serviceName, amount, payerName, payerPhone'
      });
    }

    // Generate unique RRR
    const rrr = generateRRR();
    console.log('📝 Generated RRR:', rrr);

    // Simulate zone multiplier calculation
    let finalAmount = amount;
    let zoneMultiplier = 1;
    
    if (zone) {
      // Simulate zone multipliers based on common patterns
      const zoneMultipliers = {
        'zone_a': 1.5,
        'zone_b': 1.3,
        'zone_c': 1.1,
        'zone_d': 1.0
      };
      
      zoneMultiplier = zoneMultipliers[zone.toLowerCase()] || 1.0;
      finalAmount = amount * zoneMultiplier;
    }

    // Generate reference for tracking
    const reference = `AMC-${revenueType.substring(0, 3).toUpperCase()}-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    // Simulate successful payment record creation
    const paymentRecord = {
      id: Math.random().toString(36).substring(2, 15),
      reference,
      rrr,
      revenue_type: revenueType,
      service_name: serviceName,
      zone_id: zone?.toLowerCase() || null,
      amount: finalAmount,
      payer_name: payerName,
      payer_phone: payerPhone,
      payer_email: payerEmail || null,
      property_name: payerName,
      business_address: businessAddress || null,
      registration_number: registrationNumber || null,
      notes: notes || null,
      status: 'processing',
      payment_channel: 'card',
      created_at: new Date().toISOString()
    };

    console.log('✅ Simulated payment record created:', paymentRecord.id);

    // Simulate Remita response (for demo/development)
    const remitaResponse = {
      status: 'success',
      rrr: rrr,
      orderId: rrr,
      amount: finalAmount,
      paymentUrl: `https://remitademo.net/remita/ecomm/finalize.reg?rrr=${rrr}&merchantId=${REMITA_CONFIG.merchantId}`,
      ussdCode: `*322*270007777777#`,
      bankAccount: {
        accountNumber: '9876543210',
        bankName: 'Zenith Bank',
        accountName: 'Abuja Municipal Area Council',
      },
      qrCode: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=rrr:${rrr}`,
    };

    console.log('🎉 Payment initialized successfully!');

    res.json({
      success: true,
      reference,
      rrr,
      paymentUrl: remitaResponse.paymentUrl,
      ussdCode: remitaResponse.ussdCode,
      bankAccount: remitaResponse.bankAccount,
      qrCode: remitaResponse.qrCode,
      amount: finalAmount,
      zoneMultiplier: zoneMultiplier,
      paymentRecord: paymentRecord // Include for debugging
    });

  } catch (error) {
    console.error('❌ Error in initialize-payment:', error);
    res.status(400).json({
      success: false,
      error: error.message || 'An unexpected error occurred'
    });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    message: 'Simple Payment Server is running'
  });
});

// Start server
const server = app.listen(PORT, () => {
  console.log(`🚀 Simple Payment Server running on http://localhost:${PORT}`);
  console.log(`📡 Endpoint: http://localhost:${PORT}/initialize-payment`);
  console.log(`🏥 Health Check: http://localhost:${PORT}/health`);
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down server...');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

module.exports = app;