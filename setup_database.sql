-- AMAC Revenue Collection System Database Setup
-- Run this SQL in your Supabase SQL Editor at: https://kfummdjejjjccfbzzifc.supabase.co/project/default/sql

-- ===========================================
-- 1. CREATE PAYMENTS TABLE
-- ===========================================
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  reference TEXT UNIQUE NOT NULL,
  rrr TEXT,
  revenue_type TEXT NOT NULL,
  service_name TEXT NOT NULL,
  zone TEXT,
  amount DECIMAL(15,2) NOT NULL,
  payer_name TEXT NOT NULL,
  payer_phone TEXT NOT NULL,
  payer_email TEXT,
  business_address TEXT,
  registration_number TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'confirmed', 'failed', 'pending_verification', 'awaiting_verification', 'rejected')),
  payment_method TEXT DEFAULT 'paystack' CHECK (payment_method IN ('paystack', 'bank_transfer')),
  proof_of_payment_url TEXT,
  submitted_at TIMESTAMP WITH TIME ZONE,
  verified_by UUID REFERENCES auth.users(id),
  verified_at TIMESTAMP WITH TIME ZONE,
  verification_notes TEXT,
  customer_details JSONB,
  gateway_response JSONB,
  receipt_number TEXT UNIQUE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  confirmed_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  revenue_type_code TEXT,
  zone_id TEXT,
  property_name TEXT,
  payment_channel TEXT CHECK (payment_channel IN ('card', 'bank_transfer', 'ussd', 'remita_app', 'pos')),
  remita_response JSONB,
  bank_transaction_id TEXT,
  bank_confirmed BOOLEAN DEFAULT false,
  bank_confirmed_at TIMESTAMPTZ,
  reconciled BOOLEAN DEFAULT false,
  reconciled_at TIMESTAMPTZ
);

-- ===========================================
-- 2. CREATE USER ROLES TABLE
-- ===========================================
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'admin', 'super_admin', 'auditor', 'field_officer')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);

-- ===========================================
-- 3. CREATE REVENUE TYPES TABLE
-- ===========================================
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

-- ===========================================
-- 4. CREATE ZONES TABLE
-- ===========================================
CREATE TABLE IF NOT EXISTS public.zones (
  id TEXT PRIMARY KEY CHECK (id IN ('a', 'b', 'c', 'd')),
  name TEXT NOT NULL,
  description TEXT,
  multiplier DECIMAL(3,2) DEFAULT 1.0,
  is_active BOOLEAN DEFAULT true
);

-- ===========================================
-- 5. CREATE RECEIPTS TABLE
-- ===========================================
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

-- ===========================================
-- 6. CREATE REMINDERS TABLE
-- ===========================================
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

-- ===========================================
-- 7. CREATE RECONCILIATION LOG TABLE
-- ===========================================
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

-- ===========================================
-- 8. CREATE PAYMENT HISTORY TABLE
-- ===========================================
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

-- ===========================================
-- 9. CREATE VIRTUAL ACCOUNTS TABLE
-- ===========================================
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
-- 10. ENABLE ROW LEVEL SECURITY
-- ===========================================
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.revenue_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reconciliation_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.virtual_accounts ENABLE ROW LEVEL SECURITY;

-- ===========================================
-- 11. CREATE STORAGE BUCKET
-- ===========================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('payment-proofs', 'payment-proofs', false)
ON CONFLICT (id) DO NOTHING;

