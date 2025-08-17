import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { ProjectStatus, ApprovalStatus } from '@/types/supabase';

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

    const { searchParams } = new URL(request.url);
    const department = searchParams.get('department');
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Build query for public view (approved projects only)
    let query = supabase
      .from('src_projects')
      .select(`
        *,
        department:src_departments(id, name, color, description),
        created_by_user:profiles!src_projects_created_by_fkey(id, full_name, role),
        approved_by_user:profiles!src_projects_approved_by_fkey(id, full_name, role)
      `, { count: 'exact' })
      .eq('approval_status', 'approved') // Only show approved projects
      .order('created_at', { ascending: false });

    // Apply filters
    if (department) {
      query = query.eq('department_id', department);
    }
    if (status) {
      query = query.eq('status', status);
    }

    // Execute query with pagination
    const { data: projects, error, count } = await query
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json({ error: 'Failed to fetch projects' }, { status: 500 });
    }

    return NextResponse.json({
      projects: projects || [],
      count: count || 0,
      limit,
      offset
    });

  } catch (error) {
    console.error('Error in GET /api/src-projects:', error);
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

    // Get user profile for role-based access
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, src_department')
      .eq('id', user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    // Only SRC members can create projects
    if (profile.role !== 'src') {
      return NextResponse.json({ error: 'Only SRC members can create projects' }, { status: 403 });
    }

    const body = await request.json();
    const {
      title,
      description,
      objectives,
      start_date,
      target_finish_date,
      budget_allocated,
      team_members
    } = body;

    // Validation
    if (!title || !description || !objectives) {
      return NextResponse.json({ 
        error: 'Title, description, and objectives are required' 
      }, { status: 400 });
    }

    // Get department ID from user's src_department
    const { data: department } = await supabase
      .from('src_departments')
      .select('id')
      .eq('name', profile.src_department)
      .single();

    if (!department) {
      return NextResponse.json({ error: 'Department not found' }, { status: 404 });
    }

    // Create project
    const { data: project, error } = await supabase
      .from('src_projects')
      .insert({
        department_id: department.id,
        title,
        description,
        objectives,
        start_date: start_date || null,
        target_finish_date: target_finish_date || null,
        budget_allocated: budget_allocated || null,
        team_members: team_members || [],
        status: 'not_started' as ProjectStatus,
        approval_status: 'pending' as ApprovalStatus,
        created_by: user.id,
        progress_percentage: 0
      })
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json({ error: 'Failed to create project' }, { status: 500 });
    }

    return NextResponse.json({ 
      message: 'Project created successfully and pending approval',
      project 
    }, { status: 201 });

  } catch (error) {
    console.error('Error in POST /api/src-projects:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
