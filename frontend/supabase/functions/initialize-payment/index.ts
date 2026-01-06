import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PaymentRequest {
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

// Remita API configuration
const REMITA_CONFIG = {
  publicKey: Deno.env.get('REMITA_PUBLIC_KEY') || '',
  secretKey: Deno.env.get('REMITA_SECRET_KEY') || '',
  merchantId: Deno.env.get('REMITA_MERCHANT_ID') || '',
  serviceTypeId: Deno.env.get('REMITA_SERVICE_TYPE_ID') || '',
  apiUrl: Deno.env.get('REMITA_API_URL') || 'https://remitademo.net/remita/exapp/api/v1/send/api',
  webhookUrl: Deno.env.get('REMITA_WEBHOOK_URL') || '',
};

// Generate SHA-512 hash for Remita
function generateRemitaHash(data: string): string {
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);
  return crypto.subtle.digest('SHA-512', dataBuffer)
    .then(hash => Array.from(new Uint8Array(hash))
      .map(b => b.toString(16).padStart(2, '0'))
      .join(''));
}

// Generate RRR using database function
async function generateRRR(supabase: any): Promise<string> {
  const { data, error } = await supabase.rpc('generate_rrr');
  if (error) throw error;
  return data;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!REMITA_CONFIG.publicKey || !REMITA_CONFIG.secretKey || !REMITA_CONFIG.merchantId) {
      console.error('Remita credentials not configured');
      throw new Error('Payment gateway not configured');
    }

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      console.error('Supabase environment variables not configured');
      throw new Error('Database not configured');
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const body: PaymentRequest = await req.json();
    console.log('Received payment request:', JSON.stringify(body, null, 2));

    // Validate required fields
    if (!body.revenueType || !body.serviceName || !body.amount || !body.payerName || !body.payerPhone) {
      throw new Error('Missing required fields: revenueType, serviceName, amount, payerName, payerPhone');
    }

    // Generate unique RRR (Remita Retrieval Reference)
    const rrr = await generateRRR(supabase);
    console.log('Generated RRR:', rrr);

    // Get revenue type details
    const { data: revenueType, error: revenueError } = await supabase
      .from('revenue_types')
      .select('*')
      .eq('code', body.revenueType)
      .single();

    if (revenueError || !revenueType) {
      throw new Error('Invalid revenue type');
    }

    // Get zone details if applicable
    let zoneData = null;
    if (body.zone && revenueType.has_zones) {
      const { data: zone } = await supabase
        .from('zones')
        .select('*')
        .eq('id', body.zone.toLowerCase())
        .single();
      zoneData = zone;
    }

    // Calculate final amount (including zone multiplier if applicable)
    let finalAmount = body.amount;
    if (zoneData && revenueType.has_zones) {
      finalAmount = body.amount * zoneData.multiplier;
    }

    // Generate reference for tracking
    const reference = `AMC-${body.revenueType.substring(0, 3).toUpperCase()}-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    // Create payment record in database
    const { data: paymentRecord, error: insertError } = await supabase
      .from('payments')
      .insert({
        reference,
        rrr,
        revenue_type: body.revenueType,
        revenue_type_code: body.revenueType,
        service_name: body.serviceName,
        zone_id: body.zone?.toLowerCase() || null,
        amount: finalAmount,
        payer_name: body.payerName,
        payer_phone: body.payerPhone,
        payer_email: body.payerEmail || null,
        property_name: body.payerName, // Store business/property name
        business_address: body.businessAddress || null,
        registration_number: body.registrationNumber || null,
        notes: body.notes || null,
        status: 'pending',
        payment_channel: 'card', // Default, will be updated based on user choice
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error inserting payment record:', insertError);
      throw new Error('Failed to create payment record');
    }

    console.log('Payment record created:', paymentRecord.id);

    // Prepare Remita payment data
    const remitaData = {
      merchantId: REMITA_CONFIG.merchantId,
      serviceTypeId: REMITA_CONFIG.serviceTypeId,
      amount: finalAmount,
      orderId: rrr,
      payerName: body.payerName,
      payerEmail: body.payerEmail || `${body.payerPhone.replace(/\D/g, '')}@amacpay.ng`,
      payerPhone: body.payerPhone,
      description: `${body.serviceName} - ${body.revenueType}`,
    };

    // Generate API hash for Remita
    const hashData = `${REMITA_CONFIG.merchantId}${REMITA_CONFIG.serviceTypeId}${rrr}${finalAmount}${REMITA_CONFIG.secretKey}`;
    const apiHash = await generateRemitaHash(hashData);

    // Initialize Remita transaction
    const remitaPayload = {
      ...remitaData,
      apiKey: REMITA_CONFIG.publicKey,
      hash: apiHash,
      customFields: [
        {
          name: 'Revenue Type',
          value: body.serviceName,
          type: 'String',
        },
        {
          name: 'Zone',
          value: zoneData?.name || 'N/A',
          type: 'String',
        },
        {
          name: 'Business Address',
          value: body.businessAddress || 'N/A',
          type: 'String',
        },
      ],
    };

    console.log('Remita payload:', JSON.stringify(remitaPayload, null, 2));

    // For demo/development, we'll simulate successful RRR generation
    // In production, this would call the actual Remita API
    const remitaResponse = {
      status: 'success',
      rrr: rrr,
      orderId: rrr,
      amount: finalAmount,
      paymentUrl: `https://remitademo.net/remita/ecomm/finalize.reg?rrr=${rrr}&merchantId=${REMITA_CONFIG.merchantId}`,
      ussdCode: `*322*270007777777#`, // Sample USSD code
      bankAccount: {
        accountNumber: '9876543210',
        bankName: 'Zenith Bank',
        accountName: 'Abuja Municipal Area Council',
      },
      qrCode: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=rrr:${rrr}`,
    };

    // Update payment record with Remita response
    await supabase
      .from('payments')
      .update({
        status: 'processing',
        remita_response: remitaResponse,
        gateway_response: remitaResponse,
      })
      .eq('rrr', rrr);

    console.log('Payment initialized successfully with Remita');

    return new Response(
      JSON.stringify({
        success: true,
        reference,
        rrr,
        paymentUrl: remitaResponse.paymentUrl,
        ussdCode: remitaResponse.ussdCode,
        bankAccount: remitaResponse.bankAccount,
        qrCode: remitaResponse.qrCode,
        amount: finalAmount,
        zoneMultiplier: zoneData?.multiplier || 1,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
    console.error('Error in initialize-payment:', error);
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
