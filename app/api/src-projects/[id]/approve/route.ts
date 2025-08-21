import { createServerSupabaseClient } from '@/lib/supabaseServer';
import { NextRequest, NextResponse } from 'next/server';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    // Only Admin or SRC President can approve projects
    if (profile.role !== 'admin' && !(profile.role === 'src' && profile.src_department === 'President')) {
      return NextResponse.json({ error: 'Admin or SRC President access required' }, { status: 403 });
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

    // Check if project is already approved
    if (existingProject.approval_status === 'approved') {
      return NextResponse.json({ 
        error: 'Project is already approved' 
      }, { status: 400 });
    }

    // Check if project is rejected
    if (existingProject.approval_status === 'rejected') {
      return NextResponse.json({ 
        error: 'Cannot approve a rejected project. Please contact the SRC member to resubmit.' 
      }, { status: 400 });
    }

    // Approve project
    const { data: project, error } = await supabase
      .from('src_projects')
      .update({
        approval_status: 'approved',
        approved_by: user.id,
        approved_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json({ error: 'Failed to approve project' }, { status: 500 });
    }

    return NextResponse.json({ 
      message: 'Project approved successfully',
      project 
    });

  } catch (error) {
    console.error('Error in PUT /api/src-projects/[id]/approve:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
