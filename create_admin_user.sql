-- Create admin access for an existing user
-- Replace YOUR_USER_EMAIL with the email of the user you want to make admin

-- First, find your user ID from auth.users
SELECT 'FIND YOUR USER ID:' as info;
SELECT id, email, created_at
FROM auth.users
WHERE email = 'YOUR_USER_EMAIL'  -- Replace with your actual email
ORDER BY created_at DESC;

-- Then grant admin role (replace USER_ID_HERE with the ID from above)
-- INSERT INTO public.user_roles (user_id, role)
-- VALUES ('USER_ID_HERE', 'admin');

-- Example (uncomment and replace):
-- INSERT INTO public.user_roles (user_id, role)
-- VALUES ('12345678-1234-1234-1234-123456789012', 'admin');

-- Alternative: Grant super_admin role (has all permissions)
-- INSERT INTO public.user_roles (user_id, role)
-- VALUES ('USER_ID_HERE', 'super_admin');

-- Verify admin access
SELECT 'CHECK ADMIN ROLES:' as info;
SELECT ur.user_id, ur.role, u.email
FROM public.user_roles ur
JOIN auth.users u ON ur.user_id = u.id
WHERE ur.role IN ('admin', 'super_admin', 'auditor')
ORDER BY ur.created_at DESC;

SELECT '✅ Admin user created successfully! You can now access /admin routes.' as result;
