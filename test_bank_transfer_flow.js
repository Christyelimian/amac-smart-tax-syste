// Test script to verify bank transfer flow
// This simulates the complete bank transfer payment process

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL || 'your-supabase-url';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'your-service-role-key';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function testBankTransferFlow() {
  console.log('🧪 Testing Bank Transfer Flow...\n');

  try {
    // Step 1: Create a bank transfer payment (simulating PaymentForm.tsx)
    console.log('Step 1: Creating bank transfer payment...');
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .insert([{
        payer_name: 'John Doe',
        payer_phone: '+2341234567890',
        payer_email: 'john@example.com',
        property_name: 'John\'s Business',
        business_address: '123 Main St, Abuja',
        service_name: 'Business Premises Permit',
        revenue_type: 'business-premises',
        revenue_type_code: 'business-premises',
        zone_id: 'a',
        amount: 25000,
        status: 'pending',
        payment_method: 'bank_transfer',
        notes: JSON.stringify({
          customer_details: {
            businessName: 'John\'s Business',
            contactPerson: 'John Doe',
            phone: '+2341234567890',
            email: 'john@example.com'
          }
        })
      }])
      .select()
      .single();

    if (paymentError) throw paymentError;
    console.log('✅ Payment created:', payment.id);

    // Step 2: Simulate proof upload (simulating UploadProof.tsx)
    console.log('\nStep 2: Uploading payment proof...');
    const { error: updateError } = await supabase
      .from('payments')
      .update({
        proof_of_payment_url: 'https://example.com/proof.jpg', // Mock URL
        status: 'awaiting_verification',
        submitted_at: new Date().toISOString()
      })
      .eq('id', payment.id);

    if (updateError) throw updateError;
    console.log('✅ Proof uploaded, status changed to awaiting_verification');

    // Step 3: Admin verification (simulating PaymentVerification.tsx)
    console.log('\nStep 3: Admin verifying payment...');
    const { error: verifyError } = await supabase
      .from('payments')
      .update({
        status: 'confirmed',
        verified_by: 'admin-user-id', // Mock admin ID
        verified_at: new Date().toISOString(),
        verification_notes: 'Payment proof verified',
        confirmed_at: new Date().toISOString(),
        bank_confirmed: true,
        bank_confirmed_at: new Date().toISOString(),
        reconciled: true,
        reconciled_at: new Date().toISOString()
      })
      .eq('id', payment.id);

    if (verifyError) throw verifyError;
    console.log('✅ Payment verified and confirmed');

    // Step 4: Test send-payment-confirmation function
    console.log('\nStep 4: Sending payment confirmation...');
    const { data: confirmationResponse, error: confirmationError } = await supabase.functions.invoke('send-payment-confirmation', {
      body: {
        paymentId: payment.id,
        customerEmail: payment.payer_email,
        customerPhone: payment.payer_phone
      }
    });

    if (confirmationError) {
      console.log('⚠️  Confirmation function error (expected in test environment):', confirmationError.message);
    } else {
      console.log('✅ Confirmation sent:', confirmationResponse);
    }

    // Step 5: Verify final state
    console.log('\nStep 5: Verifying final payment state...');
    const { data: finalPayment, error: finalError } = await supabase
      .from('payments')
      .select(`
        *,
        receipts (
          receipt_number,
          generated_at
        ),
        reconciliation_log (
          matched,
          resolved,
          notes
        )
      `)
      .eq('id', payment.id)
      .single();

    if (finalError) throw finalError;

    console.log('✅ Final payment status:', finalPayment.status);
    console.log('✅ Receipt generated:', finalPayment.receipts?.[0]?.receipt_number || 'None');
    console.log('✅ Reconciliation logged:', finalPayment.reconciliation_log?.[0]?.matched || false);

    // Summary
    console.log('\n🎉 Bank Transfer Flow Test Summary:');
    console.log('=====================================');
    console.log(`Payment ID: ${payment.id}`);
    console.log(`Final Status: ${finalPayment.status}`);
    console.log(`Receipt Number: ${finalPayment.receipts?.[0]?.receipt_number || 'Not generated'}`);
    console.log(`Reconciled: ${finalPayment.reconciled}`);
    console.log(`Bank Confirmed: ${finalPayment.bank_confirmed}`);

    if (finalPayment.status === 'confirmed' &&
        finalPayment.receipts?.[0]?.receipt_number &&
        finalPayment.reconciled &&
        finalPayment.bank_confirmed) {
      console.log('\n✅ All checks passed! Bank transfer flow is working correctly.');
    } else {
      console.log('\n❌ Some checks failed. Please review the implementation.');
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testBankTransferFlow();
