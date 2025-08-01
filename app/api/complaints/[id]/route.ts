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
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    const resolvedParams = await params;
    
    // Fetch complaint with related data
    const { data: complaint, error } = await supabase
      .from('complaints')
      .select(`
        *,
        student:profiles!complaints_student_id_fkey(id, full_name, student_id, department, year_level),
        assigned_to:profiles!complaints_assigned_to_fkey(id, full_name, role)
      `)
      .eq('id', resolvedParams.id)
      .single();

    if (error) {
      console.error('Error fetching complaint:', error);
      return NextResponse.json({ error: 'Complaint not found' }, { status: 404 });
    }

    // Role-based access control
    if (profile.role === 'student' && complaint.student_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json({ complaint });
  } catch (error) {
    console.error('Server error:', error);
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

    // Get user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    const resolvedParams = await params;

    // Check if complaint exists and user has permission
    const { data: existingComplaint, error: fetchError } = await supabase
      .from('complaints')
      .select('student_id, assigned_to')
      .eq('id', resolvedParams.id)
      .single();

    if (fetchError) {
      console.error('Error fetching complaint:', fetchError);
      if (fetchError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Complaint not found' }, { status: 404 });
      }
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    if (!existingComplaint) {
      return NextResponse.json({ error: 'Complaint not found' }, { status: 404 });
    }

    // Permission check
    const canEdit = 
      profile.role === 'admin' ||
      profile.role === 'src' ||
      (profile.role === 'student' && existingComplaint.student_id === user.id);

    if (!canEdit) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const updateData = await request.json();
    const allowedFields = ['title', 'description', 'category', 'priority', 'status', 'response'];

    // Filter allowed fields based on role
    const filteredData: Record<string, unknown> = {};
    
    if (profile.role === 'student') {
      // Students can only update their own complaints and only certain fields
      if (existingComplaint.student_id !== user.id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
      // Students can only update title, description, category, priority
      ['title', 'description', 'category', 'priority'].forEach(field => {
        if (updateData[field] !== undefined) {
          filteredData[field] = updateData[field];
        }
      });
    } else {
      // SRC and Admin can update all fields
      allowedFields.forEach(field => {
        if (updateData[field] !== undefined) {
          filteredData[field] = updateData[field];
        }
      });
    }

    // If status is being updated to resolved/closed, set resolved_at
    if (filteredData.status && ['resolved', 'closed'].includes(filteredData.status as string)) {
      filteredData.resolved_at = new Date().toISOString();
    }

    // Update complaint
    const { data, error } = await supabase
      .from('complaints')
      .update(filteredData)
      .eq('id', resolvedParams.id)
      .select(`
        *,
        student:profiles!complaints_student_id_fkey(id, full_name, student_id, department, year_level),
        assigned_to:profiles!complaints_assigned_to_fkey(id, full_name, role)
      `)
      .single();

    if (error) {
      console.error('Error updating complaint:', error);
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Complaint not found or no changes made' }, { status: 404 });
      }
      return NextResponse.json({ error: 'Failed to update complaint' }, { status: 500 });
    }

    return NextResponse.json({ complaint: data });
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

    const resolvedParams = await params;

    // Check if complaint exists and user has permission
    const { data: existingComplaint } = await supabase
      .from('complaints')
      .select('student_id')
      .eq('id', resolvedParams.id)
      .single();

    if (!existingComplaint) {
      return NextResponse.json({ error: 'Complaint not found' }, { status: 404 });
    }

    // Only admins and the complaint owner can delete
    const canDelete = 
      profile.role === 'admin' ||
      (profile.role === 'student' && existingComplaint.student_id === user.id);

    if (!canDelete) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Delete complaint
    const { error } = await supabase
      .from('complaints')
      .delete()
      .eq('id', resolvedParams.id);

    if (error) {
      console.error('Error deleting complaint:', error);
      return NextResponse.json({ error: 'Failed to delete complaint' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Complaint deleted successfully' });
  } catch (error) {
    console.error('Server error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 