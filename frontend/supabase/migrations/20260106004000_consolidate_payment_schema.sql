-- Consolidate Payment Schema Migration
-- This migration ensures consistent schema for both Remita and bank transfer payments

-- Ensure payments table has all required columns with proper constraints
DO $$
BEGIN
    -- Add missing columns if they don't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payments' AND column_name = 'rrr') THEN
        ALTER TABLE public.payments ADD COLUMN rrr TEXT UNIQUE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payments' AND column_name = 'revenue_type_code') THEN
        ALTER TABLE public.payments ADD COLUMN revenue_type_code TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payments' AND column_name = 'zone_id') THEN
        ALTER TABLE public.payments ADD COLUMN zone_id TEXT REFERENCES public.zones(id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payments' AND column_name = 'property_name') THEN
        ALTER TABLE public.payments ADD COLUMN property_name TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payments' AND column_name = 'business_address') THEN
        ALTER TABLE public.payments ADD COLUMN business_address TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payments' AND column_name = 'registration_number') THEN
        ALTER TABLE public.payments ADD COLUMN registration_number TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payments' AND column_name = 'payment_channel') THEN
        ALTER TABLE public.payments ADD COLUMN payment_channel TEXT CHECK (payment_channel IN ('card', 'bank_transfer', 'ussd', 'remita_app', 'pos'));
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payments' AND column_name = 'remita_response') THEN
        ALTER TABLE public.payments ADD COLUMN remita_response JSONB;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payments' AND column_name = 'bank_transaction_id') THEN
        ALTER TABLE public.payments ADD COLUMN bank_transaction_id TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payments' AND column_name = 'bank_confirmed') THEN
        ALTER TABLE public.payments ADD COLUMN bank_confirmed BOOLEAN DEFAULT false;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payments' AND column_name = 'bank_confirmed_at') THEN
        ALTER TABLE public.payments ADD COLUMN bank_confirmed_at TIMESTAMPTZ;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payments' AND column_name = 'reconciled') THEN
        ALTER TABLE public.payments ADD COLUMN reconciled BOOLEAN DEFAULT false;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payments' AND column_name = 'reconciled_at') THEN
        ALTER TABLE public.payments ADD COLUMN reconciled_at TIMESTAMPTZ;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payments' AND column_name = 'payment_method') THEN
        ALTER TABLE public.payments ADD COLUMN payment_method TEXT DEFAULT 'paystack' CHECK (payment_method IN ('paystack', 'bank_transfer'));
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payments' AND column_name = 'proof_of_payment_url') THEN
        ALTER TABLE public.payments ADD COLUMN proof_of_payment_url TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payments' AND column_name = 'submitted_at') THEN
        ALTER TABLE public.payments ADD COLUMN submitted_at TIMESTAMP WITH TIME ZONE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payments' AND column_name = 'verified_by') THEN
        ALTER TABLE public.payments ADD COLUMN verified_by UUID REFERENCES auth.users(id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payments' AND column_name = 'verified_at') THEN
        ALTER TABLE public.payments ADD COLUMN verified_at TIMESTAMP WITH TIME ZONE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payments' AND column_name = 'verification_notes') THEN
        ALTER TABLE public.payments ADD COLUMN verification_notes TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payments' AND column_name = 'customer_details') THEN
        ALTER TABLE public.payments ADD COLUMN customer_details JSONB;
    END IF;

END $$;

-- Update status constraint to include all possible statuses
ALTER TABLE public.payments DROP CONSTRAINT IF EXISTS payments_status_check;
ALTER TABLE public.payments ADD CONSTRAINT payments_status_check
  CHECK (status IN ('pending', 'processing', 'confirmed', 'failed', 'pending_verification', 'awaiting_verification', 'rejected'));

-- Ensure receipt_number column exists and is unique
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payments' AND column_name = 'receipt_number') THEN
        ALTER TABLE public.payments ADD COLUMN receipt_number TEXT UNIQUE;
    END IF;
END $$;

-- Ensure all necessary indexes exist
CREATE INDEX IF NOT EXISTS idx_payments_rrr ON public.payments(rrr);
CREATE INDEX IF NOT EXISTS idx_payments_revenue_type_code ON public.payments(revenue_type_code);
CREATE INDEX IF NOT EXISTS idx_payments_zone_id ON public.payments(zone_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON public.payments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payments_bank_confirmed ON public.payments(bank_confirmed);
CREATE INDEX IF NOT EXISTS idx_payments_payment_method ON public.payments(payment_method);
CREATE INDEX IF NOT EXISTS idx_payments_proof_submitted ON public.payments(submitted_at) WHERE proof_of_payment_url IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_payments_verified_by ON public.payments(verified_by);

-- Ensure storage bucket exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('payment-proofs', 'payment-proofs', false)
ON CONFLICT (id) DO NOTHING;

-- Ensure storage policies exist
DROP POLICY IF EXISTS "Users can upload payment proofs" ON storage.objects;
CREATE POLICY "Users can upload payment proofs" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'payment-proofs'
  AND auth.role() = 'authenticated'
);

DROP POLICY IF EXISTS "Users can view payment proofs" ON storage.objects;
CREATE POLICY "Users can view payment proofs" ON storage.objects
FOR SELECT USING (
  bucket_id = 'payment-proofs'
  AND (
    auth.uid()::text = (storage.foldername(name))[1]
    OR EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'super_admin', 'auditor')
    )
  )
);

-- Ensure user_roles table exists (for admin permissions)
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'admin', 'super_admin', 'auditor', 'field_officer')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);

