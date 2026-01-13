/**
 * Minimal Mock Payment Server for Port 3003
 * Drop-in Express server to confirm frontend flow
 * Returns a paymentUrl so frontend can redirect to Remita
 */

const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 3003;

// CORS
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3003'],
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: '*',
  credentials: true,
}));

app.use(express.json());

// Mock initialize-payment endpoint
app.post('/initialize-payment', (req, res) => {
  console.log('🧪 Mock Payment Server - Initialize Payment');
  console.log('📋 Request Body:', JSON.stringify(req.body, null, 2));

  const { revenueType, serviceName, amount, payerName, payerPhone, payerEmail } = req.body;

  // Generate mock data
  const reference = `MOCK-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
  const rrr = `MOCK-${Date.now()}`;

  const response = {
    success: true,
    reference,
    rrr,
    amount,
    // No paymentUrl - frontend will handle POST request properly
    remitaResponse: {
      statuscode: '025',
      RRR: rrr,
      status: 'Payment Reference generated (mock)'
    }
  };

  console.log('✅ Mock Response:', JSON.stringify(response, null, 2));
  res.json(response);
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    message: 'Mock Payment Server - Port 3003'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🧪 Mock Payment Server running on http://localhost:${PORT}`);
  console.log(`🏥 Health Check: http://localhost:${PORT}/health`);
  console.log('✅ Ready for frontend testing');
});

module.exports = app;