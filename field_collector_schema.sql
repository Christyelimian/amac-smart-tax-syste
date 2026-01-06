-- Field Collector App & Partners Dashboard Database Schema
-- This migration adds the missing tables for collectors and partners

-- ===========================================
-- 1. CREATE COLLECTORS TABLE
-- ===========================================

CREATE TABLE IF NOT EXISTS public.collectors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  collector_id TEXT UNIQUE NOT NULL, -- e.g., COL-A-001
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  zone TEXT NOT NULL,
  role TEXT CHECK (role IN ('field_officer', 'supervisor', 'coordinator', 'market_inspector')),
  daily_target DECIMAL(15,2) DEFAULT 50000,
  commission_rate DECIMAL(5,2) DEFAULT 0.05, -- 5% commission
  status TEXT CHECK (status IN ('active', 'suspended', 'inactive')) DEFAULT 'active',
  supervisor_id UUID REFERENCES public.collectors(id),
  device_id TEXT, -- For tracking assigned devices
  last_location POINT, -- PostGIS point for GPS tracking
  last_location_updated TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===========================================
-- 2. CREATE PARTNERS TABLE
-- ===========================================

CREATE TABLE IF NOT EXISTS public.partners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id TEXT UNIQUE NOT NULL, -- e.g., BANK-ZEN-001
  name TEXT NOT NULL, -- Zenith Bank
  type TEXT CHECK (type IN ('bank', 'fintech', 'community', 'market_association', 'estate_management')),
  api_key TEXT UNIQUE,
  webhook_url TEXT, -- For payment notifications
  commission_rate DECIMAL(5,2) DEFAULT 0.05, -- 5% commission
  monthly_target DECIMAL(15,2) DEFAULT 1000000,
  status TEXT CHECK (status IN ('active', 'suspended', 'inactive')) DEFAULT 'active',
  contact_person TEXT,
  contact_phone TEXT,
  contact_email TEXT,
  business_address TEXT,
  tax_id TEXT,
  contract_start_date DATE,
  contract_end_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===========================================
-- 3. CREATE PARTNER_BRANCHES TABLE
-- ===========================================

CREATE TABLE IF NOT EXISTS public.partner_branches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE,
  branch_name TEXT NOT NULL,
  branch_code TEXT UNIQUE NOT NULL,
  location TEXT,
  gps_location POINT, -- PostGIS point
  contact_person TEXT,
  contact_phone TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===========================================
-- 4. UPDATE PAYMENTS TABLE
-- ===========================================

-- Add new columns to payments table for field collection tracking
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS collected_by UUID REFERENCES public.collectors(id);
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS partner_id UUID REFERENCES public.partners(id);
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS partner_branch_id UUID REFERENCES public.partner_branches(id);
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS collection_method TEXT CHECK (collection_method IN ('online', 'field_cash', 'field_pos', 'partner_bank', 'partner_pos', 'partner_transfer'));
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS gps_location POINT; -- PostGIS point for collection location
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS collector_commission DECIMAL(15,2);
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS partner_commission DECIMAL(15,2);
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS collection_device TEXT; -- Device ID that collected payment
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS collection_timestamp TIMESTAMPTZ; -- When payment was physically collected
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS sync_timestamp TIMESTAMPTZ; -- When payment was synced to server
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS offline_reference TEXT; -- Reference for offline collections

-- ===========================================
-- 5. CREATE COMMISSION PAYMENTS TABLE
-- ===========================================

CREATE TABLE IF NOT EXISTS public.commission_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  collector_id UUID REFERENCES public.collectors(id),
  partner_id UUID REFERENCES public.partners(id),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  total_commission DECIMAL(15,2) NOT NULL,
  payment_status TEXT CHECK (payment_status IN ('pending', 'processing', 'paid', 'failed')) DEFAULT 'pending',
  payment_date DATE,
  payment_reference TEXT,
  bank_account_details JSONB,
  notes TEXT,
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(collector_id, period_start, period_end),
  UNIQUE(partner_id, period_start, period_end)
);

-- ===========================================
-- 6. CREATE COLLECTION LOGS TABLE
-- ===========================================

