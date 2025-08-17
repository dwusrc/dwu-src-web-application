import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

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
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    // Only Admin can reject projects
    if (profile.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { rejection_reason } = body;

    // Rejection reason is required
    if (!rejection_reason || rejection_reason.trim().length === 0) {
      return NextResponse.json({ 
        error: 'Rejection reason is required' 
      }, { status: 400 });
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

    // Check if project is already rejected
    if (existingProject.approval_status === 'rejected') {
      return NextResponse.json({ 
        error: 'Project is already rejected' 
      }, { status: 400 });
    }

    // Check if project is already approved
    if (existingProject.approval_status === 'approved') {
      return NextResponse.json({ 
        error: 'Cannot reject an approved project' 
      }, { status: 400 });
    }

    // Reject project
    const { data: project, error } = await supabase
      .from('src_projects')
      .update({
        approval_status: 'rejected',
        rejection_reason: rejection_reason.trim(),
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json({ error: 'Failed to reject project' }, { status: 500 });
    }

    return NextResponse.json({ 
      message: 'Project rejected successfully',
      project 
    });

  } catch (error) {
    console.error('Error in PUT /api/src-projects/[id]/reject:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
