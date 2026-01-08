/**
 * Corrected Remita Integration Test Script
 * Uses the proper hash generation and API format
 */

const https = require('https');
const crypto = require('crypto');

// Remita Test Configuration from meeting chat
const REMITA_CONFIG = {
  merchantId: '2547916',
  apiKey: '1946', // This is the secret key
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

// Generate SHA-512 hash for Remita API
function generateRemitaHash(data) {
  return crypto.createHash('sha512').update(data).digest('hex');
}

// Generate unique RRR (Remita Retrieval Reference)
function generateRRR() {
  const timestamp = Date.now().toString();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `AMC-${timestamp}-${random}`;
}

// Test RRR Generation with correct hash
async function testGenerateRRRCorrected() {
  console.log('🧪 Testing RRR Generation (Corrected)...');
  
  const rrr = generateRRR();
  const amount = 150000; // ₦1,500.00
  const orderId = rrr;
  const payerName = 'Test User';
  const payerEmail = 'test@amac.ng';
  const payerPhone = '08012345678';
  const description = 'Tenement Rate Payment - Test';
  
  // Generate API hash using the correct format: merchantId + serviceTypeId + rrr + amount + apiKey
  const hashString = `${REMITA_CONFIG.merchantId}${REMITA_CONFIG.serviceTypeId}${rrr}${amount}${REMITA_CONFIG.apiKey}`;
  const apiHash = generateRemitaHash(hashString);
  
  console.log('🔗 Hash String:', hashString);
  console.log('🔐 Generated Hash:', apiHash);
  
  const requestData = {
    merchantId: REMITA_CONFIG.merchantId,
    serviceTypeId: REMITA_CONFIG.serviceTypeId,
    apiKey: REMITA_CONFIG.publicKey, // Use public key here
    hash: apiHash, // Use generated hash here
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
  
  try {
    const response = await makeApiCall(REMITA_CONFIG.generateRRRUrl, requestData);
    console.log('✅ RRR Generation Response:', JSON.stringify(response, null, 2));
    
    // Extract RRR from response
    const rrrResponse = response.RRR || response.rrr;
    const statusCode = response.statuscode || response.statusCode;
    
    if (statusCode === '025' && rrrResponse) {
      console.log('🎉 RRR Generated Successfully:', rrrResponse);
      return rrrResponse;
    } else if (response.status === 'INVALID_HASH_VALUE') {
      console.error('❌ Hash validation failed. Check hash generation.');
      console.error('   Expected hash format: merchantId + serviceTypeId + rrr + amount + apiKey');
      console.error('   Your hash string:', hashString);
      console.error('   Your generated hash:', apiHash);
      return null;
    } else {
      console.error('❌ RRR Generation Failed:', response);
      return null;
    }
  } catch (error) {
    console.error('❌ RRR Generation Error:', error.message);
    return null;
  }
}

// Test Payment Status Check
async function testCheckPaymentStatus(rrr) {
  console.log('\n🧪 Testing Payment Status Check...');
  
  // Generate hash for status check: merchantId + rrr + apiKey
  const hashString = `${REMITA_CONFIG.merchantId}${rrr}${REMITA_CONFIG.apiKey}`;
  const apiHash = generateRemitaHash(hashString);
  
  const statusUrl = `${REMITA_CONFIG.checkStatusUrl}/${REMITA_CONFIG.merchantId}/${rrr}/${apiHash}/status.reg`;
  
  console.log('🔗 Status Check URL:', statusUrl);
  console.log('🔐 Status Hash String:', hashString);
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
      const postData = JSON.stringify(data);
      options.headers['Content-Length'] = Buffer.byteLength(postData);
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
          
          // Remove jsonp wrapper variations
          if (cleanData.startsWith('jsonp(') && cleanData.endsWith(')')) {
            cleanData = cleanData.substring(6, cleanData.length - 1);
          } else if (cleanData.startsWith('jsonp (') && cleanData.endsWith(')')) {
            cleanData = cleanData.substring(7, cleanData.length - 1);
          }
          
          // Clean up any remaining whitespace
          cleanData = cleanData.trim();
          
          const parsedData = JSON.parse(cleanData);
          resolve(parsedData);
        } catch (error) {
          // If JSON parsing fails, return raw data
          resolve({ raw: responseData, status: res.statusCode, error: error.message });
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
async function runCorrectedRemitaTests() {
  console.log('🚀 Starting Corrected Remita Integration Tests...\n');
  console.log('📋 Test Configuration:');
  console.log('   - Merchant ID:', REMITA_CONFIG.merchantId);
  console.log('   - Service Type ID:', REMITA_CONFIG.serviceTypeId);
  console.log('   - API Key:', REMITA_CONFIG.apiKey);
  console.log('   - Public Key:', REMITA_CONFIG.publicKey.substring(0, 20) + '...');
  console.log('   - Base URL:', REMITA_CONFIG.baseUrl);
  
  try {
    // Test 1: Generate RRR
    const rrr = await testGenerateRRRCorrected();
    
    if (!rrr) {
      console.error('\n❌ RRR generation failed. Stopping tests.');
      return;
    }
    
    console.log('\n⏳ Waiting 2 seconds before status check...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Test 2: Check initial status
    await testCheckPaymentStatus(rrr);
    
    console.log('\n🎯 Test Summary:');
    console.log('✅ RRR Generated Successfully:', rrr);
    console.log('✅ Payment URL:', `https://demo.remita.net/remita/ecomm/finalize.reg?rrr=${rrr}&merchantId=${REMITA_CONFIG.merchantId}`);
    console.log('📋 Test Card Details for Manual Payment:');
    console.log('   - Card Number:', REMITA_CONFIG.testCard.number);
    console.log('   - Expiry:', REMITA_CONFIG.testCard.expiry);
    console.log('   - CVV:', REMITA_CONFIG.testCard.cvv);
    console.log('   - OTP:', REMITA_CONFIG.testCard.otp);
    
    // Save test results
    const testResults = {
      timestamp: new Date().toISOString(),
      rrr: rrr,
      paymentUrl: `https://demo.remita.net/remita/ecomm/finalize.reg?rrr=${rrr}&merchantId=${REMITA_CONFIG.merchantId}`,
      testCard: REMITA_CONFIG.testCard,
      config: {
        merchantId: REMITA_CONFIG.merchantId,
        serviceTypeId: REMITA_CONFIG.serviceTypeId
      }
    };
    
    require('fs').writeFileSync('remita_test_results.json', JSON.stringify(testResults, null, 2));
    console.log('\n💾 Test Results Saved to: remita_test_results.json');
    
  } catch (error) {
    console.error('\n❌ Test Suite Error:', error.message);
  }
}

// Run the corrected tests
if (require.main === module) {
  runCorrectedRemitaTests().catch(console.error);
}

module.exports = {
  REMITA_CONFIG,
  generateRemitaHash,
  generateRRR,
  testGenerateRRRCorrected,
  testCheckPaymentStatus
};