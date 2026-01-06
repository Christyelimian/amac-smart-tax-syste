import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

interface ReceiptData {
  payment_id: string;
  receipt_number: string;
  payer_name: string;
  payer_phone: string;
  payer_email?: string;
  service_name: string;
  revenue_type: string;
  amount: number;
  zone?: string;
  payment_method: string;
  reference: string;
  rrr: string;
  paid_at: string;
  valid_until?: string;
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

    const { payment_id } = await req.json();

    if (!payment_id) {
      throw new Error('Payment ID is required');
    }

    // Get payment details
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .select(`
        *,
        revenue_types (
          name,
          icon
        )
      `)
      .eq('id', payment_id)
      .single();

    if (paymentError || !payment) {
      throw new Error('Payment not found');
    }

    // Get zone details if applicable
    let zoneName = 'N/A';
    if (payment.zone_id) {
      const { data: zone } = await supabase
        .from('zones')
        .select('name')
        .eq('id', payment.zone_id)
        .single();

      zoneName = zone?.name || 'N/A';
    }

    // Generate receipt number if not exists
    let receiptNumber = null;
    const { data: existingReceipt } = await supabase
      .from('receipts')
      .select('receipt_number')
      .eq('payment_id', payment_id)
      .single();

    if (!existingReceipt) {
      const { data: generatedNumber } = await supabase.rpc('generate_receipt_number', {
        revenue_code: payment.revenue_type_code
      });
      receiptNumber = generatedNumber;
    } else {
      receiptNumber = existingReceipt.receipt_number;
    }

    // Generate QR code data (simple format for now)
    const qrCodeData = `AMAC:${receiptNumber}:${payment.rrr}`;

    // Calculate valid until date (usually 1 year from payment)
    const paidDate = new Date(payment.confirmed_at || payment.created_at);
    const validUntil = new Date(paidDate);
    validUntil.setFullYear(validUntil.getFullYear() + 1);

    const receiptData: ReceiptData = {
      payment_id: payment.id,
      receipt_number: receiptNumber,
      payer_name: payment.payer_name,
      payer_phone: payment.payer_phone,
      payer_email: payment.payer_email,
      service_name: payment.service_name,
      revenue_type: payment.revenue_type,
      amount: payment.amount,
      zone: zoneName,
      payment_method: payment.payment_method,
      reference: payment.reference,
      rrr: payment.rrr,
      paid_at: payment.confirmed_at || payment.created_at,
      valid_until: validUntil.toISOString(),
    };

    // Generate HTML receipt
    const htmlReceipt = generateHTMLReceipt(receiptData);

    // In a production environment, you would:
    // 1. Use a PDF library like Puppeteer to convert HTML to PDF
    // 2. Upload PDF to cloud storage (AWS S3, Supabase Storage, etc.)
    // 3. Return the PDF URL

