import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { ComplaintCategory, ComplaintPriority, ComplaintStatus } from '@/types/supabase';

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
        },
      }
    );

    // Check authentication
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user profile for role-based access
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, src_department')
      .eq('id', user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const category = searchParams.get('category');
    const priority = searchParams.get('priority');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Build query with optimized joins
    let query = supabase
      .from('complaints')
      .select(`
        *,
        student:profiles!complaints_student_id_fkey(id, full_name, student_id, department, year_level),
        assigned_to:profiles!complaints_assigned_to_fkey(id, full_name, role)
      `, { count: 'exact' })
      .order('created_at', { ascending: false });

    // Role-based filtering - RLS policies handle the department access automatically
    if (profile.role === 'student') {
      // Students can only see their own complaints
      query = query.eq('student_id', user.id);
    }
    // SRC and Admin access is handled by RLS policies

    // Apply filters
    if (status) {
      query = query.eq('status', status);
    }
    if (category) {
      query = query.eq('category', category);
    }
    if (priority) {
      query = query.eq('priority', priority);
    }

    // Execute query with pagination
    const { data: complaints, error, count } = await query
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json({ error: 'Failed to fetch complaints' }, { status: 500 });
    }

    // Fetch department information for each complaint using the departments_selected array
    if (complaints && complaints.length > 0) {
      // Get all unique department IDs from all complaints
      const allDepartmentIds = [...new Set(
        complaints.flatMap(c => c.departments_selected || [])
      )];

      // Fetch all department data in one query
      const { data: allDepartmentData } = await supabase
        .from('src_departments')
        .select('id, name, color')
        .in('id', allDepartmentIds);

      // Create a lookup map for department data
      const departmentMap = new Map(
        allDepartmentData?.map(d => [d.id, d]) || []
      );

      // Map department data to complaints
      const complaintsWithDepartments = complaints.map(complaint => {
        const target_department_names = (complaint.departments_selected || [])
          .map((deptId: string) => departmentMap.get(deptId)?.name)
          .filter(Boolean);
        
        const target_department_colors = (complaint.departments_selected || [])
          .map((deptId: string) => departmentMap.get(deptId)?.color)
          .filter(Boolean);

        return {
          ...complaint,
          target_department_names,
          target_department_colors
        };
      });

      return NextResponse.json({ 
        complaints: complaintsWithDepartments, 
        pagination: {
          limit,
          offset,
          total: count || 0
        }
      });
    }

    return NextResponse.json({ 
      complaints: complaints || [], 
      pagination: {
        limit,
        offset,
        total: count || 0
      }
    });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
        },
      }
    );

    // Check authentication
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    // Only students can submit complaints
    if (profile.role !== 'student') {
      return NextResponse.json({ error: 'Only students can submit complaints' }, { status: 403 });
    }

    const {
      title,
      description,
      category,
      priority = 'medium',
      target_departments = ['all'] // Default to all departments
    } = await request.json();

    // Validate required fields
    if (!title || !description || !category) {
      return NextResponse.json({ 
        error: 'Title, description, and category are required' 
      }, { status: 400 });
    }

    // Validate category
    const validCategories: ComplaintCategory[] = ['academic', 'facilities', 'security', 'health', 'transport', 'other'];
    if (!validCategories.includes(category)) {
      return NextResponse.json({ 
        error: 'Invalid category' 
      }, { status: 400 });
    }

    // Validate priority
    const validPriorities: ComplaintPriority[] = ['low', 'medium', 'high', 'urgent'];
    if (!validPriorities.includes(priority)) {
      return NextResponse.json({ 
        error: 'Invalid priority' 
      }, { status: 400 });
    }

    // Validate target_departments
    if (!target_departments || target_departments.length === 0) {
      return NextResponse.json({ 
        error: 'Target departments are required' 
      }, { status: 400 });
    }

    // Prepare departments_selected array
    let departments_selected: string[] = [];
    
    if (target_departments.includes('all')) {
      // Get all active departments
      const { data: allDepartments } = await supabase
        .from('src_departments')
        .select('id')
        .eq('is_active', true);
      
      if (allDepartments && allDepartments.length > 0) {
        departments_selected = allDepartments.map(dept => dept.id);
      }
    } else {
      // Use specific departments
      departments_selected = target_departments;
    }

    // Create complaint with departments_selected array
    const { data: complaint, error: complaintError } = await supabase
      .from('complaints')
      .insert({
        student_id: user.id,
        title,
        description,
        category,
        priority,
        status: 'pending' as ComplaintStatus,
        departments_selected
      })
      .select()
      .single();

    if (complaintError) {
      return NextResponse.json({ error: 'Failed to create complaint' }, { status: 500 });
    }

    // Return complaint with full details
    const { data, error } = await supabase
      .from('complaints')
      .select(`
        *,
        student:profiles!complaints_student_id_fkey(id, full_name, student_id, department, year_level),
        assigned_to:profiles!complaints_assigned_to_fkey(id, full_name, role)
      `)
      .eq('id', complaint.id)
      .single();

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch complaint details' }, { status: 500 });
    }

    // Create notification for SRC members (optional enhancement)
    // This could be implemented later to notify SRC members of new complaints

    return NextResponse.json({ complaint: data }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
