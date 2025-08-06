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
  const { userId, src_department } = await request.json();

  // Validate input
  if (!userId || !src_department) {
    return NextResponse.json({ error: 'User ID and SRC department are required' }, { status: 400 });
  }

  // Verify the user is an SRC member
  const { data: userProfile, error: userProfileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .single();

  if (userProfileError || !userProfile) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  if (userProfile.role !== 'src') {
    return NextResponse.json({ error: 'Can only assign departments to SRC members' }, { status: 400 });
  }

  // Verify the department exists
  const { data: department, error: departmentError } = await supabase
    .from('src_departments')
    .select('name')
    .eq('name', src_department)
    .eq('is_active', true)
    .single();

  if (departmentError || !department) {
    return NextResponse.json({ error: 'Invalid SRC department' }, { status: 400 });
  }

  // Update user's SRC department
  const { data, error } = await supabase
    .from('profiles')
    .update({ 
      src_department,
      updated_at: new Date().toISOString()
    })
    .eq('id', userId)
    .select('*');

  if (error) {
    return NextResponse.json({ error: 'Failed to update SRC department' }, { status: 500 });
  }

  if (!data || data.length === 0) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  return NextResponse.json({ 
    message: 'SRC department updated successfully',
    user: data[0]
  });
} 