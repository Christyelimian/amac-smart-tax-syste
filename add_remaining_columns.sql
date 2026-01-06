-- Add remaining missing columns to payments table
-- Run this in Supabase SQL Editor

-- Check current payments table structure
SELECT 'CURRENT PAYMENTS TABLE COLUMNS:' as info;
SELECT column_name FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'payments'
ORDER BY ordinal_position;

-- Add all missing columns that the frontend expects
DO $$
BEGIN
    -- Add proof_of_payment_url column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_schema = 'public' AND table_name = 'payments' AND column_name = 'proof_of_payment_url') THEN
        ALTER TABLE public.payments ADD COLUMN proof_of_payment_url TEXT;
        RAISE NOTICE 'Added proof_of_payment_url column';
    END IF;

    -- Add submitted_at column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_schema = 'public' AND table_name = 'payments' AND column_name = 'submitted_at') THEN
        ALTER TABLE public.payments ADD COLUMN submitted_at TIMESTAMP WITH TIME ZONE;
        RAISE NOTICE 'Added submitted_at column';
    END IF;

    -- Add verified_by column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_schema = 'public' AND table_name = 'payments' AND column_name = 'verified_by') THEN
        ALTER TABLE public.payments ADD COLUMN verified_by UUID REFERENCES auth.users(id);
        RAISE NOTICE 'Added verified_by column';
    END IF;

    -- Add verified_at column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_schema = 'public' AND table_name = 'payments' AND column_name = 'verified_at') THEN
        ALTER TABLE public.payments ADD COLUMN verified_at TIMESTAMP WITH TIME ZONE;
        RAISE NOTICE 'Added verified_at column';
    END IF;

    -- Add verification_notes column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_schema = 'public' AND table_name = 'payments' AND column_name = 'verification_notes') THEN
        ALTER TABLE public.payments ADD COLUMN verification_notes TEXT;
        RAISE NOTICE 'Added verification_notes column';
    END IF;

    -- Add customer_details column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_schema = 'public' AND table_name = 'payments' AND column_name = 'customer_details') THEN
        ALTER TABLE public.payments ADD COLUMN customer_details JSONB;
        RAISE NOTICE 'Added customer_details column';
    END IF;

    -- Add gateway_response column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_schema = 'public' AND table_name = 'payments' AND column_name = 'gateway_response') THEN
        ALTER TABLE public.payments ADD COLUMN gateway_response JSONB;
        RAISE NOTICE 'Added gateway_response column';
    END IF;

    -- Add receipt_number column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_schema = 'public' AND table_name = 'payments' AND column_name = 'receipt_number') THEN
        ALTER TABLE public.payments ADD COLUMN receipt_number TEXT UNIQUE;
        RAISE NOTICE 'Added receipt_number column';
    END IF;

    -- Add remita_response column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_schema = 'public' AND table_name = 'payments' AND column_name = 'remita_response') THEN
        ALTER TABLE public.payments ADD COLUMN remita_response JSONB;
        RAISE NOTICE 'Added remita_response column';
    END IF;

    -- Add bank_transaction_id column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_schema = 'public' AND table_name = 'payments' AND column_name = 'bank_transaction_id') THEN
        ALTER TABLE public.payments ADD COLUMN bank_transaction_id TEXT;
        RAISE NOTICE 'Added bank_transaction_id column';
    END IF;

    -- Add bank_confirmed column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_schema = 'public' AND table_name = 'payments' AND column_name = 'bank_confirmed') THEN
        ALTER TABLE public.payments ADD COLUMN bank_confirmed BOOLEAN DEFAULT false;
        RAISE NOTICE 'Added bank_confirmed column';
    END IF;

    -- Add bank_confirmed_at column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_schema = 'public' AND table_name = 'payments' AND column_name = 'bank_confirmed_at') THEN
        ALTER TABLE public.payments ADD COLUMN bank_confirmed_at TIMESTAMP WITH TIME ZONE;
        RAISE NOTICE 'Added bank_confirmed_at column';
    END IF;

    -- Add reconciled column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_schema = 'public' AND table_name = 'payments' AND column_name = 'reconciled') THEN
        ALTER TABLE public.payments ADD COLUMN reconciled BOOLEAN DEFAULT false;
        RAISE NOTICE 'Added reconciled column';
    END IF;

    -- Add reconciled_at column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_schema = 'public' AND table_name = 'payments' AND column_name = 'reconciled_at') THEN
        ALTER TABLE public.payments ADD COLUMN reconciled_at TIMESTAMP WITH TIME ZONE;
        RAISE NOTICE 'Added reconciled_at column';
    END IF;

    RAISE NOTICE 'All column additions complete';
