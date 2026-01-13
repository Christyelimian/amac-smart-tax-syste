-- Manual RLS Fix for AMAC Payment Portal
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/kfummdjejjjccfbzzifc/sql

-- First, check if RLS is enabled
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Remove any existing policies
DROP POLICY IF EXISTS "Allow public payment inserts" ON public.payments;
DROP POLICY IF EXISTS "Allow public payment reads" ON public.payments;

-- Create policies to allow public access for payments
CREATE POLICY "Allow public payment inserts"
ON public.payments
FOR INSERT
TO anon
WITH CHECK (true);

CREATE POLICY "Allow public payment reads"
ON public.payments
FOR SELECT
TO anon
USING (true);

CREATE POLICY "Allow public payment updates"
ON public.payments
FOR UPDATE
TO anon
WITH CHECK (true);

-- Verify policies are created
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'payments';