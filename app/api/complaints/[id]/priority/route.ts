import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { ComplaintPriority } from '@/types/supabase';

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

    // Only SRC members and admins can update priority
    if (!['src', 'admin'].includes(profile.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const resolvedParams = await params;
    const { priority } = await request.json();

    // Validate priority
    const validPriorities: ComplaintPriority[] = ['low', 'medium', 'high', 'urgent'];
    if (!priority || !validPriorities.includes(priority)) {
      return NextResponse.json({ error: 'Valid priority is required' }, { status: 400 });
    }

    // Check if complaint exists and user has permission
    const { data: existingComplaint } = await supabase
      .from('complaints')
      .select('id, assigned_to, assigned_department, is_claimed, claimed_by')
      .eq('id', resolvedParams.id)
      .single();

    if (!existingComplaint) {
      return NextResponse.json({ error: 'Complaint not found' }, { status: 404 });
    }

    // Check if user can update priority
    let canUpdatePriority = false;
    
    if (profile.role === 'admin') {
      canUpdatePriority = true;
    } else if (profile.role === 'src') {
      // SRC members can update if:
      // 1. They are assigned to the complaint individually, OR
      // 2. They claimed the complaint, OR
      // 3. They belong to the department that claimed the complaint
      if (existingComplaint.assigned_to === user.id) {
        canUpdatePriority = true;
      } else if (existingComplaint.is_claimed && existingComplaint.claimed_by === user.id) {
        canUpdatePriority = true;
      } else if (existingComplaint.assigned_department) {
        // Check if user belongs to the assigned department
        const { data: userProfile } = await supabase
          .from('profiles')
          .select('src_department')
          .eq('id', user.id)
          .single();
        
        if (userProfile?.src_department) {
          const { data: deptInfo } = await supabase
            .from('src_departments')
            .select('name')
            .eq('id', existingComplaint.assigned_department)
            .single();
          
          canUpdatePriority = deptInfo?.name === userProfile.src_department;
        }
      }
    }

    if (!canUpdatePriority) {
      return NextResponse.json({ error: 'You do not have permission to update this complaint priority' }, { status: 500 });
    }

    // Update complaint priority
    const { data, error } = await supabase
      .from('complaints')
      .update({
        priority,
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
      console.error('Error updating complaint priority:', error);
      return NextResponse.json({ error: 'Failed to update complaint priority' }, { status: 500 });
    }

    return NextResponse.json({ 
      complaint: data,
      message: 'Priority updated successfully' 
    });
  } catch (error) {
    console.error('Server error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
