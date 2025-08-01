import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { ComplaintStatus } from '@/types/supabase';

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

    // Get user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    // Only SRC members and admins can update complaint status
    if (!['src', 'admin'].includes(profile.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const resolvedParams = await params;
    const { status } = await request.json();

    // Validate status
    const validStatuses: ComplaintStatus[] = ['pending', 'in_progress', 'resolved', 'closed', 'rejected'];
    if (!status || !validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Valid status is required' }, { status: 400 });
    }

    // Check if complaint exists and user has permission
    const { data: existingComplaint } = await supabase
      .from('complaints')
      .select('id, assigned_to, status')
      .eq('id', resolvedParams.id)
      .single();

    if (!existingComplaint) {
      return NextResponse.json({ error: 'Complaint not found' }, { status: 404 });
    }

    // Check if user is assigned to this complaint or is admin
    const canUpdateStatus = 
      profile.role === 'admin' ||
      existingComplaint.assigned_to === user.id;

    if (!canUpdateStatus) {
      return NextResponse.json({ error: 'You are not assigned to this complaint' }, { status: 403 });
    }

    // Prepare update data
    const updateData: Record<string, unknown> = {
      status,
      updated_at: new Date().toISOString()
    };

    // Set resolved_at if status is resolved or closed
    if (['resolved', 'closed'].includes(status)) {
      updateData.resolved_at = new Date().toISOString();
    } else {
      // Clear resolved_at if status is changed from resolved/closed to something else
      updateData.resolved_at = null;
    }

    // Update complaint status
    const { data, error } = await supabase
      .from('complaints')
      .update(updateData)
      .eq('id', resolvedParams.id)
      .select(`
        *,
        student:profiles!complaints_student_id_fkey(id, full_name, student_id, department, year_level),
        assigned_to:profiles!complaints_assigned_to_fkey(id, full_name, role)
      `)
      .single();

    if (error) {
      console.error('Error updating complaint status:', error);
      return NextResponse.json({ error: 'Failed to update complaint status' }, { status: 500 });
    }

    return NextResponse.json({ 
      complaint: data,
      message: 'Status updated successfully' 
    });
  } catch (error) {
    console.error('Server error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

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
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    const resolvedParams = await params;
    
    // Fetch complaint status
    const { data: complaint, error } = await supabase
      .from('complaints')
      .select('id, status, student_id, assigned_to')
      .eq('id', resolvedParams.id)
      .single();

    if (error) {
      console.error('Error fetching complaint status:', error);
      return NextResponse.json({ error: 'Complaint not found' }, { status: 404 });
    }

    // Role-based access control
    if (profile.role === 'student' && complaint.student_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json({ 
      status: complaint.status,
      canUpdate: ['src', 'admin'].includes(profile.role) && 
        (profile.role === 'admin' || complaint.assigned_to === user.id)
    });
  } catch (error) {
    console.error('Server error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 