-- ===========================================
-- 12. INSERT DEFAULT DATA
-- ===========================================
INSERT INTO public.zones (id, name, description, multiplier) VALUES
  ('a', 'Zone A - Central Business District', 'Maitama, Asokoro, Wuse, Central Area', 1.5),
  ('b', 'Zone B - Maitama/Asokoro', 'Garki, Gwarinpa, Kubwa, Jabi', 1.3),
  ('c', 'Zone C - Wuse/Garki', 'Nyanya, Karu, Lugbe, Gwagwalada', 1.2),
  ('d', 'Zone D - Satellite Towns', 'Other areas', 1.0)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.revenue_types (code, name, category, base_amount, has_zones, is_recurring, renewal_period, icon) VALUES
  ('property-tax', 'Property Tax', 'property', 50000, true, true, 365, '🏠'),
  ('business-premises', 'Business Premises Permit', 'business', 25000, true, true, 365, '🏢'),
  ('signage-permit', 'Signage/Billboard Permit', 'advertising', 15000, true, true, 365, '📋'),
  ('hotel-license', 'Hotel/Guest House License', 'entertainment', 100000, true, true, 365, '🏨'),
  ('restaurant-license', 'Restaurant License', 'entertainment', 35000, true, true, 365, '🍽️'),
  ('bar-license', 'Bar & Liquor License', 'entertainment', 50000, true, true, 365, '🍻'),
  ('market-stall', 'Market Stall Permit', 'business', 12000, true, true, 365, '🏪'),
  ('hawker-permit', 'Hawker''s Permit', 'business', 5000, true, true, 365, '🛒'),
  ('motor-park', 'Motor Park Levy', 'transport', 20000, true, true, 365, '🚌'),
  ('taxi-permit', 'Taxi Permit', 'transport', 8000, true, true, 365, '🚕'),
  ('tricycle-permit', 'Tricycle (Keke) Permit', 'transport', 6000, true, true, 365, '🛺'),
  ('motorcycle-permit', 'Motorcycle (Okada) Permit', 'transport', 4000, true, true, 365, '🏍️'),
  ('development-levy', 'Development Levy', 'construction', 75000, false, false, NULL, '🏗️'),
  ('building-plan', 'Building Plan Approval', 'construction', 50000, false, false, NULL, '📐'),
  ('c-of-o', 'Certificate of Occupancy', 'land', 200000, false, false, NULL, '📜'),
  ('land-use-charge', 'Land Use Charge', 'land', 40000, true, true, 365, '🗺️'),
  ('waste-disposal', 'Waste Disposal Fee', 'environmental', 10000, true, true, 365, '♻️'),
  ('environmental-levy', 'Environmental Impact Levy', 'environmental', 30000, false, false, NULL, '🌿'),
  ('water-abstraction', 'Water Abstraction Fee', 'utilities', 15000, false, false, NULL, '💧'),
  ('borehole-permit', 'Borehole Drilling Permit', 'utilities', 25000, false, false, NULL, '⛏️'),
  ('telecom-mast', 'Telecom Mast Levy', 'telecom', 500000, false, false, NULL, '📡'),
  ('bank-license', 'Bank Branch License', 'finance', 150000, false, false, NULL, '🏦'),
  ('microfinance', 'Microfinance License', 'finance', 50000, false, false, NULL, '💰'),
  ('petrol-station', 'Petrol Station License', 'utilities', 100000, false, false, NULL, '⛽'),
  ('lpg-station', 'LPG Station Permit', 'utilities', 75000, false, false, NULL, '🔥'),
  ('cinema-license', 'Cinema/Theatre License', 'entertainment', 80000, false, false, NULL, '🎬'),
  ('event-center', 'Event Center License', 'entertainment', 60000, false, false, NULL, '🎉'),
  ('nightclub-license', 'Nightclub License', 'entertainment', 100000, false, false, NULL, '🎵'),
  ('gym-license', 'Gym/Fitness Center License', 'health', 25000, true, true, 365, '💪'),
  ('spa-license', 'Spa/Wellness Center License', 'health', 30000, true, true, 365, '🧘'),
  ('pharmacy-license', 'Pharmacy License', 'health', 40000, true, true, 365, '💊'),
  ('hospital-license', 'Private Hospital License', 'health', 150000, false, false, NULL, '🏥'),
  ('school-license', 'Private School License', 'education', 100000, false, false, NULL, '🎓'),
  ('tutorial-center', 'Tutorial Center License', 'education', 20000, true, true, 365, '📚'),
  ('supermarket-license', 'Supermarket License', 'retail', 45000, true, true, 365, '🛍️'),
  ('warehouse-permit', 'Warehouse Permit', 'logistics', 35000, true, true, 365, '📦'),
  ('abattoir-license', 'Abattoir License', 'agriculture', 50000, false, false, NULL, '🥩'),
  ('farm-permit', 'Commercial Farm Permit', 'agriculture', 25000, false, false, NULL, '🌾'),
  ('quarry-license', 'Quarry/Mining License', 'mining', 200000, false, false, NULL, '⛰️'),
  ('sand-dredging', 'Sand Dredging Permit', 'mining', 100000, false, false, NULL, '🏖️'),
  ('factory-license', 'Factory License', 'manufacturing', 120000, false, false, NULL, '🏭'),
  ('workshop-permit', 'Workshop Permit', 'manufacturing', 20000, true, true, 365, '🔧'),
  ('printing-press', 'Printing Press License', 'manufacturing', 30000, true, true, 365, '🖨️'),
  ('car-wash', 'Car Wash Permit', 'services', 15000, true, true, 365, '🚗'),
  ('laundry-license', 'Laundry/Dry Cleaning License', 'services', 12000, true, true, 365, '👔'),
  ('barbing-salon', 'Barbing Salon Permit', 'services', 8000, true, true, 365, '✂️'),
  ('beauty-salon', 'Beauty Salon Permit', 'services', 10000, true, true, 365, '💄'),
  ('photography', 'Photography Studio License', 'services', 15000, true, true, 365, '📷'),
  ('radio-station', 'Radio Station License', 'media', 500000, false, false, NULL, '📻'),
  ('cable-tv', 'Cable TV License', 'media', 200000, false, false, NULL, '📺'),
  ('outdoor-advert', 'Outdoor Advertisement Permit', 'advertising', 25000, true, true, 365, '🎯')
