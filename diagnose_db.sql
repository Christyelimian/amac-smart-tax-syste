-- Diagnostic queries to check current database state
-- Run this in Supabase SQL Editor to see what's currently in your database

-- Check all tables in public schema
SELECT
    schemaname,
    tablename,
    tableowner
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- Check columns in user_roles table
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'user_roles'
ORDER BY ordinal_position;

-- Check if any policies exist
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- Check current user and search path
SELECT current_user, current_schema, current_schemas(true);

-- Check for any existing user_roles references in functions/policies
SELECT
    routine_name,
    routine_type,
    routine_definition
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_definition ILIKE '%user_roles%'
ORDER BY routine_name;