END $$;

-- Verify all expected columns now exist
SELECT 'VERIFICATION - Frontend Expected Columns:' as info;
SELECT
    'reference' as column_name,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'payments' AND column_name = 'reference') THEN '✅ EXISTS' ELSE '❌ MISSING' END as status
UNION ALL
SELECT 'payer_name',
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'payments' AND column_name = 'payer_name') THEN '✅ EXISTS' ELSE '❌ MISSING' END
UNION ALL
SELECT 'payer_phone',
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'payments' AND column_name = 'payer_phone') THEN '✅ EXISTS' ELSE '❌ MISSING' END
UNION ALL
SELECT 'payer_email',
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'payments' AND column_name = 'payer_email') THEN '✅ EXISTS' ELSE '❌ MISSING' END
UNION ALL
SELECT 'property_name',
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'payments' AND column_name = 'property_name') THEN '✅ EXISTS' ELSE '❌ MISSING' END
UNION ALL
SELECT 'business_address',
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'payments' AND column_name = 'business_address') THEN '✅ EXISTS' ELSE '❌ MISSING' END
UNION ALL
SELECT 'registration_number',
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'payments' AND column_name = 'registration_number') THEN '✅ EXISTS' ELSE '❌ MISSING' END
UNION ALL
SELECT 'service_name',
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'payments' AND column_name = 'service_name') THEN '✅ EXISTS' ELSE '❌ MISSING' END
UNION ALL
SELECT 'revenue_type',
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'payments' AND column_name = 'revenue_type') THEN '✅ EXISTS' ELSE '❌ MISSING' END
UNION ALL
SELECT 'revenue_type_code',
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'payments' AND column_name = 'revenue_type_code') THEN '✅ EXISTS' ELSE '❌ MISSING' END
UNION ALL
SELECT 'zone_id',
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'payments' AND column_name = 'zone_id') THEN '✅ EXISTS' ELSE '❌ MISSING' END
UNION ALL
SELECT 'amount',
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'payments' AND column_name = 'amount') THEN '✅ EXISTS' ELSE '❌ MISSING' END
UNION ALL
SELECT 'status',
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'payments' AND column_name = 'status') THEN '✅ EXISTS' ELSE '❌ MISSING' END
UNION ALL
SELECT 'payment_method',
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'payments' AND column_name = 'payment_method') THEN '✅ EXISTS' ELSE '❌ MISSING' END
UNION ALL
SELECT 'payment_channel',
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'payments' AND column_name = 'payment_channel') THEN '✅ EXISTS' ELSE '❌ MISSING' END
UNION ALL
SELECT 'proof_of_payment_url',
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'payments' AND column_name = 'proof_of_payment_url') THEN '✅ EXISTS' ELSE '❌ MISSING' END
UNION ALL
SELECT 'notes',
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'payments' AND column_name = 'notes') THEN '✅ EXISTS' ELSE '❌ MISSING' END;

-- Show updated table structure
SELECT 'UPDATED PAYMENTS TABLE COLUMNS:' as info;
SELECT column_name FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'payments'
ORDER BY ordinal_position;

SELECT '✅ All missing columns added successfully!' as result;
