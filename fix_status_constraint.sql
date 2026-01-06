-- Fix the payments status constraint to match frontend usage
-- Run this in Supabase SQL Editor

-- Check current status constraint
SELECT
    tc.table_schema,
    tc.table_name,
    tc.constraint_name,
    cc.check_clause
FROM information_schema.table_constraints tc
JOIN information_schema.check_constraints cc ON tc.constraint_name = cc.constraint_name
WHERE tc.table_schema = 'public'
    AND tc.table_name = 'payments'
    AND tc.constraint_type = 'CHECK'
    AND cc.check_clause LIKE '%status%';

-- Drop the existing status constraint if it exists
ALTER TABLE public.payments DROP CONSTRAINT IF EXISTS payments_status_check;

-- Add the correct status constraint that matches frontend usage
ALTER TABLE public.payments ADD CONSTRAINT payments_status_check
CHECK (status IN ('pending', 'processing', 'confirmed', 'failed', 'pending_verification', 'awaiting_verification', 'rejected'));

-- Verify the constraint was updated
SELECT
    tc.table_schema,
    tc.table_name,
    tc.constraint_name,
    cc.check_clause
FROM information_schema.table_constraints tc
JOIN information_schema.check_constraints cc ON tc.constraint_name = cc.constraint_name
WHERE tc.table_schema = 'public'
    AND tc.table_name = 'payments'
    AND tc.constraint_type = 'CHECK'
    AND cc.check_clause LIKE '%status%';

-- Test that the allowed statuses work
SELECT 'ALLOWED STATUSES VERIFICATION:' as info;
SELECT unnest(ARRAY[
    'pending',
    'processing',
    'confirmed',
    'failed',
    'pending_verification',
    'awaiting_verification',
    'rejected'
]) as allowed_statuses;

-- Show current payments and their statuses
SELECT
    'CURRENT PAYMENTS STATUSES:' as info,
    id,
    reference,
    status,
    payment_method
FROM public.payments
ORDER BY created_at DESC
LIMIT 5;

SELECT '✅ Status constraint updated successfully!' as result;
