# Payment API Integration Guide

This guide explains how to properly use the `/initialize-payment` endpoint to process payments through the AMAC Smart Tax System.

## Endpoint Information

- **URL**: `http://localhost:3001/initialize-payment` (development)
- **Method**: `POST` (GET requests will return helpful error guidance)
- **Content-Type**: `application/json` (required)

## Understanding the "Method Not Allowed" Response

If you make a GET request to this endpoint, you'll receive a helpful response:

```json
{
  "error": "Method Not Allowed",
  "message": "This endpoint only accepts POST requests",
  "method": "POST",
  "requiredHeaders": {
    "Content-Type": "application/json"
  },
  "exampleRequest": {
    "revenueType": "SHOP_LICENSE",
    "serviceName": "Shop License",
    "amount": 50000,
    "payerName": "John Doe",
    "payerPhone": "08012345678",
    "payerEmail": "john@example.com",
    "businessAddress": "123 Main St",
    "registrationNumber": "REG123456",
    "zone": "zone_a",
    "notes": "Optional notes"
  },
  "exampleResponse": {
    "success": true,
    "reference": "AMC-SHO-1234567890-ABC123",
    "rrr": "AMC-1234567890123-XYZ789",
    "paymentUrl": "https://remitademo.net/remita/ecomm/finalize.reg?rrr=AMC-1234567890123-XYZ789&merchantId=2547916",
    "ussdCode": "*322*270007777777#",
    "amount": 50000
  },
  "documentation": "This endpoint initializes a payment and returns a Remita payment URL for redirection",
  "healthCheck": "http://localhost:3001/health"
}
```

**This is not an error!** It's a helpful guide showing you exactly how to use the endpoint correctly.

## Correct Usage Examples

### JavaScript (Frontend)

```javascript
const response = await fetch('http://localhost:3001/initialize-payment', {
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
    notes: 'Optional notes'
  }),
});

const result = await response.json();
if (result.success) {
  // Redirect to Remita payment page
  window.location.href = result.paymentUrl;
}
```

### Node.js (Backend)

```javascript
const https = require('https');

const postData = JSON.stringify({
  revenueType: 'SHOP_LICENSE',
  serviceName: 'Shop License',
  amount: 50000,
  payerName: 'John Doe',
  payerPhone: '08012345678',
  payerEmail: 'john@example.com',
  businessAddress: '123 Main St',
  registrationNumber: 'REG123456',
  zone: 'zone_a',
  notes: 'Optional notes'
});

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

const req = https.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => {
    const result = JSON.parse(data);
    console.log('Payment URL:', result.paymentUrl);
  });
});

req.write(postData);
req.end();
```

### cURL

```bash
curl -X POST http://localhost:3001/initialize-payment \
  -H "Content-Type: application/json" \
  -d '{
    "revenueType": "SHOP_LICENSE",
    "serviceName": "Shop License",
    "amount": 50000,
    "payerName": "John Doe",
    "payerPhone": "08012345678",
    "payerEmail": "john@example.com",
    "businessAddress": "123 Main St",
    "registrationNumber": "REG123456",
    "zone": "zone_a",
    "notes": "Optional notes"
  }'
```

## Request Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `revenueType` | string | ✅ Yes | Revenue type code (e.g., "SHOP_LICENSE") |
| `serviceName` | string | ✅ Yes | Human-readable service name |
| `amount` | number | ✅ Yes | Payment amount in Naira |
| `payerName` | string | ✅ Yes | Name of the person making payment |
| `payerPhone` | string | ✅ Yes | Phone number of payer |
| `payerEmail` | string | ❌ No | Email address of payer |
| `businessAddress` | string | ❌ No | Business address |
| `registrationNumber` | string | ❌ No | Business registration number |
| `zone` | string | ❌ No | Zone identifier (e.g., "zone_a") |
| `notes` | string | ❌ No | Additional notes |

## Response Format

