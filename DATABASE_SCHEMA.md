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
  departments_selected UUID[] NOT NULL DEFAULT '{}', -- Array of SRC department IDs that the complaint was sent to
  assigned_department UUID REFERENCES src_departments(id), -- Single department that claimed the complaint
  is_claimed BOOLEAN DEFAULT false, -- Whether the complaint has been claimed by a department
  claimed_at TIMESTAMP WITH TIME ZONE, -- Timestamp when the complaint was claimed
  claimed_by UUID REFERENCES profiles(id), -- SRC member who claimed the complaint
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
COMMENT ON COLUMN complaints.assigned_department IS 'Single department that claimed the complaint (for messaging rights)';
COMMENT ON COLUMN complaints.is_claimed IS 'Whether the complaint has been claimed by a department';
COMMENT ON COLUMN complaints.claimed_at IS 'Timestamp when the complaint was claimed';
COMMENT ON COLUMN complaints.claimed_by IS 'SRC member who claimed the complaint';
```

### 3.1. **Complaint Department Indexes and Performance**
```sql
-- Index for department-based queries
CREATE INDEX idx_complaints_departments_selected ON complaints USING GIN (departments_selected);

-- Index for assigned department queries
CREATE INDEX idx_complaints_assigned_department ON complaints(assigned_department);

-- Index for claiming status
CREATE INDEX idx_complaints_is_claimed ON complaints(is_claimed);

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
    
    -- Ensure unique report per month/year
    UNIQUE(month, year)
    );
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

### Helper Functions for Department-Based Complaint Routing
```sql
-- Function to check if a user can view a complaint based on their department
CREATE OR REPLACE FUNCTION can_view_complaint(
  complaint_id UUID,
  user_id UUID
) RETURNS BOOLEAN AS $func$
DECLARE
  user_role TEXT;
  user_src_department TEXT;
  complaint_departments UUID[];
BEGIN
  -- Get user role and department
  SELECT role, src_department INTO user_role, user_src_department
  FROM profiles WHERE id = user_id;
  
  -- Get complaint departments
  SELECT departments_selected INTO complaint_departments
  FROM complaints WHERE id = complaint_id;
  
  -- Students can always see their own complaints
  IF user_role = 'student' THEN
    RETURN EXISTS (SELECT 1 FROM complaints WHERE id = complaint_id AND student_id = user_id);
  END IF;
  
  -- Admins can see all complaints
  IF user_role = 'admin' THEN
    RETURN true;
  END IF;
  
  -- SRC members can see complaints that target their department
  IF user_role = 'src' AND user_src_department IS NOT NULL THEN
    RETURN EXISTS (
      SELECT 1 FROM src_departments 
      WHERE name = user_src_department 
        AND id = ANY(complaint_departments)
    );
  END IF;
  
  RETURN false;
END;
$func$ LANGUAGE plpgsql SECURITY DEFINER;
```
```



## 🔍 Helper Views for Department-Based Complaint Routing

### Complaints with Departments View
```sql
-- View to get complaints with their target departments using the array field
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
         c.departments_selected, c.assigned_department, c.is_claimed, c.claimed_at, c.claimed_by;
```

### SRC Complaints by Department View
```sql
-- View for SRC members to see complaints relevant to their department
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
```

## 🔄 Triggers & Functions

### Update Timestamps
```sql
-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply to all tables with updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_news_posts_updated_at BEFORE UPDATE ON news_posts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_complaints_updated_at BEFORE UPDATE ON complaints
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ... (apply to all other tables)
```

### Notification Triggers
```sql
-- Function to create notification when complaint is assigned
CREATE OR REPLACE FUNCTION notify_complaint_assigned()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.assigned_to IS NOT NULL AND NEW.assigned_to != OLD.assigned_to THEN
    INSERT INTO notifications (user_id, title, message, type, reference_id, reference_type)
    VALUES (
      NEW.student_id,
      'Complaint Assigned',
      'Your complaint has been assigned to an SRC member for review.',
      'complaint_update',
      NEW.id,
      'complaint'
    );
  END IF;
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER complaint_assigned_notification
  AFTER UPDATE ON complaints
  FOR EACH ROW EXECUTE FUNCTION notify_complaint_assigned();
