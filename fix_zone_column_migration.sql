-- Migration to add missing zone column to profiles table
-- Run this in Supabase SQL Editor

-- Add zone column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'profiles'
        AND column_name = 'zone'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN zone TEXT DEFAULT 'a';
        RAISE NOTICE 'Added zone column to profiles table';
    ELSE
        RAISE NOTICE 'Zone column already exists';
    END IF;
END $$;

-- Verify the column was added
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'profiles'
AND column_name = 'zone';
