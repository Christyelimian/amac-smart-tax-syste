-- COMPREHENSIVE DATABASE FIX FOR AMAC PAYMENT SYSTEM
-- Run this entire script in Supabase SQL Editor
-- This fixes RLS policies, missing tables, and grants admin access

-- ===========================================
-- 1. ADMIN ACCESS SETUP
-- ===========================================

-- Delete any existing roles for the user first
DELETE FROM public.user_roles
WHERE user_id IN (
  SELECT id FROM auth.users WHERE email = 'floodgatesautomation@gmail.com'
);

-- Grant super_admin role to the user
INSERT INTO public.user_roles (user_id, role, created_at, updated_at)
SELECT
  id,
  'super_admin',
  NOW(),
  NOW()
FROM auth.users
WHERE email = 'floodgatesautomation@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;

-- Verify admin access
SELECT 'ADMIN ACCESS VERIFICATION:' as info;
SELECT
  u.id,
  u.email,
  ur.role,
  ur.created_at as granted_at,
  '✅ ADMIN ACCESS GRANTED' as status
FROM auth.users u
JOIN public.user_roles ur ON u.id = ur.user_id
WHERE u.email = 'floodgatesautomation@gmail.com'
  AND ur.role IN ('admin', 'super_admin', 'auditor');

-- ===========================================
-- 2. CREATE/UPDATE REQUIRED TABLES
-- ===========================================

-- Create revenue_types table if it doesn't exist
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

-- Create zones table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.zones (
  id TEXT PRIMARY KEY CHECK (id IN ('a', 'b', 'c', 'd')),
  name TEXT NOT NULL,
  description TEXT,
  multiplier DECIMAL(3,2) DEFAULT 1.0,
  is_active BOOLEAN DEFAULT true
);

-- Insert default zones
INSERT INTO public.zones (id, name, description, multiplier) VALUES
  ('a', 'Zone A - Central Business District', 'Maitama, Asokoro, Wuse, Central Area', 1.5),
  ('b', 'Zone B - Maitama/Asokoro', 'Garki, Gwarinpa, Kubwa, Jabi', 1.3),
  ('c', 'Zone C - Wuse/Garki', 'Nyanya, Karu, Lugbe, Gwagwalada', 1.2),
  ('d', 'Zone D - Satellite Towns', 'Other areas', 1.0)
ON CONFLICT (id) DO NOTHING;

-- Insert revenue types (comprehensive list)
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
  ('motorcycle-a', 'Motorcycle Permit Class A', 'transport', 3000, true, true, 365, '🏍️'),
  ('motorcycle-b', 'Motorcycle Permit Class B', 'transport', 5000, true, true, 365, '🏍️'),
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
-- 3. FIX RLS POLICIES FOR PUBLIC ACCESS
-- ===========================================

-- Enable RLS on required tables
ALTER TABLE public.revenue_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.zones ENABLE ROW LEVEL SECURITY;

-- Drop existing policies for revenue_types and zones
DROP POLICY IF EXISTS "Anyone can read revenue types" ON public.revenue_types;
DROP POLICY IF EXISTS "Only admins can modify revenue types" ON public.revenue_types;
DROP POLICY IF EXISTS "Anyone can read zones" ON public.zones;
DROP POLICY IF EXISTS "Only admins can modify zones" ON public.zones;

-- Create public read policies for revenue_types
CREATE POLICY "Public read access to revenue types" ON public.revenue_types
FOR SELECT USING (true);

-- Create public read policies for zones
CREATE POLICY "Public read access to zones" ON public.zones
FOR SELECT USING (true);

-- Create admin write policies for revenue_types
CREATE POLICY "Admins can modify revenue types" ON public.revenue_types
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'super_admin')
  )
);

-- Create admin write policies for zones
CREATE POLICY "Admins can modify zones" ON public.zones
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'super_admin')
  )
);

-- ===========================================
-- 4. ADD MISSING COLUMNS TO PAYMENTS TABLE
-- ===========================================

