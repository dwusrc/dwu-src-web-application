import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          cookieStore.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          cookieStore.set({ name, value: '', ...options });
        },
      },
    }
  );

  // Verify user is authenticated and is an admin
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  // Check if user is admin
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profileError || !profile || profile.role !== 'admin') {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  }

  // Parse request body
  const { 
    userId, 
    full_name, 
    email, 
    role, 
    student_id, 
    department, 
    year_level, 
    phone, 
    is_active 
  } = await request.json();

  // Validate input
  if (!userId || !full_name || !email || !role) {
    return NextResponse.json({ error: 'Required fields are missing' }, { status: 400 });
  }

  if (!['student', 'src', 'admin'].includes(role)) {
    return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
  }

  // Prevent admin from changing their own role or deactivating themselves
  if (userId === user.id) {
    if (role !== 'admin') {
      return NextResponse.json({ error: 'Cannot change your own role' }, { status: 400 });
    }
    if (!is_active) {
      return NextResponse.json({ error: 'Cannot deactivate your own account' }, { status: 400 });
    }
  }

  // Update user profile
  const { data, error } = await supabase
    .from('profiles')
    .update({ 
      full_name,
      email,
      role,
      student_id: student_id || null,
      department: department || null,
      year_level: year_level || null,
      phone: phone || null,
      is_active,
      updated_at: new Date().toISOString()
    })
    .eq('id', userId)
    .select('*');

  if (error) {
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
  }

  if (!data || data.length === 0) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  return NextResponse.json({ 
    message: 'User updated successfully',
    user: data[0]
  });
} 