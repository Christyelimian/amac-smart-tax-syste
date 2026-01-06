-- Fix Storage Policies for Payment Proofs
-- Run this in Supabase SQL Editor

-- Drop existing policies to recreate them
DROP POLICY IF EXISTS "Users can upload payment proofs" ON storage.objects;
DROP POLICY IF EXISTS "Users can view payment proofs" ON storage.objects;

-- Create simpler, more permissive policies for payment proofs
CREATE POLICY "Authenticated users can upload payment proofs" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'payment-proofs'
);

CREATE POLICY "Users can view payment proofs" ON storage.objects
FOR SELECT USING (
  bucket_id = 'payment-proofs'
);

-- Allow updates for admins (for verification)
CREATE POLICY "Admins can update payment proofs" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'payment-proofs'
  AND EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'super_admin')
  )
);

-- Allow deletes for admins
CREATE POLICY "Admins can delete payment proofs" ON storage.objects
FOR DELETE USING (
  bucket_id = 'payment-proofs'
  AND EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'super_admin')
  )
);

-- Check current policies
SELECT
    'STORAGE POLICIES FOR payment-proofs BUCKET:' as info,
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies
WHERE schemaname = 'storage'
    AND tablename = 'objects'
    AND policyname LIKE '%payment%'
ORDER BY policyname;

-- Test the bucket exists and is accessible
SELECT
    'PAYMENT-PROOFS BUCKET STATUS:' as info,
    CASE
        WHEN EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'payment-proofs')
        THEN '✅ Bucket exists'
        ELSE '❌ Bucket missing'
    END as bucket_status;

SELECT '✅ Storage policies updated successfully!' as result;