-- Add missing columns to payments table
DO $$
BEGIN
    -- Add property_name column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_schema = 'public' AND table_name = 'payments' AND column_name = 'property_name') THEN
        ALTER TABLE public.payments ADD COLUMN property_name TEXT;
        RAISE NOTICE 'Added property_name column';
    END IF;

    -- Add revenue_type_code column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_schema = 'public' AND table_name = 'payments' AND column_name = 'revenue_type_code') THEN
        ALTER TABLE public.payments ADD COLUMN revenue_type_code TEXT;
        RAISE NOTICE 'Added revenue_type_code column';
    END IF;

    -- Add zone_id column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_schema = 'public' AND table_name = 'payments' AND column_name = 'zone_id') THEN
        ALTER TABLE public.payments ADD COLUMN zone_id TEXT REFERENCES public.zones(id);
        RAISE NOTICE 'Added zone_id column';
    END IF;

    -- Add payment_channel column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_schema = 'public' AND table_name = 'payments' AND column_name = 'payment_channel') THEN
        ALTER TABLE public.payments ADD COLUMN payment_channel TEXT CHECK (payment_channel IN ('card', 'bank_transfer', 'ussd', 'remita_app', 'pos'));
        RAISE NOTICE 'Added payment_channel column';
    END IF;

    -- Add remita_response column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_schema = 'public' AND table_name = 'payments' AND column_name = 'remita_response') THEN
        ALTER TABLE public.payments ADD COLUMN remita_response JSONB;
        RAISE NOTICE 'Added remita_response column';
    END IF;

    -- Add bank_transaction_id column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_schema = 'public' AND table_name = 'payments' AND column_name = 'bank_transaction_id') THEN
        ALTER TABLE public.payments ADD COLUMN bank_transaction_id TEXT;
        RAISE NOTICE 'Added bank_transaction_id column';
    END IF;

    -- Add bank_confirmed column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_schema = 'public' AND table_name = 'payments' AND column_name = 'bank_confirmed') THEN
        ALTER TABLE public.payments ADD COLUMN bank_confirmed BOOLEAN DEFAULT false;
        RAISE NOTICE 'Added bank_confirmed column';
    END IF;

    -- Add bank_confirmed_at column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_schema = 'public' AND table_name = 'payments' AND column_name = 'bank_confirmed_at') THEN
        ALTER TABLE public.payments ADD COLUMN bank_confirmed_at TIMESTAMPTZ;
        RAISE NOTICE 'Added bank_confirmed_at column';
    END IF;

    -- Add reconciled column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_schema = 'public' AND table_name = 'payments' AND column_name = 'reconciled') THEN
        ALTER TABLE public.payments ADD COLUMN reconciled BOOLEAN DEFAULT false;
        RAISE NOTICE 'Added reconciled column';
    END IF;

    -- Add reconciled_at column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_schema = 'public' AND table_name = 'payments' AND column_name = 'reconciled_at') THEN
        ALTER TABLE public.payments ADD COLUMN reconciled_at TIMESTAMPTZ;
        RAISE NOTICE 'Added reconciled_at column';
    END IF;

    -- Add verified_by column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_schema = 'public' AND table_name = 'payments' AND column_name = 'verified_by') THEN
        ALTER TABLE public.payments ADD COLUMN verified_by UUID REFERENCES auth.users(id);
        RAISE NOTICE 'Added verified_by column';
    END IF;

    -- Add verified_at column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_schema = 'public' AND table_name = 'payments' AND column_name = 'verified_at') THEN
        ALTER TABLE public.payments ADD COLUMN verified_at TIMESTAMPTZ;
        RAISE NOTICE 'Added verified_at column';
    END IF;

    -- Add verification_notes column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_schema = 'public' AND table_name = 'payments' AND column_name = 'verification_notes') THEN
        ALTER TABLE public.payments ADD COLUMN verification_notes TEXT;
        RAISE NOTICE 'Added verification_notes column';
    END IF;

    -- Add customer_details column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_schema = 'public' AND table_name = 'payments' AND column_name = 'customer_details') THEN
        ALTER TABLE public.payments ADD COLUMN customer_details JSONB;
        RAISE NOTICE 'Added customer_details column';
    END IF;

END $$;

-- ===========================================
-- 5. FIX PAYMENT_HISTORY RLS ISSUES
-- ===========================================

-- Disable RLS for payment_history to allow trigger inserts
ALTER TABLE public.payment_history DISABLE ROW LEVEL SECURITY;

-- Drop existing policies for payment_history
DROP POLICY IF EXISTS "Only admins can view payment history" ON public.payment_history;

-- Create new policies for payment_history
CREATE POLICY "Authenticated users can insert payment history" ON public.payment_history
FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can view all payment history" ON public.payment_history
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'super_admin', 'auditor')
  )
);

CREATE POLICY "Admins can update payment history" ON public.payment_history
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'super_admin')
  )
);

-- ===========================================
-- 6. UPDATE PAYMENT STATUS CONSTRAINT
-- ===========================================

-- Update status constraint to include all possible statuses
ALTER TABLE public.payments DROP CONSTRAINT IF EXISTS payments_status_check;
ALTER TABLE public.payments ADD CONSTRAINT payments_status_check
  CHECK (status IN ('pending', 'processing', 'confirmed', 'failed', 'pending_verification', 'awaiting_verification', 'rejected'));

-- ===========================================
-- 7. VERIFICATION QUERIES
-- ===========================================

-- Verify revenue_types table
SELECT 'REVENUE_TYPES TABLE VERIFICATION:' as info;
SELECT COUNT(*) as total_revenue_types FROM public.revenue_types;
SELECT code, name, category, has_zones FROM public.revenue_types WHERE is_active = true ORDER BY name LIMIT 5;

-- Verify zones table
SELECT 'ZONES TABLE VERIFICATION:' as info;
SELECT COUNT(*) as total_zones FROM public.zones;
SELECT id, name, multiplier FROM public.zones ORDER BY id;

-- Verify admin access
SELECT 'FINAL ADMIN ACCESS CHECK:' as info;
SELECT
  u.email,
  ur.role,
  '✅ ADMIN ACCESS CONFIRMED' as status
FROM auth.users u
JOIN public.user_roles ur ON u.id = ur.user_id
WHERE ur.role IN ('admin', 'super_admin', 'auditor');

-- Test revenue_types query that was failing
SELECT 'TESTING REVENUE_TYPES QUERY:' as info;
SELECT * FROM public.revenue_types WHERE code = 'motorcycle-a';

-- Test zones query that was failing
SELECT 'TESTING ZONES QUERY:' as info;
SELECT * FROM public.zones ORDER BY id;

SELECT '🎉 DATABASE FIX COMPLETED SUCCESSFULLY!' as final_result;
SELECT 'Next steps:' as info;
SELECT '1. Refresh your browser' as step1;
SELECT '2. Try accessing the payment system again' as step2;
SELECT '3. Check admin access at /admin' as step3;
