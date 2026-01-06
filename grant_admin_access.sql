-- Grant admin access to a user in AMAC system
-- Run this in Supabase SQL Editor

-- Step 1: List all users to find the one you want to make admin
SELECT 'CURRENT USERS IN SYSTEM:' as info;
SELECT id, email, created_at, last_sign_in_at
FROM auth.users
ORDER BY created_at DESC;

-- Step 2: Grant admin role (replace the UUID below with your user's ID)
-- Uncomment and modify the INSERT statement below:

-- INSERT INTO public.user_roles (user_id, role, created_at, updated_at)
-- VALUES (
--   'REPLACE_WITH_YOUR_USER_ID_HERE',
--   'super_admin',
--   NOW(),
--   NOW()
-- ) ON CONFLICT (user_id, role) DO NOTHING;

-- Step 3: Verify admin access was granted
SELECT 'CURRENT ADMIN USERS:' as info;
SELECT
  u.id,
  u.email,
  ur.role,
  ur.created_at as role_granted
FROM auth.users u
JOIN public.user_roles ur ON u.id = ur.user_id
WHERE ur.role IN ('admin', 'super_admin', 'auditor')
ORDER BY ur.created_at DESC;

-- Available admin roles:
-- 'admin' - Basic admin access
-- 'super_admin' - Full admin access (recommended)
-- 'auditor' - Read-only admin access

SELECT '✅ Admin access granted! You can now access admin routes at /admin' as result;
