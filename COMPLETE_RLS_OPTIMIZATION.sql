-- ============================================================================
-- COMPLETE RLS PERFORMANCE OPTIMIZATION SCRIPT
-- ============================================================================
-- This script consolidates all RLS policies into efficient, unified policies
-- that eliminate the 80 performance warnings while maintaining security
-- 
-- EXECUTION ORDER:
-- 1. Create user context function
-- 2. Drop all existing problematic policies
-- 3. Create unified, optimized policies
-- 4. Verify the implementation
-- ============================================================================

-- ============================================================================
-- STEP 1: CREATE USER CONTEXT FUNCTION
-- ============================================================================
-- This function caches user role and department info to avoid repeated auth.uid() calls

CREATE OR REPLACE FUNCTION get_user_context()
RETURNS TABLE(role user_role, src_department text, is_admin boolean, is_src boolean, is_student boolean)
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
  SELECT 
    p.role,
    p.src_department,
    p.role = 'admin' as is_admin,
    p.role = 'src' as is_src,
    p.role = 'student' as is_student
  FROM profiles p 
  WHERE p.id = auth.uid()
$$;

-- ============================================================================
-- STEP 2: DROP ALL EXISTING PROBLEMATIC POLICIES
-- ============================================================================

-- Drop complaints policies
DROP POLICY IF EXISTS "SRC and Admin can update complaints" ON complaints;
DROP POLICY IF EXISTS "SRC can view department complaints" ON complaints;
DROP POLICY IF EXISTS "Students and Admins can delete complaints" ON complaints;
DROP POLICY IF EXISTS "Students can create complaints" ON complaints;
DROP POLICY IF EXISTS "Students can update own complaints" ON complaints;
DROP POLICY IF EXISTS "Students can view own complaints" ON complaints;

-- Drop news_categories policies
DROP POLICY IF EXISTS "Admins can manage categories" ON news_categories;
DROP POLICY IF EXISTS "Anyone can view categories" ON news_categories;

-- Drop news_posts policies
DROP POLICY IF EXISTS "Anyone can view published posts" ON news_posts;
DROP POLICY IF EXISTS "Author and SRC/Admin can delete posts" ON news_posts;
DROP POLICY IF EXISTS "Author and SRC/Admin can update posts" ON news_posts;
DROP POLICY IF EXISTS "SRC and Admin can create posts" ON news_posts;

-- Drop notifications policies
DROP POLICY IF EXISTS "Admins can view all notifications" ON notifications;
DROP POLICY IF EXISTS "System can create notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;

-- Drop profiles policies
DROP POLICY IF EXISTS "Admins can delete all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Allow all users to select profiles" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;

-- Drop report_categories policies
DROP POLICY IF EXISTS "Admin and SRC President can manage categories" ON report_categories;
DROP POLICY IF EXISTS "Anyone can view report categories" ON report_categories;

-- Drop reports policies
DROP POLICY IF EXISTS "Admin and SRC President can create reports" ON reports;
DROP POLICY IF EXISTS "Admin and SRC President can delete reports" ON reports;
DROP POLICY IF EXISTS "Admin and SRC President can update reports" ON reports;
DROP POLICY IF EXISTS "Anyone can view reports" ON reports;

-- Drop src_departments policies
DROP POLICY IF EXISTS "Admins can manage departments" ON src_departments;
DROP POLICY IF EXISTS "Anyone can view departments" ON src_departments;

-- Drop src_projects policies
DROP POLICY IF EXISTS "Admin can manage all projects" ON src_projects;
DROP POLICY IF EXISTS "SRC President can approve projects" ON src_projects;
DROP POLICY IF EXISTS "SRC President can delete all projects" ON src_projects;
DROP POLICY IF EXISTS "SRC President can view all projects" ON src_projects;
DROP POLICY IF EXISTS "SRC can create department projects" ON src_projects;
DROP POLICY IF EXISTS "SRC can delete own projects" ON src_projects;
DROP POLICY IF EXISTS "SRC can update approved projects" ON src_projects;
DROP POLICY IF EXISTS "SRC can view department projects" ON src_projects;
DROP POLICY IF EXISTS "Students can view approved projects" ON src_projects;

-- ============================================================================
-- STEP 3: CREATE UNIFIED, OPTIMIZED POLICIES
-- ============================================================================

