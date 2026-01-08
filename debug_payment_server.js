const http = require('http');

console.log('🔍 Debugging payment server...');

// Test health endpoint
const healthTest = () => {
  return new Promise((resolve, reject) => {
    const req = http.request({
      hostname: 'localhost',
      port: 3001,
      path: '/health',
      method: 'GET',
      timeout: 5000
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        console.log('✅ Health check response:');
        console.log('Status:', res.statusCode);
        console.log('Headers:', res.headers);
        console.log('Body:', data);
        resolve({ status: res.statusCode, data });
      });
    });
    
    req.on('error', (err) => {
      console.log('❌ Health check error:', err.message);
      reject(err);
    });
    
    req.on('timeout', () => {
      console.log('⏰ Health check timeout');
      req.destroy();
      reject(new Error('Timeout'));
    });
    
    req.end();
  });
};

// Test initialize payment endpoint
const paymentTest = () => {
  const postData = JSON.stringify({
    revenueType: 'SHOP_LICENSE',
    serviceName: 'Shop License',
    amount: 50000,
    payerName: 'Test User',
    payerPhone: '08012345678',
    payerEmail: 'test@example.com',
    businessAddress: '123 Test Street',
    registrationNumber: 'TEST123',
    zone: 'zone_a',
    notes: 'Test payment'
  });

  return new Promise((resolve, reject) => {
    const req = http.request({
      hostname: 'localhost',
      port: 3001,
      path: '/initialize-payment',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      },
      timeout: 10000
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        console.log('✅ Payment test response:');
        console.log('Status:', res.statusCode);
        console.log('Headers:', res.headers);
        console.log('Body:', data);
        resolve({ status: res.statusCode, data });
      });
    });
    
    req.on('error', (err) => {
      console.log('❌ Payment test error:', err.message);
      reject(err);
    });
    
    req.on('timeout', () => {
      console.log('⏰ Payment test timeout');
      req.destroy();
      reject(new Error('Timeout'));
    });
    
    req.write(postData);
    req.end();
  });
};

// Run tests
async function runTests() {
  try {
    console.log('🚀 Starting server tests...');
    
    // Start server in background
    const { spawn } = require('child_process');
    const serverProcess = spawn('node', ['simple_payment_server.js'], {
      stdio: 'pipe',
      cwd: process.cwd()
    });
    
    serverProcess.stdout.on('data', (data) => {
      console.log('📢 Server:', data.toString().trim());
    });
    
    serverProcess.stderr.on('data', (data) => {
      console.log('❌ Server Error:', data.toString().trim());
    });
    
    // Wait for server to start
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Test health endpoint
    console.log('\n🧪 Testing health endpoint...');
    await healthTest();
    
    // Wait a bit
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Test payment endpoint
    console.log('\n💳 Testing payment endpoint...');
    await paymentTest();
    
    // Cleanup
    serverProcess.kill();
    console.log('\n✅ Tests completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

runTests();