CREATE TABLE IF NOT EXISTS public.collection_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  collector_id UUID NOT NULL REFERENCES public.collectors(id),
  collection_date DATE NOT NULL,
  zone TEXT,
  total_collections INTEGER DEFAULT 0,
  total_amount DECIMAL(15,2) DEFAULT 0,
  cash_collections INTEGER DEFAULT 0,
  cash_amount DECIMAL(15,2) DEFAULT 0,
  pos_collections INTEGER DEFAULT 0,
  pos_amount DECIMAL(15,2) DEFAULT 0,
  locations_visited TEXT[], -- Array of location names
  start_time TIMESTAMPTZ,
  end_time TIMESTAMPTZ,
  notes TEXT,
  submitted_at TIMESTAMPTZ,
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===========================================
-- 7. ENABLE ROW LEVEL SECURITY
-- ===========================================

ALTER TABLE public.collectors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partner_branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commission_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collection_logs ENABLE ROW LEVEL SECURITY;

-- ===========================================
-- 8. CREATE POLICIES
-- ===========================================

-- Collectors policies
CREATE POLICY "Collectors can read their own data" ON public.collectors FOR SELECT USING (
  auth.uid() = user_id
  OR EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.role IN ('admin', 'super_admin')
  )
);

CREATE POLICY "Admins can manage collectors" ON public.collectors FOR ALL USING (
  EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.role IN ('admin', 'super_admin')
  )
);

-- Partners policies
CREATE POLICY "Partners can read their own data" ON public.partners FOR SELECT USING (
  auth.uid() IN (
    SELECT user_id FROM user_roles ur WHERE ur.role = 'partner'
  )
  OR EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.role IN ('admin', 'super_admin')
  )
);

CREATE POLICY "Admins can manage partners" ON public.partners FOR ALL USING (
  EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.role IN ('admin', 'super_admin')
  )
);

-- Partner branches policies
CREATE POLICY "Partners can read their branches" ON public.partner_branches FOR SELECT USING (
  partner_id IN (
    SELECT p.id FROM partners p
    WHERE p.api_key = current_setting('request.jwt.claims', true)::json->>'partner_api_key'
  )
  OR EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.role IN ('admin', 'super_admin')
  )
);

-- Commission payments policies
CREATE POLICY "Collectors can view their commissions" ON public.commission_payments FOR SELECT USING (
  collector_id IN (
    SELECT c.id FROM collectors c WHERE c.user_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.role IN ('admin', 'super_admin')
  )
);

CREATE POLICY "Partners can view their commissions" ON public.commission_payments FOR SELECT USING (
  partner_id IN (
    SELECT p.id FROM partners p
    WHERE p.api_key = current_setting('request.jwt.claims', true)::json->>'partner_api_key'
  )
  OR EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.role IN ('admin', 'super_admin')
  )
);

CREATE POLICY "Admins can manage commissions" ON public.commission_payments FOR ALL USING (
  EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.role IN ('admin', 'super_admin')
  )
);

-- Collection logs policies
CREATE POLICY "Collectors can view their logs" ON public.collection_logs FOR SELECT USING (
  collector_id IN (
    SELECT c.id FROM collectors c WHERE c.user_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.role IN ('admin', 'super_admin')
  )
);

CREATE POLICY "Admins can manage collection logs" ON public.collection_logs FOR ALL USING (
  EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.role IN ('admin', 'super_admin')
  )
);

-- ===========================================
-- 9. CREATE FUNCTIONS AND TRIGGERS
-- ===========================================

-- Function to update updated_at timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_collectors_updated_at
  BEFORE UPDATE ON public.collectors
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_partners_updated_at
  BEFORE UPDATE ON public.partners
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_commission_payments_updated_at
  BEFORE UPDATE ON public.commission_payments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to calculate collector commission
CREATE OR REPLACE FUNCTION public.calculate_collector_commission()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.collection_method IN ('field_cash', 'field_pos') AND NEW.collected_by IS NOT NULL THEN
    SELECT commission_rate * NEW.amount INTO NEW.collector_commission
    FROM collectors WHERE id = NEW.collected_by;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate partner commission
CREATE OR REPLACE FUNCTION public.calculate_partner_commission()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.partner_id IS NOT NULL THEN
    SELECT commission_rate * NEW.amount INTO NEW.partner_commission
    FROM partners WHERE id = NEW.partner_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for commission calculation
