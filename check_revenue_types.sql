-- Check revenue_types table and RLS policies
SELECT 'REVENUE_TYPES TABLE STATUS:' as check_type;
SELECT
  schemaname,
  tablename,
  tableowner,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename = 'revenue_types';

-- Check if table has data
SELECT 'REVENUE_TYPES DATA COUNT:' as check_type;
SELECT COUNT(*) as record_count FROM public.revenue_types;

-- Check RLS policies
SELECT 'REVENUE_TYPES POLICIES:' as check_type;
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'revenue_types'
ORDER BY policyname;

-- Test the exact query that's failing
SELECT 'TEST QUERY (tenement-rate):' as check_type;
SELECT * FROM public.revenue_types WHERE code = 'tenement-rate';

-- Test another failing query
SELECT 'TEST QUERY (ground-rent):' as check_type;
SELECT * FROM public.revenue_types WHERE code = 'ground-rent';

-- Check all revenue types codes
SELECT 'ALL REVENUE TYPES:' as check_type;
SELECT code, name, category FROM public.revenue_types ORDER BY code LIMIT 10;
