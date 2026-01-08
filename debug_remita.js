const https = require('https');
const crypto = require('crypto');

// Simple debug function to see exact Remita response
function testSimpleRRR() {
  const options = {
    hostname: 'demo.remita.net',
    port: 443,
    path: '/remita/exapp/api/v1/send/api/echannelsvc/merchant/api/paymentinit',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    }
  };

  const req = https.request(options, (res) => {
    let data = '';
    
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      console.log('Raw Response:', data);
      console.log('Status Code:', res.statusCode);
      console.log('Headers:', res.headers);
      
      // Try to parse JSONP
      try {
        if (data.startsWith('jsonp(') && data.endsWith(')')) {
          const jsonPart = data.substring(6, data.length - 1);
          const parsed = JSON.parse(jsonPart);
          console.log('Parsed JSON:', parsed);
        }
      } catch (e) {
        console.log('JSON parsing failed:', e.message);
      }
    });
  });

  req.on('error', (error) => {
    console.error('Request failed:', error);
  });

  // Sample request data
  const requestData = {
    merchantId: '2547916',
    serviceTypeId: '4430731',
    apiKey: 'QzAwMDAyNzEyNTl8MTEwNjE4NjF8OWZjOWYwNmMyZDk3MDRhYWM3YThiOThlNTNjZTE3ZjYxOTY5NDdmZWE1YzU3NDc0ZjE2ZDZjNTg1YWYxNWY3NWM4ZjMzNzZhNjNhZWZlOWQwNmJhNTFkMjIxYTRiMjYzZDkzNGQ3NTUxNDIxYWNlOGY4ZWEyODY3ZjlhNGUwYTY=',
    hash: 'testhash123',
    amount: 150000,
    orderId: 'TEST-123',
    payerName: 'Test User',
    payerEmail: 'test@example.com',
    payerPhone: '08012345678',
    description: 'Test Payment'
  };

  req.write(JSON.stringify(requestData));
  req.end();
}

testSimpleRRR();