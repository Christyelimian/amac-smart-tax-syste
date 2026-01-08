-- ===========================================
-- FIX REVENUE_TYPES 406 ERROR
-- ===========================================

-- Check if revenue_types table exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'revenue_types') THEN
        RAISE NOTICE 'Creating revenue_types table...';

        -- Create revenue_types table
        CREATE TABLE public.revenue_types (
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

        -- Insert sample data
        INSERT INTO public.revenue_types (code, name, category, base_amount, has_zones, is_recurring, renewal_period, icon) VALUES
          ('tenement-rate', 'Tenement Rate', 'property', 50000, true, true, 365, '🏠'),
          ('ground-rent', 'Ground Rent', 'property', 25000, true, true, 365, '🌱'),
          ('business-premises', 'Business Premises Permit', 'business', 25000, true, true, 365, '🏢'),
          ('signage-permit', 'Signage/Billboard Permit', 'advertising', 15000, true, true, 365, '📋')
        ON CONFLICT (code) DO NOTHING;

    ELSE
        RAISE NOTICE 'revenue_types table already exists';
    END IF;
END $$;

-- Enable RLS
ALTER TABLE public.revenue_types ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Public read access to revenue types" ON public.revenue_types;
DROP POLICY IF EXISTS "Admins can modify revenue types" ON public.revenue_types;
DROP POLICY IF EXISTS "Anyone can read revenue types" ON public.revenue_types;
DROP POLICY IF EXISTS "Only admins can modify revenue types" ON public.revenue_types;

-- Create policies for public read access
CREATE POLICY "Public read access to revenue types"
ON public.revenue_types
FOR SELECT
TO authenticated
USING (is_active = true);

-- Allow anonymous read access for public queries
CREATE POLICY "Anonymous can read active revenue types"
ON public.revenue_types
FOR SELECT
TO anon
USING (is_active = true);

-- Admin write policies
CREATE POLICY "Admins can modify revenue types"
ON public.revenue_types
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'super_admin')
  )
);

-- ===========================================
-- VERIFICATION
-- ===========================================

-- Check table status
SELECT 'REVENUE_TYPES TABLE STATUS:' as check_type;
SELECT
  schemaname,
  tablename,
  tableowner,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename = 'revenue_types';

-- Check data
SELECT 'REVENUE_TYPES DATA:' as check_type;
SELECT COUNT(*) as total_records FROM public.revenue_types WHERE is_active = true;

-- Test the failing queries
SELECT 'TEST: tenement-rate' as test;
SELECT code, name, category, base_amount FROM public.revenue_types WHERE code = 'tenement-rate';

SELECT 'TEST: ground-rent' as test;
SELECT code, name, category, base_amount FROM public.revenue_types WHERE code = 'ground-rent';

-- Check policies
SELECT 'REVENUE_TYPES POLICIES:' as check_type;
SELECT policyname, permissive, roles, cmd FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'revenue_types';

SELECT '✅ REVENUE_TYPES 406 FIX COMPLETED!' as status;
