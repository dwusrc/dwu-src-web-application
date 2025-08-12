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
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const resolvedParams = await params;
    const departmentId = resolvedParams.id;

    // First, get the department name from the department ID
    const { data: department, error: deptError } = await supabase
      .from('src_departments')
      .select('name')
      .eq('id', departmentId)
      .single();

    if (deptError || !department) {
      console.error('Error fetching department:', deptError);
      return NextResponse.json({ error: 'Department not found' }, { status: 404 });
    }

    // Now fetch SRC members using the department name
    const { data: members, error } = await supabase
      .from('profiles')
      .select('id, full_name, email, role')
      .eq('role', 'src')
      .eq('src_department', department.name)
      .eq('is_active', true)
      .order('full_name', { ascending: true });

    if (error) {
      console.error('Error fetching department members:', error);
      return NextResponse.json({ error: 'Failed to fetch department members' }, { status: 500 });
    }

    return NextResponse.json({ 
      members: members || [],
      department_id: departmentId,
      department_name: department.name
    });
  } catch (error) {
    console.error('Server error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
