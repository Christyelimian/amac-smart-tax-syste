import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

interface ReminderConfig {
  days_before: number;
  type: 'upcoming' | 'overdue';
  message_template: string;
  channels: ('sms' | 'email' | 'whatsapp')[];
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

    const reminderConfigs: ReminderConfig[] = [
      {
        days_before: 7,
        type: 'upcoming',
        message_template: 'Hi {payer_name}, your {service_name} payment of ₦{amount} is due in 7 days. Pay now: https://amacpay.ng/pay/{revenue_type}',
        channels: ['sms', 'email']
      },
      {
        days_before: 1,
        type: 'upcoming',
        message_template: 'Reminder: Your {service_name} payment of ₦{amount} is due tomorrow. Pay now: https://amacpay.ng/pay/{revenue_type}',
        channels: ['sms']
      },
      {
        days_before: 0,
        type: 'upcoming',
        message_template: 'Your {service_name} payment of ₦{amount} is due TODAY. Pay now: https://amacpay.ng/pay/{revenue_type}',
        channels: ['sms']
      },
      {
        days_before: -7,
        type: 'overdue',
        message_template: 'Your {service_name} payment of ₦{amount} is 7 days overdue. Late fee: ₦{late_fee}. Pay now: https://amacpay.ng/pay/{revenue_type}',
        channels: ['sms', 'email']
      },
      {
        days_before: -30,
        type: 'overdue',
        message_template: 'FINAL NOTICE: Your {service_name} payment is 30 days overdue. Legal action may be taken. Contact AMAC immediately.',
        channels: ['sms', 'email']
      }
    ];

    let totalRemindersSent = 0;

    for (const config of reminderConfigs) {
      const remindersSent = await processReminders(supabase, config);
      totalRemindersSent += remindersSent;
    }

    console.log(`Reminder processing completed. Total reminders sent: ${totalRemindersSent}`);

