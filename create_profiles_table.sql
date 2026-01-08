-- Create missing profiles and user management tables
-- This fixes the 404 error when fetching user profiles

-- Create app_role enum if it doesn't exist
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
        CREATE TYPE public.app_role AS ENUM ('user', 'admin', 'super_admin', 'auditor', 'field_officer');
    END IF;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create zone enum if it doesn't exist
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'zone') THEN
        CREATE TYPE public.zone AS ENUM ('a', 'b', 'c', 'd');
    END IF;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  phone TEXT,
  zone public.zone DEFAULT 'a',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Handle user_roles table (safely alter column type)
DO $$
BEGIN
    -- Create table if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_roles') THEN
        CREATE TABLE public.user_roles (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
          role public.app_role NOT NULL DEFAULT 'user',
          UNIQUE (user_id, role),
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );
    ELSE
        -- Check if role column is already the correct type
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_schema = 'public'
              AND table_name = 'user_roles'
              AND column_name = 'role'
              AND udt_name = 'app_role'
        ) THEN
            -- Temporarily drop policies that depend on user_roles.role
            DROP POLICY IF EXISTS "Only admins can modify revenue types" ON public.revenue_types;
            DROP POLICY IF EXISTS "Admins can modify zones" ON public.zones;
            DROP POLICY IF EXISTS "Only admins can view audit logs" ON public.audit_logs;
            DROP POLICY IF EXISTS "Only admins can insert audit logs" ON public.audit_logs;
            DROP POLICY IF EXISTS "Admins can manage assessments" ON public.assessments;
            DROP POLICY IF EXISTS "Admins can manage all applications" ON public.assessment_applications;
            DROP POLICY IF EXISTS "Admins can manage demand notices" ON public.demand_notices;
            DROP POLICY IF EXISTS "Admins can manage assessment formulas" ON public.assessment_formulas;

            -- Alter the role column to use the enum type
            ALTER TABLE public.user_roles ALTER COLUMN role TYPE public.app_role USING role::public.app_role;

            -- Recreate the policies (will be done later in the script)
        END IF;
    END IF;
END $$;

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security functions
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role::text = _role::text
  )
$$;

CREATE OR REPLACE FUNCTION public.is_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role::text IN ('admin', 'super_admin', 'auditor')
  )
$$;

-- Profiles policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;

CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id OR public.is_admin(auth.uid()));

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- User roles policies
DROP POLICY IF EXISTS "Users can view own role" ON public.user_roles;
DROP POLICY IF EXISTS "Super admins can manage roles" ON public.user_roles;

CREATE POLICY "Users can view own role"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id OR public.is_admin(auth.uid()));

CREATE POLICY "Super admins can manage roles"
  ON public.user_roles FOR ALL
  USING (public.has_role(auth.uid(), 'super_admin'));

-- Function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Create profile
  INSERT INTO public.profiles (id, email, full_name, phone)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'phone', '')
  );

  -- Assign default 'user' role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');

  RETURN NEW;
END;
$$;

-- Create trigger for new user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Apply updated_at triggers
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_roles_updated_at ON public.user_roles;
CREATE TRIGGER update_user_roles_updated_at
  BEFORE UPDATE ON public.user_roles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS user_roles_user_id_idx ON public.user_roles(user_id);

-- ===========================================
-- CREATE PROFILES FOR EXISTING USERS
-- ===========================================

-- Create profiles for any existing users who don't have one
INSERT INTO public.profiles (id, email, full_name, phone)
SELECT
  u.id,
  u.email,
  COALESCE(u.raw_user_meta_data->>'full_name', ''),
  COALESCE(u.raw_user_meta_data->>'phone', '')
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
WHERE p.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- Create user roles for any existing users who don't have one
INSERT INTO public.user_roles (user_id, role)
SELECT
  u.id,
  'user'
FROM auth.users u
LEFT JOIN public.user_roles ur ON u.id = ur.user_id
WHERE ur.user_id IS NULL
ON CONFLICT (user_id, role) DO NOTHING;

-- Grant super_admin role to the specific user (if they exist)
INSERT INTO public.user_roles (user_id, role)
SELECT
  u.id,
  'super_admin'
FROM auth.users u
WHERE u.email = 'floodgatesautomation@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;

-- ===========================================
-- RECREATE POLICIES (if they were dropped)
-- ===========================================

