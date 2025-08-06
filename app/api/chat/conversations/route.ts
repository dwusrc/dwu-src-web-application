import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function GET(_request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch {
              // The `setAll` method was called from a Server Component.
              // This can be ignored if you have middleware refreshing
              // user sessions.
            }
          },
        },
      }
    );
    
    // Get current user session
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user profile to determine role
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, role, student_id')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.error('Profile error:', profileError);
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    let conversations;
    
    if (profile.role === 'student') {
      // Students can see conversations where they are the student
      // Use profile.id (UUID) instead of profile.student_id (TEXT)
      conversations = await supabase
        .from('chat_conversations')
        .select(`
          *,
          src_member:profiles!chat_conversations_src_member_id_fkey(
            id,
            full_name,
            email,
            avatar_url
          )
        `)
        .eq('student_id', profile.id) // Use profile.id (UUID) here
        .order('updated_at', { ascending: false });
    } else if (profile.role === 'src') {
      // SRC members can see conversations where they are the SRC member
      conversations = await supabase
        .from('chat_conversations')
        .select(`
          *,
          student:profiles!chat_conversations_student_id_fkey(
            id,
            full_name,
            email,
            avatar_url
          )
        `)
        .eq('src_member_id', profile.id)
        .order('updated_at', { ascending: false });
    } else {
      return NextResponse.json({ error: 'Invalid role' }, { status: 403 });
    }

    if (conversations.error) {
      console.error('Conversations query error:', conversations.error);
      return NextResponse.json({ error: 'Failed to fetch conversations' }, { status: 500 });
    }

    return NextResponse.json({ conversations: conversations.data || [] });
  } catch (error) {
    console.error('Unexpected error in conversations API:', error);
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
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch {
              // The `setAll` method was called from a Server Component.
              // This can be ignored if you have middleware refreshing
              // user sessions.
            }
          },
        },
      }
    );
    
    // Get current user session
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { src_member_id } = body;

    if (!src_member_id) {
      return NextResponse.json({ error: 'SRC member ID is required' }, { status: 400 });
    }

    console.log('Creating conversation with src_member_id:', src_member_id);

    // Get user profile to determine role
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, role, student_id')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.error('Profile error:', profileError);
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    console.log('User profile for conversation creation:', { role: profile.role, id: profile.id });

    // Only students can create conversations
    if (profile.role !== 'student') {
      return NextResponse.json({ error: 'Only students can create conversations' }, { status: 403 });
    }

    // Check if conversation already exists
    // Use profile.id (UUID) instead of profile.student_id (TEXT)
    const { data: existingConversation, error: existingError } = await supabase
      .from('chat_conversations')
      .select('id')
      .eq('student_id', profile.id) // Use profile.id (UUID) here
      .eq('src_member_id', src_member_id)
      .single();

    if (existingError && existingError.code !== 'PGRST116') {
      console.error('Error checking existing conversation:', existingError);
      return NextResponse.json({ error: 'Failed to check existing conversation' }, { status: 500 });
    }

    if (existingConversation) {
      return NextResponse.json({ 
        error: 'Conversation already exists',
        conversation_id: existingConversation.id 
      }, { status: 409 });
    }

    // Create new conversation with all required fields
    const conversationData = {
      student_id: profile.id, // Use profile.id (UUID) here
      src_member_id,
      is_active: true,
      last_message_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    console.log('Attempting to create conversation with data:', conversationData);

    const { data: conversation, error: createError } = await supabase
      .from('chat_conversations')
      .insert(conversationData)
      .select()
      .single();

    if (createError) {
      console.error('Conversation creation error:', createError);
      return NextResponse.json({ 
        error: 'Failed to create conversation',
        details: createError.message 
      }, { status: 500 });
    }

    console.log('Conversation created successfully:', conversation);

    return NextResponse.json({ conversation }, { status: 201 });
  } catch (error) {
    console.error('Unexpected error in conversation creation:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 