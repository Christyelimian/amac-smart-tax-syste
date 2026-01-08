/**
 * Remita Integration Test Script
 * Tests the complete Remita payment flow with the provided credentials
 */

const https = require('https');
const crypto = require('crypto');

// Remita Test Configuration from meeting chat
const REMITA_CONFIG = {
  merchantId: '2547916',
  apiKey: '1946',
  serviceTypeId: '4430731',
  publicKey: 'QzAwMDAyNzEyNTl8MTEwNjE4NjF8OWZjOWYwNmMyZDk3MDRhYWM3YThiOThlNTNjZTE3ZjYxOTY5NDdmZWE1YzU3NDc0ZjE2ZDZjNTg1YWYxNWY3NWM4ZjMzNzZhNjNhZWZlOWQwNmJhNTFkMjIxYTRiMjYzZDkzNGQ3NTUxNDIxYWNlOGY4ZWEyODY3ZjlhNGUwYTY=',
  baseUrl: 'https://demo.remita.net/remita/exapp/api/v1/send/api',
  generateRRRUrl: 'https://demo.remita.net/remita/exapp/api/v1/send/api/echannelsvc/merchant/api/paymentinit',
  checkStatusUrl: 'https://demo.remita.net/remita/exapp/api/v1/send/api/echannelsvc',
  
  // Test Card Details
  testCard: {
    number: '5178 6810 0000 0002',
    expiry: '05/30',
    cvv: '000',
    otp: '123456'
  }
};

// Generate SHA-512 hash for Remita API (returns hex string)
function generateSHA512Hash(data) {
  return crypto.createHash('sha512').update(data).digest('hex');
}

// Generate SHA-512 hash for Remita API (returns hex string like Remita expects)
function generateRemitaHash(data) {
  return crypto.createHash('sha512').update(data).digest('hex');
}

// Generate unique RRR (Remita Retrieval Reference)
function generateRRR() {
  const timestamp = Date.now().toString();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `AMC-${timestamp}-${random}`;
}

// Test 1: Generate RRR (Remita Retrieval Reference)
async function testGenerateRRR() {
  console.log('🧪 Testing RRR Generation...');
  
  const rrr = generateRRR();
  const amount = 150000; // ₦1,500.00
  const orderId = rrr;
  const payerName = 'Test User';
  const payerEmail = 'test@amac.ng';
  const payerPhone = '08012345678';
  const description = 'Tenement Rate Payment - Test';
  
  // Generate API hash - Remita format: merchantId + serviceTypeId + rrr + amount + apiKey
  const hashString = `${REMITA_CONFIG.merchantId}${REMITA_CONFIG.serviceTypeId}${rrr}${amount}${REMITA_CONFIG.apiKey}`;
  const apiHash = generateRemitaHash(hashString);
  
  const requestData = {
    merchantId: REMITA_CONFIG.merchantId,
    serviceTypeId: REMITA_CONFIG.serviceTypeId,
    apiKey: REMITA_CONFIG.publicKey,
    hash: apiHash,
    amount: amount,
    orderId: orderId,
    payerName: payerName,
    payerEmail: payerEmail,
    payerPhone: payerPhone,
    description: description,
    customFields: [
      {
        name: 'Revenue Type',
        value: 'Tenement Rate',
        type: 'String'
      },
      {
        name: 'Zone',
        value: 'Zone A',
        type: 'String'
      }
    ]
  };
  
  console.log('📤 Request Data:', JSON.stringify(requestData, null, 2));
  console.log('🔗 Hash String:', hashString);
  console.log('🔐 Generated Hash:', apiHash);
  
  try {
    const response = await makeApiCall(REMITA_CONFIG.generateRRRUrl, requestData);
    console.log('✅ RRR Generation Response:', JSON.stringify(response, null, 2));
    
    // Handle different response formats
    const rrr = response.RRR || response.rrr || (response.raw && response.raw.match(/"RRR":"([^"]+)"/)?.[1]);
    const statusCode = response.statuscode || response.statusCode;
    
    if (statusCode === '025' && rrr) {
      console.log('🎉 RRR Generated Successfully:', rrr);
      return rrr;
    } else {
      console.error('❌ RRR Generation Failed:', response);
      return null;
    }
  } catch (error) {
    console.error('❌ RRR Generation Error:', error.message);
    return null;
  }
}

