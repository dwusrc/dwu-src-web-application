import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(
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

    // Only SRC members and admins can assign complaints
    if (!['src', 'admin'].includes(profile.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const resolvedParams = await params;
    const { assigned_to } = await request.json();

    // Validate assigned_to
    if (!assigned_to) {
      return NextResponse.json({ error: 'assigned_to is required' }, { status: 400 });
    }

    // Check if the assigned user exists and is an SRC member
    const { data: assignedUser } = await supabase
      .from('profiles')
      .select('id, role, src_department')
      .eq('id', assigned_to)
      .single();

    if (!assignedUser) {
      return NextResponse.json({ error: 'Assigned user not found' }, { status: 404 });
    }

    if (assignedUser.role !== 'src') {
      return NextResponse.json({ error: 'Can only assign to SRC members' }, { status: 400 });
    }

    // Check if the complaint targets the assigned user's department
    const { data: complaintData } = await supabase
      .from('complaints')
      .select('departments_selected')
      .eq('id', resolvedParams.id)
      .single();

    if (!complaintData) {
      return NextResponse.json({ error: 'Complaint not found' }, { status: 404 });
    }

    // Verify the assigned user belongs to a department that can handle this complaint
    if (complaintData.departments_selected && complaintData.departments_selected.length > 0) {
      // Get department names from the IDs
      const { data: deptInfos } = await supabase
        .from('src_departments')
        .select('name')
        .in('id', complaintData.departments_selected);
      
      if (deptInfos) {
        const deptNames = deptInfos.map(d => d.name);
        if (!deptNames.includes(assignedUser.src_department)) {
          return NextResponse.json({ error: 'Can only assign to SRC members from departments that can handle this complaint' }, { status: 403 });
        }
      }
    }

    // Check if complaint exists
    const { data: existingComplaint } = await supabase
      .from('complaints')
      .select('id, status')
      .eq('id', resolvedParams.id)
      .single();

    if (!existingComplaint) {
      return NextResponse.json({ error: 'Complaint not found' }, { status: 404 });
    }

    // Update complaint assignment
    const { data, error } = await supabase
      .from('complaints')
      .update({
        assigned_to,
        status: 'in_progress', // Automatically set status to in_progress when assigned
        updated_at: new Date().toISOString()
      })
      .eq('id', resolvedParams.id)
      .select(`
        *,
        student:profiles!complaints_student_id_fkey(id, full_name, student_id, department, year_level),
        assigned_to:profiles!complaints_assigned_to_fkey(id, full_name, role)
      `)
      .single();

    if (error) {
      console.error('Error assigning complaint:', error);
      return NextResponse.json({ error: 'Failed to assign complaint' }, { status: 500 });
    }

    return NextResponse.json({ 
      complaint: data,
      message: 'Complaint assigned successfully' 
    });
  } catch (error) {
    console.error('Server error:', error);
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

    // Get user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    // Only SRC members and admins can unassign complaints
    if (!['src', 'admin'].includes(profile.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const resolvedParams = await params;

    // Check if complaint exists
    const { data: existingComplaint } = await supabase
      .from('complaints')
      .select('id, assigned_to')
      .eq('id', resolvedParams.id)
      .single();

    if (!existingComplaint) {
      return NextResponse.json({ error: 'Complaint not found' }, { status: 404 });
    }

    // Only the assigned SRC member or admin can unassign
    if (profile.role !== 'admin' && existingComplaint.assigned_to !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Remove assignment and set status back to pending
    const { data, error } = await supabase
      .from('complaints')
      .update({
        assigned_to: null,
        status: 'pending',
        updated_at: new Date().toISOString()
      })
      .eq('id', resolvedParams.id)
      .select(`
        *,
        student:profiles!complaints_student_id_fkey(id, full_name, student_id, department, year_level),
        assigned_to:profiles!complaints_assigned_to_fkey(id, full_name, role)
      `)
      .single();

    if (error) {
      console.error('Error unassigning complaint:', error);
      return NextResponse.json({ error: 'Failed to unassign complaint' }, { status: 500 });
    }

    return NextResponse.json({ 
      complaint: data,
      message: 'Complaint unassigned successfully' 
    });
  } catch (error) {
    console.error('Server error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 