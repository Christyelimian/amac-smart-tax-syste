-- Remita Payment System Migration
-- Comprehensive schema for AMAC Revenue Collection System

-- Create revenue_types table
CREATE TABLE IF NOT EXISTS public.revenue_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL CHECK (category IN ('property', 'business', 'transport', 'environmental', 'utilities', 'telecom', 'finance', 'entertainment', 'health', 'education', 'retail', 'logistics', 'agriculture', 'mining', 'manufacturing', 'services', 'media', 'advertising', 'construction', 'land')),
  base_amount DECIMAL(15,2),
  has_zones BOOLEAN DEFAULT false,
  is_recurring BOOLEAN DEFAULT false,
  renewal_period INTEGER, -- days
  virtual_account TEXT,
  icon TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create zones table
CREATE TABLE IF NOT EXISTS public.zones (
  id TEXT PRIMARY KEY CHECK (id IN ('a', 'b', 'c', 'd')),
  name TEXT NOT NULL,
  description TEXT,
  multiplier DECIMAL(3,2) DEFAULT 1.0,
  is_active BOOLEAN DEFAULT true
);

-- Update payments table with Remita fields
ALTER TABLE public.payments
ADD COLUMN IF NOT EXISTS rrr TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS revenue_type_code TEXT,
ADD COLUMN IF NOT EXISTS zone_id TEXT REFERENCES public.zones(id),
ADD COLUMN IF NOT EXISTS property_name TEXT,
ADD COLUMN IF NOT EXISTS business_address TEXT,
ADD COLUMN IF NOT EXISTS registration_number TEXT,
ADD COLUMN IF NOT EXISTS payment_channel TEXT CHECK (payment_channel IN ('card', 'bank_transfer', 'ussd', 'remita_app', 'pos')),
ADD COLUMN IF NOT EXISTS remita_response JSONB,
ADD COLUMN IF NOT EXISTS bank_transaction_id TEXT,
ADD COLUMN IF NOT EXISTS bank_confirmed BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS bank_confirmed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS reconciled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS reconciled_at TIMESTAMPTZ;

-- Create receipts table
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

-- Create reminders table
CREATE TABLE IF NOT EXISTS public.reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id UUID REFERENCES public.payments(id) ON DELETE CASCADE,
  reminder_type TEXT NOT NULL CHECK (reminder_type IN ('upcoming_7_days', 'due_today', 'overdue_7_days', 'overdue_30_days', 'demand_notice')),
  channel TEXT NOT NULL CHECK (channel IN ('sms', 'email', 'whatsapp')),
  sent_at TIMESTAMPTZ,
  delivered BOOLEAN DEFAULT false,
  delivery_confirmed_at TIMESTAMPTZ,
  message_content TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create reconciliation_log table
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

-- Create payment_history table for tracking status changes
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

-- Create virtual_accounts table for managing multiple accounts
CREATE TABLE IF NOT EXISTS public.virtual_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_number TEXT UNIQUE NOT NULL,
  account_name TEXT NOT NULL,
  bank_name TEXT NOT NULL,
  revenue_type_codes TEXT[], -- Array of revenue types this account handles
  zone_ids TEXT[], -- Array of zones this account handles
  is_active BOOLEAN DEFAULT true,
  balance DECIMAL(15,2) DEFAULT 0,
  last_balance_check TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default zones
INSERT INTO public.zones (id, name, description, multiplier) VALUES
  ('a', 'Zone A - Central Business District', 'Maitama, Asokoro, Wuse, Central Area', 1.5),
  ('b', 'Zone B - Maitama/Asokoro', 'Garki, Gwarinpa, Kubwa, Jabi', 1.3),
  ('c', 'Zone C - Wuse/Garki', 'Nyanya, Karu, Lugbe, Gwagwalada', 1.2),
  ('d', 'Zone D - Satellite Towns', 'Other areas', 1.0)
ON CONFLICT (id) DO NOTHING;

-- Insert revenue types (51 types as specified)
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

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_payments_rrr ON public.payments(rrr);
CREATE INDEX IF NOT EXISTS idx_payments_revenue_type_code ON public.payments(revenue_type_code);
CREATE INDEX IF NOT EXISTS idx_payments_zone_id ON public.payments(zone_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON public.payments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payments_bank_confirmed ON public.payments(bank_confirmed);
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

-- Enable RLS on new tables
ALTER TABLE public.revenue_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reconciliation_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.virtual_accounts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for revenue_types (public read, admin write)
CREATE POLICY "Anyone can read revenue types" ON public.revenue_types FOR SELECT USING (true);
CREATE POLICY "Only admins can modify revenue types" ON public.revenue_types FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'super_admin')
  )
);

-- RLS Policies for zones (public read, admin write)
CREATE POLICY "Anyone can read zones" ON public.zones FOR SELECT USING (true);
CREATE POLICY "Only admins can modify zones" ON public.zones FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'super_admin')
  )
);

-- RLS Policies for receipts
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

-- RLS Policies for reminders (admin only)
CREATE POLICY "Only admins can manage reminders" ON public.reminders FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'super_admin')
  )
);

-- RLS Policies for reconciliation_log (admin only)
CREATE POLICY "Only admins can manage reconciliation" ON public.reconciliation_log FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'super_admin', 'auditor')
  )
);

-- RLS Policies for payment_history (admin only)
CREATE POLICY "Only admins can view payment history" ON public.payment_history FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'super_admin', 'auditor')
  )
);

-- RLS Policies for virtual_accounts (admin only)
CREATE POLICY "Only admins can manage virtual accounts" ON public.virtual_accounts FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'super_admin')
  )
);

-- Function to update updated_at timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply update triggers
CREATE TRIGGER update_revenue_types_updated_at
  BEFORE UPDATE ON public.revenue_types
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_virtual_accounts_updated_at
  BEFORE UPDATE ON public.virtual_accounts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to generate RRR (Remita Retrieval Reference)
CREATE OR REPLACE FUNCTION public.generate_rrr()
RETURNS TEXT AS $$
DECLARE
  timestamp_part TEXT;
  random_part TEXT;
  rrr TEXT;
BEGIN
  -- Generate timestamp part (last 8 digits of current timestamp)
  timestamp_part := RIGHT(EXTRACT(epoch FROM NOW())::TEXT, 8);

  -- Generate random part (4 digits)
  random_part := LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');

  -- Combine to create RRR (Remita format: 27 + timestamp + random)
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
  -- Get current year
  year_part := EXTRACT(YEAR FROM NOW())::TEXT;

  -- Get revenue type prefix (first 3 letters uppercase)
  revenue_prefix := UPPER(LEFT(revenue_code, 3));

  -- Generate sequence number (using a counter)
  -- In production, you'd want a proper sequence table
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

-- Create trigger for payment status logging
CREATE TRIGGER log_payment_status_changes
  AFTER UPDATE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION public.log_payment_status_change();

-- Enable realtime for key tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.payments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.receipts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.reminders;
ALTER PUBLICATION supabase_realtime ADD TABLE public.reconciliation_log;
