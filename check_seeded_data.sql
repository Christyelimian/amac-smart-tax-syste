-- Check what data was seeded in the database
-- Run this in Supabase SQL Editor

-- Check zones data
SELECT 'ZONES DATA' as section, COUNT(*) as count FROM public.zones
UNION ALL
SELECT 'Zones: ' || id || ' - ' || name || ' (multiplier: ' || multiplier || ')', null
FROM public.zones
ORDER BY count DESC NULLS LAST;

-- Check revenue types count by category
SELECT
  'REVENUE TYPES BY CATEGORY' as section,
  category,
  COUNT(*) as count
FROM public.revenue_types
GROUP BY category
UNION ALL
SELECT
  'TOTAL REVENUE TYPES' as section,
  'ALL' as category,
  COUNT(*) as count
FROM public.revenue_types
ORDER BY section, category;

-- Sample revenue types
SELECT
  'SAMPLE REVENUE TYPES' as section,
  code,
  name,
  base_amount,
  has_zones,
  category
FROM public.revenue_types
ORDER BY base_amount DESC NULLS LAST
LIMIT 10;

-- Check if we need sample users/admins
SELECT
  'USER ROLES STATUS' as section,
  COUNT(*) as count
FROM public.user_roles;

-- Check payments status
SELECT
  'PAYMENTS STATUS' as section,
  COUNT(*) as count
FROM public.payments;
