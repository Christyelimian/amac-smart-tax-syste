// Initialize Remita Inline Payment with RRR
if (result.rrr) {
  console.log('✅ Initializing Remita payment with RRR:', result.rrr);
  
  // Check if Remita SDK is loaded
  if (typeof (window as any).RmPaymentEngine === 'undefined') {
    toast.error('Remita payment SDK not loaded. Please refresh the page.');
    throw new Error('Remita SDK not loaded');
  }
  
  const paymentEngine = (window as any).RmPaymentEngine.init({
    key: 'QzAwMDAyNzEyNTl8MTEwNjE4NjF8OWZjOWYwNmMyZDk3MDRhYWM3YThiOThlNTNjZTE3ZjYxOTY5NDdmZWE1YzU3NDc0ZjE2ZDZjNTg1YWYxNWY3NWM4ZjMzNzZhNjNhZWZlOWQwNmJhNTFkMjIxYTRiMjYzZDkzNGQ3NTUxNDIxYWNlOGY4ZWEyODY3ZjlhNGUwYTY=',
    processRrr: true,
    extendedData: {
      customFields: [
        {
          name: 'rrr',
          value: result.rrr
        }
      ]
    },
    onSuccess: function(response: any) {
      console.log('✅ Payment successful:', response);
      toast.success('Payment completed successfully!');
    },
    onError: function(response: any) {
      console.error('❌ Payment error:', response);
      toast.error('Payment failed. Please try again.');
    },
    onClose: function() {
      console.log('Payment widget closed');
    }
  });
  
  paymentEngine.showPaymentWidget();
} else {
  throw new Error('No RRR received from payment server');
}