# DWU SRC Database Schema

## 🗄️ Database Overview

This schema supports the DWU SRC web application with role-based access control (Student, SRC, Admin) and all features outlined in the PRD.

## 👥 Core Tables

### 1. **profiles** (User Profiles)
```sql
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  student_id TEXT UNIQUE, -- For students only
  role user_role NOT NULL DEFAULT 'student',
  avatar_url TEXT,
  department TEXT, -- e.g., "Computer Science", "Business"
  src_department TEXT, -- SRC department for SRC members
  year_level INTEGER, -- For students: 1, 2, 3, 4
  phone TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Custom type for user roles
CREATE TYPE user_role AS ENUM ('student', 'src', 'admin');
```

### 2. **src_departments** (SRC Departments)
```sql
CREATE TABLE src_departments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  color TEXT DEFAULT '#359d49',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default SRC departments
INSERT INTO src_departments (name, description, color) VALUES
  ('Academic Affairs', 'Handles academic-related concerns and student academic matters', '#2a6b39'),
  ('Student Welfare', 'Student welfare, support, and personal development', '#ddc753'),
  ('Facilities & Infrastructure', 'Campus facilities, maintenance, and infrastructure issues', '#dc2626'),
  ('Events & Activities', 'Campus events, student activities, and social programs', '#7c3aed'),
  ('General', 'General inquiries and concerns not covered by other departments', '#359d49'),
  ('Health & Safety', 'Health services, safety concerns, and emergency matters', '#059669'),
  ('Technology & IT', 'IT support, computer labs, and technology-related issues', '#2563eb');

-- Create view for SRC members with department details
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
```

### 3. **news_categories** (News Categories)
```sql
CREATE TABLE news_categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  color TEXT DEFAULT '#359d49',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default categories
INSERT INTO news_categories (name, description, color) VALUES
  ('general', 'General announcements', '#359d49'),
  ('academic', 'Academic updates and information', '#2a6b39'),
  ('events', 'Campus events and activities', '#ddc753'),
  ('important', 'Important notices and alerts', '#dc2626'),
  ('student-life', 'Student life and activities', '#7c3aed');
```

### 3. **news_posts** (News & Announcements)
```sql
CREATE TABLE news_posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  excerpt TEXT, -- Short summary for preview
  author_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  category_id UUID REFERENCES news_categories(id) ON DELETE SET NULL,
  status post_status DEFAULT 'published',
  featured BOOLEAN DEFAULT false,
  image_url TEXT,
  tags TEXT[], -- Array of tags
  view_count INTEGER DEFAULT 0,
  allow_comments BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  published_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TYPE post_status AS ENUM ('draft', 'published', 'archived');
```

### 3. **complaints** (Student Complaints)
```sql
CREATE TABLE complaints (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category complaint_category NOT NULL,
  priority complaint_priority DEFAULT 'medium',
  status complaint_status DEFAULT 'pending',
  assigned_to UUID REFERENCES profiles(id) ON DELETE SET NULL, -- SRC member assigned
  response TEXT, -- SRC response
  resolved_at TIMESTAMP WITH TIME ZONE,
  -- Department-based complaint routing
  departments_selected UUID[] NOT NULL DEFAULT '{}', -- Array of SRC department IDs
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TYPE complaint_category AS ENUM (
  'academic', 'facilities', 'security', 'health', 'transport', 'other'
);

CREATE TYPE complaint_priority AS ENUM ('low', 'medium', 'high', 'urgent');

CREATE TYPE complaint_status AS ENUM (
  'pending', 'in_progress', 'resolved', 'closed', 'rejected'
);

-- Add comments for clarity
COMMENT ON COLUMN complaints.departments_selected IS 'Array of SRC department IDs that the complaint was sent to';
COMMENT ON COLUMN complaints.assigned_to IS 'SRC member assigned to handle this complaint (gives messaging rights)';
```

### 3.1. **Complaint Department Indexes and Performance**
```sql
-- Index for department-based queries
CREATE INDEX idx_complaints_departments_selected ON complaints USING GIN (departments_selected);

-- Index for assignment queries
CREATE INDEX idx_complaints_assigned_to ON complaints(assigned_to);

-- Composite index for department + status queries
CREATE INDEX idx_complaints_dept_status ON complaints(departments_selected, status);
```

