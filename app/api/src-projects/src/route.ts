import { createServerSupabaseClient } from '@/lib/supabaseServer';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();

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

    // Only SRC members can access this endpoint
    if (profile.role !== 'src') {
      return NextResponse.json({ error: 'SRC access required' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const approval_status = searchParams.get('approval_status');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Get department ID from user's src_department
    const { data: department } = await supabase
      .from('src_departments')
      .select('id')
      .eq('name', profile.src_department)
      .single();

    if (!department) {
      return NextResponse.json({ error: 'Department not found' }, { status: 404 });
    }

    // Build query for SRC view (all projects from their department)
    let query = supabase
      .from('src_projects')
      .select(`
        *,
        department:src_departments(id, name, color, description),
        created_by_user:profiles!src_projects_created_by_fkey(id, full_name, role),
        approved_by_user:profiles!src_projects_approved_by_fkey(id, full_name, role)
      `, { count: 'exact' })
      .eq('department_id', department.id)
      .order('created_at', { ascending: false });

    // Apply filters
    if (status) {
      query = query.eq('status', status);
    }
    if (approval_status) {
      query = query.eq('approval_status', approval_status);
    }

    // Execute query with pagination
    const { data: projects, error, count } = await query
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json({ error: 'Failed to fetch projects' }, { status: 500 });
    }

    // Get counts for different approval statuses
    const { count: pendingCount } = await supabase
      .from('src_projects')
      .select('*', { count: 'exact', head: true })
      .eq('department_id', department.id)
      .eq('approval_status', 'pending');

    const { count: approvedCount } = await supabase
      .from('src_projects')
      .select('*', { count: 'exact', head: true })
      .eq('department_id', department.id)
      .eq('approval_status', 'approved');

    const { count: rejectedCount } = await supabase
      .from('src_projects')
      .select('*', { count: 'exact', head: true })
      .eq('department_id', department.id)
      .eq('approval_status', 'rejected');

    return NextResponse.json({
      projects: projects || [],
      count: count || 0,
      limit,
      offset,
      summary: {
        pending: pendingCount || 0,
        approved: approvedCount || 0,
        rejected: rejectedCount || 0,
        total: count || 0
      }
    });

  } catch (error) {
    console.error('Error in GET /api/src-projects/src:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
