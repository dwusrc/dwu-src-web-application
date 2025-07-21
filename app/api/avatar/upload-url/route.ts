import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';

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

  try {
    // Use getUser for secure authentication
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { fileType } = await request.json();
    if (!fileType || !['image/jpeg', 'image/png', 'image/gif'].includes(fileType)) {
      return NextResponse.json({ error: 'Invalid file type.' }, { status: 400 });
    }

    const fileExtension = fileType.split('/')[1];
    const fileName = `${user.id}/${uuidv4()}.${fileExtension}`;
    const { data } = await supabase.storage
      .from('avatars')
      .createSignedUploadUrl(fileName);

    // The 'path' property in the response contains the key to the file in the bucket
    return NextResponse.json({ ...data, path: fileName });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 