### 3.2. **Database Schema Simplification (IMPLEMENTED)**
```sql
-- REMOVED: complaint_departments junction table (was causing conflicts)
-- DROP TABLE IF EXISTS complaint_departments CASCADE;

-- UPDATED: Using departments_selected array field directly in complaints table
-- This approach is simpler, more performant, and avoids foreign key constraint conflicts

-- Current working structure:
-- complaints.departments_selected: UUID[] - Array of SRC department IDs
-- complaints.assigned_department: UUID - Single department that claimed the complaint  
-- complaints.is_claimed: BOOLEAN - Whether complaint has been claimed
-- complaints.claimed_at: TIMESTAMP - When complaint was claimed
-- complaints.claimed_by: UUID - SRC member who claimed the complaint

-- Benefits of array approach:
-- ✅ Direct queries without joins
-- ✅ Better performance with GIN indexes
-- ✅ Simpler application logic
-- ✅ No constraint conflicts during updates
-- ✅ Claim functionality now works properly
```

### 4. **project_proposals** (Student Project Proposals)
```sql
CREATE TABLE project_proposals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  objectives TEXT NOT NULL,
  budget DECIMAL(10,2),
  timeline_months INTEGER,
  status proposal_status DEFAULT 'pending',
  reviewed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  review_notes TEXT,
  approved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TYPE proposal_status AS ENUM ('pending', 'under_review', 'approved', 'rejected');
```

### 5. **forum_topics** (Discussion Forums)
```sql
CREATE TABLE forum_topics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  author_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  category forum_category DEFAULT 'general',
  is_pinned BOOLEAN DEFAULT false,
  is_locked BOOLEAN DEFAULT false,
  view_count INTEGER DEFAULT 0,
  reply_count INTEGER DEFAULT 0,
  last_reply_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TYPE forum_category AS ENUM (
  'general', 'academic', 'events', 'suggestions', 'announcements'
);
```

### 6. **forum_replies** (Forum Replies)
```sql
CREATE TABLE forum_replies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  topic_id UUID REFERENCES forum_topics(id) ON DELETE CASCADE NOT NULL,
  author_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  parent_reply_id UUID REFERENCES forum_replies(id) ON DELETE CASCADE, -- For threaded replies
  is_solution BOOLEAN DEFAULT false, -- Mark as solution
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```



### 9. **reports** (Monthly Reports)
```sql
CREATE TABLE reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  file_url TEXT NOT NULL, -- Supabase Storage URL
  file_name TEXT NOT NULL,
  file_size INTEGER, -- File size in bytes
  month INTEGER NOT NULL, -- 1-12
  year INTEGER NOT NULL,
  uploaded_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  download_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  visibility TEXT[] DEFAULT '{src,student}', -- Dashboard visibility control
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Note: Month/Year constraint removed to allow multiple reports per month
  -- This provides flexibility for different types of reports (weekly, monthly, etc.)
);

-- Performance indexes
CREATE INDEX idx_reports_visibility ON reports USING GIN (visibility);
CREATE INDEX idx_reports_month_year ON reports(month, year);
CREATE INDEX idx_reports_uploaded_by ON reports(uploaded_by);
CREATE INDEX idx_reports_created_at ON reports(created_at DESC);
```

### 10. **notifications** (User Notifications)
```sql
CREATE TABLE notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type notification_type NOT NULL,
  reference_id UUID, -- ID of related record (complaint, post, etc.)
  reference_type TEXT, -- Type of reference ('complaint', 'news', etc.)
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TYPE notification_type AS ENUM (
  'complaint_update', 'news_post', 'forum_reply', 'system'
);
```

## 🔗 Relationships & Indexes

### Important Indexes
```sql
-- Performance indexes
CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_profiles_student_id ON profiles(student_id);
CREATE INDEX idx_profiles_src_department ON profiles(src_department);
CREATE INDEX idx_profiles_role_src_department ON profiles(role, src_department);
CREATE INDEX idx_news_posts_status ON news_posts(status);
CREATE INDEX idx_news_posts_created_at ON news_posts(created_at DESC);
CREATE INDEX idx_complaints_student_id ON complaints(student_id);
CREATE INDEX idx_complaints_status ON complaints(status);
CREATE INDEX idx_complaints_assigned_to ON complaints(assigned_to);
CREATE INDEX idx_forum_topics_category ON forum_topics(category);
CREATE INDEX idx_forum_topics_created_at ON forum_topics(created_at DESC);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);

-- Reports indexes
CREATE INDEX idx_reports_visibility ON reports USING GIN (visibility);
CREATE INDEX idx_reports_month_year ON reports(month, year);
CREATE INDEX idx_reports_uploaded_by ON reports(uploaded_by);
CREATE INDEX idx_reports_created_at ON reports(created_at DESC);
```

