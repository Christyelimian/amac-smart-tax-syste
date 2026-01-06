import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

interface BankTransaction {
  reference: string;
  amount: number;
  description: string;
  transaction_date: string;
  bank_reference?: string;
}

interface ReconciliationResult {
  total_checked: number;
  matched: number;
  discrepancies: number;
  unresolved: number;
  new_matches: number;
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

    // Get reconciliation parameters from request (optional)
    const { days_back = 30, auto_resolve = false } = await req.json().catch(() => ({}));

    const result = await performReconciliation(supabase, days_back, auto_resolve);

    console.log('Auto-reconciliation completed:', result);

    return new Response(
      JSON.stringify({
        success: true,
        ...result,
        message: `Reconciliation completed. ${result.new_matches} new matches found.`
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error in auto-reconciliation:', error);
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

async function performReconciliation(
  supabase: any,
  daysBack: number,
  autoResolve: boolean
): Promise<ReconciliationResult> {
  const result: ReconciliationResult = {
    total_checked: 0,
    matched: 0,
    discrepancies: 0,
    unresolved: 0,
    new_matches: 0,
  };

  try {
    // Get date range for reconciliation
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - daysBack);

    // Get all payments that need reconciliation within the date range
    const { data: paymentsToReconcile, error: paymentsError } = await supabase
      .from('payments')
      .select('*')
      .gte('created_at', startDate.toISOString())
      .or('bank_confirmed.is.null,bank_confirmed.eq.false')
      .eq('status', 'confirmed');

    if (paymentsError) {
      throw new Error(`Failed to fetch payments: ${paymentsError.message}`);
    }

    result.total_checked = paymentsToReconcile?.length || 0;

    // Get bank transactions (simulated - in production, you'd fetch from actual bank API)
    const bankTransactions = await fetchBankTransactions(startDate, endDate);

    console.log(`Checking ${paymentsToReconcile?.length || 0} payments against ${bankTransactions.length} bank transactions`);

    // Perform reconciliation
    for (const payment of paymentsToReconcile || []) {
      const reconciliation = await reconcilePayment(supabase, payment, bankTransactions, autoResolve);

      switch (reconciliation.status) {
        case 'matched':
          result.matched++;
          if (reconciliation.is_new) result.new_matches++;
          break;
        case 'discrepancy':
          result.discrepancies++;
          break;
        case 'unresolved':
          result.unresolved++;
          break;
      }
    }

  } catch (error) {
    console.error('Error during reconciliation:', error);
    throw error;
  }

  return result;
}

async function reconcilePayment(
  supabase: any,
  payment: any,
  bankTransactions: BankTransaction[],
  autoResolve: boolean
): Promise<{ status: 'matched' | 'discrepancy' | 'unresolved'; is_new: boolean }> {

  // Check if already reconciled
  if (payment.bank_confirmed && payment.reconciled) {
    return { status: 'matched', is_new: false };
  }

  // Find matching bank transaction
  const matchingTransaction = findMatchingTransaction(payment, bankTransactions);

  if (matchingTransaction) {
    // Check for amount discrepancies
    const amountMatch = Math.abs(payment.amount - matchingTransaction.amount) < 0.01; // Allow 1 kobo difference

    if (amountMatch) {
      // Perfect match - update payment and create reconciliation record
      await updatePaymentReconciliation(supabase, payment, matchingTransaction, 'matched', autoResolve);
      return { status: 'matched', is_new: true };

    } else {
      // Amount discrepancy - flag for manual review
      await createDiscrepancyRecord(supabase, payment, matchingTransaction, 'amount_mismatch');
      return { status: 'discrepancy', is_new: false };
    }

  } else {
    // No matching bank transaction found - could be pending or failed
    const hoursSincePayment = (Date.now() - new Date(payment.created_at).getTime()) / (1000 * 60 * 60);

    if (hoursSincePayment < 24) {
      // Within 24 hours, might still be processing - leave unresolved
      return { status: 'unresolved', is_new: false };
    } else {
      // After 24 hours, flag as potential issue
      await createDiscrepancyRecord(supabase, payment, null, 'no_bank_transaction');
      return { status: 'discrepancy', is_new: false };
    }
  }
}

function findMatchingTransaction(payment: any, bankTransactions: BankTransaction[]): BankTransaction | null {
  // Try to match by amount first
  const amountMatches = bankTransactions.filter(tx =>
    Math.abs(tx.amount - payment.amount) < 0.01
  );

  if (amountMatches.length === 1) {
    return amountMatches[0];
  }

  // If multiple amount matches, try to match by reference/RRR
  if (amountMatches.length > 1) {
    const referenceMatch = amountMatches.find(tx =>
      tx.description?.includes(payment.rrr) ||
      tx.description?.includes(payment.reference) ||
      tx.reference === payment.rrr
    );

    if (referenceMatch) {
      return referenceMatch;
    }
  }

  // Try to match by RRR or reference in description
  const referenceMatch = bankTransactions.find(tx =>
    tx.description?.includes(payment.rrr) ||
    tx.description?.includes(payment.reference) ||
    tx.reference === payment.rrr ||
    tx.reference === payment.reference
  );

  if (referenceMatch) {
    return referenceMatch;
  }

  // If still no match and only one amount match, use it
  if (amountMatches.length === 1) {
    return amountMatches[0];
  }

  return null;
}

async function updatePaymentReconciliation(
  supabase: any,
  payment: any,
  bankTransaction: BankTransaction,
  status: string,
  autoResolve: boolean
): Promise<void> {

  // Update payment record
  const updateData: any = {
    bank_confirmed: true,
    bank_confirmed_at: new Date().toISOString(),
    bank_transaction_id: bankTransaction.reference,
  };

  if (autoResolve) {
    updateData.reconciled = true;
    updateData.reconciled_at = new Date().toISOString();
  }

  const { error: updateError } = await supabase
    .from('payments')
    .update(updateData)
    .eq('id', payment.id);

  if (updateError) {
    throw new Error(`Failed to update payment: ${updateError.message}`);
  }

  // Create reconciliation record
  const { error: reconciliationError } = await supabase
    .from('reconciliation_log')
    .insert({
      payment_id: payment.id,
      remita_amount: payment.amount,
      bank_amount: bankTransaction.amount,
      remita_rrr: payment.rrr,
      bank_reference: bankTransaction.reference,
      matched: true,
      resolved: autoResolve,
      resolved_at: autoResolve ? new Date().toISOString() : null,
      notes: `Auto-reconciled: ${status}`,
    });

  if (reconciliationError) {
    console.error('Error creating reconciliation record:', reconciliationError);
    // Don't fail the whole process for reconciliation logging errors
  }
}

async function createDiscrepancyRecord(
  supabase: any,
  payment: any,
  bankTransaction: BankTransaction | null,
  discrepancyType: string
): Promise<void> {

  const notes = bankTransaction
    ? `${discrepancyType}: Payment ₦${payment.amount}, Bank ₦${bankTransaction.amount}`
    : `${discrepancyType}: No matching bank transaction found for ₦${payment.amount}`;

  const { error } = await supabase
    .from('reconciliation_log')
    .insert({
      payment_id: payment.id,
      remita_amount: payment.amount,
      bank_amount: bankTransaction?.amount || 0,
      remita_rrr: payment.rrr,
      bank_reference: bankTransaction?.reference || null,
      matched: false,
      discrepancy_reason: discrepancyType,
      notes: notes,
    });

  if (error) {
    console.error('Error creating discrepancy record:', error);
  }
}

async function fetchBankTransactions(startDate: Date, endDate: Date): Promise<BankTransaction[]> {
  // In production, this would connect to actual bank APIs:
  // - Zenith Bank API
  // - Other bank APIs
  // - Payment processor APIs

  // For demonstration, we'll simulate bank transactions
  // In production, you'd implement actual bank API integration

  console.log(`Fetching bank transactions from ${startDate.toISOString()} to ${endDate.toISOString()}`);

  // Simulate some bank transactions that would match our payments
  const mockTransactions: BankTransaction[] = [
    // These would be returned by actual bank API calls
  ];

  // For now, return empty array - in production this would fetch real data
  // The reconciliation logic will handle the "no matches" scenario appropriately

  return mockTransactions;
}
