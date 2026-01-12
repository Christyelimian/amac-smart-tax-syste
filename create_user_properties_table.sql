-- Create user_properties table if it doesn't exist
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

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_properties_user_id ON public.user_properties(user_id);
CREATE INDEX IF NOT EXISTS idx_user_properties_status ON public.user_properties(status);
CREATE INDEX IF NOT EXISTS idx_user_properties_due_date ON public.user_properties(due_date);

-- Enable Row Level Security
ALTER TABLE public.user_properties ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for user_properties
CREATE POLICY "Users can view their own properties" ON public.user_properties
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own properties" ON public.user_properties
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own properties" ON public.user_properties
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own properties" ON public.user_properties
    FOR DELETE USING (auth.uid() = user_id);

-- Insert sample data for testing (only if table is empty)
INSERT INTO public.user_properties (user_id, property_name, property_type, address, zone, revenue_type, annual_amount, due_date, status)
SELECT 
    user_id,
    'Sample Residential Property' as property_name,
    'Residential' as property_type,
    '123 Sample Street, Abuja' as address,
    'A' as zone,
    'Tenement Rate' as revenue_type,
    50000 as annual_amount,
    (CURRENT_DATE + INTERVAL '1 month')::date as due_date,
    'active' as status
FROM public.payments 
LIMIT 1;

INSERT INTO public.user_properties (user_id, property_name, property_type, address, zone, revenue_type, annual_amount, due_date, status)
SELECT 
    user_id,
    'Sample Commercial Property' as property_name,
    'Commercial' as property_type,
    '456 Business Avenue, Abuja' as address,
    'B' as zone,
    'Business Premises Permit' as revenue_type,
    75000 as annual_amount,
    (CURRENT_DATE + INTERVAL '1 month')::date as due_date,
    'active' as status
FROM public.payments 
LIMIT 1;

-- Grant necessary permissions
GRANT ALL ON public.user_properties TO authenticated;
GRANT SELECT ON public.user_properties TO anon;