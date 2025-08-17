import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

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
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    // Only Admin can access this route
    if (profile.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const department = searchParams.get('department');
    const status = searchParams.get('status');
    const approval_status = searchParams.get('approval_status');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Build query for admin view (all projects)
    let query = supabase
      .from('src_projects')
      .select(`
        *,
        department:src_departments(id, name, color, description),
        created_by_user:profiles!src_projects_created_by_fkey(id, full_name, role),
        approved_by_user:profiles!src_projects_approved_by_fkey(id, full_name, role)
      `, { count: 'exact' })
      .order('created_at', { ascending: false });

    // Apply filters
    if (department) {
      query = query.eq('department_id', department);
    }
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
      .eq('approval_status', 'pending');

    const { count: approvedCount } = await supabase
      .from('src_projects')
      .select('*', { count: 'exact', head: true })
      .eq('approval_status', 'approved');

    const { count: rejectedCount } = await supabase
      .from('src_projects')
      .select('*', { count: 'exact', head: true })
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
    console.error('Error in GET /api/src-projects/admin:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
