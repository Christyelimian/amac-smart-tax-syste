-- Force grant admin access to floodgatesautomation@gmail.com
-- Run this in Supabase SQL Editor

-- Delete any existing roles for this user first
DELETE FROM public.user_roles
WHERE user_id IN (
  SELECT id FROM auth.users WHERE email = 'floodgatesautomation@gmail.com'
);

-- Grant super_admin role
INSERT INTO public.user_roles (user_id, role, created_at, updated_at)
SELECT
  id,
  'super_admin',
  NOW(),
  NOW()
FROM auth.users
WHERE email = 'floodgatesautomation@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;

-- Verify it worked
SELECT 'ADMIN ACCESS VERIFICATION:' as info;
SELECT
  u.id,
  u.email,
  ur.role,
  ur.created_at as granted_at,
  '✅ ADMIN ACCESS GRANTED' as status
FROM auth.users u
JOIN public.user_roles ur ON u.id = ur.user_id
WHERE u.email = 'floodgatesautomation@gmail.com'
  AND ur.role IN ('admin', 'super_admin', 'auditor');

-- If no results above, the user doesn't exist
SELECT 'USER EXISTS CHECK:' as info;
SELECT
  CASE WHEN EXISTS (SELECT 1 FROM auth.users WHERE email = 'floodgatesautomation@gmail.com')
  THEN '✅ User exists in auth.users'
  ELSE '❌ User NOT found - please sign up first'
  END as user_status;

SELECT '🎯 Try logging in again at /auth and accessing /admin' as next_steps;