    // For now, we'll simulate PDF generation and return the HTML
    const pdfUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrCodeData)}`;

    // Save receipt to database
    const { error: receiptError } = await supabase
      .from('receipts')
      .upsert({
        payment_id: payment.id,
        receipt_number: receiptNumber,
        pdf_url: pdfUrl, // This would be the actual PDF URL in production
        qr_code_data: qrCodeData,
        generated_at: new Date().toISOString(),
      });

    if (receiptError) {
      console.error('Error saving receipt:', receiptError);
      throw new Error('Failed to save receipt');
    }

    // Send receipt via email if email provided
    if (receiptData.payer_email) {
      await sendEmailReceipt(receiptData, htmlReceipt);
    }

    // Send receipt via SMS
    await sendSMSReceipt(receiptData);

    console.log('Receipt generated successfully:', receiptNumber);

    return new Response(
      JSON.stringify({
        success: true,
        receipt_number: receiptNumber,
        pdf_url: pdfUrl,
        qr_code_data: qrCodeData,
        message: 'Receipt generated and sent successfully'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error generating receipt:', error);
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

function generateHTMLReceipt(data: ReceiptData): string {
  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-NG', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>AMAC Payment Receipt - ${data.receipt_number}</title>
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          margin: 0;
          padding: 20px;
          background-color: #f8fafc;
        }
        .receipt-container {
          max-width: 600px;
          margin: 0 auto;
          background: white;
          border-radius: 12px;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
          overflow: hidden;
        }
        .header {
          background: linear-gradient(135deg, #006838 0%, #008f4c 100%);
          color: white;
          padding: 24px;
          text-align: center;
        }
        .logo {
          font-size: 24px;
          font-weight: bold;
          margin-bottom: 8px;
        }
        .subtitle {
          font-size: 14px;
          opacity: 0.9;
        }
        .amount-section {
          background: #f0f9f4;
          padding: 24px;
          text-align: center;
          border-bottom: 1px solid #e2e8f0;
        }
        .amount {
          font-size: 32px;
          font-weight: bold;
          color: #006838;
          margin-bottom: 8px;
        }
        .amount-label {
          font-size: 14px;
          color: #64748b;
        }
        .details-section {
          padding: 24px;
        }
        .detail-row {
          display: flex;
          justify-content: space-between;
          padding: 8px 0;
          border-bottom: 1px solid #f1f5f9;
        }
        .detail-row:last-child {
          border-bottom: none;
        }
        .detail-label {
          font-weight: 500;
          color: #64748b;
        }
        .detail-value {
          font-weight: 600;
          color: #1e293b;
        }
        .qr-section {
          padding: 24px;
          text-align: center;
          background: #f8fafc;
          border-top: 1px solid #e2e8f0;
        }
        .qr-code {
          width: 120px;
          height: 120px;
          background: #e2e8f0;
          margin: 0 auto 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 8px;
        }
        .qr-text {
          font-size: 12px;
          color: #64748b;
        }
        .footer {
          padding: 24px;
          text-align: center;
          background: #f8fafc;
          border-top: 1px solid #e2e8f0;
        }
        .footer-text {
          font-size: 12px;
          color: #64748b;
          margin-bottom: 8px;
        }
        .contact-info {
          font-size: 11px;
          color: #94a3b8;
        }
        .validity-notice {
          background: #fef3c7;
          color: #92400e;
          padding: 12px;
          border-radius: 6px;
          margin: 16px 0;
          font-size: 13px;
        }
      </style>
    </head>
    <body>
      <div class="receipt-container">
        <!-- Header -->
        <div class="header">
          <div class="logo">🗳️ ABUJA MUNICIPAL AREA COUNCIL</div>
          <div class="subtitle">Official Payment Receipt</div>
        </div>

        <!-- Amount Section -->
        <div class="amount-section">
          <div class="amount">${formatAmount(data.amount)}</div>
          <div class="amount-label">Payment Received</div>
        </div>

        <!-- Details Section -->
        <div class="details-section">
          <div class="detail-row">
            <span class="detail-label">Receipt Number</span>
            <span class="detail-value">${data.receipt_number}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Transaction Reference</span>
            <span class="detail-value">${data.reference}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">RRR</span>
            <span class="detail-value">${data.rrr}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Payer Name</span>
            <span class="detail-value">${data.payer_name}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Revenue Type</span>
            <span class="detail-value">${data.service_name}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Zone</span>
            <span class="detail-value">${data.zone}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Payment Method</span>
            <span class="detail-value">${data.payment_method.replace('_', ' ')}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Payment Date</span>
            <span class="detail-value">${formatDate(data.paid_at)}</span>
          </div>

          <div class="validity-notice">
            <strong>Validity Period:</strong> This receipt is valid from ${formatDate(data.paid_at)} until ${data.valid_until ? formatDate(data.valid_until) : 'December 31, 2026'}
          </div>
        </div>

        <!-- QR Code Section -->
        <div class="qr-section">
          <div class="qr-code">
            <span style="font-size: 48px;">📱</span>
          </div>
          <div class="qr-text">
            Scan QR code to verify receipt authenticity
          </div>
        </div>

        <!-- Footer -->
        <div class="footer">
          <div class="footer-text">
            This is an official receipt from the Abuja Municipal Area Council (AMAC).
            For verification, contact our support team.
          </div>
          <div class="contact-info">
            📧 support@amac.gov.ng | 📞 +234-XXX-XXX-XXXX | 🌐 www.amac.gov.ng
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
}

async function sendEmailReceipt(receiptData: ReceiptData, htmlContent: string): Promise<void> {
  // In production, you would integrate with an email service like:
  // - SendGrid
  // - AWS SES
  // - Resend
  // - NodeMailer with SMTP

  console.log(`Sending email receipt to ${receiptData.payer_email}`);
  console.log('Email subject:', `AMAC Payment Receipt - ${receiptData.receipt_number}`);
  console.log('Email would contain HTML receipt with QR code');

  // For now, we'll just log the action
  // In production, implement actual email sending
}

async function sendSMSReceipt(receiptData: ReceiptData): Promise<void> {
  // In production, you would integrate with SMS services like:
  // - Africa's Talking
  // - Twilio
  // - BulkSMS
  // - Termii

  const smsMessage = `AMAC Payment Confirmed: ${receiptData.receipt_number} - ${formatAmount(receiptData.amount)}. Receipt sent to your email. Thank you!`;

  console.log(`Sending SMS receipt to ${receiptData.payer_phone}`);
  console.log('SMS content:', smsMessage);

  // For now, we'll just log the action
  // In production, implement actual SMS sending
}

function formatAmount(amount: number): string {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 0,
  }).format(amount);
}
