import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabaseServer';

export async function GET() {
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
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    // Build query based on user role
    let query = supabase
      .from('reports')
      .select(`
        *,
        uploaded_by_user:profiles!reports_uploaded_by_fkey(id, full_name, role, src_department),
        category:report_categories(id, name, color, description)
      `)
      .order('year', { ascending: false })
      .order('month', { ascending: false })
      .order('created_at', { ascending: false });

    // Apply visibility filtering based on user role
    if (profile.role === 'student') {
      // Students can only see reports visible to students
      query = query.contains('visibility', ['student']);
    } else if (profile.role === 'src') {
      // SRC members can see reports visible to SRC
      query = query.contains('visibility', ['src']);
    }
    // Admins can see all reports (no filter needed)

    const { data: reports, error } = await query;

    if (error) {
      console.error('Error fetching reports:', error);
      return NextResponse.json({ error: 'Failed to fetch reports' }, { status: 500 });
    }

    return NextResponse.json({ reports: reports || [] });
  } catch (error) {
    console.error('Server error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();

    // Check authentication
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is Admin or SRC President
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, src_department')
      .eq('id', user.id)
      .single();

    if (!profile || !['admin', 'src'].includes(profile.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // SRC members must be President to upload reports
    if (profile.role === 'src' && profile.src_department !== 'President') {
      return NextResponse.json({ error: 'Only SRC President can upload reports' }, { status: 403 });
    }

    const {
      title,
      description,
      file_url,
      file_name,
      file_size,
      month,
      year,
      visibility,
      category_id
    } = await request.json();

    // Validate required fields
    if (!title || !file_url || !file_name || !month || !year || !visibility) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Validate month and year
    if (month < 1 || month > 12) {
      return NextResponse.json({ error: 'Invalid month (1-12)' }, { status: 400 });
    }

    if (year < 2020 || year > 2030) {
      return NextResponse.json({ error: 'Invalid year (2020-2030)' }, { status: 400 });
    }

    // Validate visibility array
    if (!Array.isArray(visibility) || visibility.length === 0) {
      return NextResponse.json({ error: 'Visibility must be an array' }, { status: 400 });
    }

    const validVisibility = ['src', 'student'];
    if (!visibility.every(v => validVisibility.includes(v))) {
      return NextResponse.json({ error: 'Invalid visibility values' }, { status: 400 });
    }

    // Create report
    const { data, error } = await supabase
      .from('reports')
      .insert({
        title,
        description,
        file_url,
        file_name,
        file_size,
        month,
        year,
        visibility,
        category_id: category_id || null,
        uploaded_by: user.id
      })
      .select(`
        *,
        uploaded_by_user:profiles!reports_uploaded_by_fkey(id, full_name, role, src_department),
        category:report_categories(id, name, color, description)
      `)
      .single();

    if (error) {
      console.error('Error creating report:', error);
      return NextResponse.json({ error: 'Failed to create report' }, { status: 500 });
    }

    return NextResponse.json({ report: data }, { status: 201 });
  } catch (error) {
    console.error('Server error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