ON CONFLICT (code) DO NOTHING;

-- ===========================================
-- 13. CREATE POLICIES
-- ===========================================

-- Payments policies
CREATE POLICY "Anyone can create payments" ON public.payments FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can read payments by reference" ON public.payments FOR SELECT USING (true);
CREATE POLICY "Payments can be updated" ON public.payments FOR UPDATE USING (true);

-- User roles policies
CREATE POLICY "Users can read their own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can read all roles" ON public.user_roles FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.role IN ('admin', 'super_admin')
  )
);
CREATE POLICY "Only super admins can modify roles" ON public.user_roles FOR ALL USING (
  EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.role = 'super_admin'
  )
);

-- Revenue types policies
CREATE POLICY "Anyone can read revenue types" ON public.revenue_types FOR SELECT USING (true);
CREATE POLICY "Only admins can modify revenue types" ON public.revenue_types FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'super_admin')
  )
);

-- Zones policies
CREATE POLICY "Anyone can read zones" ON public.zones FOR SELECT USING (true);
CREATE POLICY "Only admins can modify zones" ON public.zones FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'super_admin')
  )
);

-- Receipts policies
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
CREATE POLICY "Admins can manage receipts" ON public.receipts FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'super_admin')
  )
);

-- Storage policies for payment proofs
CREATE POLICY "Users can upload payment proofs" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'payment-proofs'
  AND auth.role() = 'authenticated'
);

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

-- ===========================================
-- 14. CREATE FUNCTIONS AND TRIGGERS
-- ===========================================

-- Function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to update payments updated_at
CREATE OR REPLACE FUNCTION public.update_payments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

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

-- Function to log payment status changes
CREATE OR REPLACE FUNCTION public.log_payment_status_change()
RETURNS TRIGGER AS $$
BEGIN
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
      auth.uid(),
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===========================================
-- 15. CREATE TRIGGERS
-- ===========================================
CREATE TRIGGER update_payments_updated_at
BEFORE UPDATE ON public.payments
FOR EACH ROW
EXECUTE FUNCTION public.update_payments_updated_at();

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
-- 16. ENABLE REALTIME
-- ===========================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.payments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.receipts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.reminders;
ALTER PUBLICATION supabase_realtime ADD TABLE public.reconciliation_log;
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_roles;

-- ===========================================
-- 17. CREATE INDEXES
-- ===========================================
CREATE INDEX IF NOT EXISTS idx_payments_reference ON public.payments(reference);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON public.payments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payments_rrr ON public.payments(rrr);
CREATE INDEX IF NOT EXISTS idx_payments_revenue_type_code ON public.payments(revenue_type_code);
CREATE INDEX IF NOT EXISTS idx_payments_zone_id ON public.payments(zone_id);
CREATE INDEX IF NOT EXISTS idx_payments_bank_confirmed ON public.payments(bank_confirmed);
CREATE INDEX IF NOT EXISTS idx_payments_payment_method ON public.payments(payment_method);
CREATE INDEX IF NOT EXISTS idx_payments_proof_submitted ON public.payments(submitted_at) WHERE proof_of_payment_url IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_payments_verified_by ON public.payments(verified_by);
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
-- SETUP COMPLETE
-- ===========================================
-- Your AMAC Revenue Collection System database is now ready!
-- You can now run your application and it should connect successfully.
