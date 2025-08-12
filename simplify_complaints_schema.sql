-- =====================================================
-- SIMPLIFY COMPLAINTS SCHEMA: Remove Claim System
-- =====================================================
-- This migration safely removes the confusing claim system and simplifies
-- to an assignment-only approach that's clearer and more intuitive
--
-- WARNING: This script will remove data and objects. Make sure to backup first!
-- =====================================================

-- PHASE 1: Identify and Drop Dependent Objects
-- =====================================================

-- First, let's see what depends on the claim-related columns
DO $$
DECLARE
    obj_record RECORD;
BEGIN
    RAISE NOTICE 'Checking for objects that depend on claim-related columns...';
    
    -- Check for policies that reference claim columns
    FOR obj_record IN 
        SELECT schemaname, tablename, policyname 
        FROM pg_policies 
        WHERE tablename = 'complaints' 
        AND (qual LIKE '%assigned_department%' OR qual LIKE '%is_claimed%' OR qual LIKE '%claimed_at%' OR qual LIKE '%claimed_by%')
    LOOP
        RAISE NOTICE 'Found dependent policy: %.%.%', obj_record.schemaname, obj_record.tablename, obj_record.policyname;
    END LOOP;
    
    -- Check for views that reference claim columns
    FOR obj_record IN 
        SELECT schemaname, viewname 
        FROM pg_views 
        WHERE schemaname = 'public' 
        AND (definition LIKE '%assigned_department%' OR definition LIKE '%is_claimed%' OR definition LIKE '%claimed_at%' OR definition LIKE '%claimed_by%')
    LOOP
        RAISE NOTICE 'Found dependent view: %.%', obj_record.schemaname, obj_record.viewname;
    END LOOP;
END $$;

-- PHASE 2: Drop Dependent Policies
-- =====================================================

-- Drop any policies that reference claim columns
DROP POLICY IF EXISTS "SRC can update claimed complaints" ON complaints;

-- Drop the existing SRC view policy (we'll recreate it)
DROP POLICY IF EXISTS "SRC can view department complaints" ON complaints;

-- PHASE 3: Drop Dependent Views
-- =====================================================

-- Drop views that reference claim columns
DROP VIEW IF EXISTS src_complaints_by_department;
DROP VIEW IF EXISTS complaints_with_departments;

-- PHASE 4: Remove Claim-Related Columns
-- =====================================================

-- Now safely remove the columns
ALTER TABLE complaints 
DROP COLUMN IF EXISTS assigned_department,
DROP COLUMN IF EXISTS is_claimed,
DROP COLUMN IF EXISTS claimed_at,
DROP COLUMN IF EXISTS claimed_by;

-- PHASE 5: Drop Claim-Related Indexes
-- =====================================================

-- Drop indexes that are no longer needed
DROP INDEX IF EXISTS idx_complaints_assigned_department;
DROP INDEX IF EXISTS idx_complaints_is_claimed;

-- PHASE 6: Recreate RLS Policies
-- =====================================================

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

-- PHASE 7: Recreate Helper Views
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

-- PHASE 8: Update API Routes (if needed)
-- =====================================================

-- Note: The existing API routes should continue to work since they check assigned_to
-- However, any logic that referenced claim fields will need to be updated in the application code

-- PHASE 9: Verification
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
-- Benefits:
-- ✅ Clearer workflow - one person handles each complaint
-- ✅ Better accountability - clear who is responsible
-- ✅ Simpler UI - no confusing dual statuses
-- ✅ More intuitive - users understand "assigned to John"
--
-- Next steps:
-- 1. Test the new assignment-only workflow
-- 2. Verify that SRC members can still access relevant complaints
-- 3. Update any application code that might reference the old claim fields
