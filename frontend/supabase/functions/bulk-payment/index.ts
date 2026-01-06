import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

interface BulkPaymentItem {
  revenue_type_code: string;
  amount: number;
  zone_id?: string;
  description?: string;
}

interface BulkPaymentRequest {
  payer_name: string;
  payer_phone: string;
  payer_email?: string;
  business_address?: string;
  items: BulkPaymentItem[];
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

    const body: BulkPaymentRequest = await req.json();
    console.log('Received bulk payment request:', JSON.stringify(body, null, 2));

    // Validate required fields
    if (!body.payer_name || !body.payer_phone || !body.items || body.items.length === 0) {
      throw new Error('Missing required fields: payer_name, payer_phone, items');
    }

    if (body.items.length > 10) {
      throw new Error('Maximum 10 items allowed per bulk payment');
    }

    // Calculate total amount and validate items
    let totalAmount = 0;
    const validatedItems: any[] = [];

    for (const item of body.items) {
      // Get revenue type details
      const { data: revenueType, error: revenueError } = await supabase
        .from('revenue_types')
        .select('*')
        .eq('code', item.revenue_type_code)
        .single();

      if (revenueError || !revenueType) {
        throw new Error(`Invalid revenue type: ${item.revenue_type_code}`);
      }

      // Calculate amount with zone multiplier if applicable
      let finalAmount = item.amount;
      if (revenueType.has_zones && item.zone_id) {
        const { data: zone } = await supabase
          .from('zones')
          .select('multiplier')
          .eq('id', item.zone_id)
          .single();

        if (zone) {
          finalAmount = item.amount * zone.multiplier;
        }
      }

      totalAmount += finalAmount;

      validatedItems.push({
        revenue_type_code: item.revenue_type_code,
        revenue_type_name: revenueType.name,
        amount: finalAmount,
        original_amount: item.amount,
        zone_id: item.zone_id,
        description: item.description,
      });
    }

    // Generate bulk payment reference and RRR
    const bulkReference = `BULK-AMC-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    const bulkRRR = await generateBulkRRR(supabase);

    // Create bulk payment record (parent record)
    const { data: bulkPayment, error: bulkError } = await supabase
      .from('payments')
      .insert({
        reference: bulkReference,
        rrr: bulkRRR,
        revenue_type: 'bulk_payment',
        revenue_type_code: 'bulk_payment',
        service_name: `Bulk Payment (${body.items.length} items)`,
        amount: totalAmount,
        payer_name: body.payer_name,
        payer_phone: body.payer_phone,
        payer_email: body.payer_email || null,
        property_name: body.payer_name,
        business_address: body.business_address || null,
        status: 'pending',
        payment_method: 'card', // Default, will be updated based on user choice
        notes: JSON.stringify({
          bulk_payment: true,
          items: validatedItems,
          item_count: body.items.length
        }),
      })
      .select()
      .single();

    if (bulkError) {
      console.error('Error creating bulk payment record:', bulkError);
      throw new Error('Failed to create bulk payment record');
    }

    console.log('Bulk payment record created:', bulkPayment.id);

    // Initialize Remita payment for the bulk amount
    const remitaPayload = {
      merchantId: Deno.env.get('REMITA_MERCHANT_ID'),
      serviceTypeId: Deno.env.get('REMITA_SERVICE_TYPE_ID'),
      amount: totalAmount,
      orderId: bulkRRR,
      payerName: body.payer_name,
      payerEmail: body.payer_email || `${body.payer_phone.replace(/\D/g, '')}@amacpay.ng`,
      payerPhone: body.payer_phone,
      description: `Bulk Payment: ${body.items.length} items - ₦${totalAmount.toLocaleString()}`,
    };

    // Generate API hash
    const hashData = `${remitaPayload.merchantId}${remitaPayload.serviceTypeId}${bulkRRR}${totalAmount}${Deno.env.get('REMITA_SECRET_KEY')}`;

    const hashBuffer = await crypto.subtle.digest('SHA-512', new TextEncoder().encode(hashData));
    const apiHash = Array.from(new Uint8Array(hashBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    // Prepare Remita payment data
    const paymentData = {
      ...remitaPayload,
      hash: apiHash,
      customFields: validatedItems.map((item, index) => ({
        name: `Item ${index + 1}`,
        value: `${item.revenue_type_name} - ₦${item.amount.toLocaleString()}`,
        type: 'String',
      })),
    };

    console.log('Bulk payment Remita payload prepared');

    // Update bulk payment with processing status
    await supabase
      .from('payments')
      .update({
        status: 'processing',
        remita_response: paymentData,
        gateway_response: paymentData,
      })
      .eq('rrr', bulkRRR);

    // Generate payment URLs (simplified for demo)
    const paymentUrl = `https://remitademo.net/remita/ecomm/finalize.reg?rrr=${bulkRRR}&merchantId=${remitaPayload.merchantId}`;
    const ussdCode = `*322*270007777777#`; // Sample USSD
    const qrCode = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=bulk:${bulkRRR}`;

    return new Response(
      JSON.stringify({
        success: true,
        reference: bulkReference,
        rrr: bulkRRR,
        paymentUrl,
        ussdCode,
        qrCode,
        totalAmount,
        itemCount: body.items.length,
        items: validatedItems,
        message: `Bulk payment initialized for ${body.items.length} items totaling ₦${totalAmount.toLocaleString()}`
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error in bulk payment:', error);
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

async function generateBulkRRR(supabase: any): Promise<string> {
  const { data, error } = await supabase.rpc('generate_rrr');
  if (error) throw error;
  return data;
}
