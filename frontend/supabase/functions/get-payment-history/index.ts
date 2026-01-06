import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

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

    // Get user from auth header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Authentication required');
    }

    // Get payment history for the authenticated user
    // In this simplified version, we'll use phone/email as identifier
    // In production, you'd use proper user authentication

    const url = new URL(req.url);
    const identifier = url.searchParams.get('identifier'); // phone or email

    if (!identifier) {
      throw new Error('Identifier (phone or email) required');
    }

    // Get payment history
    const { data: payments, error } = await supabase
      .from('payments')
      .select(`
        id,
        reference,
        service_name,
        revenue_type,
        revenue_type_code,
        amount,
        zone_id,
        payer_name,
        payer_phone,
        payer_email,
        business_address,
        registration_number,
        confirmed_at,
        revenue_types (
          name,
          icon,
          has_zones,
          is_recurring,
          renewal_period
        ),
        zones (
          id,
          name,
          multiplier
        )
      `)
      .or(`payer_phone.eq.${identifier},payer_email.eq.${identifier}`)
      .eq('status', 'confirmed')
      .order('confirmed_at', { ascending: false })
      .limit(20);

    if (error) {
      throw new Error(`Failed to fetch payment history: ${error.message}`);
    }

    // Group by revenue type for repeat payments
    const groupedPayments = new Map();

    for (const payment of payments || []) {
      const key = `${payment.revenue_type_code}-${payment.zone_id || 'no-zone'}`;

      if (!groupedPayments.has(key)) {
        groupedPayments.set(key, {
          revenue_type_code: payment.revenue_type_code,
          service_name: payment.revenue_types?.name || payment.service_name,
          icon: payment.revenue_types?.icon || '💰',
          zone_id: payment.zone_id,
          zone_name: payment.zones?.name,
          zone_multiplier: payment.zones?.multiplier || 1,
          is_recurring: payment.revenue_types?.is_recurring || false,
          renewal_period: payment.revenue_types?.renewal_period,
          last_payment: {
            amount: payment.amount,
            date: payment.confirmed_at,
            reference: payment.reference,
          },
          total_paid: 0,
          payment_count: 0,
          business_details: {
            name: payment.payer_name,
            phone: payment.payer_phone,
            email: payment.payer_email,
            address: payment.business_address,
            registration_number: payment.registration_number,
          }
        });
      }

      const group = groupedPayments.get(key);
      group.total_paid += payment.amount;
      group.payment_count += 1;
    }

    const repeatPayments = Array.from(groupedPayments.values())
      .filter(group => group.is_recurring) // Only show recurring payments for repeat
      .map(group => ({
        ...group,
        next_due_date: calculateNextDueDate(group.last_payment.date, group.renewal_period),
        can_repeat: true,
      }));

    return new Response(
      JSON.stringify({
        success: true,
        payment_history: payments || [],
        repeat_payments: repeatPayments,
        total_payments: payments?.length || 0,
        total_amount: payments?.reduce((sum, p) => sum + p.amount, 0) || 0,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error fetching payment history:', error);
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

function calculateNextDueDate(lastPaymentDate: string, renewalPeriod?: number): string | null {
  if (!renewalPeriod) return null;

  const lastDate = new Date(lastPaymentDate);
  const nextDate = new Date(lastDate);
  nextDate.setDate(lastDate.getDate() + renewalPeriod);

  return nextDate.toISOString();
}
