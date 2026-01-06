-- AMAC Database Setup (Part 2)
-- Run this AFTER the tables are created

-- ===========================================
-- CREATE REMAINING TABLES
-- ===========================================

-- Reminders table
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

-- Reconciliation log table
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

-- Payment history table
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

-- Virtual accounts table
CREATE TABLE IF NOT EXISTS public.virtual_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_number TEXT UNIQUE NOT NULL,
  account_name TEXT NOT NULL,
  bank_name TEXT NOT NULL,
  revenue_type_codes TEXT[],
  zone_ids TEXT[],
  is_active BOOLEAN DEFAULT true,
  balance DECIMAL(15,2) DEFAULT 0,
  last_balance_check TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===========================================
-- ENABLE ROW LEVEL SECURITY
-- ===========================================
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.revenue_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reconciliation_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.virtual_accounts ENABLE ROW LEVEL SECURITY;

-- ===========================================
-- CREATE STORAGE BUCKET
-- ===========================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('payment-proofs', 'payment-proofs', false)
ON CONFLICT (id) DO NOTHING;

-- Success message
SELECT 'Remaining tables created successfully!' as status;
