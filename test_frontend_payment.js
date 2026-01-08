// Test frontend payment flow simulation
async function testFrontendPayment() {
  try {
    console.log('🧪 Testing frontend payment flow...');
    
    const response = await fetch('http://localhost:3001/initialize-payment', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
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
      }),
    });

    console.log('📊 Response status:', response.status);
    console.log('📋 Response headers:', Object.fromEntries(response.headers.entries()));
    
    // Check if response has content
    const text = await response.text();
    console.log('📝 Raw response text:', text);
    
    if (!text.trim()) {
      throw new Error('Empty response body');
    }
    
    // Try to parse as JSON
    let data;
    try {
      data = JSON.parse(text);
      console.log('✅ Parsed JSON successfully:', data);
    } catch (parseError) {
      console.error('❌ JSON parse error:', parseError.message);
      console.error('📄 Raw text that failed to parse:', text);
      throw new Error(`Invalid JSON response: ${parseError.message}`);
    }
    
    if (!response.ok || !data.success) {
      throw new Error(data.error || 'Payment initialization failed');
    }
    
    console.log('🎉 Payment flow test successful!');
    console.log('💳 Payment URL:', data.paymentUrl);
    console.log('📋 RRR:', data.rrr);
    
    return data;
    
  } catch (error) {
    console.error('❌ Frontend payment test failed:', error.message);
    throw error;
  }
}

// Run the test
testFrontendPayment().catch(console.error);