/**
 * Test script for the payment server
 * Tests the /initialize-payment endpoint to verify Remita integration
 */

const http = require('http');

async function testPaymentServer() {
  console.log('🧪 Testing Payment Server...');

  const testData = {
    revenueType: 'Business Permit',
    serviceName: 'Annual Business Permit',
    amount: 5000,
    payerName: 'John Doe',
    payerPhone: '08123456789',
    payerEmail: 'john@example.com'
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

  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          console.log('📥 Server Response:', JSON.stringify(response, null, 2));

          if (response.success && response.rrr) {
            console.log('✅ SUCCESS: Payment server is working!');
            console.log('🎉 Generated RRR:', response.rrr);
            resolve(response);
          } else {
            console.log('❌ FAILED: Payment server returned error');
            console.log('Error:', response.error);
            reject(new Error(response.error));
          }
        } catch (error) {
          console.error('❌ JSON Parse Error:', error);
          reject(error);
        }
      });
    });

    req.on('error', (error) => {
      console.error('❌ Request Error:', error.message);
      reject(error);
    });

    req.write(postData);
    req.end();
  });
}

// Run the test
testPaymentServer()
  .then(() => {
    console.log('\n🎯 Test completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Test failed:', error.message);
    process.exit(1);
  });
