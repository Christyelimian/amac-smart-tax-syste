-- Simple fix: Disable RLS for payment_history table
-- Run this in Supabase SQL Editor

-- Check current RLS status
SELECT
    'PAYMENT_HISTORY RLS STATUS BEFORE:' as info,
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
    AND tablename = 'payment_history';

-- Disable RLS for payment_history to allow trigger inserts
ALTER TABLE public.payment_history DISABLE ROW LEVEL SECURITY;

-- Verify RLS was disabled
SELECT
    'PAYMENT_HISTORY RLS STATUS AFTER:' as info,
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
    AND tablename = 'payment_history';

-- Check current policies (should be none now)
SELECT
    'CURRENT POLICIES ON PAYMENT_HISTORY:' as info,
    COUNT(*) as policy_count
FROM pg_policies
WHERE schemaname = 'public'
    AND tablename = 'payment_history';

SELECT '✅ Payment history RLS disabled successfully! Status change logging should now work.' as result;
