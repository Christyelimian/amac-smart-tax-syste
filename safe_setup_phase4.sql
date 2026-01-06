-- SAFE DATABASE SETUP - Phase 4: Functions and Triggers
-- Run this LAST, only after all previous phases complete

-- ===========================================
-- PHASE 4: CREATE FUNCTIONS AND TRIGGERS
-- ===========================================

-- Function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to update user_roles updated_at
CREATE OR REPLACE FUNCTION public.update_user_roles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Function to generate RRR
CREATE OR REPLACE FUNCTION public.generate_rrr()
RETURNS TEXT AS $$
DECLARE
  timestamp_part TEXT;
  random_part TEXT;
  rrr TEXT;
BEGIN
  timestamp_part := RIGHT(EXTRACT(epoch FROM NOW())::TEXT, 8);
  random_part := LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
  rrr := '27' || timestamp_part || random_part;
  RETURN rrr;
END;
$$ LANGUAGE plpgsql;

-- Function to generate receipt number
CREATE OR REPLACE FUNCTION public.generate_receipt_number(revenue_code TEXT)
RETURNS TEXT AS $$
DECLARE
  year_part TEXT;
  revenue_prefix TEXT;
  sequence_part TEXT;
  receipt_number TEXT;
BEGIN
  year_part := EXTRACT(YEAR FROM NOW())::TEXT;
  revenue_prefix := UPPER(LEFT(revenue_code, 3));
  sequence_part := LPAD((EXTRACT(EPOCH FROM NOW())::BIGINT % 100000)::TEXT, 6, '0');
  receipt_number := 'AMAC/' || year_part || '/' || revenue_prefix || '/' || sequence_part;
  RETURN receipt_number;
END;
$$ LANGUAGE plpgsql;

-- Function to log payment status changes (safe version)
CREATE OR REPLACE FUNCTION public.log_payment_status_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Only log if status actually changed
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.payment_history (
      payment_id,
      old_status,
      new_status,
      changed_by,
      change_reason,
      metadata
    ) VALUES (
      NEW.id,
      OLD.status,
      NEW.status,
      NULL, -- auth.uid() might not be available
      'Status change via system',
      jsonb_build_object(
        'previous_status', OLD.status,
        'new_status', NEW.status,
        'changed_at', NOW()
      )
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ===========================================
-- CREATE TRIGGERS
-- ===========================================
CREATE TRIGGER update_user_roles_updated_at
BEFORE UPDATE ON public.user_roles
FOR EACH ROW
EXECUTE FUNCTION public.update_user_roles_updated_at();

CREATE TRIGGER update_revenue_types_updated_at
BEFORE UPDATE ON public.revenue_types
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_virtual_accounts_updated_at
BEFORE UPDATE ON public.virtual_accounts
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER log_payment_status_changes
AFTER UPDATE ON public.payments
FOR EACH ROW EXECUTE FUNCTION public.log_payment_status_change();

-- ===========================================
-- ENABLE REALTIME
-- ===========================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.payments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.receipts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.reminders;
ALTER PUBLICATION supabase_realtime ADD TABLE public.reconciliation_log;

-- ===========================================
-- CREATE INDEXES
-- ===========================================
CREATE INDEX IF NOT EXISTS idx_receipts_payment_id ON public.receipts(payment_id);
CREATE INDEX IF NOT EXISTS idx_receipts_receipt_number ON public.receipts(receipt_number);
CREATE INDEX IF NOT EXISTS idx_reminders_payment_id ON public.reminders(payment_id);
CREATE INDEX IF NOT EXISTS idx_reminders_reminder_type ON public.reminders(reminder_type);
CREATE INDEX IF NOT EXISTS idx_reconciliation_log_payment_id ON public.reconciliation_log(payment_id);
CREATE INDEX IF NOT EXISTS idx_reconciliation_log_matched ON public.reconciliation_log(matched);
CREATE INDEX IF NOT EXISTS idx_payment_history_payment_id ON public.payment_history(payment_id);
CREATE INDEX IF NOT EXISTS idx_virtual_accounts_account_number ON public.virtual_accounts(account_number);
CREATE INDEX IF NOT EXISTS idx_revenue_types_code ON public.revenue_types(code);
CREATE INDEX IF NOT EXISTS idx_revenue_types_category ON public.revenue_types(category);

-- ===========================================
-- SETUP COMPLETE - SUCCESS MESSAGE
-- ===========================================
SELECT
  '🎉 AMAC Revenue Collection System database setup completed successfully!' as final_status,
  COUNT(*) as tables_created
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('user_roles', 'revenue_types', 'zones', 'receipts', 'reminders', 'reconciliation_log', 'payment_history', 'virtual_accounts');
