/**
 * Local Payment Server - Workaround for missing Edge Function
 * This creates a local Express server to handle payment initialization
 * until the Edge Function is properly deployed
 */

const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

const app = express();
const PORT = 3001;

// CORS configuration
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:5173'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-client-info', 'apikey'],
  credentials: true
}));

app.use(express.json());

// Supabase configuration
const supabaseUrl = 'https://kfummdjejjjccfbzzifc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtmdW1tZGplampqY2NmYnp6aWZjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzY5MjIzNCwiZXhwIjoyMDgzMjY4MjM0fQ.7tT5LUt8X5YcV5LUt8X5YcV5LUt8X5YcV5LUt8X5YcV5LUt8X5Yc'; // Service role key

const supabase = createClient(supabaseUrl, supabaseKey);

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

// Initialize payment endpoint
app.post('/initialize-payment', async (req, res) => {
  console.log('🚀 Local Payment Server - Initialize Payment');
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

    // Get revenue type details
    const { data: revenueTypeData, error: revenueError } = await supabase
      .from('revenue_types')
      .select('*')
      .eq('code', revenueType)
      .single();

    if (revenueError || !revenueTypeData) {
      throw new Error('Invalid revenue type');
    }

    // Get zone details if applicable
    let zoneData = null;
    let finalAmount = amount;
    
    if (zone && revenueTypeData.has_zones) {
      const { data: zoneResult } = await supabase
        .from('zones')
        .select('*')
        .eq('id', zone.toLowerCase())
        .single();
      
      if (zoneResult) {
        zoneData = zoneResult;
        finalAmount = amount * zoneResult.multiplier;
      }
    }

    // Generate reference for tracking
    const reference = `AMC-${revenueType.substring(0, 3).toUpperCase()}-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    // Create payment record in database
    const { data: paymentRecord, error: insertError } = await supabase
      .from('payments')
      .insert({
        reference,
        rrr,
        revenue_type: revenueType,
        revenue_type_code: revenueType,
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
        status: 'pending',
        payment_channel: 'card',
      })
      .select()
      .single();

    if (insertError) {
      console.error('❌ Error inserting payment record:', insertError);
      throw new Error('Failed to create payment record');
    }

    console.log('✅ Payment record created:', paymentRecord.id);

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

    // Update payment record with Remita response
    await supabase
      .from('payments')
      .update({
        status: 'processing',
        remita_response: remitaResponse,
        gateway_response: remitaResponse,
      })
      .eq('rrr', rrr);

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
      zoneMultiplier: zoneData?.multiplier || 1,
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
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Local Payment Server running on http://localhost:${PORT}`);
  console.log(`📡 Endpoint: http://localhost:${PORT}/initialize-payment`);
  console.log(`🏥 Health Check: http://localhost:${PORT}/health`);
});

module.exports = app;