-- Enable RLS for user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Ensure user_roles policies exist
DROP POLICY IF EXISTS "Users can read their own roles" ON public.user_roles;
CREATE POLICY "Users can read their own roles" ON public.user_roles
FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can read all roles" ON public.user_roles;
CREATE POLICY "Admins can read all roles" ON public.user_roles
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.role IN ('admin', 'super_admin')
  )
);

DROP POLICY IF EXISTS "Only super admins can modify roles" ON public.user_roles;
CREATE POLICY "Only super admins can modify roles" ON public.user_roles
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.role = 'super_admin'
  )
);

-- Ensure update trigger for user_roles
CREATE OR REPLACE FUNCTION public.update_user_roles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS update_user_roles_updated_at ON public.user_roles;
CREATE TRIGGER update_user_roles_updated_at
BEFORE UPDATE ON public.user_roles
FOR EACH ROW
EXECUTE FUNCTION public.update_user_roles_updated_at();

-- Enable realtime for key tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.payments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.receipts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.reminders;
ALTER PUBLICATION supabase_realtime ADD TABLE public.reconciliation_log;

-- Ensure receipts table has proper structure
CREATE TABLE IF NOT EXISTS public.receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id UUID REFERENCES public.payments(id) ON DELETE CASCADE,
  receipt_number TEXT UNIQUE NOT NULL,
  pdf_url TEXT,
  qr_code_data TEXT,
  sent_via_email BOOLEAN DEFAULT false,
  sent_via_sms BOOLEAN DEFAULT false,
  sent_via_whatsapp BOOLEAN DEFAULT false,
  email_sent_at TIMESTAMPTZ,
  sms_sent_at TIMESTAMPTZ,
  whatsapp_sent_at TIMESTAMPTZ,
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure reconciliation_log table exists
CREATE TABLE IF NOT EXISTS public.reconciliation_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id UUID REFERENCES public.payments(id) ON DELETE CASCADE,
  remita_amount DECIMAL(15,2),
  bank_amount DECIMAL(15,2),
  remita_rrr TEXT,
  bank_reference TEXT,
  matched BOOLEAN DEFAULT false,
  discrepancy_reason TEXT,
  discrepancy_amount DECIMAL(15,2),
  resolved BOOLEAN DEFAULT false,
  resolved_by UUID,
  resolved_at TIMESTAMPTZ,
  notes TEXT,
  checked_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure reminders table exists
CREATE TABLE IF NOT EXISTS public.reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id UUID REFERENCES public.payments(id) ON DELETE CASCADE,
  reminder_type TEXT NOT NULL CHECK (reminder_type IN ('upcoming_7_days', 'due_today', 'overdue_7_days', 'overdue_30_days', 'demand_notice', 'payment_confirmed')),
  channel TEXT NOT NULL CHECK (channel IN ('sms', 'email', 'whatsapp')),
  sent_at TIMESTAMPTZ,
  delivered BOOLEAN DEFAULT false,
  delivery_confirmed_at TIMESTAMPTZ,
  message_content TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure payment_history table exists
CREATE TABLE IF NOT EXISTS public.payment_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id UUID REFERENCES public.payments(id) ON DELETE CASCADE,
  old_status TEXT,
  new_status TEXT,
  changed_by UUID,
  change_reason TEXT,
  metadata JSONB,
  changed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on all tables
ALTER TABLE public.receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reconciliation_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_history ENABLE ROW LEVEL SECURITY;

-- Ensure RLS policies exist for receipts
DROP POLICY IF EXISTS "Users can view their own receipts" ON public.receipts;
CREATE POLICY "Users can view their own receipts" ON public.receipts FOR SELECT USING (
  payment_id IN (
    SELECT id FROM public.payments
    WHERE payer_email = (SELECT email FROM auth.users WHERE id = auth.uid())
    OR user_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'super_admin', 'auditor')
  )
);

DROP POLICY IF EXISTS "Admins can manage receipts" ON public.receipts;
CREATE POLICY "Admins can manage receipts" ON public.receipts FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'super_admin')
  )
);

-- Ensure RLS policies exist for reminders
DROP POLICY IF EXISTS "Only admins can manage reminders" ON public.reminders;
CREATE POLICY "Only admins can manage reminders" ON public.reminders FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'super_admin')
  )
);

-- Ensure RLS policies exist for reconciliation_log
DROP POLICY IF EXISTS "Only admins can manage reconciliation" ON public.reconciliation_log;
CREATE POLICY "Only admins can manage reconciliation" ON public.reconciliation_log FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'super_admin', 'auditor')
  )
);

-- Ensure RLS policies exist for payment_history
DROP POLICY IF EXISTS "Only admins can view payment history" ON public.payment_history;
CREATE POLICY "Only admins can view payment history" ON public.payment_history FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'super_admin', 'auditor')
  )
);

-- Ensure indexes for performance
CREATE INDEX IF NOT EXISTS idx_receipts_payment_id ON public.receipts(payment_id);
CREATE INDEX IF NOT EXISTS idx_receipts_receipt_number ON public.receipts(receipt_number);
CREATE INDEX IF NOT EXISTS idx_reminders_payment_id ON public.reminders(payment_id);
CREATE INDEX IF NOT EXISTS idx_reminders_reminder_type ON public.reminders(reminder_type);
CREATE INDEX IF NOT EXISTS idx_reconciliation_log_payment_id ON public.reconciliation_log(payment_id);
CREATE INDEX IF NOT EXISTS idx_reconciliation_log_matched ON public.reconciliation_log(matched);
CREATE INDEX IF NOT EXISTS idx_payment_history_payment_id ON public.payment_history(payment_id);
