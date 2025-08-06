import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.headers.get('cookie')?.split(';').map(cookie => {
              const [name, value] = cookie.trim().split('=');
              return { name, value };
            }) || [];
          },
          setAll(cookiesToSet) {
            // Handle cookie setting if needed
          },
        },
      }
    );
    
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const messageId = params.id;

    // Verify the message exists and user has access to it
    const { data: message, error: messageError } = await supabase
      .from('chat_messages')
      .select(`
        *,
        conversation:chat_conversations(
          student_id,
          src_member_id
        )
      `)
      .eq('id', messageId)
      .single();

    if (messageError || !message) {
      return NextResponse.json(
        { error: 'Message not found' },
        { status: 404 }
      );
    }

    // Check if user has access to this conversation
    const conversation = message.conversation;
    if (!conversation) {
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      );
    }

    // User can only mark messages as read if they're part of the conversation
    // and the message is not from them
    if (
      (conversation.student_id !== user.id && conversation.src_member_id !== user.id) ||
      message.sender_id === user.id
    ) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    // Mark the message as read
    const { error: updateError } = await supabase
      .from('chat_messages')
      .update({ is_read: true })
      .eq('id', messageId);

    if (updateError) {
      console.error('Error marking message as read:', updateError);
      return NextResponse.json(
        { error: 'Failed to mark message as read' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: true },
      { status: 200 }
    );

  } catch (error) {
    console.error('Error in mark message as read:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 