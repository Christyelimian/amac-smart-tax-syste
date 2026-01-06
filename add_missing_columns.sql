-- Add missing columns to payments table
-- Run this in Supabase SQL Editor

-- Check current payments table structure
SELECT 'CURRENT PAYMENTS TABLE COLUMNS:' as info;
SELECT column_name FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'payments'
ORDER BY ordinal_position;

-- Add missing columns that the frontend expects
DO $$
BEGIN
    -- Add property_name column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_schema = 'public' AND table_name = 'payments' AND column_name = 'property_name') THEN
        ALTER TABLE public.payments ADD COLUMN property_name TEXT;
        RAISE NOTICE 'Added property_name column';
    END IF;

    -- Add revenue_type_code column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_schema = 'public' AND table_name = 'payments' AND column_name = 'revenue_type_code') THEN
        ALTER TABLE public.payments ADD COLUMN revenue_type_code TEXT;
        RAISE NOTICE 'Added revenue_type_code column';
    END IF;

    -- Add zone_id column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_schema = 'public' AND table_name = 'payments' AND column_name = 'zone_id') THEN
        ALTER TABLE public.payments ADD COLUMN zone_id TEXT REFERENCES public.zones(id);
        RAISE NOTICE 'Added zone_id column';
    END IF;

    -- Add payment_channel column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_schema = 'public' AND table_name = 'payments' AND column_name = 'payment_channel') THEN
        ALTER TABLE public.payments ADD COLUMN payment_channel TEXT CHECK (payment_channel IN ('card', 'bank_transfer', 'ussd', 'remita_app', 'pos'));
        RAISE NOTICE 'Added payment_channel column';
    END IF;

    -- Add business_address column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_schema = 'public' AND table_name = 'payments' AND column_name = 'business_address') THEN
        ALTER TABLE public.payments ADD COLUMN business_address TEXT;
        RAISE NOTICE 'Added business_address column';
    END IF;

    -- Add registration_number column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_schema = 'public' AND table_name = 'payments' AND column_name = 'registration_number') THEN
        ALTER TABLE public.payments ADD COLUMN registration_number TEXT;
        RAISE NOTICE 'Added registration_number column';
    END IF;

    RAISE NOTICE 'Column check complete';
END $$;

-- Verify the columns were added
SELECT 'UPDATED PAYMENTS TABLE COLUMNS:' as info;
SELECT column_name FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'payments'
ORDER BY ordinal_position;

-- Test query that matches frontend expectations
SELECT
    'TEST: Columns frontend expects should now exist:' as info,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns
                     WHERE table_schema = 'public' AND table_name = 'payments' AND column_name = 'property_name')
         THEN '✅ property_name EXISTS' ELSE '❌ property_name MISSING' END,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns
                     WHERE table_schema = 'public' AND table_name = 'payments' AND column_name = 'revenue_type_code')
         THEN '✅ revenue_type_code EXISTS' ELSE '❌ revenue_type_code MISSING' END,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns
                     WHERE table_schema = 'public' AND table_name = 'payments' AND column_name = 'zone_id')
         THEN '✅ zone_id EXISTS' ELSE '❌ zone_id MISSING' END,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns
                     WHERE table_schema = 'public' AND table_name = 'payments' AND column_name = 'payment_channel')
         THEN '✅ payment_channel EXISTS' ELSE '❌ payment_channel MISSING' END;
