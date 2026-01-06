-- SAFE DATABASE SETUP - Creates tables first, policies second
-- Run this in Supabase SQL Editor with service role permissions

-- ===========================================
-- PHASE 1: CREATE ALL TABLES (NO POLICIES YET)
-- ===========================================

-- User roles table
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'admin', 'super_admin', 'auditor', 'field_officer')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);

-- Revenue types table
CREATE TABLE IF NOT EXISTS public.revenue_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL CHECK (category IN ('property', 'business', 'transport', 'environmental', 'utilities', 'telecom', 'finance', 'entertainment', 'health', 'education', 'retail', 'logistics', 'agriculture', 'mining', 'manufacturing', 'services', 'media', 'advertising', 'construction', 'land')),
  base_amount DECIMAL(15,2),
  has_zones BOOLEAN DEFAULT false,
  is_recurring BOOLEAN DEFAULT false,
  renewal_period INTEGER,
  virtual_account TEXT,
  icon TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Zones table
CREATE TABLE IF NOT EXISTS public.zones (
  id TEXT PRIMARY KEY CHECK (id IN ('a', 'b', 'c', 'd')),
  name TEXT NOT NULL,
  description TEXT,
  multiplier DECIMAL(3,2) DEFAULT 1.0,
  is_active BOOLEAN DEFAULT true
);

-- Receipts table
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
-- PHASE 1 COMPLETE - TABLES CREATED
-- ===========================================
SELECT '✅ Phase 1 Complete: All tables created successfully!' as phase_1_status;
