import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

// Create an admin client using the service role key (never expose to client)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

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

    // Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { 
      full_name, 
      email, 
      password, 
      role, 
      student_id, 
      department, 
      year_level, 
      phone, 
      src_department 
    } = body;

    // Basic validation
    if (!full_name || !email || !password || !role) {
      return NextResponse.json({ 
        error: 'Full name, email, password, and role are required' 
      }, { status: 400 });
    }

    // Role-specific validation
    if (role === 'student') {
      if (!student_id || !department || !year_level) {
        return NextResponse.json({ 
          error: 'Student ID, department, and year level are required for students' 
        }, { status: 400 });
      }
    }

    if (role === 'src' && !src_department) {
      return NextResponse.json({ 
        error: 'SRC department is required for SRC members' 
      }, { status: 400 });
    }

    // Validate role
    const validRoles = ['student', 'src', 'admin'];
    if (!validRoles.includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }

    // Check if email already exists
    const { data: existingUser } = await supabaseAdmin.auth.admin.listUsers();
    const userExists = existingUser.users?.some(user => user.email === email);
    if (userExists) {
      return NextResponse.json({ error: 'Email already exists' }, { status: 400 });
    }

    // Check if student_id already exists (for students)
    if (role === 'student' && student_id) {
      const { data: existingStudent } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .eq('student_id', student_id)
        .single();
      
      if (existingStudent) {
        return NextResponse.json({ error: 'Student ID already exists' }, { status: 400 });
      }
    }

    // 1. Create user in Supabase Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email for admin-created accounts
    });

    if (authError || !authData.user) {
      console.error('Auth creation error:', authError);
      return NextResponse.json({ 
        error: authError?.message || 'Failed to create user account' 
      }, { status: 400 });
    }

    const newUser = authData.user;

    // 2. Insert into profiles table
    const profileData: {
      id: string;
      email: string;
      full_name: string;
      role: string;
      phone: string | null;
      is_active: boolean;
      student_id?: string | null;
      department?: string | null;
      year_level?: number | null;
      src_department?: string | null;
    } = {
      id: newUser.id,
      email,
      full_name,
      role,
      phone: phone || null,
      is_active: true,
    };

    // Add role-specific fields
    if (role === 'student') {
      profileData.student_id = student_id;
      profileData.department = department;
      profileData.year_level = year_level;
      profileData.src_department = null;
    } else if (role === 'src') {
      profileData.src_department = src_department;
      profileData.student_id = null;
      profileData.department = null;
      profileData.year_level = null;
    } else if (role === 'admin') {
      profileData.student_id = null;
      profileData.department = null;
      profileData.year_level = null;
      profileData.src_department = null;
    }

    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert([profileData]);

    if (profileError) {
      console.error('Profile creation error:', profileError);
      // Clean up: delete the auth user if profile creation fails
      await supabaseAdmin.auth.admin.deleteUser(newUser.id);
      return NextResponse.json({ 
        error: `Failed to create user profile: ${profileError.message}` 
      }, { status: 400 });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'User created successfully',
      user: {
        id: newUser.id,
        email: newUser.email,
        full_name,
        role,
        is_active: true
      }
    });

  } catch (error) {
    console.error('Server error:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}
