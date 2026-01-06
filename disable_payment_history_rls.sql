-- Temporarily disable RLS for payment_history to allow status logging
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

-- Test if we can now insert into payment_history (this should work)
-- Note: This is just a test - the actual inserts happen via triggers
INSERT INTO public.payment_history (
    payment_id,
    old_status,
    new_status,
    change_reason,
    metadata
) VALUES (
    '00000000-0000-0000-0000-000000000000'::uuid,
    'pending',
    'awaiting_verification',
    'Test insert after RLS disable',
    '{"test": true}'::jsonb
);

-- Check if the test insert worked
SELECT
    'TEST INSERT RESULT:' as info,
    COUNT(*) as payment_history_records
FROM public.payment_history;

-- Clean up the test record
DELETE FROM public.payment_history WHERE metadata->>'test' = 'true';

SELECT '✅ Payment history RLS disabled - status logging should now work!' as result;