```

## 📊 Sample Data

### Insert Sample Roles
```sql
-- Insert sample admin user (you'll need to replace with actual auth.uid())
INSERT INTO profiles (id, email, full_name, role) 
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'admin@dwu.ac.pg',
  'System Administrator',
  'admin'
);
```

## 🚀 Complaints Table Migration Script (IMPLEMENTED)

### **✅ This script has been executed in your Supabase database**

```sql
-- =====================================================
-- COMPLAINTS TABLE MIGRATION: Department-Based Routing
-- =====================================================

-- PHASE 1: Add New Fields to Complaints Table
ALTER TABLE complaints 
ADD COLUMN IF NOT EXISTS departments_selected UUID[] NOT NULL DEFAULT '{}',
ADD COLUMN IF NOT EXISTS assigned_department UUID REFERENCES src_departments(id),
ADD COLUMN IF NOT EXISTS is_claimed BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS claimed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS claimed_by UUID REFERENCES profiles(id);

-- Add comments for clarity
COMMENT ON COLUMN complaints.departments_selected IS 'Array of SRC department IDs that the complaint was sent to';
COMMENT ON COLUMN complaints.assigned_department IS 'Single department that claimed the complaint (for messaging rights)';
COMMENT ON COLUMN complaints.is_claimed IS 'Whether the complaint has been claimed by a department';
COMMENT ON COLUMN complaints.claimed_at IS 'Timestamp when the complaint was claimed';
COMMENT ON COLUMN complaints.claimed_by IS 'SRC member who claimed the complaint';

-- =====================================================
-- PHASE 2: Create New Indexes for Performance
-- =====================================================

-- Index for department-based queries
CREATE INDEX IF NOT EXISTS idx_complaints_departments_selected ON complaints USING GIN (departments_selected);

-- Index for assigned department queries
CREATE INDEX IF NOT EXISTS idx_complaints_assigned_department ON complaints(assigned_department);

-- Index for claiming status
CREATE INDEX IF NOT EXISTS idx_complaints_is_claimed ON complaints(is_claimed);

-- Composite index for department + status queries
CREATE INDEX IF NOT EXISTS idx_complaints_dept_status ON complaints(departments_selected, status);

-- =====================================================
-- PHASE 3: Update Existing Complaints (Backfill)
-- =====================================================

-- For existing complaints, set them to be visible to all departments
-- This ensures backward compatibility
UPDATE complaints 
SET departments_selected = (
  SELECT array_agg(id) 
  FROM src_departments 
  WHERE is_active = true
)
WHERE departments_selected = '{}';

-- =====================================================
-- PHASE 4: Update RLS Policies
-- =====================================================

-- Drop old policies if they exist
DROP POLICY IF EXISTS "SRC can view department complaints" ON complaints;

-- Add new SRC department access policy
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
-- PHASE 5: Create Helper Views
-- =====================================================

-- View to get complaints with their target departments using the array field
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
         c.departments_selected, c.assigned_department, c.is_claimed, c.claimed_at, c.claimed_by;

-- View for SRC members to see complaints relevant to their department
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
-- PHASE 6: Add Triggers
-- =====================================================

-- Trigger for complaints updated_at
CREATE TRIGGER update_complaints_updated_at BEFORE UPDATE ON complaints
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- VERIFICATION
-- =====================================================

-- Check that the new fields were added
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'complaints' 
  AND column_name IN ('departments_selected', 'assigned_department', 'is_claimed', 'claimed_at', 'claimed_by');

-- Check that indexes were created
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename = 'complaints' 
  AND indexname LIKE '%departments%';
```

**Status: ✅ IMPLEMENTED** - This migration has been successfully applied to your database.

## 🚀 Next Steps

1. **✅ Database migration completed** - The complaints table has been updated
2. **✅ Application code updated** - All components now use the new array field approach
3. **🧪 Test the new functionality** - Submit complaints and verify SRC dashboard
4. **🔍 Verify everything works** - Check that complaints appear correctly for SRC members

## 🔧 Environment Variables

Add these to your `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
``` 