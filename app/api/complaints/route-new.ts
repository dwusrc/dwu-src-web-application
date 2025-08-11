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

    // Role-based filtering
    if (profile.role === 'student') {
      // Students can only see their own complaints
      query = query.eq('student_id', user.id);
    } else if (profile.role === 'src') {
      // SRC members see complaints that target their department OR are assigned to them
      if (profile.src_department) {
        // Get the department ID for the SRC member
        const { data: departmentData } = await supabase
          .from('src_departments')
          .select('id')
          .eq('name', profile.src_department)
          .single();
        
        if (departmentData) {
          // Get complaints that target this department OR are assigned to this SRC member
          const { data: departmentComplaints } = await supabase
            .from('complaint_departments')
            .select('complaint_id')
            .eq('department_id', departmentData.id);
          
          if (departmentComplaints && departmentComplaints.length > 0) {
            const complaintIds = departmentComplaints.map(dc => dc.complaint_id);
            // Show complaints that target their department OR are assigned to them
            query = query.or(`id.in.(${complaintIds.join(',')}),assigned_to.eq.${user.id}`);
          } else {
            // If no complaints target their department, only show assigned ones
            query = query.eq('assigned_to', user.id);
          }
        } else {
          // If department not found, only show assigned complaints
          query = query.eq('assigned_to', user.id);
        }
      } else {
        // If no department assigned, only show assigned complaints
        query = query.eq('assigned_to', user.id);
      }
    }
    // Admins can see all complaints (no additional filtering)

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

    // Fetch department information for each complaint
    if (complaints && complaints.length > 0) {
      const complaintIds = complaints.map(c => c.id);
      const { data: departmentData } = await supabase
        .from('complaint_departments')
        .select(`
          complaint_id,
          src_departments!complaint_departments_department_id_fkey(id, name, color, description)
        `)
        .in('complaint_id', complaintIds);

      // Map department data to complaints
      const complaintsWithDepartments = complaints.map(complaint => {
        const complaintDepartments = departmentData?.filter(d => d.complaint_id === complaint.id) || [];
        const departments = complaintDepartments.map(d => d.src_departments).filter(Boolean);
        return {
          ...complaint,
          departments
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

    // Create complaint first
    const { data: complaint, error: complaintError } = await supabase
      .from('complaints')
      .insert({
        student_id: user.id,
        title,
        description,
        category,
        priority,
        status: 'pending' as ComplaintStatus
      })
      .select()
      .single();

    if (complaintError) {
      return NextResponse.json({ error: 'Failed to create complaint' }, { status: 500 });
    }

    // Handle department assignments
    if (target_departments.includes('all')) {
      // Get all active departments
      const { data: allDepartments } = await supabase
        .from('src_departments')
        .select('id')
        .eq('is_active', true);
      
      if (allDepartments && allDepartments.length > 0) {
        const departmentRecords = allDepartments.map(dept => ({
          complaint_id: complaint.id,
          department_id: dept.id
        }));
        
        await supabase
          .from('complaint_departments')
          .insert(departmentRecords);
      }
    } else {
      // Insert specific departments
      const departmentRecords = target_departments.map((deptId: string) => ({
        complaint_id: complaint.id,
        department_id: deptId
      }));
      
      await supabase
        .from('complaint_departments')
        .insert(departmentRecords);
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
