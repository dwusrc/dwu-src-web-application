import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';


export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    // Get project with relations
    const { id } = await params;
    const { data: project, error } = await supabase
      .from('src_projects')
      .select(`
        *,
        department:src_departments(id, name, color, description),
        created_by_user:profiles!src_projects_created_by_fkey(id, full_name, role),
        approved_by_user:profiles!src_projects_approved_by_fkey(id, full_name, role)
      `)
      .eq('id', id)
      .single();

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Check access permissions
    if (profile.role === 'student') {
      // Students can only view approved projects
      if (project.approval_status !== 'approved') {
        return NextResponse.json({ error: 'Project not found' }, { status: 404 });
      }
    } else if (profile.role === 'src') {
      // SRC members can view projects from their department
      if (project.department?.name !== profile.src_department) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
      }
    }
    // Admin can view all projects

    return NextResponse.json({ project });

  } catch (error) {
    console.error('Error in GET /api/src-projects/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    // Get existing project
    const { id } = await params;
    const { data: existingProject, error: fetchError } = await supabase
      .from('src_projects')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError) {
      console.error('Database error:', fetchError);
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Check permissions
    if (profile.role === 'src') {
      // SRC members can only update approved projects from their department
      if (existingProject.approval_status !== 'approved') {
        return NextResponse.json({ 
          error: 'Can only update approved projects' 
        }, { status: 403 });
      }

      // Check if project belongs to their department
      const { data: department } = await supabase
        .from('src_departments')
        .select('name')
        .eq('id', existingProject.department_id)
        .single();

      if (department?.name !== profile.src_department) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
      }
    } else if (profile.role !== 'admin') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const body = await request.json();
    const {
      title,
      description,
      objectives,
      start_date,
      target_finish_date,
      actual_finish_date,
      progress_percentage,
      budget_allocated,
      budget_spent,
      team_members,
      status,
      challenges,
      next_steps
    } = body;

    // Validation
    if (!title || !description || !objectives) {
      return NextResponse.json({ 
        error: 'Title, description, and objectives are required' 
      }, { status: 400 });
    }

    if (progress_percentage !== undefined && (progress_percentage < 0 || progress_percentage > 100)) {
      return NextResponse.json({ 
        error: 'Progress percentage must be between 0 and 100' 
      }, { status: 400 });
    }

    // Update project
    const { data: project, error } = await supabase
      .from('src_projects')
      .update({
        title,
        description,
        objectives,
        start_date: start_date || null,
        target_finish_date: target_finish_date || null,
        actual_finish_date: actual_finish_date || null,
        progress_percentage: progress_percentage !== undefined ? progress_percentage : existingProject.progress_percentage,
        budget_allocated: budget_allocated || null,
        budget_spent: budget_spent || null,
        team_members: team_members || existingProject.team_members,
        status: status || existingProject.status,
        challenges: challenges || null,
        next_steps: next_steps || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json({ error: 'Failed to update project' }, { status: 500 });
    }

    return NextResponse.json({ 
      message: 'Project updated successfully',
      project 
    });

  } catch (error) {
    console.error('Error in PUT /api/src-projects/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    // Get existing project
    const { id } = await params;
    const { data: existingProject, error: fetchError } = await supabase
      .from('src_projects')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError) {
      console.error('Database error:', fetchError);
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Check permissions
    if (profile.role === 'src') {
      // SRC members can only delete projects from their department
      const { data: department } = await supabase
        .from('src_departments')
        .select('name')
        .eq('id', existingProject.department_id)
        .single();

      if (department?.name !== profile.src_department) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
      }
    } else if (profile.role !== 'admin') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Delete project
    const { error } = await supabase
      .from('src_projects')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json({ error: 'Failed to delete project' }, { status: 500 });
    }

    return NextResponse.json({ 
      message: 'Project deleted successfully'
    });

  } catch (error) {
    console.error('Error in DELETE /api/src-projects/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
