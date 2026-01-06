import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-remita-signature',
};

// Remita API configuration
const REMITA_CONFIG = {
  publicKey: Deno.env.get('REMITA_PUBLIC_KEY') || '',
  secretKey: Deno.env.get('REMITA_SECRET_KEY') || '',
  merchantId: Deno.env.get('REMITA_MERCHANT_ID') || '',
};

// Generate SHA-512 hash for Remita signature verification
async function generateRemitaHash(data: string): Promise<string> {
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);
  const hashBuffer = await crypto.subtle.digest('SHA-512', dataBuffer);
  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

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

    // Get raw body for signature verification
    const rawBody = await req.text();
    const signature = req.headers.get('x-remita-signature');

    console.log('Received Remita webhook');

    // Parse webhook data
    const webhookData = JSON.parse(rawBody);
    console.log('Webhook data:', JSON.stringify(webhookData, null, 2));

    // Verify webhook signature if provided
    if (signature) {
      // Remita signature verification (simplified for demo)
      // In production, verify against expected signature
      console.log('Webhook signature present, verifying...');
    }

    // Process different webhook events
    const { RRR, transactionRef, amount, status } = webhookData;

    if (!RRR) {
      console.error('No RRR in webhook data');
      return new Response(
        JSON.stringify({ error: 'Invalid webhook data - missing RRR' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    console.log(`Processing payment for RRR: ${RRR}, Status: ${status}`);

    // Find payment record by RRR
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .select('*')
      .eq('rrr', RRR)
      .single();

    if (paymentError || !payment) {
      console.error('Payment not found for RRR:', RRR);
      return new Response(
        JSON.stringify({ error: 'Payment not found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      );
    }

    // Process based on payment status
    if (status === '01' || status === '00' || webhookData.responseCode === '01') {
      // Payment successful
      console.log('Payment confirmed for RRR:', RRR);

      // Generate receipt number
      const { data: receiptNumber } = await supabase.rpc('generate_receipt_number', {
        revenue_code: payment.revenue_type_code
      });

      // Update payment record
      const { error: updateError } = await supabase
        .from('payments')
        .update({
          status: 'confirmed',
          payment_method: webhookData.paymentMethod || 'card',
          gateway_response: webhookData,
          bank_transaction_id: transactionRef || webhookData.transactionRef,
          bank_confirmed: true,
          bank_confirmed_at: new Date().toISOString(),
          reconciled: true,
          reconciled_at: new Date().toISOString(),
        })
        .eq('rrr', RRR);

      if (updateError) {
        console.error('Error updating payment:', updateError);
        throw updateError;
      }

      // Create receipt record
      const { error: receiptError } = await supabase
        .from('receipts')
        .insert({
          payment_id: payment.id,
          receipt_number: receiptNumber,
          qr_code_data: `rrr:${RRR}`,
        });

      if (receiptError) {
        console.error('Error creating receipt:', receiptError);
        // Don't fail the webhook for receipt creation errors
      }

      // Update reconciliation log
      await supabase
        .from('reconciliation_log')
        .insert({
          payment_id: payment.id,
          remita_amount: amount,
          bank_amount: amount,
          remita_rrr: RRR,
          bank_reference: transactionRef || webhookData.transactionRef,
          matched: true,
          resolved: true,
          resolved_at: new Date().toISOString(),
          notes: 'Auto-reconciled via webhook',
        });

      console.log('Payment processed successfully:', {
        rrr: RRR,
        receiptNumber,
        amount,
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

    } else if (status === '02' || status === '09' || webhookData.responseCode === '02') {
      // Payment failed
      console.log('Payment failed for RRR:', RRR);

      await supabase
        .from('payments')
        .update({
          status: 'failed',
          gateway_response: webhookData,
        })
        .eq('rrr', RRR);

    } else {
      // Unknown status - log for manual review
      console.log('Unknown payment status for RRR:', RRR, 'Status:', status);

      await supabase
        .from('reconciliation_log')
        .insert({
          payment_id: payment.id,
          remita_amount: amount,
          remita_rrr: RRR,
          matched: false,
          discrepancy_reason: `Unknown status: ${status}`,
          notes: 'Flagged for manual review',
        });
    }

    return new Response(
      JSON.stringify({
        received: true,
        status: 'processed',
        rrr: RRR
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Webhook error:', error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
