import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Remita API configuration
const REMITA_CONFIG = {
  publicKey: Deno.env.get('REMITA_PUBLIC_KEY') || '',
  secretKey: Deno.env.get('REMITA_SECRET_KEY') || '',
  merchantId: Deno.env.get('REMITA_MERCHANT_ID') || '',
  apiUrl: Deno.env.get('REMITA_API_URL') || 'https://remitademo.net/remita/exapp/api/v1/send/api',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      console.error('Supabase environment variables not configured');
      throw new Error('Database not configured');
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { reference, rrr } = await req.json();
    console.log('Verifying payment for reference:', reference, 'RRR:', rrr);

    if (!reference && !rrr) {
      throw new Error('Reference or RRR is required');
    }

    // Find payment record
    let paymentQuery = supabase.from('payments').select('*');
    if (rrr) {
      paymentQuery = paymentQuery.eq('rrr', rrr);
    } else {
      paymentQuery = paymentQuery.eq('reference', reference);
    }

    const { data: payment, error: paymentError } = await paymentQuery.single();

    if (paymentError || !payment) {
      console.error('Payment not found:', { reference, rrr });
      throw new Error('Payment not found');
    }

    // If payment is already confirmed, return current status
    if (payment.status === 'confirmed') {
      const { data: receipt } = await supabase
        .from('receipts')
        .select('receipt_number')
        .eq('payment_id', payment.id)
        .single();

      return new Response(
        JSON.stringify({
          success: true,
          status: 'confirmed',
          reference: payment.reference,
          rrr: payment.rrr,
          receipt_number: receipt?.receipt_number,
          amount: payment.amount,
          payer_name: payment.payer_name,
          service_name: payment.service_name,
          payment_method: payment.payment_method,
          confirmed_at: payment.confirmed_at,
          message: 'Payment already confirmed',
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

    // Check payment status with Remita (simplified for demo)
    // In production, this would call Remita's transaction status API
    console.log('Checking payment status for RRR:', payment.rrr);

    // For demo purposes, we'll simulate checking with Remita
    // In production, you would:
    // 1. Call Remita's transaction status API
    // 2. Verify the payment status
    // 3. Update records accordingly

    const mockRemitaResponse = {
      status: 'success',
      RRR: payment.rrr,
      amount: payment.amount,
      transactionRef: `TXN-${Date.now()}`,
      responseCode: '01', // 01 = successful
      paymentMethod: 'card',
      paidAt: new Date().toISOString(),
    };

    // Simulate different scenarios for testing
    const isSuccess = Math.random() > 0.1; // 90% success rate for demo

    if (isSuccess) {
      // Generate receipt number
      const { data: receiptNumber } = await supabase.rpc('generate_receipt_number', {
        revenue_code: payment.revenue_type_code
      });

      // Update payment record
      const { data: updatedPayment, error: updateError } = await supabase
        .from('payments')
        .update({
          status: 'confirmed',
          payment_method: mockRemitaResponse.paymentMethod,
          gateway_response: mockRemitaResponse,
          bank_transaction_id: mockRemitaResponse.transactionRef,
          bank_confirmed: true,
          bank_confirmed_at: new Date().toISOString(),
          reconciled: true,
          reconciled_at: new Date().toISOString(),
          confirmed_at: new Date().toISOString(),
        })
        .eq('rrr', payment.rrr)
        .select()
        .single();

      if (updateError) {
        console.error('Error updating payment record:', updateError);
        throw new Error('Failed to update payment record');
      }

      // Create receipt record
      const { error: receiptError } = await supabase
        .from('receipts')
        .insert({
          payment_id: payment.id,
          receipt_number: receiptNumber,
          qr_code_data: `rrr:${payment.rrr}`,
          sent_via_email: payment.payer_email ? true : false,
          sent_via_sms: true,
          email_sent_at: payment.payer_email ? new Date().toISOString() : null,
          sms_sent_at: new Date().toISOString(),
        });

      if (receiptError) {
        console.error('Error creating receipt:', receiptError);
      }

      // Update reconciliation log
      await supabase
        .from('reconciliation_log')
        .insert({
          payment_id: payment.id,
          remita_amount: payment.amount,
          bank_amount: payment.amount,
          remita_rrr: payment.rrr,
          bank_reference: mockRemitaResponse.transactionRef,
          matched: true,
          resolved: true,
          resolved_at: new Date().toISOString(),
          notes: 'Auto-verified via status check',
        });

      // Generate and send receipt automatically
      try {
        const { data: receiptResult, error: receiptError } = await supabase.functions.invoke('generate-receipt', {
          body: { payment_id: payment.id }
        });

        if (receiptError) {
          console.error('Error generating receipt:', receiptError);
        } else {
          console.log('Receipt generated successfully:', receiptResult);
        }
      } catch (error) {
        console.error('Failed to generate receipt:', error);
      }

      console.log('Payment verification completed:', {
        reference: payment.reference,
        rrr: payment.rrr,
        status: 'confirmed',
        receiptNumber,
      });

      return new Response(
        JSON.stringify({
          success: true,
          status: 'confirmed',
          reference: payment.reference,
          rrr: payment.rrr,
          receipt_number: receiptNumber,
          amount: payment.amount,
          payer_name: payment.payer_name,
          service_name: payment.service_name,
          payment_method: mockRemitaResponse.paymentMethod,
          paid_at: mockRemitaResponse.paidAt,
          message: 'Payment confirmed successfully',
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );

    } else {
      // Payment failed or pending
      await supabase
        .from('payments')
        .update({
          status: 'failed',
          gateway_response: { ...mockRemitaResponse, responseCode: '02' },
        })
        .eq('rrr', payment.rrr);

      return new Response(
        JSON.stringify({
          success: false,
          status: 'failed',
          reference: payment.reference,
          rrr: payment.rrr,
          message: 'Payment verification failed',
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
    console.error('Error in verify-payment:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
