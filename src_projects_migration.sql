-- Phase 1: SRC Projects Database Setup
-- This script creates the SRC projects table and related structures

-- Step 1: Add President department to src_departments
INSERT INTO src_departments (name, description, color) VALUES
  ('President', 'SRC President - Executive leadership and representation', '#dc2626')
ON CONFLICT (name) DO NOTHING;

-- Step 2: Create enums for project status and approval status FIRST
DO $$ BEGIN
    CREATE TYPE project_status AS ENUM (
      'not_started', 'planning', 'in_progress', 'on_hold', 'completed', 'cancelled'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE approval_status AS ENUM ('pending', 'approved', 'rejected');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Step 3: Create SRC Projects table (now the enums exist)
CREATE TABLE IF NOT EXISTS src_projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  department_id UUID REFERENCES src_departments(id) NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  objectives TEXT NOT NULL,
  start_date DATE,
  target_finish_date DATE,
  actual_finish_date DATE,
  progress_percentage INTEGER DEFAULT 0,
  budget_allocated DECIMAL(10,2),
  budget_spent DECIMAL(10,2),
  team_members TEXT[],
  status project_status DEFAULT 'not_started',
  approval_status approval_status DEFAULT 'pending',
  approved_by UUID REFERENCES profiles(id),
  approved_at TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT,
  created_by UUID REFERENCES profiles(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 4: Add columns to src_projects table (in case table already exists)
-- This step is now safe since enums exist
ALTER TABLE src_projects 
ADD COLUMN IF NOT EXISTS department_id UUID REFERENCES src_departments(id),
ADD COLUMN IF NOT EXISTS title TEXT,
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS objectives TEXT,
ADD COLUMN IF NOT EXISTS start_date DATE,
ADD COLUMN IF NOT EXISTS target_finish_date DATE,
ADD COLUMN IF NOT EXISTS actual_finish_date DATE,
ADD COLUMN IF NOT EXISTS progress_percentage INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS budget_allocated DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS budget_spent DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS team_members TEXT[],
ADD COLUMN IF NOT EXISTS status project_status DEFAULT 'not_started',
ADD COLUMN IF NOT EXISTS approval_status approval_status DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES profiles(id),
ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES profiles(id),
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Step 5: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_src_projects_department_id ON src_projects(department_id);
CREATE INDEX IF NOT EXISTS idx_src_projects_approval_status ON src_projects(approval_status);
CREATE INDEX IF NOT EXISTS idx_src_projects_status ON src_projects(status);
CREATE INDEX IF NOT EXISTS idx_src_projects_created_at ON src_projects(created_at);
CREATE INDEX IF NOT EXISTS idx_src_projects_department_status ON src_projects(department_id, status);

-- Step 6: Enable Row Level Security
ALTER TABLE src_projects ENABLE ROW LEVEL SECURITY;

-- Step 7: Create RLS Policies

-- Students can only view approved projects
CREATE POLICY "Students can view approved projects" ON src_projects
  FOR SELECT USING (approval_status = 'approved');

-- SRC members can view projects from their department
CREATE POLICY "SRC can view department projects" ON src_projects
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles p
      JOIN src_departments sd ON p.src_department = sd.name
      WHERE p.id = auth.uid() 
        AND p.role = 'src'
        AND sd.id = department_id
    )
  );

-- SRC members can create projects for their department
CREATE POLICY "SRC can create department projects" ON src_projects
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles p
      JOIN src_departments sd ON p.src_department = sd.name
      WHERE p.id = auth.uid() 
        AND p.role = 'src'
        AND sd.id = department_id
    )
  );

-- SRC members can update their approved projects
CREATE POLICY "SRC can update approved projects" ON src_projects
  FOR UPDATE USING (
    approval_status = 'approved' AND
    EXISTS (
      SELECT 1 FROM profiles p
      JOIN src_departments sd ON p.src_department = sd.name
      WHERE p.id = auth.uid() 
        AND p.role = 'src'
        AND sd.id = department_id
    )
  );

-- SRC members can delete their own projects
CREATE POLICY "SRC can delete own projects" ON src_projects
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM profiles p
      JOIN src_departments sd ON p.src_department = sd.name
      WHERE p.id = auth.uid() 
        AND p.role = 'src'
        AND sd.id = department_id
    )
  );

-- Admin can manage all projects
CREATE POLICY "Admin can manage all projects" ON src_projects
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Step 8: Create a view for easy project queries with department info
CREATE OR REPLACE VIEW src_projects_view AS
SELECT 
  sp.*,
  sd.name as department_name,
  sd.color as department_color,
  sd.description as department_description,
  p.full_name as created_by_name,
  p.role as created_by_role,
  approver.full_name as approved_by_name
FROM src_projects sp
JOIN src_departments sd ON sp.department_id = sd.id
JOIN profiles p ON sp.created_by = p.id
LEFT JOIN profiles approver ON sp.approved_by = approver.id
ORDER BY sp.created_at DESC;

-- Step 9: Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_src_projects_updated_at 
    BEFORE UPDATE ON src_projects 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Step 10: Verification queries
-- Check if the migration was successful
SELECT 'SRC Projects migration completed successfully' as status;

-- Show all available departments including President
SELECT name, description, color FROM src_departments ORDER BY name;

-- Show table structure
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'src_projects' 
ORDER BY ordinal_position;
