-- =====================================================
-- SAFE MIGRATION: Step-by-Step Claim System Removal
-- =====================================================
-- This script safely removes the claim system by first identifying
-- all dependencies and then removing them systematically
--
-- IMPORTANT: Run this in phases and verify each step works
-- =====================================================

-- PHASE 1: IDENTIFY ALL DEPENDENCIES
-- =====================================================
-- Run this first to see what needs to be removed

-- Check for policies that reference claim columns (simplified approach)
SELECT 
    'POLICY' as object_type,
    'complaints' as tablename,
    policyname,
    'DROP POLICY "' || policyname || '" ON complaints;' as drop_command
FROM pg_policies 
WHERE tablename = 'complaints' 
AND (qual LIKE '%assigned_department%' OR qual LIKE '%is_claimed%' OR qual LIKE '%claimed_at%' OR qual LIKE '%claimed_by%');

-- Check for views that reference claim columns
SELECT 
    'VIEW' as object_type,
    viewname,
    'DROP VIEW IF EXISTS ' || viewname || ';' as drop_command
FROM pg_views 
WHERE schemaname = 'public' 
AND (definition LIKE '%assigned_department%' OR definition LIKE '%is_claimed%' OR definition LIKE '%claimed_at%' OR definition LIKE '%claimed_by%');

-- Check for triggers that might reference claim columns
SELECT 
    'TRIGGER' as object_type,
    'complaints' as tablename,
    tgname as triggername,
    'DROP TRIGGER IF EXISTS ' || tgname || ' ON complaints;' as drop_command
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
WHERE c.relname = 'complaints'
AND t.tgname LIKE '%claim%';

-- Check for functions that reference claim columns
SELECT 
    'FUNCTION' as object_type,
    n.nspname as schemaname,
    p.proname as functionname,
    'DROP FUNCTION IF EXISTS ' || n.nspname || '.' || p.proname || ';' as drop_command
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE p.prosrc LIKE '%assigned_department%' 
   OR p.prosrc LIKE '%is_claimed%' 
   OR p.prosrc LIKE '%claimed_at%' 
   OR p.prosrc LIKE '%claimed_by%';

-- =====================================================
-- PHASE 2: REMOVE DEPENDENCIES (Run after Phase 1)
-- =====================================================

-- Step 2a: Drop policies that reference claim columns
-- (Replace with actual policy names found in Phase 1)
-- DROP POLICY IF EXISTS "SRC can update claimed complaints" ON complaints;

-- Step 2b: Drop views that reference claim columns
-- (Replace with actual view names found in Phase 1)
-- DROP VIEW IF EXISTS src_complaints_by_department;
-- DROP VIEW IF EXISTS complaints_with_departments;

-- Step 2c: Drop triggers that reference claim columns
-- (Replace with actual trigger names found in Phase 1)

-- Step 2d: Drop functions that reference claim columns
-- (Replace with actual function names found in Phase 1)

-- =====================================================
-- PHASE 3: REMOVE COLUMNS (Run after Phase 2)
-- =====================================================

-- Now safely remove the columns
ALTER TABLE complaints 
DROP COLUMN IF EXISTS assigned_department,
DROP COLUMN IF EXISTS is_claimed,
DROP COLUMN IF EXISTS claimed_at,
DROP COLUMN IF EXISTS claimed_by;

-- =====================================================
-- PHASE 4: REMOVE INDEXES (Run after Phase 3)
-- =====================================================

-- Drop indexes that are no longer needed
DROP INDEX IF EXISTS idx_complaints_assigned_department;
DROP INDEX IF EXISTS idx_complaints_is_claimed;

-- =====================================================
-- PHASE 5: RECREATE POLICIES (Run after Phase 4)
-- =====================================================

-- Drop the existing SRC view policy (we'll recreate it)
DROP POLICY IF EXISTS "SRC can view department complaints" ON complaints;

-- Create new simplified policy that uses assignment instead of claiming
CREATE POLICY "SRC can view department complaints" ON complaints
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles p 
      JOIN src_departments sd ON p.src_department = sd.name 
      WHERE p.id = auth.uid() 
        AND p.role = 'src'
        AND (
          -- Complaint targets their department OR is assigned to them
          (departments_selected @> ARRAY[sd.id]) OR
          assigned_to = auth.uid()
        )
    )
  );

-- =====================================================
-- PHASE 6: RECREATE VIEWS (Run after Phase 5)
-- =====================================================

-- Create new simplified view without claim fields
CREATE OR REPLACE VIEW complaints_with_departments AS
SELECT 
  c.*,
  array_agg(sd.name) as target_department_names,
  array_agg(sd.color) as target_department_colors
FROM complaints c
LEFT JOIN LATERAL unnest(c.departments_selected) AS dept_id ON true
LEFT JOIN src_departments sd ON dept_id = sd.id
GROUP BY c.id, c.student_id, c.title, c.description, c.category, c.priority, 
         c.status, c.assigned_to, c.response, c.resolved_at, c.created_at, c.updated_at,
         c.departments_selected;

-- Create new simplified SRC view
CREATE OR REPLACE VIEW src_complaints_by_department AS
SELECT 
  c.*,
  p.src_department,
  sd.name as department_name,
  sd.color as department_color
FROM complaints c
JOIN LATERAL unnest(c.departments_selected) AS dept_id ON true
JOIN src_departments sd ON dept_id = sd.id
JOIN profiles p ON p.src_department = sd.name
WHERE p.role = 'src' AND p.is_active = true;

-- =====================================================
-- PHASE 7: VERIFICATION (Run after Phase 6)
-- =====================================================

-- Check that claim columns were removed
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'complaints' 
  AND column_name IN ('assigned_department', 'is_claimed', 'claimed_at', 'claimed_by');

-- Check that only assignment-related columns remain
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'complaints' 
ORDER BY ordinal_position;

-- Check that new policy was created
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename = 'complaints' AND policyname = 'SRC can view department complaints';

-- Check that views were recreated
SELECT schemaname, viewname FROM pg_views 
WHERE schemaname = 'public' 
AND viewname IN ('complaints_with_departments', 'src_complaints_by_department');

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
-- Your complaints table is now simplified to use only assignment!
--
-- Next steps:
-- 1. Test the new assignment-only workflow
-- 2. Verify that SRC members can still access relevant complaints
-- 3. Update any application code that might reference the old claim fields