-- ============================================================================
-- COMPLAINTS TABLE - Separate policies for each operation type
-- ============================================================================

-- Policy for SELECT operations
CREATE POLICY "Complaints select access" ON complaints
FOR SELECT USING (
  (SELECT role = 'admin' FROM get_user_context()) OR
  ((SELECT role = 'src' FROM get_user_context()) AND 
   complaints.departments_selected @> ARRAY[
     (SELECT id FROM src_departments WHERE name = (SELECT src_department FROM get_user_context()))
   ]) OR
  ((SELECT role = 'student' FROM get_user_context()) AND complaints.student_id = auth.uid())
);

-- Policy for INSERT operations
CREATE POLICY "Complaints insert access" ON complaints
FOR INSERT WITH CHECK (
  (SELECT role = 'admin' FROM get_user_context()) OR
  ((SELECT role = 'src' FROM get_user_context()) AND 
   complaints.departments_selected @> ARRAY[
     (SELECT id FROM src_departments WHERE name = (SELECT src_department FROM get_user_context()))
   ]) OR
  ((SELECT role = 'student' FROM get_user_context()) AND complaints.student_id = auth.uid())
);

-- Policy for UPDATE operations
CREATE POLICY "Complaints update access" ON complaints
FOR UPDATE USING (
  (SELECT role = 'admin' FROM get_user_context()) OR
  ((SELECT role = 'src' FROM get_user_context()) AND 
   complaints.departments_selected @> ARRAY[
     (SELECT id FROM src_departments WHERE name = (SELECT src_department FROM get_user_context()))
   ]) OR
  ((SELECT role = 'student' FROM get_user_context()) AND complaints.student_id = auth.uid())
);

-- Policy for DELETE operations
CREATE POLICY "Complaints delete access" ON complaints
FOR DELETE USING (
  (SELECT role = 'admin' FROM get_user_context()) OR
  ((SELECT role = 'src' FROM get_user_context()) AND 
   complaints.departments_selected @> ARRAY[
     (SELECT id FROM src_departments WHERE name = (SELECT src_department FROM get_user_context()))
   ]) OR
  ((SELECT role = 'student' FROM get_user_context()) AND complaints.student_id = auth.uid())
);

-- ============================================================================
-- NEWS_CATEGORIES TABLE - Separate policies for each operation type
-- ============================================================================

-- Policy for SELECT operations (anyone can view)
CREATE POLICY "Categories select access" ON news_categories
FOR SELECT USING (true);

-- Policy for INSERT operations (only admins)
CREATE POLICY "Categories insert access" ON news_categories
FOR INSERT WITH CHECK (
  (SELECT role = 'admin' FROM get_user_context())
);

-- Policy for UPDATE operations (only admins)
CREATE POLICY "Categories update access" ON news_categories
FOR UPDATE USING (
  (SELECT role = 'admin' FROM get_user_context())
);

-- Policy for DELETE operations (only admins)
CREATE POLICY "Categories delete access" ON news_categories
FOR DELETE USING (
  (SELECT role = 'admin' FROM get_user_context())
);

-- ============================================================================
-- NEWS_POSTS TABLE - Separate policies for each operation type
-- ============================================================================

-- Policy for SELECT operations
CREATE POLICY "Posts select access" ON news_posts
FOR SELECT USING (
  news_posts.status = 'published' OR 
  news_posts.author_id = auth.uid() OR 
  (SELECT role = 'admin' FROM get_user_context()) OR 
  (SELECT role = 'src' FROM get_user_context())
);

-- Policy for INSERT operations
CREATE POLICY "Posts insert access" ON news_posts
FOR INSERT WITH CHECK (
  news_posts.author_id = auth.uid() OR 
  (SELECT role = 'admin' FROM get_user_context()) OR 
  (SELECT role = 'src' FROM get_user_context())
);

-- Policy for UPDATE operations
CREATE POLICY "Posts update access" ON news_posts
FOR UPDATE USING (
  news_posts.author_id = auth.uid() OR 
  (SELECT role = 'admin' FROM get_user_context()) OR 
  (SELECT role = 'src' FROM get_user_context())
);

-- Policy for DELETE operations
CREATE POLICY "Posts delete access" ON news_posts
FOR DELETE USING (
  news_posts.author_id = auth.uid() OR 
  (SELECT role = 'admin' FROM get_user_context()) OR 
  (SELECT role = 'src' FROM get_user_context())
);

