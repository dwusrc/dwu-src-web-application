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

  // Use getUser for secure authentication
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  // 2. Parse the request body
  const { full_name, phone, avatar_url } = await request.json();

  // Basic validation
  if (!full_name || typeof full_name !== 'string' || full_name.trim() === '') {
    return NextResponse.json({ error: 'Full name is required.' }, { status: 400 });
  }

  // 3. Update the user's profile in the database
  const { data, error } = await supabase
    .from('profiles')
    .update({ 
      full_name, 
      phone: phone || null, // Ensure phone can be nullable
      avatar_url: avatar_url || undefined,
      updated_at: new Date().toISOString(),
     })
    .eq('id', user.id)
    .select('*');

  if (error) {
    return NextResponse.json({ error: 'Failed to update profile.' }, { status: 500 });
  }

  if (!data || data.length === 0) {
    return NextResponse.json({ error: 'No profile was updated. Check RLS policies and user ID.' }, { status: 403 });
  }

  // 4. Return a success response
  return NextResponse.json({ message: 'Profile updated successfully.' });
} 