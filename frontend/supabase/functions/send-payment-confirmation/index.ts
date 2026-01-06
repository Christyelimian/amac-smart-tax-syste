import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ConfirmationRequest {
  paymentId: string;
  customerEmail?: string;
  customerPhone?: string;
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

    const { paymentId, customerEmail, customerPhone }: ConfirmationRequest = await req.json();
    console.log('Sending confirmation for payment:', paymentId);

    if (!paymentId) {
      throw new Error('Payment ID is required');
    }

    // Fetch payment details with receipt
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .select(`
        *,
        receipts (
          receipt_number,
          generated_at
        )
      `)
      .eq('id', paymentId)
      .single();

    if (paymentError || !payment) {
      console.error('Payment not found:', paymentError);
      throw new Error('Payment not found');
    }

    // Generate receipt number if not exists (for bank transfers)
    let receiptNumber = payment.receipt_number || payment.receipts?.[0]?.receipt_number;

    if (!receiptNumber && payment.status === 'confirmed') {
      const { data: generatedReceiptNumber } = await supabase.rpc('generate_receipt_number', {
        revenue_code: payment.revenue_type_code || payment.revenue_type
      });

      if (generatedReceiptNumber) {
        // Create receipt record
        const { error: receiptError } = await supabase
          .from('receipts')
          .insert({
            payment_id: payment.id,
            receipt_number: generatedReceiptNumber,
            qr_code_data: `ref:${payment.reference}`,
            sent_via_email: customerEmail ? true : false,
            sent_via_sms: customerPhone ? true : false,
            email_sent_at: customerEmail ? new Date().toISOString() : null,
            sms_sent_at: customerPhone ? new Date().toISOString() : null,
          });

        if (receiptError) {
          console.error('Error creating receipt:', receiptError);
        } else {
          receiptNumber = generatedReceiptNumber;

          // Update payment with receipt number
          await supabase
            .from('payments')
            .update({ receipt_number: receiptNumber })
            .eq('id', payment.id);
        }
      }
    }

    // Prepare confirmation message
    const confirmationData = {
      payment_reference: payment.reference,
      receipt_number: receiptNumber,
      amount: payment.amount,
      service_name: payment.service_name,
      payer_name: payment.payer_name,
      confirmed_at: payment.confirmed_at || payment.verified_at || new Date().toISOString(),
      payment_method: payment.payment_method,
      customer_email: customerEmail || payment.payer_email,
      customer_phone: customerPhone || payment.payer_phone,
    };

    console.log('Confirmation data:', confirmationData);

    // Send SMS if phone number available
    if (customerPhone) {
      try {
        // In production, integrate with SMS service like Termii, Twilio, etc.
        console.log('Sending SMS confirmation to:', customerPhone);

        // For demo purposes, we'll simulate SMS sending
        // Replace with actual SMS service integration
        const smsMessage = `AMAC Payment Confirmed!\nRef: ${payment.reference}\nReceipt: ${receiptNumber}\nAmount: ₦${payment.amount.toLocaleString()}\nService: ${payment.service_name}\nThank you!`;

        // Log SMS attempt
        await supabase
          .from('reminders')
          .insert({
            payment_id: payment.id,
            reminder_type: 'payment_confirmed',
            channel: 'sms',
            message_content: smsMessage,
            sent_at: new Date().toISOString(),
            delivered: true, // Assume delivered for demo
          });

      } catch (smsError) {
        console.error('SMS sending failed:', smsError);
      }
    }

    // Send Email if email available
    if (customerEmail) {
      try {
        console.log('Sending email confirmation to:', customerEmail);

        // For demo purposes, we'll simulate email sending
        // In production, integrate with email service like SendGrid, Mailgun, etc.
        const emailSubject = `AMAC Payment Confirmation - ${payment.reference}`;
        const emailBody = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #006838;">Payment Confirmed Successfully!</h2>
            <p>Dear ${payment.payer_name},</p>
            <p>Your payment has been confirmed and processed successfully.</p>

            <div style="background: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
              <h3>Payment Details:</h3>
              <p><strong>Reference:</strong> ${payment.reference}</p>
              <p><strong>Receipt Number:</strong> ${receiptNumber}</p>
              <p><strong>Amount:</strong> ₦${payment.amount.toLocaleString()}</p>
              <p><strong>Service:</strong> ${payment.service_name}</p>
              <p><strong>Payment Method:</strong> ${payment.payment_method}</p>
              <p><strong>Confirmed At:</strong> ${new Date(confirmationData.confirmed_at).toLocaleString('en-NG')}</p>
            </div>

            <p>Please keep this receipt for your records.</p>
            <p>Thank you for using Abuja Municipal Area Council services!</p>

            <hr style="margin: 30px 0;">
            <p style="color: #666; font-size: 12px;">
              Abuja Municipal Area Council<br>
              Revenue Collection System
            </p>
          </div>
        `;

        // Log email attempt
        await supabase
          .from('reminders')
          .insert({
            payment_id: payment.id,
            reminder_type: 'payment_confirmed',
            channel: 'email',
            message_content: emailBody,
            sent_at: new Date().toISOString(),
            delivered: true, // Assume delivered for demo
          });

      } catch (emailError) {
        console.error('Email sending failed:', emailError);
      }
    }

    console.log('Payment confirmation sent successfully');

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Confirmation sent successfully',
        receipt_number: receiptNumber,
        sent_to: {
          email: customerEmail,
          phone: customerPhone,
        },
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error in send-payment-confirmation:', error);
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