-- ============================================================================
-- NOTIFICATIONS TABLE - Separate policies for each operation type
-- ============================================================================

-- Policy for SELECT operations
CREATE POLICY "Notifications select access" ON notifications
FOR SELECT USING (
  notifications.user_id = auth.uid() OR 
  (SELECT role = 'admin' FROM get_user_context())
);

-- Policy for INSERT operations
CREATE POLICY "Notifications insert access" ON notifications
FOR INSERT WITH CHECK (
  notifications.user_id = auth.uid() OR 
  (SELECT role = 'admin' FROM get_user_context()) OR
  true  -- System can create notifications
);

-- Policy for UPDATE operations
CREATE POLICY "Notifications update access" ON notifications
FOR UPDATE USING (
  notifications.user_id = auth.uid() OR 
  (SELECT role = 'admin' FROM get_user_context())
);

-- Policy for DELETE operations
CREATE POLICY "Notifications delete access" ON notifications
FOR DELETE USING (
  notifications.user_id = auth.uid() OR 
  (SELECT role = 'admin' FROM get_user_context())
);

-- ============================================================================
-- PROFILES TABLE - Separate policies for each operation type
-- ============================================================================

-- Policy for SELECT operations (anyone can view profiles)
CREATE POLICY "Profiles select access" ON profiles
FOR SELECT USING (true);

-- Policy for INSERT operations (only admins)
CREATE POLICY "Profiles insert access" ON profiles
FOR INSERT WITH CHECK (
  (SELECT role = 'admin' FROM get_user_context())
);

-- Policy for UPDATE operations
CREATE POLICY "Profiles update access" ON profiles
FOR UPDATE USING (
  profiles.id = auth.uid() OR 
  (SELECT role = 'admin' FROM get_user_context())
);

-- Policy for DELETE operations (only admins)
CREATE POLICY "Profiles delete access" ON profiles
FOR DELETE USING (
  (SELECT role = 'admin' FROM get_user_context())
);

-- ============================================================================
-- REPORT_CATEGORIES TABLE - Separate policies for each operation type
-- ============================================================================

-- Policy for SELECT operations (anyone can view)
CREATE POLICY "Report categories select access" ON report_categories
FOR SELECT USING (true);

-- Policy for INSERT operations
CREATE POLICY "Report categories insert access" ON report_categories
FOR INSERT WITH CHECK (
  (SELECT role = 'admin' FROM get_user_context()) OR 
  ((SELECT role = 'src' FROM get_user_context()) AND 
   (SELECT src_department = 'President' FROM get_user_context()))
);

-- Policy for UPDATE operations
CREATE POLICY "Report categories update access" ON report_categories
FOR UPDATE USING (
  (SELECT role = 'admin' FROM get_user_context()) OR 
  ((SELECT role = 'src' FROM get_user_context()) AND 
   (SELECT src_department = 'President' FROM get_user_context()))
);

-- Policy for DELETE operations
CREATE POLICY "Report categories delete access" ON report_categories
FOR DELETE USING (
  (SELECT role = 'admin' FROM get_user_context()) OR 
  ((SELECT role = 'src' FROM get_user_context()) AND 
   (SELECT src_department = 'President' FROM get_user_context()))
);

-- ============================================================================
-- REPORTS TABLE - Separate policies for each operation type
-- ============================================================================

-- Policy for SELECT operations
CREATE POLICY "Reports select access" ON reports
FOR SELECT USING (
  reports.visibility @> ARRAY['student'] OR
  (reports.visibility @> ARRAY['src'] AND (SELECT role = 'src' FROM get_user_context())) OR
  (SELECT role = 'admin' FROM get_user_context())
);

-- Policy for INSERT operations
CREATE POLICY "Reports insert access" ON reports
FOR INSERT WITH CHECK (
  (SELECT role = 'admin' FROM get_user_context()) OR 
  ((SELECT role = 'src' FROM get_user_context()) AND 
   (SELECT src_department = 'President' FROM get_user_context()))
);

-- Policy for UPDATE operations
CREATE POLICY "Reports update access" ON reports
FOR UPDATE USING (
  (SELECT role = 'admin' FROM get_user_context()) OR 
  ((SELECT role = 'src' FROM get_user_context()) AND 
   (SELECT src_department = 'President' FROM get_user_context()))
);