// Test 2: Check Payment Status
async function testCheckPaymentStatus(rrr) {
  console.log('\n🧪 Testing Payment Status Check...');
  
  const hashString = `${REMITA_CONFIG.merchantId}${rrr}${REMITA_CONFIG.apiKey}`;
  const apiHash = generateSHA512Hash(hashString);
  
  const statusUrl = `${REMITA_CONFIG.checkStatusUrl}/${REMITA_CONFIG.merchantId}/${rrr}/${apiHash}/status.reg`;
  
  console.log('🔗 Status Check URL:', statusUrl);
  console.log('🔐 Status Hash:', apiHash);
  
  try {
    const response = await makeApiCall(statusUrl, null, 'GET');
    console.log('✅ Status Check Response:', JSON.stringify(response, null, 2));
    return response;
  } catch (error) {
    console.error('❌ Status Check Error:', error.message);
    return null;
  }
}

// Test 3: Test Card Payment Process
async function testCardPaymentProcess(rrr) {
  console.log('\n🧪 Testing Card Payment Process...');
  
  const paymentUrl = `https://demo.remita.net/remita/ecomm/finalize.reg?rrr=${rrr}&merchantId=${REMITA_CONFIG.merchantId}`;
  
  console.log('💳 Payment URL for manual testing:', paymentUrl);
  console.log('💳 Test Card Details:');
  console.log('   - Card Number:', REMITA_CONFIG.testCard.number);
  console.log('   - Expiry:', REMITA_CONFIG.testCard.expiry);
  console.log('   - CVV:', REMITA_CONFIG.testCard.cvv);
  console.log('   - OTP:', REMITA_CONFIG.testCard.otp);
  
  console.log('\n📋 Instructions for manual card payment test:');
  console.log('1. Open the payment URL in a browser');
  console.log('2. Enter the test card details');
  console.log('3. Complete the payment flow');
  console.log('4. Check payment status after completion');
  
  return paymentUrl;
}

// Helper function to make API calls
function makeApiCall(url, data, method = 'POST') {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    
    const options = {
      hostname: urlObj.hostname,
      port: 443,
      path: urlObj.pathname + urlObj.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'AMAC-Test-Client/1.0'
      }
    };
    
    if (method === 'POST' && data) {
      options.headers['Content-Length'] = Buffer.byteLength(JSON.stringify(data));
    }
    
    const req = https.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          // Handle JSONP responses from Remita
          let cleanData = responseData.trim();
          if (cleanData.startsWith('jsonp(') && cleanData.endsWith(')')) {
            cleanData = cleanData.substring(6, cleanData.length - 1);
          }
          
          const parsedData = JSON.parse(cleanData);
          resolve(parsedData);
        } catch (error) {
          // If JSON parsing fails, return raw data
          resolve({ raw: responseData, status: res.statusCode });
        }
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    if (method === 'POST' && data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

// Main test function
async function runRemitaTests() {
  console.log('🚀 Starting Remita Integration Tests...\n');
  console.log('📋 Test Configuration:');
  console.log('   - Merchant ID:', REMITA_CONFIG.merchantId);
  console.log('   - Service Type ID:', REMITA_CONFIG.serviceTypeId);
  console.log('   - API Key:', REMITA_CONFIG.apiKey);
  console.log('   - Base URL:', REMITA_CONFIG.baseUrl);
  
  try {
    // Test 1: Generate RRR
    const rrr = await testGenerateRRR();
    
    if (!rrr) {
      console.error('\n❌ RRR generation failed. Stopping tests.');
      return;
    }
    
    // Test 2: Check initial status
    await testCheckPaymentStatus(rrr);
    
    // Test 3: Get payment URL for manual testing
    const paymentUrl = await testCardPaymentProcess(rrr);
    
    console.log('\n🎯 Test Summary:');
    console.log('✅ RRR Generated:', rrr);
    console.log('✅ Payment URL Created:', paymentUrl);
    console.log('📋 Next Steps:');
    console.log('   1. Open the payment URL in a browser');
    console.log('   2. Use the test card details provided');
    console.log('   3. Complete the payment');
    console.log('   4. Run status check again to verify payment');
    
    // Save test results for future reference
    const testResults = {
      timestamp: new Date().toISOString(),
      rrr: rrr,
      paymentUrl: paymentUrl,
      testCard: REMITA_CONFIG.testCard,
      config: {
        merchantId: REMITA_CONFIG.merchantId,
        serviceTypeId: REMITA_CONFIG.serviceTypeId
      }
    };
    
    console.log('\n💾 Test Results Saved to: remita_test_results.json');
    require('fs').writeFileSync('remita_test_results.json', JSON.stringify(testResults, null, 2));
    
  } catch (error) {
    console.error('\n❌ Test Suite Error:', error.message);
  }
}

// Run the tests
if (require.main === module) {
  runRemitaTests().catch(console.error);
}

module.exports = {
  REMITA_CONFIG,
  generateSHA512Hash,
  generateRRR,
  testGenerateRRR,
  testCheckPaymentStatus,
  testCardPaymentProcess
};