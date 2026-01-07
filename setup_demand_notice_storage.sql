-- ===========================================
-- SETUP DEMAND NOTICE STORAGE BUCKET
-- ===========================================
-- Creates Supabase storage bucket for demand notice PDFs

-- Create storage bucket for demand notices
INSERT INTO storage.buckets (id, name, public)
VALUES ('demand-notices', 'demand-notices', true)
ON CONFLICT (id) DO NOTHING;

-- Set up RLS policies for the demand-notices bucket
-- Allow public read access for downloading PDFs
CREATE POLICY "Public read access for demand notices" ON storage.objects
FOR SELECT USING (bucket_id = 'demand-notices');

-- Allow authenticated users (admins) to upload PDFs
CREATE POLICY "Admins can upload demand notices" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'demand-notices'
  AND auth.role() = 'authenticated'
  -- Additional admin check can be added here
);

-- Allow admins to update/delete PDFs
CREATE POLICY "Admins can manage demand notices" ON storage.objects
FOR ALL USING (
  bucket_id = 'demand-notices'
  AND auth.role() = 'authenticated'
  -- Additional admin check can be added here
);

-- ===========================================
-- VERIFICATION
-- ===========================================

-- Check if bucket was created
SELECT 'STORAGE BUCKET VERIFICATION:' as info;
SELECT id, name, public, created_at
FROM storage.buckets
WHERE id = 'demand-notices';

-- Check bucket policies
SELECT 'STORAGE POLICIES VERIFICATION:' as info;
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'objects'
  AND schemaname = 'storage';

SELECT '✅ DEMAND NOTICE STORAGE SETUP COMPLETED!' as final_result;
