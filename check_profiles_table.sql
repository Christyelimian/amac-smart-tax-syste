-- Check profiles table structure and data
SELECT 'PROFILES TABLE STRUCTURE:' as info;
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'profiles'
ORDER BY ordinal_position;

SELECT 'PROFILES TABLE DATA COUNT:' as info;
SELECT COUNT(*) as total_profiles FROM public.profiles;

SELECT 'SAMPLE PROFILES DATA:' as info;
SELECT
  id,
  email,
  full_name,
  phone,
  created_at
FROM public.profiles
LIMIT 5;

-- Check if zone column exists
SELECT 'ZONE COLUMN EXISTS:' as info;
SELECT
  CASE
    WHEN EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'profiles'
        AND column_name = 'zone'
    ) THEN 'YES - Zone column exists'
    ELSE 'NO - Zone column missing'
  END as zone_column_status;
