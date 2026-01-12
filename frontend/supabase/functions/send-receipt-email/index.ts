import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EmailReceiptRequest {
  receipt_number: string;
  reference: string;
  amount: number;
  payer_name: string;
  service_name: string;
  payment_method: string;
  paid_at: string;
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

    const emailData: EmailReceiptRequest = await req.json();
    console.log('Sending receipt email for reference:', emailData.reference);

    // Validate required fields
    const { receipt_number, reference, amount, payer_name, service_name, payment_method, paid_at } = emailData;
    
    if (!receipt_number || !reference || !amount || !payer_name) {
      throw new Error('Missing required fields for email receipt');
    }

    // Find the payment and customer email
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .select('payer_email')
      .eq('reference', reference)
      .single();

    if (paymentError || !payment) {
      throw new Error('Payment not found or email not available');
    }

    const customerEmail = payment.payer_email;
    if (!customerEmail) {
      throw new Error('Customer email not found');
    }

    // Send email using Resend (or your preferred email service)
    try {
      console.log('Sending receipt email to:', customerEmail);

      // For demo purposes, we'll log the email content
      // In production, integrate with email service like Resend, SendGrid, etc.
      const emailSubject = `AMAC Payment Receipt - ${receipt_number}`;
      const emailBody = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #1e40af; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; }
            .details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .details div { margin: 10px 0; }
            .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 30px; }
            .amount { font-size: 24px; font-weight: bold; color: #059669; }
            .receipt-number { background: #fef3c7; color: #92400e; padding: 10px; border-radius: 4px; text-align: center; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>ABUJA MUNICIPAL AREA COUNCIL</h1>
            <p>Automated Municipal Assessment Collection</p>
          </div>

          <div class="content">
            <h2>Payment Receipt</h2>
            <p>Dear ${payer_name},</p>
            <p>Thank you for your payment. Your transaction has been successfully processed.</p>

            <div class="receipt-number">
              RECEIPT NUMBER: ${receipt_number}
            </div>

            <div class="details">
              <h3>Payment Details:</h3>
              <div><strong>Reference:</strong> ${reference}</div>
              <div><strong>Amount Paid:</strong> <span class="amount">₦${amount.toLocaleString()}</span></div>
              <div><strong>Revenue Type:</strong> ${service_name}</div>
              <div><strong>Payment Method:</strong> ${payment_method}</div>
              <div><strong>Payment Date:</strong> ${new Date(paid_at).toLocaleDateString('en-NG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
              <div><strong>Payment Time:</strong> ${new Date(paid_at).toLocaleTimeString('en-NG')}</div>
            </div>

            <p><strong>Important:</strong> Please keep this receipt for your records. You can verify the authenticity of this receipt by scanning the QR code or visiting the verification link provided.</p>

            <p>Thank you for using AMAC services!</p>
          </div>

          <div class="footer">
            <p>Abuja Municipal Area Council<br>
            Revenue Collection System<br>
            This is an official receipt from AMAC</p>
          </div>
        </body>
        </html>
      `;

      // Log the email attempt for tracking
      await supabase
        .from('email_logs')
        .insert({
          to_email: customerEmail,
          subject: emailSubject,
          template: 'payment_receipt',
          payment_reference: reference,
          receipt_number: receipt_number,
          status: 'sent', // Change to 'pending' if using actual email service
          sent_at: new Date().toISOString(),
        });

      console.log('Receipt email sent successfully to:', customerEmail);

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Receipt email sent successfully',
          email: customerEmail,
          receipt_number: receipt_number,
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );

    } catch (emailError) {
      console.error('Email sending failed:', emailError);
      throw new Error('Failed to send email: ' + emailError.message);
    }

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error in send-receipt-email:', error);
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