    return new Response(
      JSON.stringify({
        success: true,
        total_reminders_sent: totalRemindersSent,
        message: 'Reminders processed successfully'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error sending reminders:', error);
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

async function processReminders(supabase: any, config: ReminderConfig): Promise<number> {
  const today = new Date();
  const targetDate = new Date(today);
  targetDate.setDate(today.getDate() + config.days_before);

  // For recurring payments, we need to find payments that are due around this date
  // This is a simplified approach - in production, you'd have a proper due date tracking system

  let remindersSent = 0;

  try {
    // Get payments that might need reminders
    // This is a simplified query - you'd need more sophisticated logic for production
    const { data: payments, error } = await supabase
      .from('payments')
      .select(`
        *,
        revenue_types (
          name,
          is_recurring,
          renewal_period
        )
      `)
      .eq('status', 'confirmed')
      .eq('revenue_types.is_recurring', true);

    if (error) {
      console.error('Error fetching payments for reminders:', error);
      return 0;
    }

    for (const payment of payments || []) {
      if (!payment.revenue_types?.is_recurring) continue;

      const lastPaymentDate = new Date(payment.confirmed_at);
      const renewalPeriod = payment.revenue_types.renewal_period || 365; // Default 1 year
      const nextDueDate = new Date(lastPaymentDate);
      nextDueDate.setDate(lastPaymentDate.getDate() + renewalPeriod);

      // Check if this payment is due around our target date
      const daysUntilDue = Math.floor((nextDueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

      if (daysUntilDue === config.days_before) {
        // Check if we already sent this type of reminder recently
        const { data: existingReminder } = await supabase
          .from('reminders')
          .select('id')
          .eq('payment_id', payment.id)
          .eq('reminder_type', `${config.type}_${Math.abs(config.days_before)}_days`)
          .gte('sent_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()) // Within last 24 hours
          .single();

        if (!existingReminder) {
          await sendReminder(supabase, payment, config);
          remindersSent++;
        }
      }
    }

    // Also check for payments that should have been made but weren't (simulated overdue)
    if (config.days_before < 0) {
      // This would be more complex in production - you'd need a proper billing system
      // For now, we'll skip overdue reminders as they require more sophisticated tracking
    }

  } catch (error) {
    console.error('Error processing reminders:', error);
  }

  return remindersSent;
}

async function sendReminder(supabase: any, payment: any, config: ReminderConfig): Promise<void> {
  const reminderType = `${config.type}_${Math.abs(config.days_before)}_days`;

  // Generate personalized message
  let message = config.message_template;
  message = message.replace('{payer_name}', payment.payer_name);
  message = message.replace('{service_name}', payment.service_name);
  message = message.replace('{amount}', payment.amount.toLocaleString());
  message = message.replace('{revenue_type}', payment.revenue_type_code);
  message = message.replace('{late_fee}', Math.round(payment.amount * 0.1).toLocaleString()); // 10% late fee

  for (const channel of config.channels) {
    try {
      let sent = false;

      if (channel === 'sms' && payment.payer_phone) {
        await sendSMSReminder(payment.payer_phone, message);
        sent = true;
      } else if (channel === 'email' && payment.payer_email) {
        await sendEmailReminder(payment.payer_email, message, payment);
        sent = true;
      } else if (channel === 'whatsapp' && payment.payer_phone) {
        await sendWhatsAppReminder(payment.payer_phone, message);
        sent = true;
      }

      if (sent) {
        // Record the reminder
        await supabase
          .from('reminders')
          .insert({
            payment_id: payment.id,
            reminder_type: reminderType,
            channel: channel,
            sent_at: new Date().toISOString(),
            delivered: true, // Assume delivered for now
            message_content: message,
          });
      }

    } catch (error) {
      console.error(`Error sending ${channel} reminder:`, error);

      // Record failed reminder
      await supabase
        .from('reminders')
        .insert({
          payment_id: payment.id,
          reminder_type: reminderType,
          channel: channel,
          sent_at: new Date().toISOString(),
          delivered: false,
          message_content: message,
        });
    }
  }

  console.log(`Reminder sent to ${payment.payer_name} via ${config.channels.join(', ')}`);
}

async function sendSMSReminder(phoneNumber: string, message: string): Promise<void> {
  // In production, integrate with SMS services like:
  // - Africa's Talking
  // - Twilio
  // - BulkSMS
  // - Termii

  console.log(`Sending SMS reminder to ${phoneNumber}: ${message}`);

  // Simulate SMS sending
  await new Promise(resolve => setTimeout(resolve, 100)); // Simulate API call

  // In production, implement actual SMS sending
}

async function sendEmailReminder(email: string, message: string, payment: any): Promise<void> {
  // In production, integrate with email services like:
  // - SendGrid
  // - AWS SES
  // - Resend
  // - NodeMailer with SMTP

  const subject = `AMAC Payment Reminder - ${payment.service_name}`;
  const htmlBody = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #006838 0%, #008f4c 100%); color: white; padding: 20px; text-align: center;">
        <h2>🗳️ Abuja Municipal Area Council</h2>
        <p>Payment Reminder</p>
      </div>

      <div style="padding: 20px;">
        <h3>Hello ${payment.payer_name},</h3>

        <p>${message}</p>

        <div style="background: #f0f9f4; border: 1px solid #006838; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <h4>Payment Details:</h4>
          <ul>
            <li><strong>Service:</strong> ${payment.service_name}</li>
            <li><strong>Amount:</strong> ₦${payment.amount.toLocaleString()}</li>
            <li><strong>Zone:</strong> ${payment.zone_id?.toUpperCase() || 'N/A'}</li>
            <li><strong>Last Payment:</strong> ${new Date(payment.confirmed_at).toLocaleDateString()}</li>
          </ul>
        </div>

        <div style="text-align: center; margin: 30px 0;">
          <a href="https://amacpay.ng/pay/${payment.revenue_type_code}"
             style="background: #006838; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
            Pay Now
          </a>
        </div>

        <p style="color: #666; font-size: 14px;">
          If you have already made this payment, please disregard this reminder.
        </p>

        <hr style="margin: 20px 0; border: none; border-top: 1px solid #eee;">

        <p style="color: #666; font-size: 12px;">
          Abuja Municipal Area Council (AMAC)<br>
          For enquiries: support@amac.gov.ng | +234-XXX-XXX-XXXX
        </p>
      </div>
    </div>
  `;

  console.log(`Sending email reminder to ${email}:`, subject);

  // In production, implement actual email sending
}

async function sendWhatsAppReminder(phoneNumber: string, message: string): Promise<void> {
  // In production, integrate with WhatsApp Business API
  // - 360Dialog
  // - Twilio WhatsApp
  // - Meta WhatsApp Business API

  console.log(`Sending WhatsApp reminder to ${phoneNumber}: ${message}`);

  // In production, implement actual WhatsApp sending
}
