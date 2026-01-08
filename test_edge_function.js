/**
 * Test Edge Function CORS and Functionality
 * This script tests the Supabase Edge Function directly
 */

const https = require('https');

// Test configuration
const SUPABASE_URL = 'https://kfummdjejjjccfbzzifc.supabase.co';
const FUNCTION_NAME = 'initialize-payment';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtmdW1tZGplampqY2NmYnp6aWZjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc2OTIyMzQsImV4cCI6MjA4MzI2ODIzNH0.MWQbDQ0YINAAWC0opByVE4tCWWHlVWE4rXnRi8d_sYg';

// Test data
const testData = {
  revenueType: 'tenement_rate',
  serviceName: 'Tenement Rate',
  amount: 50000,
  payerName: 'Test User',
  payerPhone: '08012345678',
  payerEmail: 'test@amac.ng',
  businessAddress: '123 Test Street, Abuja',
  zone: 'zone_a'
};

function testEdgeFunction() {
  console.log('🧪 Testing Edge Function:', `${SUPABASE_URL}/functions/v1/${FUNCTION_NAME}`);
  console.log('📋 Test Data:', JSON.stringify(testData, null, 2));

  const postData = JSON.stringify(testData);

  const options = {
    hostname: 'kfummdjejjjccfbzzifc.supabase.co',
    port: 443,
    path: `/functions/v1/${FUNCTION_NAME}`,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData),
      'Authorization': `Bearer ${ANON_KEY}`,
      'apikey': ANON_KEY,
      'User-Agent': 'AMAC-Test-Client/1.0'
    }
  };

  const req = https.request(options, (res) => {
    console.log('📊 Response Status:', res.statusCode);
    console.log('📋 Response Headers:', res.headers);

    let responseData = '';

    res.on('data', (chunk) => {
      responseData += chunk;
    });

    res.on('end', () => {
      console.log('📤 Raw Response:', responseData);

      try {
        const parsedData = JSON.parse(responseData);
        console.log('✅ Parsed Response:', JSON.stringify(parsedData, null, 2));
        
        if (parsedData.success) {
          console.log('🎉 SUCCESS! Payment initialized successfully');
          console.log('🔗 Payment URL:', parsedData.paymentUrl);
          console.log('📋 RRR:', parsedData.rrr);
        } else {
          console.log('❌ Function Error:', parsedData.error);
        }
      } catch (error) {
        console.error('❌ JSON Parse Error:', error.message);
        console.log('📄 Raw Response:', responseData);
      }
    });
  });

  req.on('error', (error) => {
    console.error('❌ Request Error:', error.message);
    console.log('💡 This might indicate:');
    console.log('   - Edge Function not deployed');
    console.log('   - CORS configuration issue');
    console.log('   - Function error or timeout');
    console.log('   - Network connectivity issue');
  });

  // Test CORS preflight
  console.log('\n🔍 Testing CORS Preflight...');
  const corsOptions = {
    hostname: 'kfummdjejjjccfbzzifc.supabase.co',
    port: 443,
    path: `/functions/v1/${FUNCTION_NAME}`,
    method: 'OPTIONS',
    headers: {
      'Origin': 'http://localhost:3000',
      'Access-Control-Request-Method': 'POST',
      'Access-Control-Request-Headers': 'authorization, content-type'
    }
  };

  const corsReq = https.request(corsOptions, (res) => {
    console.log('📊 CORS Response Status:', res.statusCode);
    console.log('📋 CORS Response Headers:', res.headers);

    if (res.statusCode === 200) {
      console.log('✅ CORS Preflight: SUCCESS');
    } else {
      console.log('❌ CORS Preflight: FAILED');
    }

    let corsResponseData = '';
    res.on('data', (chunk) => {
      corsResponseData += chunk;
    });

    res.on('end', () => {
      if (corsResponseData) {
        console.log('📤 CORS Response Body:', corsResponseData);
      }
    });
  });

  corsReq.on('error', (error) => {
    console.error('❌ CORS Test Error:', error.message);
  });

  corsReq.end();

  // Send main request
  req.write(postData);
  req.end();
}

// Run the test
testEdgeFunction();