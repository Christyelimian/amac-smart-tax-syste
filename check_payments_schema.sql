-- Check the actual payments table schema
-- Run this in Supabase SQL Editor

-- Get all columns in payments table
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default,
    ordinal_position
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'payments'
ORDER BY ordinal_position;

-- Check if property_name column exists
SELECT
    CASE
        WHEN EXISTS (
            SELECT 1
            FROM information_schema.columns
            WHERE table_schema = 'public'
            AND table_name = 'payments'
            AND column_name = 'property_name'
        ) THEN '✅ property_name column EXISTS'
        ELSE '❌ property_name column MISSING'
    END as property_name_status;

-- Check what the frontend is trying to insert vs what exists
SELECT 'FRONTEND EXPECTS THESE COLUMNS:' as info;
SELECT unnest(ARRAY[
    'reference',
    'payer_name',
    'payer_phone',
    'payer_email',
    'property_name',
    'business_address',
    'registration_number',
    'service_name',
    'revenue_type',
    'revenue_type_code',
    'zone_id',
    'amount',
    'status',
    'payment_method',
    'payment_channel',
    'notes'
]) as frontend_columns;

SELECT 'DATABASE HAS THESE COLUMNS:' as info;
SELECT column_name as database_columns
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'payments'
ORDER BY ordinal_position;