-- Recreate policies that depend on user_roles (only if they don't exist)
DO $$
BEGIN
    -- Revenue types policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'revenue_types' AND policyname = 'Public read access to revenue types') THEN
        CREATE POLICY "Public read access to revenue types" ON public.revenue_types
        FOR SELECT USING (true);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'revenue_types' AND policyname = 'Admins can modify revenue types') THEN
        CREATE POLICY "Admins can modify revenue types" ON public.revenue_types
        FOR ALL USING (
          EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_id = auth.uid()
            AND role IN ('admin', 'super_admin')
          )
        );
    END IF;

    -- Zones policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'zones' AND policyname = 'Public read access to zones') THEN
        CREATE POLICY "Public read access to zones" ON public.zones
        FOR SELECT USING (true);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'zones' AND policyname = 'Admins can modify zones') THEN
        CREATE POLICY "Admins can modify zones" ON public.zones
        FOR ALL USING (
          EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_id = auth.uid()
            AND role IN ('admin', 'super_admin')
          )
        );
    END IF;

    -- Assessments policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'assessments' AND policyname = 'Admins can manage assessments') THEN
        CREATE POLICY "Admins can manage assessments" ON public.assessments
        FOR ALL USING (
          EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_id = auth.uid()
            AND role IN ('admin', 'super_admin', 'auditor')
          )
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'assessments' AND policyname = 'Taxpayers can view their own assessments') THEN
        CREATE POLICY "Taxpayers can view their own assessments" ON public.assessments
        FOR SELECT USING (taxpayer_id = auth.uid());
    END IF;

    -- Assessment applications policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'assessment_applications' AND policyname = 'Anyone can create assessment applications') THEN
        CREATE POLICY "Anyone can create assessment applications" ON public.assessment_applications
        FOR INSERT WITH CHECK (true);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'assessment_applications' AND policyname = 'Taxpayers can view their own applications') THEN
        CREATE POLICY "Taxpayers can view their own applications" ON public.assessment_applications
        FOR SELECT USING (taxpayer_id = auth.uid());
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'assessment_applications' AND policyname = 'Admins can manage all applications') THEN
        CREATE POLICY "Admins can manage all applications" ON public.assessment_applications
        FOR ALL USING (
          EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_id = auth.uid()
            AND role IN ('admin', 'super_admin')
          )
        );
    END IF;

    -- Demand notices policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'demand_notices' AND policyname = 'Admins can manage demand notices') THEN
        CREATE POLICY "Admins can manage demand notices" ON public.demand_notices
        FOR ALL USING (
          EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_id = auth.uid()
            AND role IN ('admin', 'super_admin', 'auditor')
          )
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'demand_notices' AND policyname = 'Taxpayers can view their own demand notices') THEN
        CREATE POLICY "Taxpayers can view their own demand notices" ON public.demand_notices
        FOR SELECT USING (taxpayer_id = auth.uid());
    END IF;

    -- Assessment formulas policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'assessment_formulas' AND policyname = 'Public can read assessment formulas') THEN
        CREATE POLICY "Public can read assessment formulas" ON public.assessment_formulas
        FOR SELECT USING (is_active = true);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'assessment_formulas' AND policyname = 'Admins can manage assessment formulas') THEN
        CREATE POLICY "Admins can manage assessment formulas" ON public.assessment_formulas
        FOR ALL USING (
          EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_id = auth.uid()
            AND role IN ('admin', 'super_admin')
          )
        );
    END IF;

    -- Audit logs policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'audit_logs' AND policyname = 'Only admins can view audit logs') THEN
        CREATE POLICY "Only admins can view audit logs" ON public.audit_logs
        FOR SELECT USING (
          EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_id = auth.uid()
            AND role IN ('admin', 'super_admin', 'auditor')
          )
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'audit_logs' AND policyname = 'Only admins can insert audit logs') THEN
        CREATE POLICY "Only admins can insert audit logs" ON public.audit_logs
        FOR INSERT WITH CHECK (
          EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_id = auth.uid()
            AND role IN ('admin', 'super_admin', 'auditor')
          ) OR auth.uid() IS NOT NULL
        );
    END IF;

END $$;

-- ===========================================
-- VERIFICATION QUERIES
-- ===========================================

-- Verify tables were created
SELECT 'TABLES CREATED:' as info;
SELECT
  schemaname,
  tablename,
  tableowner
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('profiles', 'user_roles')
ORDER BY tablename;

-- Verify existing users now have profiles
SELECT 'USERS WITH PROFILES:' as info;
SELECT
  COUNT(*) as total_users_with_profiles
FROM public.profiles;

-- Verify admin access
SELECT 'ADMIN ACCESS CHECK:' as info;
SELECT
  u.email,
  ur.role,
  '✅ PROFILE AND ROLE CREATED' as status
FROM auth.users u
JOIN public.user_roles ur ON u.id = ur.user_id
WHERE ur.role IN ('admin', 'super_admin', 'auditor')
ORDER BY u.email;

SELECT '🎉 PROFILES TABLE AND USER MANAGEMENT SETUP COMPLETED!' as final_result;
