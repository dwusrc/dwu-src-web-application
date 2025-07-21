import { NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

// Create an admin client using the service role key (never expose to client)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { full_name, email, password, student_id, department, year_level, phone } = body;

  // Basic validation
  if (!full_name || !email || !password || !student_id || !department || !year_level) {
    return Response.json({ error: 'Missing required fields.' }, { status: 400 });
  }

  // Use server-side supabase client for auth
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name) { return cookieStore.get(name)?.value; },
        set(name, value, options) { cookieStore.set({ name, value, ...options }); },
        remove(name, options) { cookieStore.set({ name, value: '', ...options }); },
      },
    }
  );

  // 1. Create user in Supabase Auth
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
  });

  if (authError || !authData.user) {
    return Response.json({ error: authError?.message || 'Auth sign up failed.' }, { status: 400 });
  }

  const user = authData.user;

  // 2. Insert into profiles table using service role key
  const { error: profileError } = await supabaseAdmin.from('profiles').insert([
    {
      id: user.id,
      email,
      full_name,
      student_id,
      role: 'student',
      department,
      year_level,
      phone,
      is_active: true,
    },
  ]);

  if (profileError) {
    // Optionally: delete the user from auth if profile insert fails
    return Response.json({ error: profileError.message }, { status: 400 });
  }

  return Response.json({ success: true });
} 