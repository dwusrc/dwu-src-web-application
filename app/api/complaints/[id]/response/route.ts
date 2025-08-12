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

    // Get user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    // Only SRC members and admins can add responses
    if (!['src', 'admin'].includes(profile.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const resolvedParams = await params;
    const { response } = await request.json();

    if (!response || response.trim().length === 0) {
      return NextResponse.json({ error: 'Response text is required' }, { status: 400 });
    }

    // Check if complaint exists and user has permission
    const { data: existingComplaint } = await supabase
      .from('complaints')
      .select('id, assigned_to')
      .eq('id', resolvedParams.id)
      .single();

    if (!existingComplaint) {
      return NextResponse.json({ error: 'Complaint not found' }, { status: 404 });
    }

    // Check if user is assigned to this complaint or is admin
    const canRespond = 
      profile.role === 'admin' ||
      existingComplaint.assigned_to === user.id;

    if (!canRespond) {
      return NextResponse.json({ error: 'You are not assigned to this complaint' }, { status: 403 });
    }

    // Update complaint with response
    const { data, error } = await supabase
      .from('complaints')
      .update({
        response: response.trim(),
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
      console.error('Error updating complaint response:', error);
      return NextResponse.json({ error: 'Failed to update complaint response' }, { status: 500 });
    }

    return NextResponse.json({ 
      complaint: data,
      message: 'Response added successfully' 
    });
  } catch (error) {
    console.error('Server error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
