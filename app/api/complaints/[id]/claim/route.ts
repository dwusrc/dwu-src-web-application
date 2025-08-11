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
      .select('role, src_department')
      .eq('id', user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    // Only SRC members can claim complaints
    if (profile.role !== 'src') {
      return NextResponse.json({ error: 'Only SRC members can claim complaints' }, { status: 403 });
    }

    // SRC members must have a department assigned
    if (!profile.src_department) {
      return NextResponse.json({ error: 'SRC member must have a department assigned' }, { status: 400 });
    }

    const resolvedParams = await params;
    const { action } = await request.json(); // 'claim' or 'unclaim'

    // Check if complaint exists
    const { data: existingComplaint } = await supabase
      .from('complaints')
      .select('id, is_claimed, claimed_by, assigned_department, departments_selected')
      .eq('id', resolvedParams.id)
      .single();

    if (!existingComplaint) {
      return NextResponse.json({ error: 'Complaint not found' }, { status: 404 });
    }

    // Get the SRC member's department ID
    const { data: departmentData } = await supabase
      .from('src_departments')
      .select('id')
      .eq('name', profile.src_department)
      .single();

    if (!departmentData) {
      return NextResponse.json({ error: 'Department not found' }, { status: 404 });
    }

    // Check if the complaint targets this SRC member's department
    const targetsUserDepartment = existingComplaint.departments_selected.includes(departmentData.id);
    if (!targetsUserDepartment) {
      return NextResponse.json({ error: 'Complaint does not target your department' }, { status: 403 });
    }

    let updateData: Record<string, unknown> = {};

    if (action === 'claim') {
      // Check if complaint is already claimed
      if (existingComplaint.is_claimed) {
        return NextResponse.json({ error: 'Complaint is already claimed' }, { status: 400 });
      }

      // Claim the complaint
      updateData = {
        is_claimed: true,
        claimed_at: new Date().toISOString(),
        claimed_by: user.id,
        assigned_department: departmentData.id,
        updated_at: new Date().toISOString()
      };
    } else if (action === 'unclaim') {
      // Check if user is the one who claimed it
      if (existingComplaint.claimed_by !== user.id) {
        return NextResponse.json({ error: 'You can only unclaim complaints you claimed' }, { status: 403 });
      }

      // Unclaim the complaint
      updateData = {
        is_claimed: false,
        claimed_at: null,
        claimed_by: null,
        assigned_department: null,
        updated_at: new Date().toISOString()
      };
    } else {
      return NextResponse.json({ error: 'Invalid action. Use "claim" or "unclaim"' }, { status: 400 });
    }

    // Update complaint - don't select after update to avoid RLS issues
    const { error } = await supabase
      .from('complaints')
      .update(updateData)
      .eq('id', resolvedParams.id);

    if (error) {
      console.error('Error updating complaint claim status:', error);
      return NextResponse.json({ error: 'Failed to update complaint claim status' }, { status: 500 });
    }

    const actionText = action === 'claim' ? 'claimed' : 'unclaimed';
    return NextResponse.json({ 
      success: true,
      message: `Complaint ${actionText} successfully` 
    });
  } catch (error) {
    console.error('Server error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