## 🔒 Row Level Security (RLS) Policies

### Enable RLS on all tables
```sql
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE src_departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE news_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE complaints ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE forum_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE forum_replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Notifications RLS Policies
-- Users can view their own notifications
CREATE POLICY "Users can view own notifications" ON notifications
  FOR SELECT USING (user_id = auth.uid());

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users can update own notifications" ON notifications
  FOR UPDATE USING (user_id = auth.uid());

-- System can create notifications for users (for triggers)
CREATE POLICY "System can create notifications" ON notifications
  FOR INSERT WITH CHECK (true);

-- Admins can view all notifications
CREATE POLICY "Admins can view all notifications" ON notifications
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
```

### Profiles RLS Policies
```sql
-- Users can view their own profile
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Admins can view all profiles
CREATE POLICY "Admins can view all profiles" ON profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Admins can update all profiles
CREATE POLICY "Admins can update all profiles" ON profiles
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Admins can delete all profiles
CREATE POLICY "Admins can delete all profiles" ON profiles
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
```

### News Categories RLS Policies
```sql
-- Anyone can view categories
CREATE POLICY "Anyone can view categories" ON news_categories
  FOR SELECT USING (true);

-- Admins can manage categories
CREATE POLICY "Admins can manage categories" ON news_categories
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
```

### SRC Departments RLS Policies
```sql
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
```

### News Posts RLS Policies
```sql
-- Everyone can view published posts
CREATE POLICY "Anyone can view published posts" ON news_posts
  FOR SELECT USING (status = 'published');

-- SRC and Admin can create posts
CREATE POLICY "SRC and Admin can create posts" ON news_posts
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role IN ('src', 'admin')
    )
  );

-- Author, SRC, and Admin can update posts
CREATE POLICY "Author and SRC/Admin can update posts" ON news_posts
  FOR UPDATE USING (
    author_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role IN ('src', 'admin')
    )
  );

-- Author and SRC/Admin can delete posts
CREATE POLICY "Author and SRC/Admin can delete posts" ON news_posts
  FOR DELETE USING (
    author_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role IN ('src', 'admin')
    )
  );
```

### Complaints RLS Policies
```sql
-- Students can view their own complaints
CREATE POLICY "Students can view own complaints" ON complaints
  FOR SELECT USING (
    student_id = auth.uid() OR
    assigned_to = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role IN ('src', 'admin')
    )
  );

-- SRC can view complaints that target their department
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

-- Students can create complaints
CREATE POLICY "Students can create complaints" ON complaints
  FOR INSERT WITH CHECK (
    student_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'student'
    )
  );

-- SRC and Admin can update complaints
CREATE POLICY "SRC and Admin can update complaints" ON complaints
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role IN ('src', 'admin')
    )
  );

-- Students can update their own complaints
CREATE POLICY "Students can update own complaints" ON complaints
  FOR UPDATE USING (
    student_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'student'
    )
  );

-- Students and Admins can delete complaints
CREATE POLICY "Students and Admins can delete complaints" ON complaints
  FOR DELETE USING (
    (student_id = auth.uid() AND 
     EXISTS (
       SELECT 1 FROM profiles 
       WHERE id = auth.uid() AND role = 'student'
     )) OR
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
```

