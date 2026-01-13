-- Fix profiles table by adding missing zone column
-- This resolves the "Could not find the 'zone' column" error

DO $$
BEGIN
    -- Check if zone column exists, if not add it
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'profiles'
          AND column_name = 'zone'
    ) THEN
        -- Add zone column with enum type
        ALTER TABLE public.profiles ADD COLUMN zone public.zone DEFAULT 'a';

        RAISE NOTICE '✅ Added zone column to profiles table';
    ELSE
        RAISE NOTICE 'ℹ️ Zone column already exists in profiles table';
    END IF;
END $$;

-- Verify the fix
SELECT 'PROFILES TABLE STRUCTURE AFTER FIX:' as info;
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'profiles'
ORDER BY ordinal_position;

-- Test insert to verify it works
SELECT 'TESTING PROFILE INSERT:' as info;
INSERT INTO public.profiles (id, email, full_name, phone, zone)
VALUES (
  'test-user-id',
  'test@example.com',
  'Test User',
  '+1234567890',
  'a'
)
ON CONFLICT (id) DO NOTHING;

SELECT 'SAMPLE PROFILE DATA:' as info;
SELECT id, email, full_name, phone, zone
FROM public.profiles
WHERE id = 'test-user-id';

-- Clean up test data
DELETE FROM public.profiles WHERE id = 'test-user-id';

SELECT '✅ PROFILES TABLE ZONE COLUMN FIX COMPLETED!' as final_result;
