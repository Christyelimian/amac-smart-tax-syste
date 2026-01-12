import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SMSReceiptRequest {
  receipt_number: string;
  reference: string;
  amount: number;
  payer_name: string;
  service_name: string;
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

    const smsData: SMSReceiptRequest = await req.json();
    console.log('Sending receipt SMS for reference:', smsData.reference);

    // Validate required fields
    const { receipt_number, reference, amount, payer_name, service_name } = smsData;
    
    if (!receipt_number || !reference || !amount || !payer_name) {
      throw new Error('Missing required fields for SMS receipt');
    }

    // Find payment and customer phone
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .select('payer_phone')
      .eq('reference', reference)
      .single();

    if (paymentError || !payment) {
      throw new Error('Payment not found or phone number not available');
    }

    const customerPhone = payment.payer_phone;
    if (!customerPhone) {
      throw new Error('Customer phone number not found');
    }

    // Send SMS using your SMS service (Termii, Twilio, etc.)
    try {
      console.log('Sending receipt SMS to:', customerPhone);

      // Construct SMS message (keep under 160 characters if possible)
      const smsMessage = `AMAC Receipt: ${receipt_number}
Ref: ${reference}
Amount: ₦${amount.toLocaleString()}
Service: ${service_name}
Name: ${payer_name}
Thank you! Verify: smarttax.com.ng/verify/${receipt_number}`;

      // For demo purposes, we'll log the message
      // In production, integrate with SMS service like:
      // - Termii (African SMS provider)
      // - Twilio
      // - Infobip
      // etc.
      
      console.log('SMS Message:', smsMessage);

      // Example Termii integration (commented for demo):
      // const termiiResponse = await fetch('https://api.termii.com/api/sms/send', {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //   },
      //   body: JSON.stringify({
      //     to: customerPhone,
      //     from: 'AMAC',
      //     sms: smsMessage,
      //     type: 'plain',
      //     channel: 'dnd',
      //     api_key: Deno.env.get('TERMII_API_KEY'),
      //   }),
      // });

      // if (!termiiResponse.ok) {
      //   throw new Error('SMS service error');
      // }

      // Log SMS attempt for tracking
      await supabase
        .from('sms_logs')
        .insert({
          to_phone: customerPhone,
          message: smsMessage,
          template: 'payment_receipt',
          payment_reference: reference,
          receipt_number: receipt_number,
          status: 'sent', // Change to 'pending' if using actual SMS service
          sent_at: new Date().toISOString(),
          characters_count: smsMessage.length,
        });

      console.log('Receipt SMS sent successfully to:', customerPhone);

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Receipt SMS sent successfully',
          phone: customerPhone,
          receipt_number: receipt_number,
          message_preview: smsMessage.substring(0, 50) + '...',
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );

    } catch (smsError) {
      console.error('SMS sending failed:', smsError);
      throw new Error('Failed to send SMS: ' + smsError.message);
    }

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error in send-receipt-sms:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});