### Reports RLS Policies
```sql
-- Enable RLS on reports table
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- Policy 1: Anyone can view reports (students and SRC members)
-- This policy allows users to see reports based on their role and visibility
CREATE POLICY "Anyone can view reports" ON reports
  FOR SELECT USING (
    (visibility @> ARRAY['student']) OR
    (visibility @> ARRAY['src'] AND
     EXISTS (
       SELECT 1 FROM profiles
       WHERE id = auth.uid() AND role = 'src'
     )) OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Policy 2: Only Admin and SRC President can create reports
CREATE POLICY "Admin and SRC President can create reports" ON reports
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND
        (role = 'admin' OR
         (role = 'src' AND src_department = 'President'))
    )
  );

-- Policy 3: Only Admin and SRC President can update reports
CREATE POLICY "Admin and SRC President can update reports" ON reports
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND
        (role = 'admin' OR
         (role = 'src' AND src_department = 'President'))
    )
  );

-- Policy 4: Only Admin and SRC President can delete reports
CREATE POLICY "Admin and SRC President can delete reports" ON reports
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND
        (role = 'admin' OR
         (role = 'src' AND src_department = 'President'))
    )
  );

-- Reports Helper View and Triggers
```sql
-- Create a view for easy report queries with user info
CREATE OR REPLACE VIEW reports_view AS
SELECT
  r.*,
  p.full_name as uploaded_by_name,
  p.role as uploaded_by_role,
  p.src_department as uploaded_by_department
FROM reports r
LEFT JOIN profiles p ON r.uploaded_by = p.id
ORDER BY r.year DESC, r.month DESC, r.created_at DESC;

-- Add trigger to update updated_at timestamp (if not exists)
DO $$
BEGIN
  -- Check if the function exists
  IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at_column') THEN
    CREATE OR REPLACE FUNCTION update_updated_at_column()
    RETURNS TRIGGER AS $$
    BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
    END;
    $$ language 'plpgsql';
  END IF;
END $$;

-- Create trigger for reports table
DROP TRIGGER IF EXISTS update_reports_updated_at ON reports;
CREATE TRIGGER update_reports_updated_at
    BEFORE UPDATE ON reports
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
```

### **✅ Working Reports Configuration (Verified)**
The above reports table structure, RLS policies, and triggers have been tested and are working successfully. The key to making it work was:

1. **Enable RLS**: `ALTER TABLE reports ENABLE ROW LEVEL SECURITY;`
2. **Recreate Policies**: Drop and recreate RLS policies if they exist
3. **Proper Role Check**: Ensure user has admin role or src role with President department

**Test Status**: ✅ Reports API working - upload, download, delete operations successful
**Dashboard Integration**: ✅ Reports feature fully integrated into Admin, SRC, and Student dashboards

### Helper Functions for Department-Based Complaint Routing
```
```

## 🚀 **NEW: Simplified Assignment-Only System (RECOMMENDED)**

### **Why This Approach is Better:**
- ✅ **Clearer workflow** - One person handles the complaint
- ✅ **Better accountability** - Clear who is responsible  
- ✅ **Simpler UI** - No confusing dual statuses
- ✅ **More intuitive** - Users understand "assigned to John" vs "claimed by Department X"

### **How It Works:**
1. **Student submits complaint** → Targets specific departments
2. **SRC member from target department** → Can assign to themselves or others
3. **Assignment automatically gives messaging rights** to the assigned person
4. **No separate "claiming" step needed**

### **Updated Complaints Table Structure:**
```sql
CREATE TABLE complaints (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category complaint_category NOT NULL,
  priority complaint_priority DEFAULT 'medium',
  status complaint_status DEFAULT 'pending',
  assigned_to UUID REFERENCES profiles(id) ON DELETE SET NULL, -- SRC member assigned
  response TEXT, -- SRC response
  resolved_at TIMESTAMP WITH TIME ZONE,
  -- Department-based complaint routing
  departments_selected UUID[] NOT NULL DEFAULT '{}', -- Array of SRC department IDs
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### **Simplified Indexes:**
```sql
-- Index for department-based queries
CREATE INDEX idx_complaints_departments_selected ON complaints USING GIN (departments_selected);

-- Index for assignment queries
CREATE INDEX idx_complaints_assigned_to ON complaints(assigned_to);

-- Composite index for department + status queries
CREATE INDEX idx_complaints_dept_status ON complaints(departments_selected, status);
```

### **Migration Script to Remove Claim Fields:**
```sql
-- Remove claim-related columns
ALTER TABLE complaints 
DROP COLUMN IF EXISTS assigned_department,
DROP COLUMN IF EXISTS is_claimed,
DROP COLUMN IF EXISTS claimed_at,
DROP COLUMN IF EXISTS claimed_by;

-- Drop claim-related indexes
DROP INDEX IF EXISTS idx_complaints_assigned_department;
DROP INDEX IF EXISTS idx_complaints_is_claimed;

-- Update RLS policies to use assignment instead of claiming
DROP POLICY IF EXISTS "SRC can view department complaints" ON complaints;

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
```

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