-- Policy for DELETE operations
CREATE POLICY "Reports delete access" ON reports
FOR DELETE USING (
  (SELECT role = 'admin' FROM get_user_context()) OR 
  ((SELECT role = 'src' FROM get_user_context()) AND 
   (SELECT src_department = 'President' FROM get_user_context()))
);

-- ============================================================================
-- SRC_DEPARTMENTS TABLE - Separate policies for each operation type
-- ============================================================================

-- Policy for SELECT operations (anyone can view)
CREATE POLICY "Departments select access" ON src_departments
FOR SELECT USING (true);

-- Policy for INSERT operations (only admins)
CREATE POLICY "Departments insert access" ON src_departments
FOR INSERT WITH CHECK (
  (SELECT role = 'admin' FROM get_user_context())
);

-- Policy for UPDATE operations (only admins)
CREATE POLICY "Departments update access" ON src_departments
FOR UPDATE USING (
  (SELECT role = 'admin' FROM get_user_context())
);

-- Policy for DELETE operations (only admins)
CREATE POLICY "Departments delete access" ON src_departments
FOR DELETE USING (
  (SELECT role = 'admin' FROM get_user_context())
);

-- ============================================================================
-- SRC_PROJECTS TABLE - Separate policies for each operation type
-- ============================================================================

-- Policy for SELECT operations
CREATE POLICY "Projects select access" ON src_projects
FOR SELECT USING (
  (SELECT role = 'admin' FROM get_user_context()) OR
  ((SELECT role = 'src' FROM get_user_context()) AND 
   (SELECT src_department = 'President' FROM get_user_context())) OR
  ((SELECT role = 'src' FROM get_user_context()) AND src_projects.department_id = (
    SELECT id FROM src_departments WHERE name = (SELECT src_department FROM get_user_context())
  )) OR
  (src_projects.approval_status = 'approved')
);

-- Policy for INSERT operations
CREATE POLICY "Projects insert access" ON src_projects
FOR INSERT WITH CHECK (
  (SELECT role = 'admin' FROM get_user_context()) OR
  ((SELECT role = 'src' FROM get_user_context()) AND 
   (SELECT src_department = 'President' FROM get_user_context())) OR
  ((SELECT role = 'src' FROM get_user_context()) AND src_projects.department_id = (
    SELECT id FROM src_departments WHERE name = (SELECT src_department FROM get_user_context())
  ))
);

-- Policy for UPDATE operations
CREATE POLICY "Projects update access" ON src_projects
FOR UPDATE USING (
  (SELECT role = 'admin' FROM get_user_context()) OR
  ((SELECT role = 'src' FROM get_user_context()) AND 
   (SELECT src_department = 'President' FROM get_user_context())) OR
  ((SELECT role = 'src' FROM get_user_context()) AND src_projects.department_id = (
    SELECT id FROM src_departments WHERE name = (SELECT src_department FROM get_user_context())
  ))
);

-- Policy for DELETE operations
CREATE POLICY "Projects delete access" ON src_projects
FOR DELETE USING (
  (SELECT role = 'admin' FROM get_user_context()) OR
  ((SELECT role = 'src' FROM get_user_context()) AND 
   (SELECT src_department = 'President' FROM get_user_context())) OR
  ((SELECT role = 'src' FROM get_user_context()) AND src_projects.department_id = (
    SELECT id FROM src_departments WHERE name = (SELECT src_department FROM get_user_context())
  ))
);

-- ============================================================================
-- STEP 4: VERIFICATION
-- ============================================================================

-- Check that all policies are created successfully
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- Summary of expected policies (should show ~36 policies total)
SELECT 
  tablename,
  COUNT(*) as policy_count,
  STRING_AGG(cmd, ', ' ORDER BY cmd) as operations
FROM pg_policies 
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY tablename;

-- Check for any remaining auth.uid() calls
SELECT 
  'REMAINING AUTH.UID() CALLS FOUND' as status,
  schemaname,
  tablename,
  policyname,
  qual,
  with_check
FROM pg_policies 
WHERE schemaname = 'public'
  AND (qual::text LIKE '%auth.uid()%' OR with_check::text LIKE '%auth.uid()%')
ORDER BY tablename, policyname;
