// Test the real payment server
async function testPayment() {
  try {
    const response = await fetch('http://localhost:3002/initialize-payment', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        revenueType: 'SHOP_LICENSE',
        serviceName: 'Shop License',
        amount: 50000,
        payerName: 'John Doe',
        payerPhone: '08012345678',
        payerEmail: 'john@example.com',
        businessAddress: '123 Main St',
        registrationNumber: 'REG123456',
        zone: 'zone_a',
        notes: 'Test payment'
      }),
    });

    console.log('Response status:', response.status);
    const result = await response.json();
    console.log('Response:', result);
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testPayment();