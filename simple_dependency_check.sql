-- =====================================================
-- SIMPLE DEPENDENCY CHECK FOR CLAIM SYSTEM REMOVAL
-- =====================================================
-- This script checks for the specific dependencies we know exist
-- based on the error message you received
-- =====================================================

-- Check for the specific policy mentioned in the error
SELECT 
    'POLICY' as object_type,
    policyname,
    'DROP POLICY "' || policyname || '" ON complaints;' as drop_command
FROM pg_policies 
WHERE tablename = 'complaints' 
AND policyname = 'SRC can update claimed complaints';

-- Check for views that might reference claim columns
SELECT 
    'VIEW' as object_type,
    viewname,
    'DROP VIEW IF EXISTS ' || viewname || ';' as drop_command
FROM pg_views 
WHERE schemaname = 'public' 
AND viewname IN ('src_complaints_by_department', 'complaints_with_departments');

-- Check for any other policies on complaints table
SELECT 
    'POLICY' as object_type,
    policyname,
    'DROP POLICY "' || policyname || '" ON complaints;' as drop_command
FROM pg_policies 
WHERE tablename = 'complaints';

-- Check for any triggers on complaints table
SELECT 
    'TRIGGER' as object_type,
    tgname as triggername,
    'DROP TRIGGER IF EXISTS ' || tgname || ' ON complaints;' as drop_command
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
WHERE c.relname = 'complaints';

-- Check current complaints table structure
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'complaints' 
ORDER BY ordinal_position;
