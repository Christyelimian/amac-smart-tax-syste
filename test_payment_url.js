/**
 * Test Payment URL Response
 * Direct test to see what the server actually returns
 */

const http = require('http');

const testData = {
  revenueType: "Tenement Rate",
  serviceName: "URL Test",
  amount: 150000,
  payerName: "Test User",
  payerPhone: "08012345678",
  payerEmail: "test@url.com"
};

const postData = JSON.stringify(testData);

const options = {
  hostname: 'localhost',
  port: 3002,
  path: '/initialize-payment',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData)
  }
};

console.log('🧪 Testing payment URL response...');
console.log('📤 Request data:', JSON.stringify(testData, null, 2));

const req = http.request(options, (res) => {
  let responseData = '';
  
  res.on('data', (chunk) => {
    responseData += chunk;
  });
  
  res.on('end', () => {
    console.log('📥 Raw response:', responseData);
    console.log('📊 Response length:', responseData.length, 'bytes');
    
    try {
      const parsed = JSON.parse(responseData);
      console.log('✅ Parsed response:', JSON.stringify(parsed, null, 2));
      
      if (parsed.paymentUrl) {
        console.log('🎉 PAYMENT URL FOUND:', parsed.paymentUrl);
      } else {
        console.log('❌ PAYMENT URL MISSING!');
        console.log('📋 Available fields:', Object.keys(parsed));
      }
    } catch (error) {
      console.error('❌ Parse error:', error.message);
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Request error:', error.message);
});

req.write(postData);
req.end();