import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

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

    const { id: conversationId } = await params;
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    if (!conversationId) {
      return NextResponse.json({ error: 'Conversation ID is required' }, { status: 400 });
    }

    // Get user profile to determine role
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, role, student_id')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    // Verify user has access to this conversation
    const { data: conversation, error: conversationError } = await supabase
      .from('chat_conversations')
      .select('*')
      .eq('id', conversationId)
      .single();

    if (conversationError || !conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    // Check if user is part of this conversation
    // Use profile.id (UUID) instead of profile.student_id (TEXT)
    const isStudentInConversation = profile.role === 'student' && conversation.student_id === profile.id;
    const isSrcMemberInConversation = profile.role === 'src' && conversation.src_member_id === profile.id;

    if (!isStudentInConversation && !isSrcMemberInConversation) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Get messages for the conversation with sender information
    const { data: messages, error: messagesError, count } = await supabase
      .from('chat_messages')
      .select(`
        *,
        sender_profile:profiles!chat_messages_sender_id_fkey(
          id,
          full_name,
          email,
          avatar_url
        )
      `, { count: 'exact' })
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })
      .range(offset, offset + limit - 1);

    if (messagesError) {
      return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
    }

    // Get conversation participants info
    let participants = {};
    if (profile.role === 'student') {
      const { data: srcMember } = await supabase
        .from('profiles')
        .select('id, full_name, email, avatar_url')
        .eq('id', conversation.src_member_id)
        .single();
      participants = { src_member: srcMember };
    } else {
      const { data: student } = await supabase
        .from('profiles')
        .select('id, full_name, email, avatar_url')
        .eq('id', conversation.student_id)
        .single();
      participants = { student };
    }

    return NextResponse.json({ 
      messages: messages || [], 
      total: count || 0,
      hasMore: (count || 0) > offset + limit,
      participants
    });
  } catch (_error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 