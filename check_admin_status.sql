-- Check admin status for floodgatesautomation@gmail.com
-- Run this in Supabase SQL Editor

-- Find the user
SELECT 'USER LOOKUP:' as info;
SELECT id, email, created_at, last_sign_in_at
FROM auth.users
WHERE email = 'floodgatesautomation@gmail.com';

-- Check if admin role exists for this user
SELECT 'ADMIN ROLE CHECK:' as info;
SELECT
  u.id,
  u.email,
  ur.role,
  ur.created_at as role_granted,
  ur.updated_at as role_updated
FROM auth.users u
LEFT JOIN public.user_roles ur ON u.id = ur.user_id
WHERE u.email = 'floodgatesautomation@gmail.com'
  AND (ur.role IS NULL OR ur.role IN ('admin', 'super_admin', 'auditor'));

-- Check all user roles in the system
SELECT 'ALL USER ROLES:' as info;
SELECT
  u.email,
  ur.role,
  ur.created_at as role_granted
FROM public.user_roles ur
JOIN auth.users u ON ur.user_id = u.id
ORDER BY ur.created_at DESC;

-- If no admin role found, let's create it manually
-- First get the user ID
SELECT 'MANUAL ADMIN GRANT - STEP 1: Get User ID' as info;
SELECT id as user_id_to_use
FROM auth.users
WHERE email = 'floodgatesautomation@gmail.com';

-- Then run this INSERT (replace USER_ID with the ID above):
-- INSERT INTO public.user_roles (user_id, role, created_at, updated_at)
-- VALUES ('REPLACE_WITH_USER_ID', 'super_admin', NOW(), NOW())
-- ON CONFLICT (user_id, role) DO NOTHING;

SELECT 'If no admin role shows above, run the INSERT statement above with your user ID.' as instructions;
