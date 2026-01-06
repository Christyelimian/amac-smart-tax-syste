-- Fix RLS policies for payment_history table
-- Run this in Supabase SQL Editor

-- Check current RLS policies for payment_history
SELECT
    'CURRENT PAYMENT_HISTORY POLICIES:' as info,
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies
WHERE schemaname = 'storage'  -- Wait, this should be 'public'
    AND tablename = 'payment_history'
ORDER BY policyname;

-- Correct query - check public schema
SELECT
    'CURRENT PAYMENT_HISTORY POLICIES:' as info,
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies
WHERE schemaname = 'public'
    AND tablename = 'payment_history'
ORDER BY policyname;

-- Drop existing policies for payment_history
DROP POLICY IF EXISTS "Only admins can view payment history" ON public.payment_history;

-- Create simpler policies for payment_history
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

-- Allow updates for admins (for reconciliation)
CREATE POLICY "Admins can update payment history" ON public.payment_history
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'super_admin')
  )
);

-- Verify policies were created
SELECT
    'UPDATED PAYMENT_HISTORY POLICIES:' as info,
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies
WHERE schemaname = 'public'
    AND tablename = 'payment_history'
ORDER BY policyname;

-- Check if payment_history table has RLS enabled
SELECT
    'PAYMENT_HISTORY RLS STATUS:' as info,
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
    AND tablename = 'payment_history';

-- Test current payment_history entries
SELECT
    'CURRENT PAYMENT_HISTORY ENTRIES:' as info,
    COUNT(*) as total_entries
FROM public.payment_history;

SELECT
    'SAMPLE PAYMENT_HISTORY ENTRIES:' as info,
    id,
    payment_id,
    old_status,
    new_status,
    changed_at
FROM public.payment_history
ORDER BY changed_at DESC
LIMIT 3;

SELECT '✅ Payment history RLS policies updated successfully!' as result;
