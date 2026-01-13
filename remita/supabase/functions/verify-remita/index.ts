import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// Generate SHA512 hash for Remita API
async function generateHash(data: string): Promise<string> {
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);
  const hashBuffer = await crypto.subtle.digest('SHA-512', dataBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const REMITA_MERCHANT_ID = Deno.env.get('REMITA_MERCHANT_ID');
    const REMITA_API_KEY = Deno.env.get('REMITA_API_KEY');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!REMITA_MERCHANT_ID || !REMITA_API_KEY) {
      console.error('Remita credentials not configured');
      throw new Error('Remita payment gateway not configured');
    }

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      console.error('Supabase environment variables not configured');
      throw new Error('Database not configured');
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { reference, rrr } = await req.json();
    console.log('Verifying Remita payment for reference:', reference, 'RRR:', rrr);

    if (!reference && !rrr) {
      throw new Error('Reference or RRR is required');
    }

    // Generate hash for status check: SHA512(rrr + apiKey + merchantId)
    const rrrToCheck = rrr || reference;
    const hashString = `${rrrToCheck}${REMITA_API_KEY}${REMITA_MERCHANT_ID}`;
    const apiHash = await generateHash(hashString);

    // Check payment status with Remita
    const statusUrl = `https://demo.remita.net/remita/exapp/api/v1/send/api/echannelsvc/${REMITA_MERCHANT_ID}/${rrrToCheck}/${apiHash}/status.reg`;
    console.log('Status check URL:', statusUrl);

    const statusResponse = await fetch(statusUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const statusText = await statusResponse.text();
    console.log('Remita status raw response:', statusText);

    // Parse response (may be JSONP format)
    let statusData;
    try {
      const jsonMatch = statusText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        statusData = JSON.parse(jsonMatch[0]);
      } else {
        statusData = JSON.parse(statusText);
      }
    } catch (parseError) {
      console.error('Error parsing Remita status response:', parseError);
      throw new Error('Invalid response from Remita');
    }

    console.log('Remita status parsed response:', JSON.stringify(statusData, null, 2));

    // Check payment status - "00" or "01" means successful
    const isSuccess = statusData.status === '00' || statusData.status === '01';
    
    // Generate receipt number if successful
    const receiptNumber = isSuccess 
      ? `AMAC/${new Date().getFullYear()}/REM/${String(Date.now()).slice(-6)}`
      : null;

    // Get payment record by reference or by looking up RRR in gateway_response
    let paymentQuery = supabase.from('payments').select('*');
    
    if (reference && !reference.startsWith('RRR')) {
      paymentQuery = paymentQuery.eq('reference', reference);
    } else {
      // Search in gateway_response for RRR
      paymentQuery = paymentQuery.contains('gateway_response', { rrr: rrrToCheck });
    }

    const { data: existingPayment } = await paymentQuery.single();

    // Update payment record
    const updateData = {
      status: isSuccess ? 'confirmed' : 'failed',
      payment_method: 'remita',
      gateway_response: statusData,
      receipt_number: receiptNumber,
      confirmed_at: isSuccess ? new Date().toISOString() : null,
    };

    let updatedPayment;
    if (existingPayment) {
      const { data, error: updateError } = await supabase
        .from('payments')
        .update(updateData)
        .eq('id', existingPayment.id)
        .select()
        .single();

      if (updateError) {
        console.error('Error updating payment record:', updateError);
      }
      updatedPayment = data || existingPayment;
    }

    console.log('Remita payment verification completed:', {
      reference,
      rrr: rrrToCheck,
      status: isSuccess ? 'confirmed' : 'failed',
      receiptNumber,
    });

    return new Response(
      JSON.stringify({
        success: isSuccess,
        status: isSuccess ? 'confirmed' : 'failed',
        reference: existingPayment?.reference || reference,
        rrr: rrrToCheck,
        receipt_number: receiptNumber,
        amount: statusData.amount || updatedPayment?.amount,
        payer_name: updatedPayment?.payer_name,
        service_name: updatedPayment?.service_name,
        payment_method: 'remita',
        paid_at: statusData.transactiontime || null,
        message: isSuccess ? 'Payment confirmed successfully' : statusData.message || 'Payment verification failed',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
    console.error('Error in verify-remita:', error);
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
