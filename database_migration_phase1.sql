-- Phase 1: Database Schema Updates for SRC Departments
-- This script adds SRC department support to the existing database

-- Step 1: Add SRC Department field to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS src_department TEXT;

-- Step 2: Create SRC Departments reference table for consistency
CREATE TABLE IF NOT EXISTS src_departments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  color TEXT DEFAULT '#359d49',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 3: Insert default SRC departments
INSERT INTO src_departments (name, description, color) VALUES
  ('Academic Affairs', 'Handles academic-related concerns and student academic matters', '#2a6b39'),
  ('Student Welfare', 'Student welfare, support, and personal development', '#ddc753'),
  ('Facilities & Infrastructure', 'Campus facilities, maintenance, and infrastructure issues', '#dc2626'),
  ('Events & Activities', 'Campus events, student activities, and social programs', '#7c3aed'),
  ('General', 'General inquiries and concerns not covered by other departments', '#359d49'),
  ('Health & Safety', 'Health services, safety concerns, and emergency matters', '#059669'),
  ('Technology & IT', 'IT support, computer labs, and technology-related issues', '#2563eb')
ON CONFLICT (name) DO NOTHING;

-- Step 4: Update existing SRC members with default department
UPDATE profiles 
SET src_department = 'General' 
WHERE role = 'src' AND src_department IS NULL;

-- Step 5: Add index for performance on src_department
CREATE INDEX IF NOT EXISTS idx_profiles_src_department ON profiles(src_department);

-- Step 6: Add index for role and src_department combination
CREATE INDEX IF NOT EXISTS idx_profiles_role_src_department ON profiles(role, src_department);

-- Step 7: Add constraint to ensure SRC members have a department
ALTER TABLE profiles 
ADD CONSTRAINT check_src_department 
CHECK (
  (role = 'src' AND src_department IS NOT NULL) OR 
  (role != 'src')
);

-- Step 8: Create a view for easy SRC member queries
CREATE OR REPLACE VIEW src_members_view AS
SELECT 
  p.id,
  p.full_name,
  p.email,
  p.avatar_url,
  p.src_department,
  p.phone,
  p.is_active,
  p.created_at,
  sd.description as department_description,
  sd.color as department_color
FROM profiles p
LEFT JOIN src_departments sd ON p.src_department = sd.name
WHERE p.role = 'src' AND p.is_active = true
ORDER BY p.src_department, p.full_name;

-- Step 9: Add RLS policy for src_departments table
ALTER TABLE src_departments ENABLE ROW LEVEL SECURITY;

-- Anyone can view departments
CREATE POLICY "Anyone can view departments" ON src_departments
  FOR SELECT USING (true);

-- Only admins can manage departments
CREATE POLICY "Admins can manage departments" ON src_departments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Step 10: Update existing RLS policies to include src_department
-- (This will be handled by existing policies since we're just adding a field)

-- Verification queries
-- Check if the migration was successful
SELECT 'Migration completed successfully' as status;

-- Show current SRC members and their departments
SELECT 
  full_name, 
  email, 
  src_department, 
  is_active 
FROM profiles 
WHERE role = 'src' 
ORDER BY src_department, full_name;

-- Show all available departments
SELECT name, description, color FROM src_departments ORDER BY name; 