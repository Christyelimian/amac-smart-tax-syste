/**
 * Test Local Payment Server
 */

const http = require('http');

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

const postData = JSON.stringify(testData);

const options = {
  hostname: 'localhost',
  port: 3001,
  path: '/initialize-payment',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData)
  }
};

console.log('🧪 Testing Local Payment Server...');
console.log('📡 URL:', `http://localhost:3001/initialize-payment`);
console.log('📋 Test Data:', testData);

const req = http.request(options, (res) => {
  console.log('📊 Status Code:', res.statusCode);
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
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Request Error:', error.message);
  if (error.code === 'ECONNREFUSED') {
    console.log('💡 Server is not running. Start it with: node local_payment_server.js');
  }
});

req.write(postData);
req.end();