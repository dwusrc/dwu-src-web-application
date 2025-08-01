import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { ComplaintCategory, ComplaintPriority, ComplaintStatus } from '@/types/supabase';

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

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const category = searchParams.get('category');
    const priority = searchParams.get('priority');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = parseInt(searchParams.get('offset') || '0');

    let query = supabase
      .from('complaints')
      .select(`
        *,
        student:profiles!complaints_student_id_fkey(id, full_name, student_id, department, year_level),
        assigned_to:profiles!complaints_assigned_to_fkey(id, full_name, role)
      `)
      .order('created_at', { ascending: false });

    // Role-based filtering
    if (profile.role === 'student') {
      // Students can only see their own complaints
      query = query.eq('student_id', user.id);
    } else if (profile.role === 'src') {
      // SRC members can see all complaints but prioritize assigned ones
      query = query.or(`assigned_to.eq.${user.id},assigned_to.is.null`);
    }
    // Admins can see all complaints (no additional filtering)

    // Apply filters
    if (status) {
      query = query.eq('status', status);
    }
    if (category) {
      query = query.eq('category', category);
    }
    if (priority) {
      query = query.eq('priority', priority);
    }

    const { data: complaints, error, count } = await query
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Error fetching complaints:', error);
      return NextResponse.json({ error: 'Failed to fetch complaints' }, { status: 500 });
    }

    return NextResponse.json({ 
      complaints, 
      pagination: {
        limit,
        offset,
        total: count || 0
      }
    });
  } catch (error) {
    console.error('Server error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
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

    // Only students can submit complaints
    if (profile.role !== 'student') {
      return NextResponse.json({ error: 'Only students can submit complaints' }, { status: 403 });
    }

    const {
      title,
      description,
      category,
      priority = 'medium'
    } = await request.json();

    // Validate required fields
    if (!title || !description || !category) {
      return NextResponse.json({ 
        error: 'Title, description, and category are required' 
      }, { status: 400 });
    }

    // Validate category
    const validCategories: ComplaintCategory[] = ['academic', 'facilities', 'security', 'health', 'transport', 'other'];
    if (!validCategories.includes(category)) {
      return NextResponse.json({ 
        error: 'Invalid category' 
      }, { status: 400 });
    }

    // Validate priority
    const validPriorities: ComplaintPriority[] = ['low', 'medium', 'high', 'urgent'];
    if (!validPriorities.includes(priority)) {
      return NextResponse.json({ 
        error: 'Invalid priority' 
      }, { status: 400 });
    }

    // Create complaint
    const { data, error } = await supabase
      .from('complaints')
      .insert({
        student_id: user.id,
        title,
        description,
        category,
        priority,
        status: 'pending' as ComplaintStatus
      })
      .select(`
        *,
        student:profiles!complaints_student_id_fkey(id, full_name, student_id, department, year_level),
        assigned_to:profiles!complaints_assigned_to_fkey(id, full_name, role)
      `)
      .single();

    if (error) {
      console.error('Error creating complaint:', error);
      return NextResponse.json({ error: 'Failed to create complaint' }, { status: 500 });
    }

    // Create notification for SRC members (optional enhancement)
    // This could be implemented later to notify SRC members of new complaints

    return NextResponse.json({ complaint: data }, { status: 201 });
  } catch (error) {
    console.error('Server error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 