```json
{
  "success": true,
  "reference": "AMC-SHO-1234567890-ABC123",
  "rrr": "AMC-1234567890123-XYZ789",
  "paymentUrl": "https://remitademo.net/remita/ecomm/finalize.reg?rrr=AMC-1234567890123-XYZ789&merchantId=2547916",
  "ussdCode": "*322*270007777777#",
  "bankAccount": {
    "accountNumber": "9876543210",
    "bankName": "Zenith Bank",
    "accountName": "Abuja Municipal Area Council"
  },
  "qrCode": "https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=rrr:AMC-1234567890123-XYZ789",
  "amount": 75000,
  "zoneMultiplier": 1.5,
  "paymentRecord": {
    "id": "unique-id",
    "reference": "AMC-SHO-1234567890-ABC123",
    "rrr": "AMC-1234567890123-XYZ789",
    "revenue_type": "SHOP_LICENSE",
    "service_name": "Shop License",
    "zone_id": "zone_a",
    "amount": 75000,
    "payer_name": "John Doe",
    "payer_phone": "08012345678",
    "payer_email": "john@example.com",
    "property_name": "Business Name",
    "business_address": "123 Main St",
    "registration_number": "REG123456",
    "notes": "Test payment",
    "status": "processing",
    "payment_channel": "card",
    "created_at": "2026-01-08T19:41:04.923Z"
  }
}
```

## Zone Multipliers

The system automatically applies zone multipliers:

- `zone_a`: 1.5x multiplier
- `zone_b`: 1.3x multiplier  
- `zone_c`: 1.1x multiplier
- `zone_d`: 1.0x multiplier (no change)

If no zone is provided, the base amount is used.

## Error Handling

Common errors and how to handle them:

### Missing Required Fields
```json
{
  "success": false,
  "error": "Missing required fields: revenueType, serviceName, amount, payerName, payerPhone"
}
```

**Solution**: Ensure all required fields are provided in the request.

### Invalid JSON
```json
{
  "success": false,
  "error": "Invalid JSON payload"
}
```

**Solution**: Check that your request body is valid JSON.

### Server Errors
```json
{
  "success": false,
  "error": "An unexpected error occurred"
}
```

**Solution**: Check server logs and try again.

## Testing the Endpoint

You can test the endpoint using the provided test files:

- `test_frontend_payment.js` - Simple frontend test
- `test_local_server.js` - Comprehensive server test
- `test_payment_endpoint.js` - API testing guide

Run tests with:
```bash
node test_frontend_payment.js
```

## Health Check

Check if the server is running:
```bash
curl http://localhost:3001/health
# or
fetch('http://localhost:3001/health')
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2026-01-08T19:41:04.923Z",
  "message": "Simple Payment Server is running"
}
```

## Integration with Frontend

The `DemandNoticePayment.tsx` component now includes full payment integration:

```typescript
const handlePayment = async () => {
  if (!selectedNotice) {
    toast.error('No demand notice selected');
    return;
  }

  try {
    setIsProcessing(true);
    toast.info('Initializing payment...');
    
    // Prepare payment data from demand notice
    const paymentData = {
      revenueType: selectedNotice.revenue_type,
      serviceName: selectedNotice.revenue_type,
      amount: selectedNotice.amount_due,
      payerName: selectedNotice.taxpayer_name,
      payerPhone: selectedNotice.taxpayer_phone,
      // ... other fields
    };

    // Make POST request
    const response = await fetch('http://localhost:3001/initialize-payment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(paymentData),
    });

    const result = await response.json();
    
    if (result.success) {
      // Redirect to Remita
      window.location.href = result.paymentUrl;
    }

  } catch (error) {
    toast.error(error.message);
  } finally {
    setIsProcessing(false);
  }
};
```

## Troubleshooting

### "Method Not Allowed" Error
**Cause**: You're making a GET request instead of POST.
**Solution**: Change your request method to POST.

### CORS Issues
**Cause**: Request from unauthorized origin.
**Solution**: Ensure your frontend is running on `http://localhost:3000` or configure CORS properly.

### Empty Response
**Cause**: Server error or invalid request.
**Solution**: Check server logs and validate your request payload.

### Connection Refused
**Cause**: Server not running.
**Solution**: Start the server with `node simple_payment_server.js`.

## Best Practices

1. **Always use POST method** for this endpoint
2. **Set Content-Type header** to `application/json`
3. **Validate input data** before sending to server
4. **Handle errors gracefully** and show user-friendly messages
5. **Use loading states** to prevent duplicate submissions
6. **Test with different scenarios** (different zones, amounts, etc.)
7. **Monitor server logs** for debugging

## Support

For additional help:
- Check the server console logs
- Review the example test files
- Consult the Remita integration documentation
- Contact the development team for complex issues