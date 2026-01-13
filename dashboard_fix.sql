-- Quick fix for dashboard blank page issue
-- Run this in your Supabase SQL Editor

-- 1. Create user_properties table if missing
CREATE TABLE IF NOT EXISTS public.user_properties (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    property_name TEXT NOT NULL,
    property_type TEXT NOT NULL,
    address TEXT NOT NULL,
    zone TEXT,
    revenue_type TEXT NOT NULL,
    annual_amount DECIMAL(15,2) NOT NULL,
    due_date DATE NOT NULL,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'paid')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Enable RLS
ALTER TABLE public.user_properties ENABLE ROW LEVEL SECURITY;

-- 3. Create RLS policies
CREATE POLICY IF NOT EXISTS "Users can view their own properties" ON public.user_properties
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can insert their own properties" ON public.user_properties
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can update their own properties" ON public.user_properties
    FOR UPDATE USING (auth.uid() = user_id);

-- 4. Add sample data if table is empty
INSERT INTO public.user_properties (user_id, property_name, property_type, address, zone, revenue_type, annual_amount, due_date, status)
SELECT 
    auth.users.id::uuid,
    'Sample Property' as property_name,
    'Residential' as property_type,
    '123 Sample Street' as address,
    'A' as zone,
    'Tenement Rate' as revenue_type,
    50000 as annual_amount,
    (CURRENT_DATE + INTERVAL '1 month')::date as due_date,
    'active' as status
FROM auth.users 
WHERE auth.users.email = 'test@example.com'
LIMIT 1;

-- 5. Grant permissions
GRANT ALL ON public.user_properties TO authenticated;
GRANT SELECT ON public.user_properties TO anon;