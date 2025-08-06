import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get('conversation_id');
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

    // Get messages for the conversation
    const { data: messages, error: messagesError, count } = await supabase
      .from('chat_messages')
      .select('*', { count: 'exact' })
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })
      .range(offset, offset + limit - 1);

    if (messagesError) {
      return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
    }

    return NextResponse.json({ 
      messages: messages || [], 
      total: count || 0,
      hasMore: (count || 0) > offset + limit
    });
  } catch {
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
    const { conversation_id, content, message_type = 'text' } = body;

    if (!conversation_id || !content) {
      return NextResponse.json({ error: 'Conversation ID and content are required' }, { status: 400 });
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
      .eq('id', conversation_id)
      .single();

    if (conversationError || !conversation) {
      console.error('Conversation not found:', conversationError);
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    // Check if user is part of this conversation
    // Use profile.id (UUID) instead of profile.student_id (TEXT)
    const isStudentInConversation = profile.role === 'student' && conversation.student_id === profile.id;
    const isSrcMemberInConversation = profile.role === 'src' && conversation.src_member_id === profile.id;

    if (!isStudentInConversation && !isSrcMemberInConversation) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Create new message - remove sender_type as it doesn't exist in schema
    const messageData = {
      conversation_id,
      sender_id: profile.id, // Use profile.id (UUID) here
      content,
      message_type,
      created_at: new Date().toISOString()
    };

    const { data: message, error: createError } = await supabase
      .from('chat_messages')
      .insert(messageData)
      .select()
      .single();

    if (createError) {
      console.error('Message creation error:', createError);
      return NextResponse.json({ 
        error: 'Failed to create message',
        details: createError.message 
      }, { status: 500 });
    }

    // Update conversation's updated_at timestamp
    const { error: updateError } = await supabase
      .from('chat_conversations')
      .update({ 
        updated_at: new Date().toISOString(),
        last_message_at: new Date().toISOString()
      })
      .eq('id', conversation_id);

    if (updateError) {
      console.error('Error updating conversation timestamp:', updateError);
      // Don't fail the message creation if timestamp update fails
    }

    return NextResponse.json({ message }, { status: 201 });
  } catch (error) {
    console.error('Unexpected error in message creation:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 