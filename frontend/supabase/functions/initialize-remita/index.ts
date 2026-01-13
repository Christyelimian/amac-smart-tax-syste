import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RemitaPaymentRequest {
  revenueType: string;
  serviceName: string;
  amount: number;
  payerName: string;
  payerPhone: string;
  payerEmail?: string;
  businessAddress?: string;
  registrationNumber?: string;
  zone?: string;
  notes?: string;
}

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
    return new Response(null, { 
      headers: corsHeaders,
      status: 200
    });
  }

  try {
    const REMITA_MERCHANT_ID = Deno.env.get('REMITA_MERCHANT_ID');
    const REMITA_API_KEY = Deno.env.get('REMITA_API_KEY');
    const REMITA_SERVICE_TYPE_ID = Deno.env.get('REMITA_SERVICE_TYPE_ID');
    const REMITA_PUBLIC_KEY = Deno.env.get('REMITA_PUBLIC_KEY');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!REMITA_MERCHANT_ID || !REMITA_API_KEY || !REMITA_SERVICE_TYPE_ID || !REMITA_PUBLIC_KEY) {
      console.error('Remita credentials not configured:', {
        REMITA_MERCHANT_ID: !!REMITA_MERCHANT_ID,
        REMITA_API_KEY: !!REMITA_API_KEY,
        REMITA_SERVICE_TYPE_ID: !!REMITA_SERVICE_TYPE_ID,
        REMITA_PUBLIC_KEY: !!REMITA_PUBLIC_KEY
      });
      throw new Error('Remita payment gateway not configured');
    }

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      console.error('Supabase environment variables not configured');
      throw new Error('Database not configured');
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const body: RemitaPaymentRequest = await req.json();
    console.log('Received Remita payment request:', JSON.stringify(body, null, 2));

    // Validate required fields
    if (!body.revenueType || !body.serviceName || !body.amount || !body.payerName || !body.payerPhone) {
      throw new Error('Missing required fields: revenueType, serviceName, amount, payerName, payerPhone');
    }

    // Generate unique order ID for Remita
    const orderId = `AMAC-${body.revenueType.substring(0, 3).toUpperCase()}-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    
    console.log('Generated order ID:', orderId);

    // Create payment record in database first
    const { data: paymentRecord, error: insertError } = await supabase
      .from('payments')
      .insert({
        reference: orderId,
        revenue_type: body.revenueType,
        service_name: body.serviceName,
        amount: body.amount,
        payer_name: body.payerName,
        payer_phone: body.payerPhone,
        payer_email: body.payerEmail || null,
        business_address: body.businessAddress || null,
        registration_number: body.registrationNumber || null,
        zone: body.zone || null,
        notes: body.notes || null,
        status: 'pending',
        payment_method: 'remita',
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error inserting payment record:', insertError);
      throw new Error('Failed to create payment record');
    }

    console.log('Payment record created:', paymentRecord.id);

    // Generate hash for Remita: SHA512(merchantId + serviceTypeId + orderId + amount + apiKey)
    const hashString = `${REMITA_MERCHANT_ID}${REMITA_SERVICE_TYPE_ID}${orderId}${body.amount}${REMITA_API_KEY}`;
    const apiHash = await generateHash(hashString);

    // Prepare Remita payment initialization request
    const remitaPayload = {
      serviceTypeId: REMITA_SERVICE_TYPE_ID,
      amount: body.amount,
      orderId: orderId,
      payerName: body.payerName,
      payerEmail: body.payerEmail || `${body.payerPhone.replace(/\D/g, '')}@amacpay.ng`,
      payerPhone: body.payerPhone,
      description: `${body.serviceName} - ${body.payerName}`,
    };

    console.log('Remita payload:', JSON.stringify(remitaPayload, null, 2));

    // Initialize Remita RRR generation
    const remitaResponse = await fetch('https://demo.remita.net/remita/exapp/api/v1/send/api/echannelsvc/merchant/api/paymentinit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `remitaConsumerKey=${REMITA_MERCHANT_ID},remitaConsumerToken=${apiHash}`,
      },
      body: JSON.stringify(remitaPayload),
    });

    const remitaText = await remitaResponse.text();
    console.log('Remita raw response:', remitaText);

    // Parse Remita response (may be JSONP format)
    let remitaData;
    try {
      // Handle JSONP response: jsonp({ ... })
      const jsonMatch = remitaText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        remitaData = JSON.parse(jsonMatch[0]);
      } else {
        remitaData = JSON.parse(remitaText);
      }
    } catch (parseError) {
      console.error('Error parsing Remita response:', parseError);
      throw new Error('Invalid response from Remita');
    }

    console.log('Remita parsed response:', JSON.stringify(remitaData, null, 2));

    // Check for successful RRR generation
    if (remitaData.statuscode === '025' || remitaData.RRR) {
      const rrr = remitaData.RRR;

      // Update payment record with RRR
      await supabase
        .from('payments')
        .update({ 
          status: 'processing',
          gateway_response: { ...remitaData, rrr },
        })
        .eq('reference', orderId);

      console.log('RRR generated successfully:', rrr);

      return new Response(
        JSON.stringify({
          success: true,
          reference: orderId,
          rrr: rrr,
          amount: body.amount,
          merchantId: REMITA_MERCHANT_ID,
          publicKey: REMITA_PUBLIC_KEY,
          payerEmail: body.payerEmail || `${body.payerPhone.replace(/\D/g, '')}@amacpay.ng`,
          payerPhone: body.payerPhone,
          payerName: body.payerName,
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    } else {
      console.error('Remita RRR generation failed:', remitaData);

      // Update payment record to failed
      await supabase
        .from('payments')
        .update({ status: 'failed', gateway_response: remitaData })
        .eq('reference', orderId);

      throw new Error(remitaData.status || 'Failed to generate RRR');
    }

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
    console.error('Error in initialize-remita:', error);
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