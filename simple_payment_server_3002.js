/**
 * Payment Server - Real Remita API Integration
 * This calls Remita's actual API to get valid RRRs
 */

const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const https = require('https');

const app = express();
const PORT = 3002;

// CORS configuration
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3003',  'https://smarttax.com.ng', 'https://amac-smart-tax-system.vercel.app'], 
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: '*',
  credentials: true,
  maxAge: 86400
}));

app.use(express.json());

// Remita configuration
const REMITA_CONFIG = {
  merchantId: '2547916',
  apiKey: '1946',
  publicKey: 'QzAwMDAyNzEyNTl8MTEwNjE4NjF8OWZjOWYwNmMyZDk3MDRhYWM3YThiOThlNTNjZTE3ZjYxOTY5NDdmZWE1YzU3NDc0ZjE2ZDZjNTg1YWYxNWY3NWM4ZjMzNzZhNjNhZWZlOWQwNmJhNTFkMjIxYTRiMjYzZDkzNGQ3NTUxNDIxYWNlOGY4ZWEyODY3ZjlhNGUwYTY=',
  serviceTypeId: '4430731',
  apiUrl: 'https://demo.remita.net'
};

// Generate SHA-512 hash for Remita API (matching test script)
function generateRemitaHash(data) {
  return crypto.createHash('sha512').update(data).digest('hex');
}

// Generate unique order ID
function generateOrderId() {
  return `AMC-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
}

// Call Remita API to initialize payment
function initializeRemitaPayment(payload) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(payload);

    // Generate the consumer token hash for Authorization header
    const consumerToken = generateRemitaHash(`${REMITA_CONFIG.merchantId}${REMITA_CONFIG.serviceTypeId}${payload.orderId}${payload.amount}${REMITA_CONFIG.apiKey}`);

    const options = {
      hostname: 'demo.remita.net',
      port: 443,
      path: '/remita/exapp/api/v1/send/api/echannelsvc/merchant/api/paymentinit',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
        'Authorization': `remitaConsumerKey=${REMITA_CONFIG.merchantId},remitaConsumerToken=${consumerToken}`
      }
    };

    console.log('📡 Calling Remita API...');
    console.log('🔗 URL:', `https://${options.hostname}${options.path}`);

    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        console.log('📥 Remita Response:', data);
        try {
          // Handle JSONP responses from Remita
          let cleanData = data.trim();

          // Remove jsonp wrapper variations
          if (cleanData.startsWith('jsonp(') && cleanData.endsWith(')')) {
            cleanData = cleanData.substring(6, cleanData.length - 1);
          } else if (cleanData.startsWith('jsonp (') && cleanData.endsWith(')')) {
            cleanData = cleanData.substring(7, cleanData.length - 1);
          }

          // Clean up any remaining whitespace
          cleanData = cleanData.trim();

          const response = JSON.parse(cleanData);

          if (response.statuscode === '025' || response.statuscode === '00') {
            resolve(response);
          } else {
            reject(new Error(response.statusMessage || 'Payment initialization failed'));
          }
        } catch (error) {
          console.error('❌ JSON Parse Error:', error);
          reject(new Error('Invalid response from Remita'));
        }
      });
    });

    req.on('error', (error) => {
      console.error('❌ HTTPS Request Error:', error);
      reject(error);
    });

    req.write(postData);
    req.end();
  });
}

// Initialize payment endpoint
app.post('/initialize-payment', async (req, res) => {
  console.log('🚀 Payment Server - Initialize Payment');
  console.log('📋 Request Body:', JSON.stringify(req.body, null, 2));

  try {
    const {
      revenueType,
      serviceName,
      amount,
      payerName,
      payerPhone,
      payerEmail,
      businessAddress
    } = req.body;

    // Validate required fields
    if (!revenueType || !serviceName || !amount || !payerName || !payerPhone) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: revenueType, serviceName, amount, payerName, payerPhone'
      });
    }

    // Generate unique order ID
    const orderId = generateOrderId();
    console.log('📝 Generated Order ID:', orderId);

    // Prepare Remita payload (matching the working test script)
    const remitaPayload = {
      merchantId: REMITA_CONFIG.merchantId,
      serviceTypeId: REMITA_CONFIG.serviceTypeId,
      apiKey: REMITA_CONFIG.publicKey,
      hash: generateRemitaHash(`${REMITA_CONFIG.merchantId}${REMITA_CONFIG.serviceTypeId}${orderId}${amount}${REMITA_CONFIG.apiKey}`),
      amount: amount,
      orderId: orderId,
      payerName: payerName,
      payerEmail: payerEmail || `${payerPhone}@placeholder.com`,
      payerPhone: payerPhone,
      description: `${serviceName} - ${revenueType}`,
      customFields: [
        {
          name: 'revenueType',
          value: revenueType,
          type: 'String'
        },
        {
          name: 'serviceName',
          value: serviceName,
          type: 'String'
        }
      ]
    };

    // Add optional fields
    if (businessAddress) {
      remitaPayload.customFields.push({
        name: 'businessAddress',
        value: businessAddress
      });
    }

    console.log('📤 Remita Payload:', JSON.stringify(remitaPayload, null, 2));

    // Call Remita API
    const remitaResponse = await initializeRemitaPayment(remitaPayload);

    console.log('✅ Remita Response:', remitaResponse);

    // Extract RRR from response
    const rrr = remitaResponse.RRR || remitaResponse.rrr;

    if (!rrr) {
      throw new Error('No RRR received from Remita');
    }

    console.log('🎉 Payment initialized successfully! RRR:', rrr);

    console.log('🔗 Payment initialized with RRR:', rrr);

    // Return success response with required fields for inline widget
    const responseData = {
      success: true,
      reference: orderId,
      rrr: rrr,
      amount: amount,
      merchantId: REMITA_CONFIG.merchantId,
      publicKey: REMITA_CONFIG.publicKey || "test_public_key",
      payerEmail: body.payerEmail || `${body.payerPhone.replace(/\D/g, '')}@amacpay.ng`,
      payerPhone: body.payerPhone,
      payerName: body.payerName,
      currency: 'NGN',
      country: 'NG',
      ussdCode: ussdCode,
      remitaResponse: remitaResponse
    };

    console.log("📋 Local server response:", responseData);
    res.json(responseData);

  } catch (error) {
    console.error('❌ Error in initialize-payment:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Payment initialization failed',
      details: error.stack
    });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    message: 'Payment Server with Real Remita API'
  });
});

// Start server
const server = app.listen(PORT, () => {
  console.log(`🚀 Payment Server running on http://localhost:${PORT}`);
  console.log(`📡 Using Real Remita API: ${REMITA_CONFIG.apiUrl}`);
  console.log(`🏥 Health Check: http://localhost:${PORT}/health`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down server...');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

module.exports = app;