CREATE TRIGGER calculate_collector_commission_trigger
  BEFORE INSERT OR UPDATE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION public.calculate_collector_commission();

CREATE TRIGGER calculate_partner_commission_trigger
  BEFORE INSERT OR UPDATE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION public.calculate_partner_commission();

-- ===========================================
-- 10. CREATE INDEXES
-- ===========================================

CREATE INDEX IF NOT EXISTS idx_collectors_user_id ON public.collectors(user_id);
CREATE INDEX IF NOT EXISTS idx_collectors_zone ON public.collectors(zone);
CREATE INDEX IF NOT EXISTS idx_collectors_status ON public.collectors(status);
CREATE INDEX IF NOT EXISTS idx_partners_type ON public.partners(type);
CREATE INDEX IF NOT EXISTS idx_partners_status ON public.partners(status);
CREATE INDEX IF NOT EXISTS idx_partner_branches_partner_id ON public.partner_branches(partner_id);
CREATE INDEX IF NOT EXISTS idx_payments_collected_by ON public.payments(collected_by);
CREATE INDEX IF NOT EXISTS idx_payments_partner_id ON public.payments(partner_id);
CREATE INDEX IF NOT EXISTS idx_payments_collection_method ON public.payments(collection_method);
CREATE INDEX IF NOT EXISTS idx_payments_gps_location ON public.payments USING GIST(gps_location);
CREATE INDEX IF NOT EXISTS idx_commission_payments_collector ON public.commission_payments(collector_id);
CREATE INDEX IF NOT EXISTS idx_commission_payments_partner ON public.commission_payments(partner_id);
CREATE INDEX IF NOT EXISTS idx_collection_logs_collector ON public.collection_logs(collector_id);
CREATE INDEX IF NOT EXISTS idx_collection_logs_date ON public.collection_logs(collection_date);

-- ===========================================
-- 11. ENABLE REALTIME
-- ===========================================

ALTER PUBLICATION supabase_realtime ADD TABLE public.collectors;
ALTER PUBLICATION supabase_realtime ADD TABLE public.partners;
ALTER PUBLICATION supabase_realtime ADD TABLE public.partner_branches;
ALTER PUBLICATION supabase_realtime ADD TABLE public.commission_payments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.collection_logs;

-- ===========================================
-- 12. INSERT SAMPLE DATA
-- ===========================================

-- Sample collectors
INSERT INTO public.collectors (collector_id, full_name, phone, zone, role, daily_target, commission_rate) VALUES
  ('COL-A-001', 'John Doe', '+2348012345678', 'a', 'field_officer', 50000, 0.05),
  ('COL-A-002', 'Jane Smith', '+2348012345679', 'a', 'supervisor', 100000, 0.07),
  ('COL-B-001', 'Mike Johnson', '+2348012345680', 'b', 'field_officer', 45000, 0.05),
  ('COL-C-001', 'Sarah Wilson', '+2348012345681', 'c', 'coordinator', 80000, 0.06)
ON CONFLICT (collector_id) DO NOTHING;

-- Sample partners
INSERT INTO public.partners (partner_id, name, type, commission_rate, monthly_target, contact_person, contact_phone, contact_email) VALUES
  ('BANK-ZEN-001', 'Zenith Bank', 'bank', 0.05, 2000000, 'Adebayo Johnson', '+2348023456789', 'partnerships@zenithbank.com'),
  ('BANK-ACC-001', 'Access Bank', 'bank', 0.05, 1500000, 'Chioma Okoro', '+2348023456790', 'partners@accessbank.com'),
  ('FIN-PAY-001', 'Paystack Agents', 'fintech', 0.03, 1000000, 'Emeka Nwosu', '+2348023456791', 'agents@paystack.com'),
  ('COM-MKT-001', 'Wuse Market Association', 'community', 0.04, 500000, 'Alhaji Musa', '+2348023456792', 'chairman@qusemarket.org')
ON CONFLICT (partner_id) DO NOTHING;

-- ===========================================
-- SETUP COMPLETE
-- ===========================================

SELECT '🎉 Field Collector & Partners database schema setup completed successfully!' as status;
